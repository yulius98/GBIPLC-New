import { Router } from 'express';
import usersController from './users.controller.js';
import { registerSchema, updateProfileSchema } from './users.validation.js';
import validate from '../../utils/validate.js';
import authenticate from '../../middlewares/authenticate.js';
import authorize from '../../middlewares/authorize.js';
import rateLimit from '../../middlewares/rateLimit.js';
import { uploadImage } from '../../middlewares/upload.js';
import { ROLES } from '../../constants/roles.js';

const router = Router();

// Anti mass-creation akun bot + disk-fill via upload foto saat register:
// maksimal 5 registrasi per IP per jam, dipasang SEBELUM multer agar request
// tajuk (limit) ditolak tanpa sempat menyimpan file ke disk.
const registerRateLimit = rateLimit({ max: 5, windowMs: 60 * 60_000 });

router.post('/register', registerRateLimit, uploadImage, validate(registerSchema), usersController.register);

router.get('/birthday', usersController.birthdays);

router.get(
  '/myprofile/:id',
  authenticate,
  authorize(...ROLES.jemaatOrPengurus),
  usersController.showProfile
);
router.get(
  '/myprofile/:id/edit',
  authenticate,
  authorize(...ROLES.jemaatOrPengurus),
  usersController.editProfile
);
router.put(
  '/myprofile/:id',
  authenticate,
  authorize(...ROLES.jemaatOrPengurus),
  uploadImage,
  validate(updateProfileSchema),
  usersController.updateProfile
);

export default router;
