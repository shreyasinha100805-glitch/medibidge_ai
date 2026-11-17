import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { normalizeTimeZone } from '../utils/timeZone.js';
import { getJwtSecret } from '../utils/jwtSecret.js';

/**
 * Verifies the JWT from the Authorization header ("Bearer <token>"),
 * loads the corresponding user, and attaches it to req.user.
 */
export const protect = asyncHandler(async (req, res, next) => {
  let token;

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }

  if (!token) {
    throw new ApiError(401, 'Not authorized. No token provided.');
  }

  const secret = getJwtSecret();

  let decoded;
  try {
    decoded = jwt.verify(token, secret, { algorithms: ['HS256'] });
  } catch (err) {
    throw new ApiError(401, 'Not authorized. Invalid or expired token.');
  }

  const user = await User.findById(decoded.id);
  if (!user) {
    throw new ApiError(401, 'Not authorized. User no longer exists.');
  }

  const timeZone = normalizeTimeZone(req.get('X-Time-Zone'));
  if (timeZone && timeZone !== user.timeZone) {
    user.timeZone = timeZone;
    await user.save();
  }

  req.user = user;
  next();
});

/**
 * Role-based authorization guard.
 * Usage: router.get('/x', protect, authorize('CARETAKER'), handler)
 */
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      throw new ApiError(403, `Access denied. Requires role: ${roles.join(' or ')}.`);
    }
    next();
  };
};
