import User from '../models/User.js';
import CaretakerConnection from '../models/CaretakerConnection.js';
import Medicine from '../models/Medicine.js';
import MedicationLog from '../models/MedicationLog.js';
import Notification from '../models/Notification.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { getMonthAdherence, getMedicineWiseAdherence, getDailyAdherenceTrend } from '../services/adherenceService.js';
import { ensureTodayLogsForPatient } from '../services/reminderService.js';

/**
 * Send a connection request by email (Patient -> Caretaker or Caretaker -> Patient)
 */
export const sendConnectionRequest = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) throw new ApiError(400, 'Target user email is required.');

  const targetUser = await User.findOne({ email: email.toLowerCase().trim() });
  if (!targetUser) throw new ApiError(404, 'User with this email was not found.');

  if (targetUser._id.toString() === req.user._id.toString()) {
    throw new ApiError(400, 'You cannot connect with yourself.');
  }

  let patientId, caretakerId;
  if (req.user.role === 'PATIENT' && targetUser.role === 'CARETAKER') {
    patientId = req.user._id;
    caretakerId = targetUser._id;
  } else if (req.user.role === 'CARETAKER' && targetUser.role === 'PATIENT') {
    patientId = targetUser._id;
    caretakerId = req.user._id;
  } else {
    throw new ApiError(400, `Connection must be between a Patient and a Caretaker.`);
  }

  // Check if connection already exists
  const existing = await CaretakerConnection.findOne({ patientId, caretakerId });
  if (existing) {
    if (existing.status === 'ACCEPTED') {
      throw new ApiError(400, 'You are already connected to this user.');
    }
    if (existing.status === 'PENDING') {
      throw new ApiError(400, 'A pending connection request already exists.');
    }
    // If REJECTED, update to PENDING again
    existing.status = 'PENDING';
    await existing.save();

    await Notification.create({
      userId: targetUser._id,
      type: 'CARETAKER_REQUEST',
      title: 'New Connection Request',
      message: `${req.user.name} sent you a caretaker connection request.`,
    });

    return res.status(200).json({
      success: true,
      message: 'Connection request sent successfully.',
      data: { connection: existing },
    });
  }

  const connection = await CaretakerConnection.create({
    patientId,
    caretakerId,
    status: 'PENDING',
  });

  await Notification.create({
    userId: targetUser._id,
    type: 'CARETAKER_REQUEST',
    title: 'New Connection Request',
    message: `${req.user.name} sent you a caretaker connection request.`,
  });

  res.status(201).json({
    success: true,
    message: 'Connection request sent successfully.',
    data: { connection },
  });
});

/**
 * List connection requests for the authenticated user (incoming and outgoing)
 */
export const getRequests = asyncHandler(async (req, res) => {
  const isCaretaker = req.user.role === 'CARETAKER';
  const query = isCaretaker ? { caretakerId: req.user._id } : { patientId: req.user._id };

  const connections = await CaretakerConnection.find(query)
    .populate('patientId', 'name email profileImage role')
    .populate('caretakerId', 'name email profileImage role')
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    data: { connections },
  });
});

/**
 * Accept or Reject a pending request
 */
export const respondToRequest = asyncHandler(async (req, res) => {
  const { status } = req.body; // ACCEPTED or REJECTED
  if (!['ACCEPTED', 'REJECTED'].includes(status)) {
    throw new ApiError(400, 'Status must be ACCEPTED or REJECTED.');
  }

  const connection = await CaretakerConnection.findById(req.params.id);
  if (!connection) throw new ApiError(404, 'Connection request not found.');

  // Verify authorization
  const isCaretakerTarget = connection.caretakerId.toString() === req.user._id.toString();
  const isPatientTarget = connection.patientId.toString() === req.user._id.toString();

  if (!isCaretakerTarget && !isPatientTarget) {
    throw new ApiError(403, 'Not authorized to respond to this request.');
  }

  connection.status = status;
  await connection.save();

  const otherUserId = isCaretakerTarget ? connection.patientId : connection.caretakerId;

  if (status === 'ACCEPTED') {
    await Notification.create({
      userId: otherUserId,
      type: 'CARETAKER_ACCEPTED',
      title: 'Connection Accepted',
      message: `${req.user.name} accepted your connection request.`,
    });
  }

  res.status(200).json({
    success: true,
    message: `Connection request ${status.toLowerCase()}.`,
    data: { connection },
  });
});

/**
 * List all connected patients for a caretaker
 */
