import { Router } from 'express';
import { uploadController, uploadChunk } from './upload.controller.js';
import authenticate from '../../middlewares/authenticate.js';
import authorize from '../../middlewares/authorize.js';
import { ROLES } from '../../constants/roles.js';

const router = Router();

const adminAuth = [authenticate, authorize(...ROLES.pengurus)];

// Chunk upload untuk file besar (protokol Resumable.js), khusus pengurus.
router.get('/chunk-upload', ...adminAuth, uploadController.checkChunk);
router.post('/chunk-upload', ...adminAuth, uploadChunk, uploadController.upload);
router.post('/chunk-cleanup', ...adminAuth, uploadController.cleanup);

export default router;
