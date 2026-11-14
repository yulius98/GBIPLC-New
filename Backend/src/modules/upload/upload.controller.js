import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { once } from 'events';
import multer from 'multer';
import AppError from '../../utils/AppError.js';
import { UPLOAD_DIR } from '../../middlewares/upload.js';
import { detectFileType, DOCUMENT_TYPES } from '../../utils/fileTypes.js';

/**
 * Chunk upload (protokol Resumable.js).
 * Port dari ChunkUploadController Laravel untuk upload file besar
 * (PDF/PowerPoint), mis. materi kotbah.
 */

const CHUNKS_ROOT = path.join(import.meta.dirname, '../../storage/chunks');
const TMP_DIR = path.join(import.meta.dirname, '../../storage/tmp');

const ALLOWED_EXTENSIONS = ['pdf', 'ppt', 'pptx'];

// Maksimal satu chunk (frontend mengirim ±5MB; dibatasi 50MB agar aman).
const MAX_CHUNK_SIZE = 50 * 1024 * 1024;
// Batas total file hasil gabungan, melindungi disk dari upload tak wajar.
const MAX_FILE_SIZE = 300 * 1024 * 1024;
const MAX_TOTAL_CHUNKS = 2000;
// Chunk/file sementara yang tidak tersentuh selama ini dianggap yatim.
const STALE_MS = 24 * 60 * 60 * 1000;

// Identifier yang sedang digabung (mencegah merge ganda untuk upload yang sama).
const merging = new Set();

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

ensureDir(CHUNKS_ROOT);
ensureDir(TMP_DIR);

function sanitizeIdentifier(identifier) {
  return String(identifier || '').replace(/[^a-zA-Z0-9_-]/g, '');
}

function toPositiveInt(value) {
  const n = Number.parseInt(value, 10);
  return Number.isInteger(n) && n >= 1 ? n : null;
}

function getChunkDir(identifier) {
  return path.join(CHUNKS_ROOT, sanitizeIdentifier(identifier));
}

function getChunkPath(identifier, chunkNumber) {
  // Nomor chunk dipaksa integer: mencegah traversal via "../../" pada "chunk_<nomor>".
  return path.join(getChunkDir(identifier), `chunk_${toPositiveInt(chunkNumber) ?? 0}`);
}

/**
 * Middleware multer untuk menerima satu chunk.
 * Nama file sementara dibuat unik, sehingga dua upload yang berjalan bersamaan
 * dengan nomor chunk yang sama tidak saling menimpa, dan urutan field di
 * multipart tidak lagi berpengaruh.
 * Validasi ekstensi dilakukan di controller (setelah seluruh field ter-parse).
 */
const uploadChunk = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, TMP_DIR),
    filename: (req, file, cb) => cb(null, `${crypto.randomUUID()}.part`),
  }),
  limits: { fileSize: MAX_CHUNK_SIZE },
}).single('file');

/**
 * Gabungkan chunk 1..total secara berurutan ke satu file.
 * Chunk dibaca satu per satu (bukan membuka semua sekaligus) dan menghormati
 * backpressure, sehingga memori & file descriptor tetap kecil untuk file besar.
 */
async function mergeChunks(chunkDir, finalPath, total) {
  const out = fs.createWriteStream(finalPath);
  const failed = new Promise((_, reject) => out.once('error', reject));
  failed.catch(() => {}); // hindari unhandled rejection; error diteruskan lewat race di bawah

  try {
    for (let i = 1; i <= total; i += 1) {
      const input = fs.createReadStream(path.join(chunkDir, `chunk_${i}`));
      for await (const data of input) {
        if (!out.write(data)) {
          await Promise.race([once(out, 'drain'), failed]);
        }
      }
    }
    await Promise.race([new Promise((resolve) => out.end(resolve)), failed]);
  } catch (err) {
    out.destroy();
    fs.rmSync(finalPath, { force: true });
    throw err;
  }
}

function removeChunkDir(chunkDir) {
  // Jangan pernah menghapus folder akar chunk (identifier kosong).
  if (path.resolve(chunkDir) === path.resolve(CHUNKS_ROOT)) return;
  fs.rmSync(chunkDir, { recursive: true, force: true });
}

function discardTmp(req) {
  if (req.file?.path) fs.rmSync(req.file.path, { force: true });
}

/**
 * Hapus chunk dan file sementara dari upload yang ditinggalkan.
 * mtime folder chunk ikut berubah setiap chunk masuk, jadi upload yang masih
 * berjalan tidak ikut terhapus.
 */
function sweepStale() {
  const now = Date.now();
  for (const root of [CHUNKS_ROOT, TMP_DIR]) {
    let names = [];
    try {
      names = fs.readdirSync(root);
    } catch {
      continue;
    }
    for (const name of names) {
      const target = path.join(root, name);
      try {
        if (now - fs.statSync(target).mtimeMs > STALE_MS) {
          fs.rmSync(target, { recursive: true, force: true });
        }
      } catch {
        /* abaikan: file hilang/sedang dipakai */
      }
    }
  }
}

sweepStale();
setInterval(sweepStale, 60 * 60 * 1000).unref();

