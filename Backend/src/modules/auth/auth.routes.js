import { Router } from 'express';
import authController from './auth.controller.js';
import { loginSchema } from './auth.validation.js';
import validate from '../../utils/validate.js';
import authenticate from '../../middlewares/authenticate.js';
const router = Router();

router.post('/login', validate(loginSchema), authController.login);
router.post('/refresh', authController.refresh);
router.post('/logout', authController.logout);

router.get('/user', authenticate, authController.currentUser);

export default router;
