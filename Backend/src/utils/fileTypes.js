import fs from 'fs';

/**
 * Deteksi tipe file berdasarkan magic bytes (signature di awal file),
 * bukan mimetype yang dikirim klien (yang mudah dipalsukan).
 *
 * Dipakai untuk memvalidasi isi upload: gambar, video, PDF/PowerPoint.
 */

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const OLE_SIGNATURE = Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]); // legacy .ppt
const ZIP_SIGNATURE_STARTS = ['PK\x03\x04', 'PK\x05\x06', 'PK\x07\x08']; // OOXML (.pptx/.docx/.xlsx)

/**
 * Baca beberapa byte pertama file.
 * @param {string} filePath
 * @param {number} [size=16]
 * @returns {Buffer} bisa kosong (length 0) bila file tidak ada/kosong
 */
function readHead(filePath, size = 16) {
  let fd;
  try {
    fd = fs.openSync(filePath, 'r');
    const buf = Buffer.alloc(size);
    const bytes = fs.readSync(fd, buf, 0, size, 0);
    return buf.subarray(0, bytes);
  } catch {
    return Buffer.alloc(0);
  } finally {
    if (fd !== undefined) {
      try {
        fs.closeSync(fd);
      } catch {
        /* abaikan */
      }
    }
  }
}

function ascii(buf, start, len) {
  if (buf.length < start + len) return '';
  return buf.subarray(start, start + len).toString('latin1');
}

/**
 * @param {string} filePath
 * @returns {string} salah satu dari:
 *   'jpeg' 'png' 'gif' 'webp' 'mp4' 'webm' 'avi' 'pdf' 'zip' 'ole' 'unknown'
 */
export function detectFileType(filePath) {
  const head = readHead(filePath, 16);
  if (head.length < 4) return 'unknown';

  if (head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff) return 'jpeg';
  if (head.subarray(0, 8).equals(PNG_SIGNATURE)) return 'png';
  if (ascii(head, 0, 4) === 'GIF8') return 'gif';

  if (ascii(head, 0, 4) === 'RIFF') {
    if (ascii(head, 8, 4) === 'WEBP') return 'webp';
    if (ascii(head, 8, 4) === 'AVI ') return 'avi';
    return 'unknown';
  }

  if (head.length >= 12 && ascii(head, 4, 4) === 'ftyp') return 'mp4';
  if (head[0] === 0x1a && head[1] === 0x45 && head[2] === 0xdf && head[3] === 0xa3) return 'webm';

  if (ascii(head, 0, 4) === '%PDF') return 'pdf';
  if (head.subarray(0, 8).equals(OLE_SIGNATURE)) return 'ole';
  if (ZIP_SIGNATURE_STARTS.some((sig) => ascii(head, 0, 4) === sig.slice(0, 4))) return 'zip';

  return 'unknown';
}

// Kategori tipe yang diperbolehkan (SVG sengaja dikecualikan: bisa
// mengeksekusi <script> di browser = stored XSS).
export const IMAGE_TYPES = new Set(['jpeg', 'png', 'gif', 'webp']);
export const VIDEO_TYPES = new Set(['mp4', 'webm', 'avi']);
// 'zip' = OOXML (.pptx), 'ole' = legacy .ppt
export const DOCUMENT_TYPES = new Set(['pdf', 'zip', 'ole']);

/**
 * @param {function(string): boolean} predicate - true jika tipe boleh lolos
 * @param {string} permissionText - pesan untuk user
 * @returns {function(string|null): string|null} null jika lolos, pesan error jika tidak
 */
function makeValidator(predicate, permissionText) {
  return (type) => (type && predicate(type) ? null : `Isi file bukan ${permissionText}. Periksa kembali file yang diunggah.`);
}

export const validateImageData = makeValidator((t) => IMAGE_TYPES.has(t), 'gambar yang valid');
export const validateMediaData = makeValidator((t) => IMAGE_TYPES.has(t) || VIDEO_TYPES.has(t), 'gambar atau video yang valid');
export const validateDocumentData = makeValidator(
  (t) => IMAGE_TYPES.has(t) || DOCUMENT_TYPES.has(t),
  'gambar, PDF, atau PowerPoint yang valid'
);
