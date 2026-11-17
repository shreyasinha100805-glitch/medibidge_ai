import test from 'node:test';
import assert from 'node:assert/strict';
import Medicine from '../models/Medicine.js';
import { createMedicine, validateMedicinePayload } from './medicineController.js';

const patientId = 'patient-test-id';
const validMedicine = {
  name: 'Example medicine',
  dosage: 1,
  unit: 'tablet',
  scheduledTime: '08:30',
  frequency: 'DAILY',
  startDate: '2026-11-18',
};

const runCreateMedicine = ({ body = validMedicine, idempotencyKey } = {}) => new Promise((resolve, reject) => {
  const req = {
    body,
    headers: idempotencyKey ? { 'idempotency-key': idempotencyKey } : {},
    user: { _id: patientId },
    get: (headerName) => headerName.toLowerCase() === 'idempotency-key' ? idempotencyKey : undefined,
  };
  const res = {
    statusCode: 200,
    status(statusCode) {
      this.statusCode = statusCode;
      return this;
    },
    json(payload) {
      resolve({ statusCode: this.statusCode, payload });
    },
  };
  createMedicine(req, res, reject);
});

test('medicine validation requires an explicit supported frequency and positive dosage', () => {
  assert.throws(
    () => validateMedicinePayload({ ...validMedicine, frequency: undefined }),
    (error) => error.statusCode === 400 && error.message.includes('Frequency must be one of')
  );
  assert.throws(
    () => validateMedicinePayload({ ...validMedicine, dosage: 0 }),
    (error) => error.statusCode === 400 && error.message.includes('positive number')
  );
  assert.doesNotThrow(() => validateMedicinePayload({ ...validMedicine, dosage: '2.5' }));
});

test('medicine creation stores a scanner idempotency key for retry safety', async () => {
  const originalFindOne = Medicine.findOne;
  const originalCreate = Medicine.create;
  let createdPayload;
  Medicine.findOne = async () => null;
  Medicine.create = async (payload) => {
    createdPayload = payload;
    return { ...payload, _id: 'saved-medicine-id' };
  };

  try {
    const result = await runCreateMedicine({ idempotencyKey: 'scan-request-1234' });
    assert.equal(result.statusCode, 201);
    assert.equal(createdPayload.idempotencyKey, 'scan-request-1234');
    assert.equal(result.payload.data.medicine._id, 'saved-medicine-id');
  } finally {
    Medicine.findOne = originalFindOne;
    Medicine.create = originalCreate;
  }
});

test('replaying a scanner save returns the existing medicine without creating another', async () => {
  const originalFindOne = Medicine.findOne;
  const originalCreate = Medicine.create;
  const existingMedicine = { _id: 'existing-medicine-id', name: validMedicine.name };
  let createCalls = 0;
  Medicine.findOne = async (query) => {
    assert.deepEqual(query, { patientId, idempotencyKey: 'scan-request-1234' });
    return existingMedicine;
  };
  Medicine.create = async () => {
    createCalls += 1;
    throw new Error('A replay must not create a second medicine.');
  };

  try {
    const result = await runCreateMedicine({ idempotencyKey: 'scan-request-1234' });
    assert.equal(result.statusCode, 200);
    assert.equal(result.payload.data.idempotentReplay, true);
    assert.equal(result.payload.data.medicine, existingMedicine);
    assert.equal(createCalls, 0);
  } finally {
    Medicine.findOne = originalFindOne;
    Medicine.create = originalCreate;
  }
});

test('a duplicate-key race resolves to the previously created medicine', async () => {
  const originalFindOne = Medicine.findOne;
  const originalCreate = Medicine.create;
  const existingMedicine = { _id: 'existing-medicine-id', name: validMedicine.name };
  let lookupCount = 0;
  Medicine.findOne = async () => {
    lookupCount += 1;
    return lookupCount === 1 ? null : existingMedicine;
  };
  Medicine.create = async () => {
    const error = new Error('duplicate key');
    error.code = 11000;
    throw error;
  };

  try {
    const result = await runCreateMedicine({ idempotencyKey: 'scan-request-1234' });
    assert.equal(result.statusCode, 200);
    assert.equal(result.payload.data.idempotentReplay, true);
    assert.equal(result.payload.data.medicine, existingMedicine);
    assert.equal(lookupCount, 2);
  } finally {
    Medicine.findOne = originalFindOne;
    Medicine.create = originalCreate;
  }
});