export const getMyPatients = asyncHandler(async (req, res) => {
  const connections = await CaretakerConnection.find({
    caretakerId: req.user._id,
    status: 'ACCEPTED',
  }).populate('patientId', 'name email profileImage createdAt');

  const patientsData = await Promise.all(
    connections.map(async (conn) => {
      const patient = conn.patientId;
      if (!patient) return null;

      await ensureTodayLogsForPatient(patient._id);
      const adherence = await getMonthAdherence(patient._id);

      // Check today's status overview
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const todayLogs = await MedicationLog.find({
        patientId: patient._id,
        scheduledTime: { $gte: today, $lt: tomorrow },
      });

      const todayMissed = todayLogs.filter((l) => l.status === 'MISSED').length;
      const todayTaken = todayLogs.filter((l) => l.status === 'TAKEN').length;
      const todayTotal = todayLogs.length;

      return {
        connectionId: conn._id,
        patient: {
          _id: patient._id,
          name: patient.name,
          email: patient.email,
        },
        adherenceMonthPercent: adherence.adherencePercentage,
        todaySummary: {
          total: todayTotal,
          taken: todayTaken,
          missed: todayMissed,
          pending: todayTotal - (todayTaken + todayMissed),
        },
        riskStatus: adherence.adherencePercentage < 70 || todayMissed > 0 ? 'HIGH_RISK' : 'STABLE',
      };
    })
  );

  res.status(200).json({
    success: true,
    data: { patients: patientsData.filter(Boolean) },
  });
});

/**
 * List connected caretakers for a patient
 */
export const getMyCaretakers = asyncHandler(async (req, res) => {
  const connections = await CaretakerConnection.find({
    patientId: req.user._id,
    status: 'ACCEPTED',
  }).populate('caretakerId', 'name email profileImage');

  res.status(200).json({
    success: true,
    data: {
      caretakers: connections.map((c) => ({
        connectionId: c._id,
        caretaker: c.caretakerId,
        connectedSince: c.createdAt,
      })),
    },
  });
});

/**
 * Caretaker view: Detailed dashboard for a specific patient
 */
export const getPatientDashboardForCaretaker = asyncHandler(async (req, res) => {
  const { patientId } = req.params;

  // Verify caretaker connection
  const connection = await CaretakerConnection.findOne({
    patientId,
    caretakerId: req.user._id,
    status: 'ACCEPTED',
  });

  if (!connection) {
    throw new ApiError(403, 'You do not have an active caretaker connection with this patient.');
  }

  const patient = await User.findById(patientId).select('name email profileImage role createdAt');
  if (!patient) throw new ApiError(404, 'Patient not found.');

  await ensureTodayLogsForPatient(patientId);

  // Fetch patient details
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [todaySchedule, monthAdherence, medicines, recentMissedLogs, notifications] = await Promise.all([
    MedicationLog.find({ patientId, scheduledTime: { $gte: today, $lt: tomorrow } })
      .populate('medicineId', 'name dosage unit scheduledTime instructions')
      .sort({ scheduledTime: 1 }),
    getMonthAdherence(patientId),
    Medicine.find({ patientId, isActive: true }),
    MedicationLog.find({ patientId, status: 'MISSED' })
      .populate('medicineId', 'name dosage unit')
      .sort({ scheduledTime: -1 })
      .limit(10),
    Notification.find({ userId: patientId })
      .sort({ createdAt: -1 })
      .limit(10),
  ]);

  res.status(200).json({
    success: true,
    data: {
      patient,
      summary: {
        adherenceMonthPercent: monthAdherence.adherencePercentage,
        totalScheduledMonth: monthAdherence.totalScheduled,
        takenMonth: monthAdherence.taken,
        missedMonth: monthAdherence.missed,
        activeMedicinesCount: medicines.length,
      },
      todaySchedule,
      medicines,
      recentMissedLogs,
      notifications,
    },
  });
});

/**
 * Caretaker view: Detailed adherence metrics for a specific patient
 */
export const getPatientAdherenceForCaretaker = asyncHandler(async (req, res) => {
  const { patientId } = req.params;

  const connection = await CaretakerConnection.findOne({
    patientId,
    caretakerId: req.user._id,
    status: 'ACCEPTED',
  });

  if (!connection) {
    throw new ApiError(403, 'You do not have an active caretaker connection with this patient.');
  }

  const monthStart = new Date();
  monthStart.setDate(monthStart.getDate() - 29);
  monthStart.setHours(0, 0, 0, 0);
  const monthEnd = new Date();

  const [month, medicineWise, dailyTrend] = await Promise.all([
    getMonthAdherence(patientId),
    getMedicineWiseAdherence(patientId, monthStart, monthEnd),
    getDailyAdherenceTrend(patientId, 7),
  ]);

  res.status(200).json({
    success: true,
    data: {
      month,
      medicineWise,
      dailyTrend,
    },
  });
});
