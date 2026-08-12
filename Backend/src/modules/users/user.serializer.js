import fileUploadService from '../../services/fileUpload.service.js';
const SAFE_FIELDS = [
  'id',
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

export { serializeUser };
