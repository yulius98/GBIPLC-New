import { Router } from 'express';
import passwordResetController from './passwordReset.controller.js';
import { forgotPasswordSchema, resetPasswordSchema } from './passwordReset.validation.js';
import validate from '../../utils/validate.js';
const router = Router();

router.post('/forgot-password', validate(forgotPasswordSchema), passwordResetController.sendResetLinkEmail);
router.post('/reset-password', validate(resetPasswordSchema), passwordResetController.resetPassword);

export default router;
