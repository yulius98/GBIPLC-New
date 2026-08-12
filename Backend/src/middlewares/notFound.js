import apiResponse from '../utils/apiResponse.js';
/**
 * Handler 404 untuk route yang tidak ditemukan.
 */
function notFound(req, res) {
  return apiResponse.error(res, {
    message: `Route tidak ditemukan: ${req.method} ${req.originalUrl}`,
    statusCode: 404,
  });
}

export default notFound;
