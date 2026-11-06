import jwt from 'jsonwebtoken';
import NodeCache from 'node-cache';
import env from '../config/env.js';

const AUTH_COOKIE = 'gbipc_token';

/**
 * Blacklist server-side: jti token yang sudah di-logout jadi ditolak
 * walau token JWT-nya sendiri belum kedaluwarsa.
 * Entri disimpan selama refreshTtlMinutes (14 hari) — melebihi masa hidup
 * access token (JWT_TTL menit) — lalu dibersihkan otomatis.
 * In-memory per proses; ganti ke Redis bila nanti multi-instance.
 */
const revokedCache = new NodeCache({
  stdTTL: env.jwt.refreshTtlMinutes * 60,
  checkperiod: 600,
});
/**
 * Pencabutan semua sesi milik satu user (mis. setelah reset password).
 * Menyimpan UNIX ms saat seluruh sesi user dicabut; token usia lebih tua
 * dari penanda ini ditolak di authenticate/refresh.
 * TTL = masa hidup access token (+ buffer): setelah itu semua token yang
 * terbit sebelum pencabutan sudah pasti kedaluwarsa, jadi entri aman dihapus.
 */
const userRevokedCache = new NodeCache({
  stdTTL: env.jwt.ttlMinutes * 60 + 60,
  checkperiod: 300,
});
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
   * Selain access_token di body (kompatibilitas aplikasi mobile),
   * token juga disetel sebagai httpOnly cookie agar klien web
   * tidak perlu menyimpan token di localStorage (rentan XSS).
   */
  respondWithToken(res, token) {
    res.cookie(AUTH_COOKIE, token, {
      httpOnly: true,                 // tidak bisa dibaca JavaScript
      secure: env.isProduction,       // hanya via HTTPS di produksi
      sameSite: 'lax',                // mitigasi CSRF untuk request lintas-situs
      path: '/api',                   // hanya dikirim untuk endpoint API
      maxAge: env.jwt.refreshTtlMinutes * 60 * 1000,
    });
    return res.status(200).json({
      access_token: token,
      token_type: 'bearer',
      expires_in: env.jwt.ttlMinutes * 1,
      refresh_ttl: env.jwt.refreshTtlMinutes * 1,
    });
  },

  /*
   * ===================== Pembatalan token (server-side) =====================
   */

  /**
   * Batalkan token sampai kedaluwarsanya (via jti).
   * dipakai oleh POST /api/logout.
   * @param {string} token - token mentah yang dibatalkan
   * @returns {boolean} true jika jti berhasil masuk blacklist
   */
  revoke(token) {
    try {
      // Verifikasi tanda tangan (abaikan kedaluwarsa agar token lawas
      // pun tetap bisa dilogout dengan bersih).
      const payload = jwt.verify(token, env.jwt.secret, {
        algorithms: [env.jwt.algorithm],
        ignoreExpiration: true,
      });
      if (payload?.jti) {
        revokedCache.set(`rvi:${payload.jti}`, 1);
        return true;
      }
      return false;
    } catch {
      // Token rusak/expired tidak perlu dibatalkan — sudah otomatis ditolak.
      return false;
    }
  },

  /**
   * Cek apakah jti sudah dibatalkan (logout).
   * @param {string|undefined} jti
   * @returns {boolean}
   */
  isRevoked(jti) {
    if (!jti) return false;
    return revokedCache.has(`rvi:${jti}`);
  },

  /**
   * Cabut SEMUA token aktif satu user (setelah reset/ganti password).
   * Berlaku untuk semua token yang terbit sebelum momen ini, termasuk
   * token yang dikeluarkan sebelum fitur ini ada (dicek via iat payload).
   * @param {number|string} userId
   * @returns {boolean}
   */
  revokeAllForUser(userId) {
    if (!userId) return false;
    userRevokedCache.set(`rsu:${userId}`, Date.now());
    return true;
  },

  /**
   * Apakah sesi user sudah dicabut SETELAH token ini terbit?
   * @param {number|string} userId
   * @param {number|undefined} iatSeconds - klaim iat payload JWT
   * @returns {boolean}
   */
  areUserSessionsRevoked(userId, iatSeconds) {
    if (!userId) return false;
    const revokedAt = userRevokedCache.get(`rsu:${userId}`);
    if (revokedAt == null) return false;
    if (!iatSeconds) return true; // payload tanpa iat: perlakukan sebagai token lama
    return iatSeconds * 1000 < revokedAt;
  },

  /**
   * Hapus cookie auth (untuk logout).
   */
  clearAuthCookie(res) {
    res.clearCookie(AUTH_COOKIE, {
      httpOnly: true,
      secure: env.isProduction,
      sameSite: 'lax',
      path: '/api',
    });
  },
};

export default tokenService;
export { AUTH_COOKIE, AUTH_COOKIE as TOKEN_COOKIE };
