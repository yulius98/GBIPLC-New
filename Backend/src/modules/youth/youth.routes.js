import prisma from '../../utils/prisma.js';
import createCrudController from '../../utils/crudFactory.js';
import { Router } from 'express';
import authenticate from '../../middlewares/authenticate.js';
import authorize from '../../middlewares/authorize.js';
import { uploadFields } from '../../middlewares/upload.js';
import { ROLES } from '../../constants/roles.js';

/**
 * Youth module: programs, galleries, schedules.
 * Public endpoint = daftar aktif (read only).
 * Endpoint admin (pengurus) = CRUD penuh.
 */

const adminAuth = [...[authenticate, authorize(...ROLES.pengurus)]];

const programsController = createCrudController({
  model: prisma.tblYouthProgram,
  orderBy: { order: 'asc' },
  allowedFields: ['title', 'description', 'icon', 'frequency', 'category', 'is_active', 'order'],
  resourceName: 'Program',
});

const galleriesController = createCrudController({
  model: prisma.tblYouthGallery,
  orderBy: { order: 'asc' },
  allowedFields: [
    'title',
    'description',
    'type',
    'category',
    'event_date',
    'is_featured',
    'order',
  ],
  fileFields: { file_path: 'youth-galleries', thumbnail_path: 'youth-galleries' },
  resourceName: 'Galeri',
});

const schedulesController = createCrudController({
  model: prisma.tblYouthSchedule,
  orderBy: { order: 'asc' },
  allowedFields: [
    'title',
    'description',
    'type',
    'day_of_week',
    'event_date',
    'start_time',
    'end_time',
    'location',
    'location_url',
    'category',
    'is_active',
    'order',
  ],
  resourceName: 'Jadwal',
});

const galleryUpload = uploadFields([
  { name: 'file', maxCount: 1 },
  { name: 'thumbnail', maxCount: 1 },
]);

const router = Router();

// ---- Program ----
router.get('/youth/programs', programsController.list);
router.get('/youth/programs/:id', programsController.get);
router.post('/youth/programs', ...adminAuth, programsController.create);
router.put('/youth/programs/:id', ...adminAuth, programsController.update);
router.delete('/youth/programs/:id', ...adminAuth, programsController.remove);

// ---- Galleries ----
router.get('/youth/galleries', galleriesController.list);
router.get('/youth/galleries/:id', galleriesController.get);
router.post('/youth/galleries', ...adminAuth, galleryUpload, galleriesController.create);
router.put('/youth/galleries/:id', ...adminAuth, galleryUpload, galleriesController.update);
router.delete('/youth/galleries/:id', ...adminAuth, galleriesController.remove);

// ---- Schedules ----
router.get('/youth/schedules', schedulesController.list);
router.get('/youth/schedules/:id', schedulesController.get);
router.post('/youth/schedules', ...adminAuth, schedulesController.create);
router.put('/youth/schedules/:id', ...adminAuth, schedulesController.update);
router.delete('/youth/schedules/:id', ...adminAuth, schedulesController.remove);

export default router;
