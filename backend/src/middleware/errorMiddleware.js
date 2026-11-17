import ApiError from '../utils/ApiError.js';

/**
 * Centralized error handler. Converts known error types (Mongoose
 * validation, duplicate key, cast errors, our ApiError) into clean
 * JSON responses. Never leaks stack traces in production.
 */
// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, req, res, next) => {
  if (res.headersSent) return next(err);

  let statusCode = err.statusCode || err.status || 500;
  let message = err.message || 'Internal Server Error';

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors)
      .map((e) => e.message)
      .join(', ');
  }

  // Mongoose duplicate key error (e.g. email already registered)
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    message = `${field} already exists.`;
  }

  // Mongoose invalid ObjectId
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid ${err.path}: ${err.value}`;
  }

  if (process.env.NODE_ENV !== 'production') {
    console.error('API request failed.', {
      errorType: err.name || 'Error',
      statusCode,
    });
  }

  const publicMessage =
    process.env.NODE_ENV === 'production' &&
    statusCode >= 500 &&
    !(err instanceof ApiError)
      ? 'Internal Server Error'
      : message;

  res.status(statusCode).json({
    success: false,
    message: publicMessage,
  });
};

export const notFound = (req, res, next) => {
  const err = new ApiError(404, `Route not found: ${req.originalUrl}`);
  next(err);
};
