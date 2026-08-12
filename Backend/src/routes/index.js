import { Router } from 'express';

import authRoutes from '../modules/auth/auth.routes.js';
import usersRoutes from '../modules/users/users.routes.js';
import contentsRoutes from '../modules/contents/contents.routes.js';
import readingRoutes from '../modules/reading/reading.routes.js';
import dashboardRoutes from '../modules/dashboard/dashboard.routes.js';
import passwordResetRoutes from '../modules/passwordReset/passwordReset.routes.js';
import youthRoutes from '../modules/youth/youth.routes.js';
import miscRoutes from '../modules/misc/misc.routes.js';
import uploadRoutes from '../modules/upload/upload.routes.js';
import adminRoutes from '../modules/admin/admin.routes.js';
const router = Router();

router.use(authRoutes);       // /api/login, /logout, /refresh, /user
router.use(usersRoutes);      // /api/register, /myprofile, /birthday
router.use(contentsRoutes);   // /api/pastornote, /event, /carousel, ...
router.use('/reading', readingRoutes); // /api/reading/*
router.use(dashboardRoutes);  // /api/dashboard, /api/pengurus/dashboard
router.use(passwordResetRoutes); // /api/forgot-password, /reset-password
router.use(youthRoutes);      // /api/youth/*
router.use(miscRoutes);       // /api/kunjungan, /toko-jemaat, dll
router.use(uploadRoutes);     // /api/chunk-upload, /chunk-cleanup
router.use('/admin', adminRoutes); // /api/admin/*

export default router;
