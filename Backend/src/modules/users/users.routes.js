import { Router } from 'express';
import usersController from './users.controller.js';
import { registerSchema, updateProfileSchema } from './users.validation.js';
import validate from '../../utils/validate.js';
import authenticate from '../../middlewares/authenticate.js';
import authorize from '../../middlewares/authorize.js';
import { uploadImage } from '../../middlewares/upload.js';
import { ROLES } from '../../constants/roles.js';

const router = Router();

router.post('/register', uploadImage, validate(registerSchema), usersController.register);

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
