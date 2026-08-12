import jwt from 'jsonwebtoken';
import env from '../config/env.js';
import prisma from '../utils/prisma.js';
import AppError from '../utils/AppError.js';
/**
 * Middleware autentikasi JWT.
 * Token diambil dari header Authorization: Bearer <token>.
 * User diambil ulang dari database agar data (role, dll) selalu terbaru.
 */
async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return next(new AppError('Unauthenticated. Token tidak ditemukan.', 401));
  }

  try {
    const payload = jwt.verify(token, env.jwt.secret, {
      algorithms: [env.jwt.algorithm],
    });

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

export default authenticate;
