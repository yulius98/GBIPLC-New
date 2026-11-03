import { Router } from 'express';
import visitorController from './visitors.controller.js';
import authenticate from '../../middlewares/authenticate.js';
import authorize from '../../middlewares/authorize.js';
import { ROLES } from '../../constants/roles.js';

/**
 * Modul statistik pengunjung website.
 * POST /api/visits        -> publik: frontend kirim kunjungan (dedup harian)
 * GET /api/dashboard/visitors -> auth pengurus: ringkasan bulan ini & total
 */
const router = Router();

const auth = [authenticate, authorize(...ROLES.pengurus)];

router.post('/visits', visitorController.track);
router.get('/dashboard/visitors', ...auth, visitorController.stats);

export default router;
