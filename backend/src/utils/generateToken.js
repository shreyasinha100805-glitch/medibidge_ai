import jwt from 'jsonwebtoken';

/**
 * Generate a signed JWT for a given user id.
 * Expires in 7 days by default — fine for a hackathon demo.
 */
export const generateToken = (userId) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not defined in environment variables');
  }
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: '7d',
  });
};
