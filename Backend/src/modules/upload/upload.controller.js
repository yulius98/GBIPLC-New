import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import multer from 'multer';
import AppError from '../../utils/AppError.js';
import { UPLOAD_DIR } from '../../middlewares/upload.js';

/**
 * Chunk upload (protokol Resumable.js).
 * Port dari ChunkUploadController Laravel untuk upload file besar
 * (PDF/PowerPoint), mis. materi kotbah.
 */

const CHUNKS_ROOT = path.join(import.meta.dirname, '../../storage/chunks');
const TMP_DIR = path.join(import.meta.dirname, '../../storage/tmp');

const ALLOWED_EXTENSIONS = ['pdf', 'ppt', 'pptx'];

// Maksimal satu chunk (Resumable.js default 1MB; dibatasi 50MB agar aman).
const MAX_CHUNK_SIZE = 50 * 1024 * 1024;

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

ensureDir(CHUNKS_ROOT);
ensureDir(TMP_DIR);

function sanitizeIdentifier(identifier) {
  return String(identifier || '').replace(/[^a-zA-Z0-9_-]/g, '');
}

function getChunkDir(identifier) {
  return path.join(CHUNKS_ROOT, sanitizeIdentifier(identifier));
}

function getChunkPath(identifier, chunkNumber) {
  return path.join(getChunkDir(identifier), `chunk_${chunkNumber}`);
}

/**
 * Middleware multer untuk menerima satu chunk.
 * Validasi ekstensi dilakukan di controller (setelah seluruh field ter-parse),
 * karena req.body belum lengkap saat fileFilter multer dijalankan.
 */
const uploadChunk = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, TMP_DIR),
    filename: (req, file, cb) =>
      cb(null, `chunk_${req.body.resumableChunkNumber || 0}`),
  }),
  limits: { fileSize: MAX_CHUNK_SIZE },
}).single('file');

function mergeChunks(chunkDir, finalPath, total) {
  return new Promise((resolve, reject) => {
    const out = fs.createWriteStream(finalPath);
    const streams = [];
    for (let i = 1; i <= total; i += 1) {
      streams.push(fs.createReadStream(path.join(chunkDir, `chunk_${i}`)));
    }

    let index = 0;
    const next = () => {
      if (index >= streams.length) {
        out.end();
        resolve();
        return;
      }
      streams[index].on('error', reject);
      streams[index].pipe(out, { end: false });
      streams[index].on('end', () => {
        index += 1;
        next();
      });
    };

    out.on('error', reject);
    next();
  });
}

function removeChunkDir(chunkDir) {
  if (!fs.existsSync(chunkDir)) return;
  for (const file of fs.readdirSync(chunkDir)) {
    try {
      fs.unlinkSync(path.join(chunkDir, file));
    } catch {
      /* abaikan file yang sudah tidak ada */
    }
  }
  try {
    fs.rmdirSync(chunkDir);
  } catch {
    /* abaikan jika direktori tidak bisa dihapus */
  }
}

const uploadController = {
  /**
   * GET /api/chunk-upload?resumableIdentifier=...&resumableChunkNumber=...
   * 200 jika chunk sudah ada (untuk resume), 204 jika belum.
   */
  checkChunk(req, res) {
    const { resumableIdentifier, resumableChunkNumber } = req.query;
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
    const {
      resumableIdentifier,
      resumableFilename,
      resumableChunkNumber,
      resumableTotalChunks,
    } = req.body;

    if (!resumableIdentifier || !resumableFilename || !resumableChunkNumber) {
      throw new AppError('Parameter resumable upload tidak lengkap', 400);
    }

    const extension = path.extname(resumableFilename).slice(1).toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(extension)) {
      // Hapus file sementara yang sudah ditulis multer.
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      throw new AppError('File harus berupa PDF atau PowerPoint (ppt, pptx)', 400);
    }

    // Pindahkan chunk dari folder sementara ke folder chunk.
    const chunkDir = getChunkDir(resumableIdentifier);
    const chunkFile = getChunkPath(resumableIdentifier, resumableChunkNumber);
    ensureDir(chunkDir);

    if (req.file && fs.existsSync(req.file.path)) {
      if (fs.existsSync(chunkFile)) {
        fs.unlinkSync(chunkFile);
      }
      fs.renameSync(req.file.path, chunkFile);
    } else if (!fs.existsSync(chunkFile)) {
      throw new AppError('No file found in request. Please check your upload configuration.', 400);
    }

    const total = Number.parseInt(resumableTotalChunks, 10) || 1;

    // Cek apakah semua chunk sudah terupload.
    let allUploaded = true;
    for (let i = 1; i <= total; i += 1) {
      if (!fs.existsSync(getChunkPath(resumableIdentifier, i))) {
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

    // Gabungkan semua chunk menjadi satu file final.
    const finalFilename = `materi-kotbah/${crypto.randomBytes(20).toString('hex')}.${extension}`;
    const finalPath = path.join(UPLOAD_DIR, finalFilename);
    ensureDir(path.dirname(finalPath));

    await mergeChunks(chunkDir, finalPath, total);
    removeChunkDir(chunkDir);

    return res.json({
      status: 'success',
      message: 'File uploaded successfully',
      filename: finalFilename,
      original_name: resumableFilename,
    });
  },

  /**
   * POST /api/chunk-cleanup { identifier }
   * Hapus chunk yang tidak selesai diupload.
   */
  cleanup(req, res) {
    const identifier = req.body.identifier || req.query.identifier;

    if (!identifier) {
      return res.status(400).json({ status: 'error', message: 'No identifier provided' });
    }

    const chunkDir = getChunkDir(identifier);
    if (fs.existsSync(chunkDir)) {
      removeChunkDir(chunkDir);
      return res.json({ status: 'success', message: 'Chunks cleaned up' });
    }

    return res.status(400).json({ status: 'error', message: 'No identifier provided' });
  },
};

export { uploadController, uploadChunk };
