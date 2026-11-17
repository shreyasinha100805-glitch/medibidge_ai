import User from '../models/User.js';
import CaretakerConnection from '../models/CaretakerConnection.js';
import Medicine from '../models/Medicine.js';
import MedicationLog from '../models/MedicationLog.js';
import Notification from '../models/Notification.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { getMonthAdherence, getMedicineWiseAdherence, getDailyAdherenceTrend } from '../services/adherenceService.js';
import { ensureTodayLogsForPatient } from '../services/reminderService.js';
import { logAuditEvent } from './auditLogController.js';
import { getRollingDateRange, getZonedDayBounds } from '../utils/timeZone.js';

/**
 * Send a connection request by email (Patient -> Caretaker or Caretaker -> Patient)
 */
export const sendConnectionRequest = asyncHandler(async (req, res) => {
  const body = req.body && typeof req.body === 'object' && !Array.isArray(req.body) ? req.body : {};
  const { email } = body;
  if (typeof email !== 'string' || !/^\S+@\S+\.\S+$/.test(email.trim())) {
    throw new ApiError(400, 'A valid target user email is required.');
  }

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
    existing.initiatorId = req.user._id;
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
    initiatorId: req.user._id,
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
 * List connection requests for the authenticated user (incoming AND outgoing)
 * Returns all connections where the user is either patient or caretaker,
 * with a `direction` field: 'INCOMING' or 'OUTGOING' relative to the current user.
 */
export const getRequests = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  // Fetch both sides: connections where user sent the request AND received it
  const connections = await CaretakerConnection.find({
    $or: [{ patientId: userId }, { caretakerId: userId }],
  })
    .populate('patientId', 'name email profileImage role')
    .populate('caretakerId', 'name email profileImage role')
    .sort({ createdAt: -1 });

  // Annotate each connection with direction from the perspective of the current user
  const annotated = connections.map((conn) => {
    const obj = conn.toObject();

    // Determine who initiated the request:
    // The sender is always the person who called sendConnectionRequest.
    // We store initiatorId on new requests; for older records fall back to role logic.
    let direction;
    if (conn.initiatorId) {
      direction =
        conn.initiatorId.toString() === userId.toString()
          ? 'OUTGOING'
          : 'INCOMING';
    } else {
      // Legacy: assume caretaker always initiates when caretaker is logged in
      // and patient always initiates when patient is logged in.
      // We can't know for old records so show as INCOMING to be safe (shows Accept/Reject).
      // A better heuristic: if the current user is the caretaker, treat as OUTGOING (they sent it),
      // if the current user is the patient, treat as INCOMING (they received it).
      direction =
        req.user.role === 'CARETAKER' &&
        conn.caretakerId._id?.toString() === userId.toString()
          ? 'OUTGOING'
          : req.user.role === 'PATIENT' &&
            conn.patientId._id?.toString() === userId.toString()
          ? 'INCOMING'
          : 'INCOMING';
    }

    obj.direction = direction;
    return obj;
  });

  res.status(200).json({
    success: true,
    data: { connections: annotated },
  });
});

/**
 * Accept or Reject a pending request
 */
