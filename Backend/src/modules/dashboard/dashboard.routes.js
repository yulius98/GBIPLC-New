import { Router } from 'express';
import dashboardController from './dashboard.controller.js';
import authenticate from '../../middlewares/authenticate.js';
import authorize from '../../middlewares/authorize.js';
import { ROLES } from '../../constants/roles.js';

const router = Router();

const auth = [authenticate, authorize(...ROLES.pengurus)];

router.get('/dashboard/:id', ...auth, dashboardController.index);
router.get('/pengurus/dashboard', ...auth, dashboardController.pengurusDashboard);

export default router;
