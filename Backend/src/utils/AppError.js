/**
 * Custom error class dengan status code.
 * Dipakai untuk error bisnis yang bisa diprediksi (validation, not found, dll).
 */
class AppError extends Error {
  constructor(message, statusCode = 500, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export default AppError;
