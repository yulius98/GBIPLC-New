import 'dotenv/config';
/**
 * Konfigurasi environment terpusat.
 * Semua akses ke process.env dilakukan di sini agar mudah dibaca & di-test.
 */
const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number.parseInt(process.env.PORT || '8000', 10),
  appUrl: process.env.APP_URL || 'http://localhost:8000',

  databaseUrl: process.env.DATABASE_URL,

  jwt: {
    secret: process.env.JWT_SECRET || 'gbi-plc-secret',
    algorithm: process.env.JWT_ALGO || 'HS256',
    ttlMinutes: Number.parseInt(process.env.JWT_TTL || '60', 10),
    refreshTtlMinutes: Number.parseInt(process.env.JWT_REFRESH_TTL || '20160', 10),
  },

  mail: {
    enabled: process.env.MAIL_ENABLED === 'true',
    host: process.env.MAIL_HOST || '',
    port: Number.parseInt(process.env.MAIL_PORT || '587', 10),
    username: process.env.MAIL_USERNAME || '',
    password: process.env.MAIL_PASSWORD || '',
    fromAddress: process.env.MAIL_FROM_ADDRESS || 'noreply@philadelphialifecenter.com',
    fromName: process.env.MAIL_FROM_NAME || 'GBI Philadelpia Life Center',
  },

  bible: {
    cacheTtlDays: Number.parseInt(process.env.BIBLE_CACHE_TTL_DAYS || '7', 10),
  },

  isProduction: process.env.NODE_ENV === 'production',
};

export default env;
