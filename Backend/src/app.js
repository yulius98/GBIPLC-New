import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import env from './config/env.js';
import routes from './routes/index.js';
import notFound from './middlewares/notFound.js';
import errorHandler from './middlewares/errorHandler.js';
const app = express();

// Aplikasi ini selalu berada di belakang proxy (cloudflared tunnel → nginx),
// jadi req.ip diambil dari X-Forwarded-For hop pertama. Akses langsung dari
// internet ke nginx/backend sudah ditutup (port host terikat 127.0.0.1 di
// docker-compose), sehingga header dari klien tidak bisa dipalsukan —
// rate limit memakai CF-Connecting-IP, lihat middlewares/rateLimit.js.
app.set('trust proxy', 1);

// ---------- Security headers ----------
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=(), payment=()');
  // Respons API tidak berisi dokumen HTML aktif: larang semua konten & embed.
  res.setHeader('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none'");
  if (env.isProduction) {
    // TLS dihentikan di Cloudflare; header ini diwariskan ke browser lewat tunnel.
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  next();
});

// ---------- Global middleware ----------
app.use(
  cors(
    env.isProduction
      ? {
          // Di produksi hanya izinkan origin frontend yang dikonfigurasi.
          // Same-origin (via proxy nginx) tetap lolos tanpa perlu CORS.
          origin(origin, callback) {
            const allowed = [env.frontendUrl, env.appUrl].map((u) => String(u).replace(/\/$/, ''));
            if (!origin || allowed.includes(origin)) return callback(null, true);
            // Jangan lempar error; cukup tanpa Access-Control-Allow-Origin.
            return callback(null, false);
          },
          credentials: true, // httpOnly cookie auth
        }
      : { origin: true, credentials: true }
  )
);
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// File upload statis (public/uploads)
app.use('/uploads', express.static(path.join(import.meta.dirname, '../public/uploads')));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ---------- API routes ----------
app.use('/api', routes);

// ---------- 404 & error handling ----------
app.use(notFound);
app.use(errorHandler);

export default app;
