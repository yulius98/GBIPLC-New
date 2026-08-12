import { Router } from 'express';
import readingController from './reading.controller.js';
import { startDateSchema } from './reading.validation.js';
import validate from '../../utils/validate.js';
import authenticate from '../../middlewares/authenticate.js';
import authorize from '../../middlewares/authorize.js';
import { ROLES } from '../../constants/roles.js';

const router = Router();

const auth = [authenticate, authorize(...ROLES.jemaatOrPengurus)];

// Publik: dipakai landing page sebelum login.
router.get('/today', readingController.today);
router.post('/start-date', ...auth, validate(startDateSchema), readingController.setStartDate);
router.put('/start-date', ...auth, validate(startDateSchema), readingController.updateStartDate);

export default router;
