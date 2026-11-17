import test from 'node:test';
import assert from 'node:assert/strict';
import { getJwtSecret } from './jwtSecret.js';

function withJwtSecret(value, callback) {
  const original = process.env.JWT_SECRET;
  if (value === undefined) delete process.env.JWT_SECRET;
  else process.env.JWT_SECRET = value;

  try {
    callback();
  } finally {
    if (original === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = original;
  }
}

test('rejects missing, short, and placeholder JWT secrets', () => {
  for (const value of [undefined, 'short-secret', 'your_jwt_secret_here', '<JWT_SECRET>']) {
    withJwtSecret(value, () => {
      assert.throws(getJwtSecret, { statusCode: 503 });
    });
  }
});

test('accepts a configured secret with at least 32 characters', () => {
  const secret = 'test-only-secret-with-at-least-32-characters';
  withJwtSecret(secret, () => assert.equal(getJwtSecret(), secret));
});
