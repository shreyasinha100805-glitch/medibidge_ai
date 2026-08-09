import jwt from 'jsonwebtoken';

/**
 * Generate a signed JWT for a given user id.
 * Expires in 7 days by default — fine for a hackathon demo.
 */
const DEFAULT_JWT_SECRET = 'CWC86EswJQw12jyKNv4Ti40YLTJJ/V1L0o+QV7aT3oJbMcVRFsxkpXv+7/QUUL8MXSHCXrR7pzARFwLmJU/1iw==';

export const generateToken = (userId) => {
  const secret = process.env.JWT_SECRET || DEFAULT_JWT_SECRET;
  return jwt.sign({ id: userId }, secret, {
    expiresIn: '7d',
  });
};
