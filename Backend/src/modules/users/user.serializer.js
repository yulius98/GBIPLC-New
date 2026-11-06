import fileUploadService from '../../services/fileUpload.service.js';
const SAFE_FIELDS = [
  'id',
  'public_id',
  'name',
  'email',
  'alamat',
  'tgl_lahir',
  'no_HP',
  'gol_darah',
  'instagram',
  'facebook',
  'filename',
  'role',
  'reading_start_date',
  'created_at',
  'updated_at',
];

/**
 * Serialisasi objek user: hanya field aman + tambah photo_url.
 * @param {object} user - objek hasil query Prisma
 */
function serializeUser(user) {
  if (!user) return null;

  const data = {};
  for (const key of SAFE_FIELDS) {
    if (key in user) data[key] = user[key];
  }
  data.photo_url = fileUploadService.getPublicUrl(user.filename);
  return data;
}

/**
 * Serialisasi minimal untuk data yang diakses tanpa autentikasi
 * (endpoint publik /birthday): hanya nama, tanggal lahir, dan foto.
 * Tanpa email, No. HP, alamat, gol_darah, public_id, media sosial —
 * mencegah scraping PII jemaat oleh pihak tanpa akun.
 * @param {object} user - objek hasil query Prisma
 */
function serializeBirthdayUser(user) {
  if (!user) return null;
  return {
    id: user.id,
    name: user.name,
    tgl_lahir: user.tgl_lahir,
    photo_url: fileUploadService.getPublicUrl(user.filename),
  };
}

export { serializeUser, serializeBirthdayUser };
