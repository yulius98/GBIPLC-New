import dayjs from 'dayjs';
import fs from 'fs';
import path from 'path';
import prisma from '../../utils/prisma.js';
import apiResponse from '../../utils/apiResponse.js';
import AppError from '../../utils/AppError.js';
import fileUploadService from '../../services/fileUpload.service.js';
/**
 * Tambahkan field URL publik ke item konten yang punya file.
 */
function withFileUrl(item, urlField) {
  const data = { ...item };
  data[urlField] = fileUploadService.getPublicUrl(item.filename);
  return data;
}

/**
 * Controller konten gereja:
 * pastor note, event, carousel, life group, materi kotbah, ibadah raya.
 */
const contentsController = {
  /**
   * GET /api/pastornote
   * Pastor note terbaru.
   */
  async pastornote(req, res) {
    const note = await prisma.tblPastorNote.findFirst({
      where: { deleted_at: null },
      orderBy: { tgl_note: 'desc' },
    });

    if (!note) {
      return apiResponse.notFound(res);
    }

    return apiResponse.success(res, {
      message: 'Data ditemukan',
      data: withFileUrl(note, 'image_kotbah_url'),
    });
  },

  /**
   * GET /api/event
   * Event pada bulan dari event terbaru, diurutkan naik.
   */
  async event(req, res) {
    const latest = await prisma.tblEvent.findFirst({
      where: { deleted_at: null },
      orderBy: { tgl_event: 'desc' },
    });

    if (!latest) {
      return apiResponse.notFound(res);
    }

    const month = dayjs(latest.tgl_event).month(); // 0-11
    const year = dayjs(latest.tgl_event).year();

    const events = await prisma.tblEvent.findMany({
      where: {
        deleted_at: null,
        tgl_event: {
          gte: dayjs(`${year}-${String(month + 1).padStart(2, '0')}-01`).toDate(),
          lt: dayjs(`${year}-${String(month + 1).padStart(2, '0')}-01`).add(1, 'month').toDate(),
        },
      },
      orderBy: { tgl_event: 'asc' },
    });

    if (events.length === 0) {
      return apiResponse.notFound(res);
    }

    return apiResponse.success(res, {
      message: 'Data ditemukan',
      data: events.map((e) => withFileUrl(e, 'photo_url')),
    });
  },

  /**
   * GET /api/carousel
   * Semua banner carousel aktif.
   */
  async carousel(req, res) {
    const items = await prisma.tblCarousel.findMany({
      where: { deleted_at: null },
      orderBy: { id: 'asc' },
    });

    if (items.length === 0) {
      return apiResponse.notFound(res);
    }

    return apiResponse.success(res, {
      message: 'Data ditemukan',
      data: items.map((item) => withFileUrl(item, 'image_url')),
    });
  },

  /**
   * GET /api/lifegroup
   * Daftar life group (komsel).
   */
  async lifeGroup(req, res) {
    const groups = await prisma.tblKomsel.findMany({
      where: { deleted_at: null },
      orderBy: { nama_komsel: 'asc' },
    });

    if (groups.length === 0) {
      return apiResponse.success(res, {
        message: 'Data tidak tersedia',
        data: [],
      });
    }

    return apiResponse.success(res, {
      message: 'Data ditemukan',
      data: groups,
    });
  },

  /**
   * GET /api/materi-kotbah
   * Daftar judul kotbah.
   */
  async materiKotbahIndex(req, res) {
    const items = await prisma.tblMateriKotbah.findMany({
      where: { deleted_at: null },
      select: { judul: true },
    });

    if (items.length === 0) {
      return apiResponse.notFound(res);
    }

    return apiResponse.success(res, {
      message: 'Data ditemukan',
      data: items,
    });
  },

  /**
   * GET /api/materi-kotbah/available
   * Semua materi kotbah (dengan tanggal & URL) untuk dipilih per tanggal.
   */
  async materiKotbahAvailable(req, res) {
    const items = await prisma.tblMateriKotbah.findMany({
      where: { deleted_at: null },
      orderBy: { tgl_kotbah: 'desc' },
    });

    if (items.length === 0) {
      return apiResponse.notFound(res);
    }

    return apiResponse.success(res, {
      message: 'Data ditemukan',
      data: items.map((item) => withFileUrl(item, 'materi_kotbah_url')),
    });
  },

  /**
   * GET /api/materi-kotbah/getlink?tgl_kotbah=YYYY-MM-DD
   * Link materi kotbah berdasarkan tanggal.
   */
  async getMateriKotbahLink(req, res) {
    const { tgl_kotbah } = req.query;

    if (!tgl_kotbah) {
      return apiResponse.error(res, {
        message: 'Parameter tgl_kotbah wajib diisi',
        statusCode: 422,
      });
    }

    const items = await prisma.tblMateriKotbah.findMany({
      where: { deleted_at: null, tgl_kotbah: new Date(tgl_kotbah) },
      orderBy: { tgl_kotbah: 'asc' },
    });

    if (items.length === 0) {
      return apiResponse.notFound(res);
    }

    return apiResponse.success(res, {
      message: 'Data ditemukan',
      data: items.map((item) => withFileUrl(item, 'materi_kotbah_url')),
    });
  },

  /**
   * GET /api/ibadahraya/available
   * Semua jadwal ibadah raya (dengan tanggal & link) untuk dipilih per tanggal.
   */
  async ibadahRayaAvailable(req, res) {
    const items = await prisma.tblIbadahRaya.findMany({
      where: { deleted_at: null },
      orderBy: [{ tgl_ibadah: 'desc' }, { ibadah_ke: 'asc' }],
    });

    if (items.length === 0) {
      return apiResponse.notFound(res);
    }

    return apiResponse.success(res, {
      message: 'Data ditemukan',
      data: items,
    });
  },

  /**
   * GET /api/ibadahraya?tgl_ibadah=YYYY-MM-DD&ibadah_ke=1
   * Link ibadah raya berdasarkan tanggal & sesi.
   */
  async getIbadahRayaLink(req, res) {
    const { tgl_ibadah, ibadah_ke } = req.query;

    const ibadah = await prisma.tblIbadahRaya.findFirst({
      where: {
        deleted_at: null,
        tgl_ibadah: tgl_ibadah ? new Date(tgl_ibadah) : undefined,
        ibadah_ke: ibadah_ke || undefined,
      },
    });

    return apiResponse.success(res, {
      message: 'Data ditemukan',
      data: ibadah,
    });
  },

  /**
   * GET /api/materi-kotbah/download/:id
   * Download file materi kotbah. Nama file unduhan = judul + ekstensi.
   */
  async downloadMateriKotbah(req, res) {
    const id = Number(req.params.id);

    const item = await prisma.tblMateriKotbah.findUnique({ where: { id } });

    if (!item || !item.filename) {
      throw new AppError('File tidak ditemukan', 404);
    }

    const filePath = fileUploadService.getDiskPath(item.filename);
    if (!filePath || !fs.existsSync(filePath)) {
      throw new AppError('File tidak ditemukan', 404);
    }

    const ext = path.extname(item.filename);
    const originalName = `${item.judul || 'materi-kotbah'}${ext}`;

    return res.download(filePath, originalName);
  },
};

export default contentsController;
