import prisma from '../../utils/prisma.js';
import createCrudController from '../../utils/crudFactory.js';
import apiResponse from '../../utils/apiResponse.js';
import fileUploadService from '../../services/fileUpload.service.js';
import { Router } from 'express';
import authenticate from '../../middlewares/authenticate.js';
import authorize from '../../middlewares/authorize.js';
import { uploadFields } from '../../middlewares/upload.js';
import { ROLES } from '../../constants/roles.js';

/**
 * Module pendukung: kunjungan, toko jemaat, popup ads, notifikasi, materi komsel.
 * Semua akses tulis dibatasi untuk role pengurus.
 */

const kunjunganController = createCrudController({
  model: prisma.tblKunjungan,
  orderBy: { tglkunjungan: 'desc' },
  allowedFields: ['id_jemaat', 'tglkunjungan', 'nama_timbesuk', 'keterangan'],
  fileFields: { filename: 'kunjungan' },
  resourceName: 'Kunjungan',
  searchFields: ['nama_timbesuk', 'keterangan'],
  transform: (d) => ({
    ...d,
    id_jemaat: d.id_jemaat !== undefined ? Number(d.id_jemaat) : undefined,
    tglkunjungan: d.tglkunjungan ? new Date(d.tglkunjungan) : undefined,
  }),
});

const tokoJemaatController = createCrudController({
  model: prisma.tblTokoJemaat,
  orderBy: { nama: 'asc' },
  allowedFields: ['nama', 'nama_usaha', 'jenis_usaha', 'alamat_usaha', 'no_telp', 'keterangan'],
  resourceName: 'Toko Jemaat',
  searchFields: ['nama', 'nama_usaha', 'jenis_usaha', 'alamat_usaha', 'no_telp', 'keterangan'],
});

const popupAdController = createCrudController({
  model: prisma.tblPopupAd,
  orderBy: { id: 'desc' },
  allowedFields: [],
  fileFields: { filename: 'popup-ads' },
  resourceName: 'Popup Ad',
});

const notoficationController = createCrudController({
  model: prisma.notofication,
  orderBy: { start_date: 'desc' },
  allowedFields: ['start_date', 'end_date', 'jam_kirim', 'pesan', 'frekuensi'],
  resourceName: 'Notifikasi',
  searchFields: ['pesan'],
});

const materiKomselController = createCrudController({
  model: prisma.tblMateriKomsel,
  orderBy: { tgl_komsel: 'desc' },
  allowedFields: ['tgl_komsel', 'judul'],
  fileFields: { filename: 'materi-komsel' },
  resourceName: 'Materi Komsel',
  searchFields: ['judul'],
});

const router = Router();

router.get('/kunjungan', kunjunganController.list);
router.get('/kunjungan/:id', kunjunganController.get);
router.post('/kunjungan', authenticate, authorize(...ROLES.pengurus), uploadFields([{ name: 'filename', maxCount: 1 }]), kunjunganController.create);
router.put('/kunjungan/:id', authenticate, authorize(...ROLES.pengurus), uploadFields([{ name: 'filename', maxCount: 1 }]), kunjunganController.update);
router.delete('/kunjungan/:id', authenticate, authorize(...ROLES.pengurus), kunjunganController.remove);

router.get('/toko-jemaat', tokoJemaatController.list);
router.get('/toko-jemaat/:id', tokoJemaatController.get);
router.post('/toko-jemaat', authenticate, authorize(...ROLES.pengurus), tokoJemaatController.create);
router.put('/toko-jemaat/:id', authenticate, authorize(...ROLES.pengurus), tokoJemaatController.update);
router.delete('/toko-jemaat/:id', authenticate, authorize(...ROLES.pengurus), tokoJemaatController.remove);

router.get('/popup-ads', popupAdController.list);
router.get('/popup-ads/:id', popupAdController.get);
router.post('/popup-ads', authenticate, authorize(...ROLES.pengurus), uploadFields([{ name: 'filename', maxCount: 1 }]), popupAdController.create);
router.put('/popup-ads/:id', authenticate, authorize(...ROLES.pengurus), uploadFields([{ name: 'filename', maxCount: 1 }]), popupAdController.update);
router.delete('/popup-ads/:id', authenticate, authorize(...ROLES.pengurus), popupAdController.remove);

router.get('/notofications', notoficationController.list);
router.get('/notofications/:id', notoficationController.get);
router.post('/notofications', authenticate, authorize(...ROLES.pengurus), notoficationController.create);
router.put('/notofications/:id', authenticate, authorize(...ROLES.pengurus), notoficationController.update);
router.delete('/notofications/:id', authenticate, authorize(...ROLES.pengurus), notoficationController.remove);

router.get('/materi-komsel', materiKomselController.list);
router.get('/materi-komsel/getlink', async (req, res) => {
  const { tgl_komsel, judul } = req.query;

  if (!tgl_komsel || !judul) {
    return apiResponse.error(res, {
      message: 'Parameter tgl_komsel dan judul wajib diisi',
      statusCode: 422,
    });
  }

  const materi = await prisma.tblMateriKomsel.findFirst({
    where: {
      deleted_at: null,
      tgl_komsel: new Date(tgl_komsel),
      judul,
    },
  });

  if (!materi) {
    return apiResponse.notFound(res);
  }

  const data = { ...materi };
  data.materi_komsel_url = fileUploadService.getPublicUrl(materi.filename);

  return apiResponse.success(res, {
    message: 'Data ditemukan',
    data,
  });
});
router.get('/materi-komsel/:id', materiKomselController.get);
router.post('/materi-komsel', authenticate, authorize(...ROLES.pengurus), uploadFields([{ name: 'filename', maxCount: 1 }]), materiKomselController.create);
router.put('/materi-komsel/:id', authenticate, authorize(...ROLES.pengurus), uploadFields([{ name: 'filename', maxCount: 1 }]), materiKomselController.update);
router.delete('/materi-komsel/:id', authenticate, authorize(...ROLES.pengurus), materiKomselController.remove);

export default router;
