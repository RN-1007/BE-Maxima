const { errorResponse } = require('../utils/response');
const multer = require('multer');

/**
 * Global Error Handler Middleware
 */
const errorHandler = (err, req, res, next) => {
  console.error('[Error Details]:', err);

  // Handle Multer specific errors (e.g. file size exceeded)
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return errorResponse(res, 'Ukuran file melebihi batas maksimal 5MB (FR-5).', 400);
    }
    return errorResponse(res, `Kesalahan unggah file: ${err.message}`, 400);
  }

  // Handle custom validation error
  if (err.message && err.message.includes('Format file tidak didukung')) {
    return errorResponse(res, err.message, 400);
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Terjadi kesalahan internal pada server.';

  return errorResponse(res, message, statusCode, process.env.NODE_ENV === 'development' ? err.stack : null);
};

/**
 * 404 Not Found Middleware
 */
const notFoundHandler = (req, res) => {
  return errorResponse(res, `Endpoint tidak ditemukan: ${req.method} ${req.originalUrl}`, 404);
};

module.exports = {
  errorHandler,
  notFoundHandler,
};
