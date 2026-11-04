import { Router } from 'express';
import passwordResetController from './passwordReset.controller.js';
import { forgotPasswordSchema, resetPasswordSchema } from './passwordReset.validation.js';
import validate from '../../utils/validate.js';
import rateLimit from '../../middlewares/rateLimit.js';
const router = Router();

router.post('/forgot-password', rateLimit({ max: 5 }), validate(forgotPasswordSchema), passwordResetController.sendResetLinkEmail);
router.post('/reset-password', rateLimit({ max: 10 }), validate(resetPasswordSchema), passwordResetController.resetPassword);

export default router;
