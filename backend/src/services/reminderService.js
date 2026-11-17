import Medicine from '../models/Medicine.js';
import MedicationLog from '../models/MedicationLog.js';
import User from '../models/User.js';
import { notifyMissedDose } from './notificationService.js';
import {
  calendarDaysBetween,
  getCalendarDateKey,
  getStoredDateKey,
  getZonedDateTime,
  getZonedDayBounds,
} from '../utils/timeZone.js';

export function isMedicineActiveOn(medicine, date, timeZone = 'UTC') {
  if (!medicine.isActive) return false;

  const dateKey = typeof date === 'string' ? date : getCalendarDateKey(date, timeZone);
  const startDateKey = medicine.startDate ? getStoredDateKey(medicine.startDate, timeZone) : null;
  const endDateKey = medicine.endDate ? getStoredDateKey(medicine.endDate, timeZone) : null;
  if (startDateKey && dateKey < startDateKey) return false;
  if (endDateKey && dateKey > endDateKey) return false;

  const frequency = medicine.frequency || 'DAILY';
  if (frequency === 'AS_NEEDED') return false;
  if (frequency === 'DAILY' || !startDateKey) return true;

  const daysSinceStart = calendarDaysBetween(startDateKey, dateKey);
  if (frequency === 'ALTERNATE_DAYS') return daysSinceStart % 2 === 0;
  if (frequency === 'WEEKLY') return daysSinceStart % 7 === 0;
  return false;
}

export async function ensureTodayLogsForPatient(patientId, timeZone = 'UTC') {
  const { dateKey, start: today, endExclusive: tomorrow } = getZonedDayBounds(new Date(), timeZone);

  const medicines = await Medicine.find({ patientId, isActive: true });

  const created = [];

  for (const medicine of medicines) {
    if (!isMedicineActiveOn(medicine, dateKey, timeZone)) continue;
    if (!medicine.scheduledTime) continue;

    const scheduledTime = getZonedDateTime(dateKey, medicine.scheduledTime, timeZone);

    try {
      const existingLog = await MedicationLog.findOne({
        medicineId: medicine._id,
        patientId,
        scheduledTime: { $gte: today, $lt: tomorrow },
      }).sort({ scheduledTime: 1 });

      if (existingLog) {
        if (existingLog.status === 'PENDING' && existingLog.scheduledTime.getTime() !== scheduledTime.getTime()) {
          existingLog.scheduledTime = scheduledTime;
          await existingLog.save();
        }
        created.push(existingLog);
        continue;
      }

      const log = await MedicationLog.findOneAndUpdate(
        { medicineId: medicine._id, patientId, scheduledTime },
        {
          $setOnInsert: {
            medicineId: medicine._id,
            patientId,
            scheduledTime,
            status: 'PENDING',
          },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      created.push(log);
    } catch (err) {
      if (err.code !== 11000) throw err;
    }
  }

  return created;
}

export async function processMissedDoses() {
  const now = new Date();

  const overdueLogs = await MedicationLog.find({
    status: 'PENDING',
    scheduledTime: { $lt: now },
  }).populate('medicineId', 'name');

  let processedCount = 0;

  for (const log of overdueLogs) {
    if (!log.medicineId) continue;

    const claimedLog = await MedicationLog.findOneAndUpdate(
      { _id: log._id, status: 'PENDING' },
      { $set: { status: 'MISSED', missedAt: now } },
      { new: true }
    );
    if (!claimedLog) continue;

    const patient = await User.findById(log.patientId).select('name timeZone');
    if (patient) {
      await notifyMissedDose({
        patientId: log.patientId,
        patientName: patient.name,
        medicineName: log.medicineId.name,
        scheduledTime: claimedLog.scheduledTime,
        timeZone: patient.timeZone || 'UTC',
      });
    }

    processedCount++;
  }

  return processedCount;
}

export async function runReminderCycle() {
  const patients = await User.find({ role: 'PATIENT' }).select('_id timeZone');
  for (const patient of patients) {
    await ensureTodayLogsForPatient(patient._id, patient.timeZone || 'UTC');
  }
  const missedCount = await processMissedDoses();
  return { patientsChecked: patients.length, missedProcessed: missedCount };
}
