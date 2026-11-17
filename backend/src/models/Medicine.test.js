import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import Medicine from './Medicine.js';

const baseMedicine = (frequency) => new Medicine({
  patientId: new mongoose.Types.ObjectId(),
  name: 'Example medication',
  dosage: 1,
  unit: 'tablet',
  frequency,
  startDate: new Date('2026-11-17T00:00:00.000Z'),
});

test('as-needed medicines can be saved without a scheduled reminder time', () => {
  const medicine = baseMedicine('AS_NEEDED');
  assert.equal(medicine.validateSync(), undefined);
});

test('scheduled medicines require a valid reminder time', () => {
  const medicine = baseMedicine('DAILY');
  assert.ok(medicine.validateSync()?.errors.scheduledTime);

  medicine.scheduledTime = '08:30';
  assert.equal(medicine.validateSync(), undefined);
});

test('medicine model requires the patient-confirmed frequency', () => {
  const medicine = baseMedicine(undefined);
  assert.ok(medicine.validateSync()?.errors.frequency);
});

test('scanner idempotency keys are unique per patient only when present', () => {
  const idempotencyIndex = Medicine.schema.indexes().find(([keys]) => keys.idempotencyKey === 1);
  assert.ok(idempotencyIndex);
  assert.equal(idempotencyIndex[1].unique, true);
  assert.deepEqual(idempotencyIndex[1].partialFilterExpression, {
    idempotencyKey: { $type: 'string' },
  });
});