export const respondToRequest = asyncHandler(async (req, res) => {
  const body = req.body && typeof req.body === 'object' && !Array.isArray(req.body) ? req.body : {};
  const { status } = body; // ACCEPTED or REJECTED
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
  if (connection.status !== 'PENDING') {
    throw new ApiError(409, 'This connection request is no longer pending.');
  }

  const isInitiator = connection.initiatorId
    ? connection.initiatorId.toString() === req.user._id.toString()
    : req.user.role === 'CARETAKER' && isCaretakerTarget;
  if (isInitiator) {
    throw new ApiError(403, 'Only the recipient can respond to a connection request.');
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
    'permissions.viewAdherence': true,
  }).populate('patientId', 'name email profileImage createdAt timeZone');

  const patientsData = await Promise.all(
    connections.map(async (conn) => {
      const patient = conn.patientId;
      if (!patient) return null;

      const timeZone = patient.timeZone || 'UTC';
      await ensureTodayLogsForPatient(patient._id, timeZone);
      const adherence = await getMonthAdherence(patient._id, timeZone);

      // Check today's status overview
      const { start: today, endExclusive: tomorrow } = getZonedDayBounds(new Date(), timeZone);

      const todayLogs = await MedicationLog.find({
        patientId: patient._id,
        scheduledTime: { $gte: today, $lt: tomorrow },
      });

      const todayMissed = todayLogs.filter((l) => l.status === 'MISSED').length;
      const todayTaken = todayLogs.filter((l) => l.status === 'TAKEN').length;
      const todayTotal = todayLogs.length;
      const hasAdherenceData = Number.isFinite(adherence.adherencePercentage);
      const hasActivity = hasAdherenceData || todayTotal > 0;
      const riskStatus = !hasActivity
        ? 'NO_DATA'
        : todayMissed > 0 || (hasAdherenceData && adherence.adherencePercentage < 70)
          ? 'HIGH_RISK'
          : 'STABLE';

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
        riskStatus,
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
  if (!connection.permissions?.viewAdherence) {
    throw new ApiError(403, 'The patient has not granted access to adherence details.');
  }

  const patient = await User.findById(patientId).select('name email profileImage role createdAt timeZone');
  if (!patient) throw new ApiError(404, 'Patient not found.');

  const timeZone = patient.timeZone || 'UTC';
  await ensureTodayLogsForPatient(patientId, timeZone);

  // Fetch patient details
  const { start: today, endExclusive: tomorrow } = getZonedDayBounds(new Date(), timeZone);

  const [todaySchedule, monthAdherence, medicines, recentMissedLogs, notifications] = await Promise.all([
    MedicationLog.find({ patientId, scheduledTime: { $gte: today, $lt: tomorrow } })
      .populate('medicineId', 'name dosage unit scheduledTime instructions')
      .sort({ scheduledTime: 1 }),
    getMonthAdherence(patientId, timeZone),
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
  if (!connection.permissions?.viewAdherence) {
    throw new ApiError(403, 'The patient has not granted access to adherence details.');
  }

  const patient = await User.findById(patientId).select('timeZone');
  if (!patient) throw new ApiError(404, 'Patient not found.');
  const timeZone = patient.timeZone || 'UTC';
  const monthRange = getRollingDateRange(new Date(), 30, timeZone);

  const [month, medicineWise, dailyTrend] = await Promise.all([
    getMonthAdherence(patientId, timeZone),
    getMedicineWiseAdherence(patientId, monthRange.start, monthRange.end),
    getDailyAdherenceTrend(patientId, 7, timeZone),
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

export const updateConnectionPermissions = asyncHandler(async (req, res) => {
  const connection = await CaretakerConnection.findOne({
    _id: req.params.id,
    patientId: req.user._id,
    status: 'ACCEPTED',
  });

  if (!connection) {
    throw new ApiError(404, 'Connection not found or not active.');
  }

  const { permissions } = req.body || {};
  if (!permissions || typeof permissions !== 'object' || Array.isArray(permissions)) {
    throw new ApiError(400, 'permissions object is required.');
  }

  const allowedFields = ['viewAdherence', 'viewHealthLogs', 'receiveMissedAlerts'];
  const requestedFields = Object.keys(permissions);
  if (requestedFields.length === 0 || requestedFields.some((field) => !allowedFields.includes(field))) {
    throw new ApiError(400, 'Provide one or more supported caretaker permissions.');
  }

  allowedFields.forEach((field) => {
    if (Object.prototype.hasOwnProperty.call(permissions, field)) {
      if (typeof permissions[field] !== 'boolean') {
        throw new ApiError(400, `${field} must be true or false.`);
      }
      connection.permissions[field] = Boolean(permissions[field]);
    }
  });

  await connection.save();
  await logAuditEvent(req.user._id, 'PERMISSIONS_UPDATED', `Updated caretaker permissions for connection ${connection._id}.`);

  res.status(200).json({
    success: true,
    message: 'Permissions updated successfully.',
    data: { connection },
  });
});

export const revokeConnection = asyncHandler(async (req, res) => {
  const connection = await CaretakerConnection.findById(req.params.id);

  if (!connection) {
    throw new ApiError(404, 'Connection not found.');
  }

  const isOwner =
    connection.patientId.toString() === req.user._id.toString() ||
    connection.caretakerId.toString() === req.user._id.toString();

  if (!isOwner) {
    throw new ApiError(403, 'You are not allowed to revoke this connection.');
  }

  connection.status = 'REJECTED';
  await connection.save();
  await logAuditEvent(req.user._id, 'CARETAKER_REVOKED', `Revoked connection ${connection._id}.`);

  res.status(200).json({
    success: true,
    message: 'Caretaker access revoked.',
    data: { connection },
  });
});
