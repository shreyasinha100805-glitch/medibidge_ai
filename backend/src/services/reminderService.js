import Medicine from '../models/Medicine.js';
import MedicationLog from '../models/MedicationLog.js';
import User from '../models/User.js';
import { notifyMissedDose } from './notificationService.js';

function combineDateAndTime(date, hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  const d = new Date(date);
  d.setHours(h, m, 0, 0);
  return d;
}

function isMedicineActiveOn(medicine, date) {
  if (!medicine.isActive) return false;
  if (medicine.startDate && date < new Date(new Date(medicine.startDate).setHours(0, 0, 0, 0))) return false;
  if (medicine.endDate && date > new Date(new Date(medicine.endDate).setHours(23, 59, 59, 999))) return false;
  return true;
}

export async function ensureTodayLogsForPatient(patientId) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const medicines = await Medicine.find({ patientId, isActive: true });

  const created = [];

  for (const medicine of medicines) {
    if (!isMedicineActiveOn(medicine, today)) continue;

    const scheduledTime = combineDateAndTime(today, medicine.scheduledTime);

    try {
      const log = await MedicationLog.findOneAndUpdate(
        { medicineId: medicine._id, scheduledTime },
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

    log.status = 'MISSED';
    log.missedAt = now;
    await log.save();

    const patient = await User.findById(log.patientId);
    if (patient) {
      await notifyMissedDose({
        patientId: log.patientId,
        patientName: patient.name,
        medicineName: log.medicineId.name,
        scheduledTime: log.scheduledTime,
      });
    }

    processedCount++;
  }

  return processedCount;
}

export async function runReminderCycle() {
  const patients = await User.find({ role: 'PATIENT' }).select('_id');
  for (const patient of patients) {
    await ensureTodayLogsForPatient(patient._id);
  }
  const missedCount = await processMissedDoses();
  return { patientsChecked: patients.length, missedProcessed: missedCount };
}