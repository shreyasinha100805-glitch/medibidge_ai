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
