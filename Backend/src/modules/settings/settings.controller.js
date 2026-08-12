import prisma from '../../utils/prisma.js';
import apiResponse from '../../utils/apiResponse.js';
import fileUploadService from '../../services/fileUpload.service.js';

/**
 * Nilai default SEO (single-row, id=1).
 * Dipakai saat baris setting belum pernah dibuat.
 */
const DEFAULT_SEO = {
  site_name: 'GBI Philadelphia Life Center',
  site_name_short: 'GBI PLC',
  site_url: 'https://philadelphialifecenter.com',
  locale: 'id_ID',
  default_title: 'GBI Philadelphia Life Center — Gereja di Yogyakarta',
  default_description:
    'GBI Philadelphia Life Center (GBI PLC) adalah gereja Bethel di Yogyakarta. Ibadah Raya setiap Minggu pukul 10.00 WIB, Saat Teduh harian, materi kotbah, Youth Ministry, dan Life Group.',
  keywords:
    'gereja, GBI, gereja di jogja, gereja di Yogyakarta, gereja di sleman, kotbah, ibadah raya, materi kotbah, saat teduh, GBI PLC, philadelphia life center',
  church_name: 'GBI Philadelphia Life Center',
  church_alternate_name: 'GBI PLC',
  church_description:
    'Gereja Bethel Indonesia (GBI) Philadelphia Life Center di Yogyakarta yang melayani Ibadah Raya, Youth Ministry, dan Life Group.',
  telephone: '+6285336618852',
  whatsapp: '6285336618852',
  street_address: 'Jl. Babarsari No.45, Janti, Caturtunggal, Kec. Depok',
  address_locality: 'Sleman',
  address_region: 'Daerah Istimewa Yogyakarta',
  postal_code: '55281',
  address_country: 'ID',
  service_name: 'Ibadah Raya',
  day_of_week: 'Sunday',
  opens: '10:00',
  closes: '12:00',
  instagram: '',
  facebook: '',
};

const SEO_FIELDS = [
  'site_name',
  'site_name_short',
  'site_url',
  'locale',
  'default_title',
  'default_description',
  'keywords',
  'church_name',
  'church_alternate_name',
  'church_description',
  'telephone',
  'whatsapp',
  'street_address',
  'address_locality',
  'address_region',
  'postal_code',
  'address_country',
  'service_name',
  'day_of_week',
  'opens',
  'closes',
  'instagram',
  'facebook',
];

/**
 * Ambil baris setting SEO (buat otomatis dengan default jika belum ada).
 */
async function ensureSeoRow() {
  const existing = await prisma.tblSeoSetting.findUnique({ where: { id: 1 } });
  if (existing) return existing;
  return prisma.tblSeoSetting.create({
    data: { ...DEFAULT_SEO, og_image: null },
  });
}

/**
 * GET /api/seo dan /api/admin/seo
 * Setting SEO untuk situs (single row).
 */
async function getSeo(req, res) {
  const settings = await ensureSeoRow();
  const data = { ...settings };
  if (settings.og_image) {
    data.og_image_url = fileUploadService.getPublicUrl(settings.og_image);
  }
  return apiResponse.success(res, {
    message: 'Data ditemukan',
    data,
  });
}

/**
 * PUT /api/admin/seo
 * Perbarui setting SEO. Menerima JSON atau multipart/form-data
 * (untuk upload gambar og:image lewat field "og_image").
 */
async function updateSeo(req, res) {
  const data = {};
  for (const field of SEO_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(req.body, field)) {
      data[field] = req.body[field] ?? null;
    }
  }

  if (req.file && req.file.fieldname === 'og_image') {
    const existing = await prisma.tblSeoSetting.findUnique({ where: { id: 1 } });
    data.og_image = fileUploadService.replaceFile(req.file, {
      subDirectory: 'seo',
      oldFilePath: existing?.og_image,
    });
  }

  const settings = await prisma.tblSeoSetting.upsert({
    where: { id: 1 },
    update: data,
    create: { ...DEFAULT_SEO, ...data, og_image: data.og_image ?? null },
  });

  const result = { ...settings };
  if (settings.og_image) {
    result.og_image_url = fileUploadService.getPublicUrl(settings.og_image);
  }

  return apiResponse.success(res, {
    message: 'Setting SEO berhasil disimpan',
    data: result,
  });
}

export default { getSeo, updateSeo };
