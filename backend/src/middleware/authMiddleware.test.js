import test from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { authorize, protect } from './authMiddleware.js';

const testSecret = 'scanner-auth-test-secret-with-more-than-32-characters';

const invokeProtect = (authorization) => new Promise((resolve, reject) => {
  const req = {
    headers: authorization ? { authorization } : {},
    get: () => undefined,
  };
  protect(req, {}, (error) => error ? reject(error) : resolve(req.user));
});

test('scanner authentication rejects missing, invalid and expired JWTs', async () => {
  const originalSecret = process.env.JWT_SECRET;
  process.env.JWT_SECRET = testSecret;

  try {
    await assert.rejects(invokeProtect(undefined), (error) => error.statusCode === 401);
    await assert.rejects(invokeProtect('Bearer not-a-token'), (error) => error.statusCode === 401);
    const expired = jwt.sign({ id: 'patient-test-id' }, testSecret, { expiresIn: '-1s' });
    await assert.rejects(invokeProtect(`Bearer ${expired}`), (error) => error.statusCode === 401);
  } finally {
    if (originalSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = originalSecret;
  }
});

test('a valid patient JWT loads the patient and passes role authorization', async () => {
  const originalSecret = process.env.JWT_SECRET;
  const originalFindById = User.findById;
  const patient = { _id: 'patient-test-id', role: 'PATIENT', timeZone: 'UTC' };
  process.env.JWT_SECRET = testSecret;
  User.findById = async (id) => {
    assert.equal(id, patient._id);
    return patient;
  };

  try {
    const token = jwt.sign({ id: patient._id }, testSecret, { expiresIn: '5m' });
    const authenticatedUser = await invokeProtect(`Bearer ${token}`);
    assert.equal(authenticatedUser, patient);

    let nextCalled = false;
    authorize('PATIENT')({ user: authenticatedUser }, {}, () => { nextCalled = true; });
    assert.equal(nextCalled, true);

    assert.throws(
      () => authorize('CARETAKER')({ user: authenticatedUser }, {}, () => {}),
      (error) => error.statusCode === 403
    );
  } finally {
    User.findById = originalFindById;
    if (originalSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = originalSecret;
  }
});
