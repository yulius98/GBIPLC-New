import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import env from './config/env.js';
import routes from './routes/index.js';
import notFound from './middlewares/notFound.js';
import errorHandler from './middlewares/errorHandler.js';
const app = express();

// Aplikasi ini selalu berada di belakang proxy (nginx / cloudflared tunnel),
// jadi req.ip diambil dari header X-Forwarded-For hops pertama.
app.set('trust proxy', 1);

// ---------- Security headers ----------
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
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
