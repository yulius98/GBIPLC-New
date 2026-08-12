import express from 'express';
import cors from 'cors';
import path from 'path';
import routes from './routes/index.js';
import notFound from './middlewares/notFound.js';
import errorHandler from './middlewares/errorHandler.js';
const app = express();

// ---------- Global middleware ----------
app.use(cors());
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
