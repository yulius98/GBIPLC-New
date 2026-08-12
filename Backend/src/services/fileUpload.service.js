import path from 'path';
import fs from 'fs';
import { UPLOAD_DIR } from '../middlewares/upload.js';
import env from '../config/env.js';

/**
 * Service untuk pengelolaan file upload.
 * Menggantikan FileUploadService Laravel.
 *
 * File disimpan di public/uploads/ dan URL publik menjadi APP_URL/uploads/<nama>.
 */
const fileUploadService = {
  /**
   * Simpan file (dari multer) ke disk.
   * @param {Express.Multer.File|null} file - objek file dari multer
   * @param {object} options
   * @param {string} [options.subDirectory=''] - sub-folder opsional (mis. 'foto-jemaat')
   * @returns {string|null} nama file yang disimpan (relative path), atau null
   */
  saveFile(file, { subDirectory = '' } = {}) {
    if (!file) return null;

    let relativePath = file.filename;
    if (subDirectory) {
      const dir = path.join(UPLOAD_DIR, subDirectory);
      fs.mkdirSync(dir, { recursive: true });
      const target = path.join(dir, file.filename);
      fs.renameSync(file.path, target);
      relativePath = path.join(subDirectory, file.filename).replace(/\\/g, '/');
    }
    return relativePath;
  },

  /**
   * Hapus file dari disk berdasarkan relative path (mis. 'foto-jemaat/abc.jpg').
   */
  deleteFile(filePath) {
    const fullPath = this.getDiskPath(filePath);
    if (!fullPath) return false;
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
      return true;
    }
    return false;
  },

  /**
   * Ubah relative path menjadi path absolut di dalam UPLOAD_DIR.
   * Mengembalikan null jika path di luar UPLOAD_DIR (anti path traversal).
   * @param {string|null} relativePath - mis. 'foto-jemaat/abc.jpg'
   * @returns {string|null}
   */
  getDiskPath(relativePath) {
    if (!relativePath) return null;
    const fullPath = path.normalize(path.join(UPLOAD_DIR, relativePath));
    if (!fullPath.startsWith(UPLOAD_DIR)) return null;
    return fullPath;
  },

  /**
   * Ganti file lama dengan file baru (opsional: hapus yang lama).
   */
  replaceFile(file, { subDirectory = '', oldFilePath = null } = {}) {
    if (oldFilePath) this.deleteFile(oldFilePath);
    return this.saveFile(file, { subDirectory });
  },

  /**
   * Bangun URL publik untuk sebuah file.
   * @param {string|null} relativePath - mis. 'foto-jemaat/abc.jpg'
   * @returns {string|null}
   */
  getPublicUrl(relativePath) {
    if (!relativePath) return null;
    return `${env.appUrl}/uploads/${relativePath.replace(/\\/g, '/')}`;
  },
};

export default fileUploadService;
