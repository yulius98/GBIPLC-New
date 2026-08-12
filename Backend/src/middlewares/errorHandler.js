import apiResponse from '../utils/apiResponse.js';
import env from '../config/env.js';
/**
 * Global error handler.
 * Error AppError (operational) => respons bersih.
 * Error lain => 500 (detail hanya tampil di development).
 */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  // Error dari Prisma (database)
  if (err.name === 'PrismaClientKnownRequestError') {
    const map = {
      P2002: ['Data dengan nilai yang sama sudah ada'],
      P2025: ['Data tidak ditemukan'],
    };
    return apiResponse.error(res, {
      message: err.code === 'P2002' ? 'Data duplikat' : 'Terjadi kesalahan database',
      statusCode: err.code === 'P2002' ? 409 : 400,
      errors: map[err.code] ? { database: map[err.code] } : null,
    });
  }

  if (err.isOperational && err.statusCode) {
    return apiResponse.error(res, {
      message: err.message,
      statusCode: err.statusCode,
      errors: err.details,
    });
  }

  // Error tak terduga
  if (env.isProduction) {
    return apiResponse.error(res, {
      message: 'Terjadi kesalahan internal server.',
      statusCode: 500,
    });
  }

  console.error('ERROR:', err);
  return apiResponse.error(res, {
    message: err.message || 'Terjadi kesalahan internal server.',
    statusCode: 500,
  });
}

export default errorHandler;
