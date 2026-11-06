import { Router } from 'express';
import visitorController from './visitors.controller.js';
import authenticate from '../../middlewares/authenticate.js';
import authorize from '../../middlewares/authorize.js';
import rateLimit from '../../middlewares/rateLimit.js';
import { ROLES } from '../../constants/roles.js';

/**
 * Modul statistik pengunjung website.
 * POST /api/visits        -> publik: frontend kirim kunjungan (dedup harian)
 * GET /api/dashboard/visitors -> auth pengurus: ringkasan bulan ini & total
 */
const router = Router();

const auth = [authenticate, authorize(...ROLES.pengurus)];

// Anti flood visitor_id acak: tiap batas 30 track per IP per jendela —
// dapur dedup harian yang sah (satu pengunjung = beberapa track/page load)
// tetap jauh di bawah batas ini.
const visitRateLimit = rateLimit({ max: 30, windowMs: 15 * 60_000 });

router.post('/visits', visitRateLimit, visitorController.track);
router.get('/dashboard/visitors', ...auth, visitorController.stats);

export default router;
