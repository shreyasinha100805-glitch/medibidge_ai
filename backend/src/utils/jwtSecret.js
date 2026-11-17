import ApiError from './ApiError.js';

export function getJwtSecret() {
  const secret = typeof process.env.JWT_SECRET === 'string'
    ? process.env.JWT_SECRET.trim()
    : '';
  const isPlaceholder = /^(?:your(?:[_ -].*)?|replace(?:[_ -].*)?|change(?:[_ -].*)?|<[^>]+>)$/i.test(secret);

  if (secret.length < 32 || isPlaceholder) {
    throw new ApiError(503, 'Authentication is temporarily unavailable. Please contact the administrator.');
  }

  return secret;
}
