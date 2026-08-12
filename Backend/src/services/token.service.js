import jwt from 'jsonwebtoken';
import env from '../config/env.js';
/**
 * Service JWT terpusat.
 * Payload mengikuti klaim JWT Laravel (sub = id user, plus role/name/email).
 */
const tokenService = {
  /**
   * Buat access token baru.
   * @param {object} user - minimal berisi id, role, name, email
   * @returns {string}
   */
  sign(user) {
    const payload = {
      sub: user.id,
      role: user.role,
      name: user.name,
      email: user.email,
      iat: Math.floor(Date.now() / 1000),
      jti: `jti-${user.id}-${Date.now()}`,
    };

    return jwt.sign(payload, env.jwt.secret, {
      algorithm: env.jwt.algorithm,
      expiresIn: env.jwt.ttlMinutes * 60,
    });
  },

  /**
   * Verifikasi token dan kembalikan payload.
   * @throws {Error} jika token invalid/expired
   */
  verify(token) {
    return jwt.verify(token, env.jwt.secret, {
      algorithms: [env.jwt.algorithm],
    });
  },

  /**
   * Format respons token (sama dengan AuthLoginController Laravel).
   */
  respondWithToken(res, token) {
    return res.status(200).json({
      access_token: token,
      token_type: 'bearer',
      expires_in: env.jwt.ttlMinutes * 1,
      refresh_ttl: env.jwt.refreshTtlMinutes * 1,
    });
  },
};

export default tokenService;
