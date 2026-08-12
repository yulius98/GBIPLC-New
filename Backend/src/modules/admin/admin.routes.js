import { Router } from 'express';
import prisma from '../../utils/prisma.js';
import createCrudController from '../../utils/crudFactory.js';
import authenticate from '../../middlewares/authenticate.js';
import authorize from '../../middlewares/authorize.js';
import { uploadFields, uploadDocument } from '../../middlewares/upload.js';
import { ROLES } from '../../constants/roles.js';
import settingsController from '../settings/settings.controller.js';

/**
 * Modul admin (pengurus): CRUD untuk kelola konten website.
 * Semua akses dibatasi role pengurus.
 */
const router = Router();

const auth = [authenticate, authorize(...ROLES.pengurus)];

const eventController = createCrudController({
  model: prisma.tblEvent,
  orderBy: { tgl_event: 'desc' },
  allowedFields: ['tgl_event', 'keterangan', 'filename'],
  fileFields: { filename: 'event' },
  resourceName: 'Kegiatan',
  searchFields: ['keterangan'],
  transform: (d) => ({ ...d, tgl_event: d.tgl_event ? new Date(d.tgl_event) : undefined }),
});

const ibadahRayaController = createCrudController({
  model: prisma.tblIbadahRaya,
  orderBy: [{ tgl_ibadah: 'desc' }, { ibadah_ke: 'asc' }],
  allowedFields: ['tgl_ibadah', 'ibadah_ke', 'link_ibadah'],
  resourceName: 'Ibadah Raya',
  searchFields: ['link_ibadah'],
  transform: (d) => ({ ...d, tgl_ibadah: d.tgl_ibadah ? new Date(d.tgl_ibadah) : undefined }),
});

const readingScheduleController = createCrudController({
  model: prisma.readingSchedule,
  orderBy: { day: 'asc' },
  allowedFields: ['day', 'morning_passage', 'evening_passage'],
  resourceName: 'Saat Teduh',
  searchFields: ['morning_passage', 'evening_passage'],
  transform: (d) => ({ ...d, day: d.day !== undefined ? Number(d.day) : undefined }),
});

const pastorNoteController = createCrudController({
  model: prisma.tblPastorNote,
  orderBy: { tgl_note: 'desc' },
  allowedFields: ['tgl_note', 'note', 'filename'],
  fileFields: { filename: 'saat-teduh' },
  resourceName: 'Saat Teduh',
  searchFields: ['tgl_note', 'note'],
  transform: (d) => ({ ...d, tgl_note: d.tgl_note ? new Date(d.tgl_note) : undefined }),
});

const carouselController = createCrudController({
  model: prisma.tblCarousel,
  orderBy: { id: 'asc' },
  allowedFields: ['tema', 'description', 'filename'],
  fileFields: { filename: 'carousel' },
  resourceName: 'Carousel',
  searchFields: ['tema', 'description'],
});

const materiKotbahController = createCrudController({
  model: prisma.tblMateriKotbah,
  orderBy: { tgl_kotbah: 'desc' },
  allowedFields: ['tgl_kotbah', 'judul', 'filename'],
  fileFields: { filename: 'materi-kotbah' },
  resourceName: 'Materi Kotbah',
  searchFields: ['judul'],
  transform: (d) => ({ ...d, tgl_kotbah: d.tgl_kotbah ? new Date(d.tgl_kotbah) : undefined }),
});

// ---------- Kegiatan (event) ----------
router.get('/event', ...auth, eventController.list);
router.post('/event', ...auth, uploadFields([{ name: 'filename', maxCount: 1 }]), eventController.create);
router.get('/event/:id', ...auth, eventController.get);
router.put('/event/:id', ...auth, uploadFields([{ name: 'filename', maxCount: 1 }]), eventController.update);
router.delete('/event/:id', ...auth, eventController.remove);

// ---------- Ibadah Raya ----------
router.get('/ibadahraya', ...auth, ibadahRayaController.list);
router.post('/ibadahraya', ...auth, ibadahRayaController.create);
router.get('/ibadahraya/:id', ...auth, ibadahRayaController.get);
router.put('/ibadahraya/:id', ...auth, ibadahRayaController.update);
router.delete('/ibadahraya/:id', ...auth, ibadahRayaController.remove);

// ---------- Saat Teduh (pastor note) ----------
router.get('/pastornote', ...auth, pastorNoteController.list);
router.post('/pastornote', ...auth, uploadFields([{ name: 'filename', maxCount: 1 }]), pastorNoteController.create);
router.get('/pastornote/:id', ...auth, pastorNoteController.get);
router.put('/pastornote/:id', ...auth, uploadFields([{ name: 'filename', maxCount: 1 }]), pastorNoteController.update);
router.delete('/pastornote/:id', ...auth, pastorNoteController.remove);

// ---------- Carousel (banner) ----------
router.get('/carousel', ...auth, carouselController.list);
router.post('/carousel', ...auth, uploadFields([{ name: 'filename', maxCount: 1 }]), carouselController.create);
router.get('/carousel/:id', ...auth, carouselController.get);
router.put('/carousel/:id', ...auth, uploadFields([{ name: 'filename', maxCount: 1 }]), carouselController.update);
router.delete('/carousel/:id', ...auth, carouselController.remove);

// ---------- Materi Kotbah Ibadah Raya ----------
router.get('/materi-kotbah', ...auth, materiKotbahController.list);
router.post('/materi-kotbah', ...auth, uploadDocument([{ name: 'filename', maxCount: 1 }]), materiKotbahController.create);
router.get('/materi-kotbah/:id', ...auth, materiKotbahController.get);
router.put('/materi-kotbah/:id', ...auth, uploadDocument([{ name: 'filename', maxCount: 1 }]), materiKotbahController.update);
router.delete('/materi-kotbah/:id', ...auth, materiKotbahController.remove);

// ---------- Setting SEO ----------
router.get('/seo', ...auth, settingsController.getSeo);
router.put('/seo', ...auth, uploadFields([{ name: 'og_image', maxCount: 1 }]), settingsController.updateSeo);

// ---------- Bacaan Alkitab (reading schedule 298 hari) ----------
router.get('/reading', ...auth, readingScheduleController.list);
router.post('/reading', ...auth, readingScheduleController.create);
router.get('/reading/:id', ...auth, readingScheduleController.get);
router.put('/reading/:id', ...auth, readingScheduleController.update);
router.delete('/reading/:id', ...auth, readingScheduleController.remove);

// ---------- Referensi: daftar jemaat (untuk form kunjungan) ----------
router.get('/users', ...auth, async (req, res) => {
  const users = await prisma.user.findMany({
    where: { deleted_at: null },
    select: { id: true, name: true, no_HP: true, email: true },
    orderBy: { name: 'asc' },
  });
  return res.json({ status: true, message: 'Data ditemukan', data: users });
});

export default router;
