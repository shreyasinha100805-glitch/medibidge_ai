import AuditLog from '../models/AuditLog.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';

export const logAuditEvent = async (userId, action, details = '') => {
  if (!userId || !action) return null;

  return AuditLog.create({
    userId,
    action,
    details: String(details || '').trim(),
    timestamp: new Date(),
  });
};

export const getAuditLogs = asyncHandler(async (req, res) => {
  const logs = await AuditLog.find({ userId: req.user._id }).sort({ timestamp: -1 });

  res.status(200).json({
    success: true,
    data: {
      logs: logs.map((log) => ({
        ...log.toObject(),
        id: log._id.toString(),
      })),
    },
  });
});

export const createAuditLog = asyncHandler(async (req, res) => {
  const body = req.body && typeof req.body === 'object' && !Array.isArray(req.body) ? req.body : {};
  const { action, details } = body;

  if (!action || !String(action).trim()) {
    throw new ApiError(400, 'Action is required.');
  }

  const log = await logAuditEvent(req.user._id, action, details || '');

  res.status(201).json({
    success: true,
    message: 'Audit log recorded.',
    data: { log },
  });
});