const uploadController = {
  /**
   * GET /api/chunk-upload?resumableIdentifier=...&resumableChunkNumber=...
   * 200 jika chunk sudah ada (untuk resume), 204 jika belum.
   */
  checkChunk(req, res) {
    const { resumableIdentifier, resumableChunkNumber } = req.query;
    if (!sanitizeIdentifier(resumableIdentifier)) {
      return res.status(204).end();
    }
    const chunkPath = getChunkPath(resumableIdentifier, resumableChunkNumber);

    if (fs.existsSync(chunkPath)) {
      return res.status(200).end();
    }
    return res.status(204).end();
  },

  /**
   * POST /api/chunk-upload (multipart, field: file)
   * Simpan chunk; jika semua chunk lengkap, gabungkan menjadi satu file
   * di public/uploads/materi-kotbah/<random>.<ext>.
   */
  async upload(req, res) {
    try {
      const {
        resumableIdentifier,
        resumableFilename,
        resumableChunkNumber,
        resumableTotalChunks,
        resumableTotalSize,
      } = req.body;

      const identifier = sanitizeIdentifier(resumableIdentifier);
      const chunkNumber = toPositiveInt(resumableChunkNumber);
      const total = toPositiveInt(resumableTotalChunks);

      if (!identifier || !resumableFilename || !chunkNumber || !total || chunkNumber > total) {
        throw new AppError('Parameter resumable upload tidak lengkap', 400);
      }
      if (total > MAX_TOTAL_CHUNKS) {
        throw new AppError('Jumlah chunk terlalu banyak', 400);
      }
      if (Number(resumableTotalSize) > MAX_FILE_SIZE) {
        throw new AppError(
          `Ukuran file terlalu besar (maksimal ${MAX_FILE_SIZE / 1024 / 1024}MB)`,
          413
        );
      }

      const extension = path.extname(resumableFilename).slice(1).toLowerCase();
      if (!ALLOWED_EXTENSIONS.includes(extension)) {
        throw new AppError('File harus berupa PDF atau PowerPoint (ppt, pptx)', 400);
      }

      // Pindahkan chunk dari folder sementara ke folder chunk.
      const chunkDir = getChunkDir(identifier);
      const chunkFile = getChunkPath(identifier, chunkNumber);
      ensureDir(chunkDir);

      if (req.file && fs.existsSync(req.file.path)) {
        fs.rmSync(chunkFile, { force: true });
        fs.renameSync(req.file.path, chunkFile);
      } else if (!fs.existsSync(chunkFile)) {
        throw new AppError(
          'No file found in request. Please check your upload configuration.',
          400
        );
      }

      // Cek apakah semua chunk sudah terupload + jumlahkan ukurannya.
      let allUploaded = true;
      let accumulated = 0;
      for (let i = 1; i <= total; i += 1) {
        try {
          accumulated += fs.statSync(getChunkPath(identifier, i)).size;
        } catch {
          allUploaded = false;
          break;
        }
      }

      if (!allUploaded) {
        return res.json({
          status: 'chunk_uploaded',
          chunk: resumableChunkNumber,
        });
      }

      if (accumulated > MAX_FILE_SIZE) {
        removeChunkDir(chunkDir);
        throw new AppError(
          `Ukuran file terlalu besar (maksimal ${MAX_FILE_SIZE / 1024 / 1024}MB)`,
          413
        );
      }

      // Request lain untuk identifier yang sama sedang menggabungkan file.
      if (merging.has(identifier)) {
        return res.json({ status: 'merging', chunk: resumableChunkNumber });
      }
      merging.add(identifier);

      try {
        // Gabungkan semua chunk menjadi satu file final.
        const finalFilename = `materi-kotbah/${crypto.randomBytes(20).toString('hex')}.${extension}`;
        const finalPath = path.join(UPLOAD_DIR, finalFilename);
        ensureDir(path.dirname(finalPath));

        await mergeChunks(chunkDir, finalPath, total);
        removeChunkDir(chunkDir);

        // Verifikasi isi file hasil merge (magic bytes): ekstensi dan mimetype
        // yang dikirim klien bisa dipalsukan, isi binernya tidak.
        const detectedType = detectFileType(finalPath);
        if (!DOCUMENT_TYPES.has(detectedType)) {
          fs.rmSync(finalPath, { force: true });
          throw new AppError('Isi file bukan PDF atau PowerPoint yang valid', 400);
        }

        return res.json({
          status: 'success',
          message: 'File uploaded successfully',
          filename: finalFilename,
          original_name: resumableFilename,
        });
      } finally {
        merging.delete(identifier);
      }
    } catch (err) {
      // Chunk sementara yang belum dipindahkan tidak boleh tertinggal di disk.
      discardTmp(req);
      throw err;
    }
  },

  /**
   * POST /api/chunk-cleanup { identifier }
   * Hapus chunk yang tidak selesai diupload.
   */
  cleanup(req, res) {
    const identifier = sanitizeIdentifier(req.body.identifier || req.query.identifier);

    if (!identifier) {
      return res.status(400).json({ status: 'error', message: 'No identifier provided' });
    }

    removeChunkDir(getChunkDir(identifier));
    return res.json({ status: 'success', message: 'Chunks cleaned up' });
  },
};

export { uploadController, uploadChunk, MAX_FILE_SIZE };
