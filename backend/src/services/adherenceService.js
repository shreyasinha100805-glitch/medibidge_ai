import MedicationLog from '../models/MedicationLog.js';

/**
 * Calculate adherence percentage for a patient over a date range.
 *
 * Formula (per spec):
 *   adherence = (taken doses / completed scheduled doses) * 100
 *
 * "Completed scheduled doses" = TAKEN + MISSED (i.e. doses whose scheduled
 * time has already passed and been resolved). PENDING doses (not yet due)
 * are excluded from the denominator since they haven't happened yet.
 */
export async function calculateAdherence(patientId, startDate, endDate) {
  const logs = await MedicationLog.find({
    patientId,
    scheduledTime: { $gte: startDate, $lte: endDate },
  });

  const taken = logs.filter((l) => l.status === 'TAKEN').length;
  const missed = logs.filter((l) => l.status === 'MISSED').length;
  const pending = logs.filter((l) => l.status === 'PENDING').length;
  const completed = taken + missed;

  const adherencePercentage = completed > 0 ? Math.round((taken / completed) * 1000) / 10 : null;

  return {
    totalScheduled: logs.length,
    taken,
    missed,
    pending,
    completed,
    adherencePercentage,
  };
}

export async function getTodayAdherence(patientId) {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  return calculateAdherence(patientId, start, end);
}

export async function getWeekAdherence(patientId) {
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  const start = new Date();
  start.setDate(start.getDate() - 6);
  start.setHours(0, 0, 0, 0);
  return calculateAdherence(patientId, start, end);
}

export async function getMonthAdherence(patientId) {
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  const start = new Date();
  start.setDate(start.getDate() - 29);
  start.setHours(0, 0, 0, 0);
  return calculateAdherence(patientId, start, end);
}

export async function getMedicineWiseAdherence(patientId, startDate, endDate) {
  const logs = await MedicationLog.find({
    patientId,
    scheduledTime: { $gte: startDate, $lte: endDate },
  }).populate('medicineId', 'name');

  const byMedicine = {};

  for (const log of logs) {
    if (!log.medicineId) continue;
    const key = log.medicineId._id.toString();
    if (!byMedicine[key]) {
      byMedicine[key] = {
        medicineId: key,
        name: log.medicineId.name,
        taken: 0,
        missed: 0,
        pending: 0,
      };
    }
    if (log.status === 'TAKEN') byMedicine[key].taken++;
    if (log.status === 'MISSED') byMedicine[key].missed++;
    if (log.status === 'PENDING') byMedicine[key].pending++;
  }

  return Object.values(byMedicine).map((m) => {
    const completed = m.taken + m.missed;
    return {
      ...m,
      adherencePercentage: completed > 0 ? Math.round((m.taken / completed) * 1000) / 10 : null,
    };
  });
}

export async function getDailyAdherenceTrend(patientId, days = 7) {
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  const start = new Date();
  start.setDate(start.getDate() - (days - 1));
  start.setHours(0, 0, 0, 0);

  const logs = await MedicationLog.find({
    patientId,
    scheduledTime: { $gte: start, $lte: end },
  });

  const byDay = {};
  for (const log of logs) {
    const dayKey = log.scheduledTime.toISOString().slice(0, 10);
    if (!byDay[dayKey]) byDay[dayKey] = { taken: 0, missed: 0, pending: 0 };
    if (log.status === 'TAKEN') byDay[dayKey].taken++;
    if (log.status === 'MISSED') byDay[dayKey].missed++;
    if (log.status === 'PENDING') byDay[dayKey].pending++;
  }

  const result = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dayKey = d.toISOString().slice(0, 10);
    const counts = byDay[dayKey] || { taken: 0, missed: 0, pending: 0 };
    const completed = counts.taken + counts.missed;
    result.push({
      date: dayKey,
      taken: counts.taken,
      missed: counts.missed,
      pending: counts.pending,
      adherencePercentage: completed > 0 ? Math.round((counts.taken / completed) * 1000) / 10 : null,
    });
  }

  return result;
}