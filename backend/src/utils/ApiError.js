/**
 * Custom error class so controllers can throw errors with a specific
 * HTTP status code, caught centrally by the error-handling middleware.
 */
class ApiError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
    Error.captureStackTrace(this, this.constructor);
  }
}

export default ApiError;
