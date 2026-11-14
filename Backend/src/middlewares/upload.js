import multer from 'multer';
import path from 'path';
import fs from 'fs';
import AppError from '../utils/AppError.js';
import {
  detectFileType,
  validateImageData,
  validateMediaData,
  validateDocumentData,
} from '../utils/fileTypes.js';
const UPLOAD_DIR = path.join(import.meta.dirname, '../../public/uploads');

// Pastikan folder upload selalu ada
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

/**
 * Kumpulkan semua path file yang terunggah pada request,
 * baik dari .single (req.file) maupun .fields (req.files).
 */
function collectUploadedFiles(req) {
  const files = [];
  if (req.file) files.push(req.file);
  if (req.files) {
    for (const list of Object.values(req.files)) {
      for (const f of list) files.push(f);
    }
  }
  return files;
}

/**
 * Hapus sisa file di disk ketika validasi gagal, agar tidak jadi sampah.
 */
function unlinkUploaded(files) {
  for (const f of files) {
    if (f?.path && fs.existsSync(f.path)) {
      try {
        fs.unlinkSync(f.path);
      } catch {
        /* abaikan */
      }
    }
  }
}

/**
 * Validasi magic bytes SETELAH multer menyimpan file: isi file nyata
 * harus sesuai kategori (mimetype dari klien bisa dipalsukan bebas).
 */
function validateContent(files, validator) {
  for (const f of files) {
    const type = detectFileType(f.path);
    const error = validator(type);
    if (error) {
      unlinkUploaded(files);
      return error;
    }
  }
  return null;
}

/**
 * Konfigurasi multer: simpan file ke public/uploads dengan nama aman.
 * Disimpan sebagai original (belum ada proses resize),
 * nama asli di-sanitize untuk keamanan.
 */
const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, UPLOAD_DIR);
  },
  filename(req, file, cb) {
    const cleanBase = (file.originalname || 'file')
      .replace(/\.[^.]+$/, '')
      .replace(/[^A-Za-z0-9_-]/g, '_');
    const ext = path.extname(file.originalname || '').toLowerCase();
    cb(null, `${cleanBase}_${Date.now()}${ext}`);
  },
});

// SVG dikeluarkan: browser bisa mengeksekusi <script> di dalam SVG,
// sehingga file SVG yang diunggah publik berpotensi jadi celah stored XSS.
const ALLOWED_IMAGE_MIMES = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'image/webp'];

const IMAGE_MAX_MB = 2;
const MEDIA_MAX_MB = 10;
// Batas unggah dokumen langsung. Sonar S5693 menandai limit > 8.000.000 byte
// sebagai hotspot DoS. Dokumen besar tetap bisa diunggah lewat POST
// /api/chunk-upload, jadi batas ini hanya untuk file yang diunggah langsung.
const DOCUMENT_MAX_BYTES = 8_000_000; // 8 MB desimal (≈ 7,6 MiB)

function limitError(err, maxBytes) {
  if (err?.name === "MulterError" && err.code === "LIMIT_FILE_SIZE") {
    const maxMb = Math.ceil(maxBytes / (1024 * 1024));
    const message = `Ukuran file terlalu besar (maksimal ${maxMb}MB).`;
    return new AppError(message, 422, { filename: [message] });
  }
  return err;
}



function failOrNext(err, files, req, res, next) {
  if (err) {
    unlinkUploaded(files);
    return next(limitError(err, IMAGE_MAX_MB * 1024 * 1024));
  }
  const error = validateContent(collectUploadedFiles(req), validateImageData);
  if (error) {
    return next(
      new AppError(error, 422, {
        filename: 'File yang diunggah harus berupa gambar yang valid (jpeg, png, gif, atau webp).',
      })
    );
  }
  next();
}

const multerImage = multer({
  storage,
  limits: { fileSize: IMAGE_MAX_MB * 1024 * 1024 },
  fileFilter(req, file, cb) {
    if (ALLOWED_IMAGE_MIMES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new AppError("File yang diunggah harus berupa gambar.", 422, {
          filename:
            "File yang diunggah harus berupa gambar (jpeg, png, jpg, gif, atau webp).",
        }),
      );
    }
  },
});

/**
 * Upload single file image (untuk foto jemaat, carousel, dll).
 * Nama field default: 'filename' (sesuai request Laravel lama).
 * mimeType + magic bytes wajib gambar.
 */
const uploadImage = (req, res, next) =>
  multerImage.single('filename')(req, res, (err) => {
    const files = collectUploadedFiles(req);
    failOrNext(err, files, req, res, next);
  });

const multerMedia = () =>
  multer({
    storage,
    limits: { fileSize: MEDIA_MAX_MB * 1024 * 1024 },
    fileFilter(req, file, cb) {
      const isImage = file.mimetype.startsWith("image/");
      const isVideo = file.mimetype.startsWith("video/");
      if (isImage || isVideo) {
        cb(null, true);
      } else {
        cb(new AppError("File harus berupa gambar atau video.", 422));
      }
    },
  });

/**
 * Buat middleware upload untuk beberapa field file sekaligus.
 * mimeType + magic bytes wajib gambar/video.
 * @param {Array<{name: string, maxCount: number}>} fields
 */
function uploadFields(fields) {
  return (req, res, next) =>
    multerMedia().fields(fields)(req, res, (err) => {
      const files = collectUploadedFiles(req);
      if (err) {
        unlinkUploaded(files);
        return next(limitError(err, MEDIA_MAX_MB * 1024 * 1024));
      }
      const error = validateContent(files, validateMediaData);
      if (error) {
        return next(new AppError(error, 422));
      }
      next();
    });
}

const DOCUMENT_MIMES = [
  'application/pdf',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
];

/**
 * Buat middleware upload yang menerima gambar + dokumen (PDF/PPT/PPTX),
 * untuk materi kotbah ibadah raya.
 * mimeType + magic bytes wajib gambar atau dokumen.
 * @param {Array<{name: string, maxCount: number}>} fields
 */
function uploadDocument(fields) {
  return (req, res, next) =>
    multer({
      storage,
      // Batas aman di bawah ambang hotspot S5693 (8.000.000 byte).
      limits: { fileSize: DOCUMENT_MAX_BYTES },
      fileFilter(req, file, cb) {
        const isImage = file.mimetype.startsWith("image/");
        if (isImage || DOCUMENT_MIMES.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(
            new AppError(
              "File harus berupa gambar, PDF, atau PowerPoint.",
              422,
            ),
          );
        }
      },
    }).fields(fields)(req, res, (err) => {
      const files = collectUploadedFiles(req);
      if (err) {
        unlinkUploaded(files);
        return next(limitError(err, DOCUMENT_MAX_BYTES));
      }
      const error = validateContent(files, validateDocumentData);
      if (error) {
        return next(new AppError(error, 422));
      }
      next();
    });
}

export { uploadImage, uploadFields, uploadDocument, UPLOAD_DIR };
