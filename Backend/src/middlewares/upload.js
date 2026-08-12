import multer from 'multer';
import path from 'path';
import fs from 'fs';
import AppError from '../utils/AppError.js';
const UPLOAD_DIR = path.join(import.meta.dirname, '../../public/uploads');

// Pastikan folder upload selalu ada
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
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

const ALLOWED_IMAGE_MIMES = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'image/svg+xml'];

/**
 * Upload single file image (untuk foto jemaat, carousel, dll).
 * Nama field default: 'filename' (sesuai request Laravel lama).
 */
const uploadImage = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter(req, file, cb) {
    if (ALLOWED_IMAGE_MIMES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new AppError(
          'File yang diunggah harus berupa gambar.',
          422,
          { filename: 'File yang diunggah harus berupa gambar (jpeg, png, jpg, gif, atau svg).' }
        )
      );
    }
  },
}).single('filename');

/**
 * Buat middleware upload untuk beberapa field file sekaligus.
 * @param {Array<{name: string, maxCount: number}>} fields
 */
function uploadFields(fields) {
  return multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    fileFilter(req, file, cb) {
      const isImage = file.mimetype.startsWith('image/');
      const isVideo = file.mimetype.startsWith('video/');
      if (isImage || isVideo) {
        cb(null, true);
      } else {
        cb(new AppError('File harus berupa gambar atau video.', 422));
      }
    },
  }).fields(fields);
}

const DOCUMENT_MIMES = [
  'application/pdf',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
];

/**
 * Buat middleware upload yang menerima gambar + dokumen (PDF/PPT/PPTX),
 * untuk materi kotbah ibadah raya.
 * @param {Array<{name: string, maxCount: number}>} fields
 */
function uploadDocument(fields) {
  return multer({
    storage,
    limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
    fileFilter(req, file, cb) {
      const isImage = file.mimetype.startsWith('image/');
      if (isImage || DOCUMENT_MIMES.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new AppError('File harus berupa gambar, PDF, atau PowerPoint.', 422));
      }
    },
  }).fields(fields);
}

export { uploadImage, uploadFields, uploadDocument, UPLOAD_DIR };
