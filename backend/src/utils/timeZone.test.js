import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calendarDaysBetween,
  getCalendarDateKey,
  getRollingDateRange,
  getStoredDateKey,
  getZonedDateTime,
  getZonedDayBounds,
  normalizeTimeZone,
} from './timeZone.js';
import { isMedicineActiveOn } from '../services/reminderService.js';

test('converts a local scheduled time to the correct UTC instant', () => {
  const scheduled = getZonedDateTime('2026-11-17', '08:00', 'Asia/Kolkata');
  assert.equal(scheduled.toISOString(), '2026-11-17T02:30:00.000Z');
});

test('uses local calendar-day bounds across daylight-saving changes', () => {
  const spring = getZonedDayBounds(new Date('2024-03-10T16:00:00.000Z'), 'America/New_York');
  const fall = getZonedDayBounds(new Date('2024-11-03T16:00:00.000Z'), 'America/New_York');
  assert.equal((spring.endExclusive - spring.start) / 3600000, 23);
  assert.equal((fall.endExclusive - fall.start) / 3600000, 25);
});

test('moves a nonexistent daylight-saving wall time to the first valid minute', () => {
  const scheduled = getZonedDateTime('2024-03-10', '02:30', 'America/New_York');
  assert.equal(scheduled.toISOString(), '2024-03-10T07:00:00.000Z');
  assert.equal(getCalendarDateKey(scheduled, 'America/New_York'), '2024-03-10');
});

test('preserves date-only medicine values and counts calendar days', () => {
  assert.equal(getStoredDateKey('2026-11-17', 'America/Los_Angeles'), '2026-11-17');
  assert.equal(getStoredDateKey(new Date('2026-11-17T00:00:00.000Z'), 'America/Los_Angeles'), '2026-11-17');
  assert.equal(calendarDaysBetween('2024-02-28', '2024-03-01'), 2);
});

test('builds a rolling range using the patient calendar date', () => {
  const range = getRollingDateRange(new Date('2026-11-17T02:00:00.000Z'), 7, 'Asia/Kolkata');
  assert.equal(range.startDateKey, '2026-11-11');
  assert.equal(range.endDateKey, '2026-11-17');
  assert.equal(range.start.toISOString(), '2026-11-10T18:30:00.000Z');
});

test('applies alternate-day schedules on the patient calendar', () => {
  const medicine = {
    isActive: true,
    frequency: 'ALTERNATE_DAYS',
    startDate: new Date('2026-11-17T00:00:00.000Z'),
    endDate: new Date('2026-11-20T00:00:00.000Z'),
  };
  assert.equal(isMedicineActiveOn(medicine, '2026-11-17', 'Asia/Kolkata'), true);
  assert.equal(isMedicineActiveOn(medicine, '2026-11-18', 'Asia/Kolkata'), false);
  assert.equal(isMedicineActiveOn(medicine, '2026-11-19', 'Asia/Kolkata'), true);
  assert.equal(isMedicineActiveOn(medicine, '2026-11-21', 'Asia/Kolkata'), false);
});

test('applies weekly schedules from their patient-local start date', () => {
  const medicine = {
    isActive: true,
    frequency: 'WEEKLY',
    startDate: new Date('2026-11-02T00:00:00.000Z'),
    endDate: new Date('2026-11-24T00:00:00.000Z'),
  };
  assert.equal(isMedicineActiveOn(medicine, '2026-11-02', 'Asia/Kolkata'), true);
  assert.equal(isMedicineActiveOn(medicine, '2026-11-09', 'Asia/Kolkata'), true);
  assert.equal(isMedicineActiveOn(medicine, '2026-11-10', 'Asia/Kolkata'), false);
  assert.equal(isMedicineActiveOn(medicine, '2026-11-25', 'Asia/Kolkata'), false);
});

test('does not generate scheduled doses for as-needed or inactive medicines', () => {
  const asNeeded = {
    isActive: true,
    frequency: 'AS_NEEDED',
    startDate: new Date('2026-11-17T00:00:00.000Z'),
  };
  const inactive = { ...asNeeded, frequency: 'DAILY', isActive: false };
  assert.equal(isMedicineActiveOn(asNeeded, '2026-11-17', 'Asia/Kolkata'), false);
  assert.equal(isMedicineActiveOn(inactive, '2026-11-17', 'Asia/Kolkata'), false);
});

test('does not generate scheduled doses when a medicine has no confirmed frequency', () => {
  const unconfirmed = {
    isActive: true,
    startDate: new Date('2026-11-18T00:00:00.000Z'),
    scheduledTime: '08:00',
  };
  assert.equal(isMedicineActiveOn(unconfirmed, '2026-11-18', 'UTC'), false);
});

test('rejects invalid time zones and falls back when resolving timestamps', () => {
  assert.equal(normalizeTimeZone('Not/A_Time_Zone'), null);
  assert.equal(getCalendarDateKey(new Date('2026-11-17T00:00:00.000Z'), 'Not/A_Time_Zone'), '2026-11-17');
});
