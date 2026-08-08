/**
 * Wraps an async controller so thrown errors are automatically
 * passed to Express's error-handling middleware via next(err),
 * instead of needing try/catch in every controller function.
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export default asyncHandler;