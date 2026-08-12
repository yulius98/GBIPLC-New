import app from './app.js';
import env from './config/env.js';
import prisma from './utils/prisma.js';
async function start() {
  try {
    await prisma.$connect();
    console.log(`[DB] Terhubung ke PostgreSQL.`);

    app.listen(env.port, () => {
      console.log(`[SERVER] API GBI PLC berjalan di ${env.appUrl} (mode: ${env.nodeEnv})`);
    });
  } catch (err) {
    console.error('[DB] Gagal terhubung ke database:', err.message);
    process.exit(1);
  }
}

start();

// Graceful shutdown
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});
process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});
