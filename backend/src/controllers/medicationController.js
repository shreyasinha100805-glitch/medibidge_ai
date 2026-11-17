import MedicationLog from '../models/MedicationLog.js';
import Medicine from '../models/Medicine.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { ensureTodayLogsForPatient } from '../services/reminderService.js';
import { notifyTaken, notifyMissedDose } from '../services/notificationService.js';
import {
  getTodayAdherence,
  getWeekAdherence,
  getMonthAdherence,
  getMedicineWiseAdherence,
  getDailyAdherenceTrend,
} from '../services/adherenceService.js';
import { getRollingDateRange, getZonedDayBounds } from '../utils/timeZone.js';

export const markTaken = asyncHandler(async (req, res) => {
  const medicine = await Medicine.findOne({ _id: req.params.id, patientId: req.user._id });
  if (!medicine) throw new ApiError(404, 'Medicine not found.');

  const timeZone = req.user.timeZone || 'UTC';
  await ensureTodayLogsForPatient(req.user._id, timeZone);
  const { start: today, endExclusive: tomorrow } = getZonedDayBounds(new Date(), timeZone);

  const log = await MedicationLog.findOne({
    medicineId: medicine._id,
    patientId: req.user._id,
    scheduledTime: { $gte: today, $lt: tomorrow },
  });

  if (!log) throw new ApiError(404, "Today's schedule for this medicine was not found.");

  if (log.status === 'TAKEN') {
    return res.status(200).json({
      success: true,
      message: 'Already marked as taken.',
      data: { log },
    });
  }

  log.status = 'TAKEN';
  log.takenAt = new Date();
  log.missedAt = null;
  await log.save();

  await notifyTaken({
    patientId: req.user._id,
    medicineName: medicine.name,
    takenAt: log.takenAt,
    timeZone,
  });

  res.status(200).json({
    success: true,
    message: 'Medicine marked as taken.',
    data: { log },
  });
});

export const markMissed = asyncHandler(async (req, res) => {
  const medicine = await Medicine.findOne({ _id: req.params.id, patientId: req.user._id });
  if (!medicine) throw new ApiError(404, 'Medicine not found.');

  const timeZone = req.user.timeZone || 'UTC';
  await ensureTodayLogsForPatient(req.user._id, timeZone);
  const { start: today, endExclusive: tomorrow } = getZonedDayBounds(new Date(), timeZone);

  const scheduleFilter = {
    medicineId: medicine._id,
    patientId: req.user._id,
    scheduledTime: { $gte: today, $lt: tomorrow },
  };
  const log = await MedicationLog.findOneAndUpdate(
    { ...scheduleFilter, status: { $ne: 'MISSED' } },
    { $set: { status: 'MISSED', missedAt: new Date(), takenAt: null } },
    { new: true }
  );

  if (!log) {
    const currentLog = await MedicationLog.findOne(scheduleFilter);
    if (!currentLog) throw new ApiError(404, "Today's schedule for this medicine was not found.");

    return res.status(200).json({
      success: true,
      message: currentLog.status === 'MISSED'
        ? 'Already marked as missed.'
        : 'The dose status changed before it could be marked as missed.',
      data: { log: currentLog },
    });
  }

  await notifyMissedDose({
    patientId: req.user._id,
    patientName: req.user.name,
    medicineName: medicine.name,
    scheduledTime: log.scheduledTime,
    timeZone,
  });

  res.status(200).json({
    success: true,
    message: 'Medicine marked as missed.',
    data: { log },
  });
});

export const getToday = asyncHandler(async (req, res) => {
  const timeZone = req.user.timeZone || 'UTC';
  await ensureTodayLogsForPatient(req.user._id, timeZone);
  const { start: today, endExclusive: tomorrow } = getZonedDayBounds(new Date(), timeZone);

  const logs = await MedicationLog.find({
    patientId: req.user._id,
    scheduledTime: { $gte: today, $lt: tomorrow },
  })
    .populate('medicineId', 'name dosage unit category instructions scheduledTime')
    .sort({ scheduledTime: 1 });

  const summary = {
    total: logs.length,
    taken: logs.filter((l) => l.status === 'TAKEN').length,
    missed: logs.filter((l) => l.status === 'MISSED').length,
    pending: logs.filter((l) => l.status === 'PENDING').length,
  };

  res.status(200).json({
    success: true,
    data: { summary, schedule: logs },
  });
});

export const getHistory = asyncHandler(async (req, res) => {
  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.min(parseInt(req.query.limit) || 20, 100);
  const skip = (page - 1) * limit;

  const filter = { patientId: req.user._id };
  if (req.query.status && ['TAKEN', 'MISSED', 'PENDING'].includes(req.query.status)) {
    filter.status = req.query.status;
  }

  const [logs, total] = await Promise.all([
    MedicationLog.find(filter)
      .populate('medicineId', 'name dosage unit category')
      .sort({ scheduledTime: -1 })
      .skip(skip)
      .limit(limit),
    MedicationLog.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    data: {
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    },
  });
});

export const getAdherence = asyncHandler(async (req, res) => {
  const patientId = req.user._id;
  const timeZone = req.user.timeZone || 'UTC';
  const monthRange = getRollingDateRange(new Date(), 30, timeZone);

  const [today, week, month, medicineWise, dailyTrend] = await Promise.all([
    getTodayAdherence(patientId, timeZone),
    getWeekAdherence(patientId, timeZone),
    getMonthAdherence(patientId, timeZone),
    getMedicineWiseAdherence(patientId, monthRange.start, monthRange.end),
    getDailyAdherenceTrend(patientId, 7, timeZone),
  ]);

  res.status(200).json({
    success: true,
    data: {
      today,
      week,
      month,
      medicineWise,
      dailyTrend,
    },
  });
});
