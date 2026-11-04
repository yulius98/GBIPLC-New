import jwt from 'jsonwebtoken';
import env from '../config/env.js';
import prisma from '../utils/prisma.js';
import AppError from '../utils/AppError.js';
import tokenService, { AUTH_COOKIE } from '../services/token.service.js';

/**
 * Ambil token dari request: utamakan header Authorization: Bearer (klien
 * mobile/klien lama), fallback ke httpOnly cookie (klien web).
 */
function getAccessToken(req) {
  const authHeader = req.headers.authorization || '';
  if (authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }
  return req.cookies?.[AUTH_COOKIE] || null;
}
/**
 * Middleware autentikasi JWT.
 * Token diambil dari header Authorization: Bearer <token>.
 * User diambil ulang dari database agar data (role, dll) selalu terbaru.
 */
async function authenticate(req, res, next) {
  const token = getAccessToken(req);

  if (!token) {
    return next(new AppError('Unauthenticated. Token tidak ditemukan.', 401));
  }

  try {
    const payload = jwt.verify(token, env.jwt.secret, {
      algorithms: [env.jwt.algorithm],
    });

    // Token yang pernah di-logout ditolak walau JWT-nya belum kedaluwarsa.
    if (tokenService.isRevoked(payload.jti)) {
      return next(new AppError('Sesi sudah diakhiri. Silakan login kembali.', 401));
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        filename: true,
        reading_start_date: true,
      },
    });

    if (!user) {
      return next(new AppError('User tidak ditemukan.', 401));
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return next(new AppError('Token sudah kedaluwarsa.', 401));
    }
    if (err.name === 'JsonWebTokenError') {
      return next(new AppError('Token tidak valid.', 401));
    }
    return next(err);
  }
}

/**
 * Middleware autentikasi opsional: jika token dikirim, set req.user.
 * Jika tidak ada token (atau token rusak), lanjutkan tanpa req.user.
 * Dipakai endpoint yang bisa diakses publik tapi tetap personal saat login.
 */
async function optionalAuthenticate(req, res, next) {
  const token = getAccessToken(req);

  if (!token) return next();

  try {
    const payload = jwt.verify(token, env.jwt.secret, {
      algorithms: [env.jwt.algorithm],
    });

    if (tokenService.isRevoked(payload.jti)) {
      // Token sudah di-logout: perlakukan sebagai request publik tanpa user.
      return next();
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        filename: true,
        reading_start_date: true,
      },
    });

    if (user) req.user = user;
  } catch {
    // Token invalid/expired: abaikan, perlakukan sebagai request publik.
  }

  next();
}

export default authenticate;
export { optionalAuthenticate };
