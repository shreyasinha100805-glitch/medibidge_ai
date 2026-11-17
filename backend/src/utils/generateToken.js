import jwt from 'jsonwebtoken';
import { getJwtSecret } from './jwtSecret.js';

/**
 * Generate a signed JWT for a given user id.
 * A real secret must be configured in the environment before the backend can start.
 */
export const generateToken = (userId) => {
  return jwt.sign({ id: userId }, getJwtSecret(), {
    expiresIn: '7d',
  });
};
