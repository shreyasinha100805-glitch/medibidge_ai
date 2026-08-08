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

export const markTaken = asyncHandler(async (req, res) => {
  const medicine = await Medicine.findOne({ _id: req.params.id, patientId: req.user._id });
  if (!medicine) throw new ApiError(404, 'Medicine not found.');

  await ensureTodayLogsForPatient(req.user._id);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

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

  await notifyTaken({ patientId: req.user._id, medicineName: medicine.name, takenAt: log.takenAt });

  res.status(200).json({
    success: true,
    message: 'Medicine marked as taken.',
    data: { log },
  });
});

export const markMissed = asyncHandler(async (req, res) => {
  const medicine = await Medicine.findOne({ _id: req.params.id, patientId: req.user._id });
  if (!medicine) throw new ApiError(404, 'Medicine not found.');

  await ensureTodayLogsForPatient(req.user._id);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const log = await MedicationLog.findOne({
    medicineId: medicine._id,
    patientId: req.user._id,
    scheduledTime: { $gte: today, $lt: tomorrow },
  });

  if (!log) throw new ApiError(404, "Today's schedule for this medicine was not found.");

  if (log.status === 'MISSED') {
    return res.status(200).json({
      success: true,
      message: 'Already marked as missed.',
      data: { log },
    });
  }

  log.status = 'MISSED';
  log.missedAt = new Date();
  log.takenAt = null;
  await log.save();

  await notifyMissedDose({
    patientId: req.user._id,
    patientName: req.user.name,
    medicineName: medicine.name,
    scheduledTime: log.scheduledTime,
  });

  res.status(200).json({
    success: true,
    message: 'Medicine marked as missed.',
    data: { log },
  });
});

export const getToday = asyncHandler(async (req, res) => {
  await ensureTodayLogsForPatient(req.user._id);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

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

  const monthStart = new Date();
  monthStart.setDate(monthStart.getDate() - 29);
  monthStart.setHours(0, 0, 0, 0);
  const monthEnd = new Date();
  monthEnd.setHours(23, 59, 59, 999);

  const [today, week, month, medicineWise, dailyTrend] = await Promise.all([
    getTodayAdherence(patientId),
    getWeekAdherence(patientId),
    getMonthAdherence(patientId),
    getMedicineWiseAdherence(patientId, monthStart, monthEnd),
    getDailyAdherenceTrend(patientId, 7),
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