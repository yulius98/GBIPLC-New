import AppError from '../utils/AppError.js';

/**
 * Rate limit sederhana (in-memory, per proses).
 * Untuk single-instance deployment (docker-compose ini) sudah memadai;
 * kalau nanti multi-instance, ganti dengan store bersama (Redis).
 *
 * @param {object} options
 * @param {number} [options.max=5] - jumlah request maksimum per jendela waktu
 * @param {number} [options.windowMs=900000] - jendela waktu (ms), default 15 menit
 * @param {(req: import('express').Request) => string} [options.key] - identitas bucket
 */
function rateLimit({ max = 5, windowMs = 15 * 60_000, key = (req) => req.ip } = {}) {
  const buckets = new Map();

  // Prune bucket kadaluarsa agar memori tidak tumbuh tanpa batas
  function prune(now) {
    for (const [k, b] of buckets) {
      if (b.reset <= now) buckets.delete(k);
    }
  }

  return (req, res, next) => {
    const k = key(req);
    const now = Date.now();
    const bucket = buckets.get(k) || { count: 0, reset: now + windowMs };
    if (bucket.reset <= now) {
      bucket.count = 0;
      bucket.reset = now + windowMs;
    }
    bucket.count += 1;
    buckets.set(k, bucket);

    if (buckets.size > 10_000) prune(now);

    if (bucket.count > max) {
      return next(
        new AppError('Terlalu banyak percobaan. Silakan coba lagi nanti.', 429)
      );
    }
    next();
  };
}

export default rateLimit;
