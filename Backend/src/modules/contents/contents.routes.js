import { Router } from 'express';
import contentsController from './contents.controller.js';
import settingsController from '../settings/settings.controller.js';
const router = Router();

router.get('/seo', settingsController.getSeo);
router.get('/pastornote', contentsController.pastornote);
router.get('/event', contentsController.event);
router.get('/carousel', contentsController.carousel);
router.get('/lifegroup', contentsController.lifeGroup);
router.get('/materi-kotbah', contentsController.materiKotbahIndex);
router.get('/materi-kotbah/available', contentsController.materiKotbahAvailable);
router.get('/materi-kotbah/getlink', contentsController.getMateriKotbahLink);
router.get('/materi-kotbah/download/:id', contentsController.downloadMateriKotbah);
router.get('/ibadahraya', contentsController.getIbadahRayaLink);
router.get('/ibadahraya/available', contentsController.ibadahRayaAvailable);

export default router;
