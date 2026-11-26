class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
  }
}

function notFoundHandler(req, res, next) {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
}

function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  if (process.env.NODE_ENV !== 'test') {
    console.error(`[Error ${statusCode}] ${message}`, err.stack || '');
  }

  res.status(statusCode).json({
    success: false,
    message,
  });
}

module.exports = {
  AppError,
  notFoundHandler,
  errorHandler,
};
