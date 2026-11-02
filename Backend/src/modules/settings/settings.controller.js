import prisma from '../../utils/prisma.js';
import apiResponse from '../../utils/apiResponse.js';
import fileUploadService from '../../services/fileUpload.service.js';
import DEFAULT_SEO from './seoDefaults.js';

/**
 * Nilai default Data Gembala (singleton, id=1).
 * Dipakai saat baris belum pernah dibuat — sama dengan seed migrasi.
 */
const DEFAULT_GEMBALA = {
  nama_gembala: 'Pdm. Jimmy Sugiarto',
  wakil_gembala: 'Pdm. Freddy Budiman',
};

/**
 * Nilai default SEO (single-row, id=1). Lihat ./seoDefaults.js.
 * Dipakai saat baris setting belum pernah dibuat.
 */

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

/**
 * GET /api/schedule
 * Daftar jadwal ibadah (multi-row, tabel tbl_service_schedules) untuk
 * halaman publik: footer PublicLayout, halaman Kontak, dll.
 * Tanpa autentikasi (read-only, hanya mengembalikan data Setting).
 */
async function getSchedules(req, res) {
  const data = await prisma.tblServiceSchedule.findMany({
    orderBy: { id: 'asc' },
  });

  return apiResponse.success(res, {
    message: 'Data ditemukan',
    data,
  });
}

/**
 * GET /api/gembala dan GET /api/admin/gembala
 * Data gembala (singleton path row) untuk footer publik & form admin.
 */
async function getGembala(req, res) {
  let data = await prisma.tblDataGembala.findUnique({ where: { id: 1 } });
  if (!data) {
    // Idempotent fallback: garantikan baris ada (sama pola ensureSeoRow)
    data = await prisma.tblDataGembala.create({ data: { ...DEFAULT_GEMBALA } });
  }

  return apiResponse.success(res, {
    message: 'Data ditemukan',
    data,
  });
}

/**
 * PUT /api/admin/gembala
 * Perbarui data gembala (singleton, hanya field nama yang diubah).
 */
async function updateGembala(req, res) {
  const body = req.body || {};
  const data = {};
  for (const field of ['nama_gembala', 'wakil_gembala']) {
    if (Object.prototype.hasOwnProperty.call(body, field)) {
      data[field] = String(body[field] ?? '').trim();
    }
  }

  if (!data.nama_gembala) {
    return apiResponse.error(res, {
      message: 'Nama gembala wajib diisi',
      statusCode: 422,
    });
  }

  const row = await prisma.tblDataGembala.upsert({
    where: { id: 1 },
    update: data,
    create: { ...DEFAULT_GEMBALA, ...data },
  });

  return apiResponse.success(res, {
    message: 'Data gembala berhasil disimpan',
    data: row,
  });
}

/**
 * GET /api/tentang dan GET /api/admin/tentang
 * Konten halaman Tentang: singleton text + daftar kartu pelayanan.
 */
async function getTentang(req, res) {
  const tentang = await prisma.tblTentangKami.findUnique({ where: { id: 1 } });
  const pelayanan = await prisma.tblTentangKamiPelayanan.findMany({
    orderBy: { id: 'asc' },
  });

  return apiResponse.success(res, {
    message: 'Data ditemukan',
    data: { tentang, pelayanan },
  });
}

/**
 * PUT /api/admin/tentang
 * Perbarui konten teks halaman Tentang (singleton, hanya field yang dikirim).
 */
async function updateTentang(req, res) {
  const body = req.body || {};
  const fields = ['judul', 'sub_judul', 'lede', 'paragraf_1', 'paragraf_2'];
  const data = {};
  for (const field of fields) {
    if (Object.prototype.hasOwnProperty.call(body, field)) {
      data[field] = String(body[field] ?? '').trim();
    }
  }

  if (!data.judul && !data.sub_judul && !data.lede && !data.paragraf_1 && !data.paragraf_2) {
    return apiResponse.error(res, {
      message: 'Minimal satu field wajib diisi',
      statusCode: 422,
    });
  }

  await prisma.tblTentangKami.upsert({
    where: { id: 1 },
    update: data,
    // Bila baris belum ada, nilai default dari migrasi dipakai untuk field lain
    create: {
      judul: data.judul || 'GBI Philadelphia Life Center',
      sub_judul: data.sub_judul || 'Gereja Bethel di Yogyakarta',
      lede: data.lede || '',
      paragraf_1: data.paragraf_1 || '',
      paragraf_2: data.paragraf_2 || '',
    },
  });

  const tentang = await prisma.tblTentangKami.findUnique({ where: { id: 1 } });
  const pelayanan = await prisma.tblTentangKamiPelayanan.findMany({
    orderBy: { id: 'asc' },
  });

  return apiResponse.success(res, {
    message: 'Konten Tentang Kami berhasil disimpan',
    data: { tentang, pelayanan },
  });
}

export default { getSeo, updateSeo, getSchedules, getGembala, updateGembala, getTentang, updateTentang };
