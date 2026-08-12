import prisma from '../../utils/prisma.js';
import tokenService from '../../services/token.service.js';
import apiResponse from '../../utils/apiResponse.js';
import AppError from '../../utils/AppError.js';
import bcrypt from 'bcryptjs';
import { serializeUser } from '../users/user.serializer.js';

/**
 * Controller autentikasi: login, logout, refresh, info user.
 */
const authController = {
  /**
   * POST /api/login
   * Body: { email, password }
   */
  async login(req, res) {
    const { email, password } = req.validated_body;

    const user = await prisma.user.findUnique({ where: { email } });

    // Hash dibandingkan manual (bcryptjs) agar email belum terdaftar
    // tidak membedakan waktu respons.
    const passwordOk =
      user?.password != null &&
      (await bcrypt.compare(password, user.password));

    if (!user || !passwordOk) {
      throw new AppError('Email atau Password salah', 401);
    }

    const token = tokenService.sign(user);
    return tokenService.respondWithToken(res, token);
  },

  /**
   * POST /api/refresh
   * Membuat token baru dari token lama yang masih valid.
   */
  async refresh(req, res) {
    const authHeader = req.headers.authorization || '';
    const oldToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!oldToken) {
      throw new AppError('Token tidak valid', 401);
    }

    let payload;
    try {
      payload = tokenService.verify(oldToken);
    } catch {
      throw new AppError('Token tidak valid', 401);
    }

    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) {
      throw new AppError('User tidak ditemukan', 401);
    }

    const newToken = tokenService.sign(user);
    return tokenService.respondWithToken(res, newToken);
  },

  /**
   * POST /api/logout
   * Client menghapus tokennya. Server cukup merespons sukses.
   */
  async logout(req, res) {
    return apiResponse.success(res, {
      message: 'Berhasil logout',
    });
  },

  /**
   * GET /api/user (auth)
   * Mengembalikan data user yang sedang login.
   * Format respons dipertahankan seperti Laravel: { success, user } agar
   * aplikasi mobile (Flutter) yang membaca key "user" tetap kompatibel.
   */
  async currentUser(req, res) {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
    });

    if (!user) {
      throw new AppError('User tidak ditemukan', 404);
    }

    return res.json({
      success: true,
      user: serializeUser(user),
    });
  },
};

export default authController;
