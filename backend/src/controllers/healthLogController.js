import HealthLog from '../models/HealthLog.js';
import CaretakerConnection from '../models/CaretakerConnection.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';

const normalizeLogPayload = (body) => {
  body = body && typeof body === 'object' && !Array.isArray(body) ? body : {};
  const { systolicBP, diastolicBP, bloodSugar, bloodSugarType, symptoms, notes, loggedAt } = body;

  if (
    systolicBP === undefined ||
    diastolicBP === undefined ||
    bloodSugar === undefined
  ) {
    throw new ApiError(400, 'systolicBP, diastolicBP, and bloodSugar are required.');
  }

  const systolic = Number(systolicBP);
  const diastolic = Number(diastolicBP);
  const sugar = Number(bloodSugar);

  if (Number.isNaN(systolic) || Number.isNaN(diastolic) || Number.isNaN(sugar)) {
    throw new ApiError(400, 'Blood pressure and blood sugar values must be numeric.');
  }

  if (systolic < 40 || systolic > 260 || diastolic < 20 || diastolic > 180) {
    throw new ApiError(400, 'Blood pressure values are out of a realistic range.');
  }

  if (sugar < 30 || sugar > 500) {
    throw new ApiError(400, 'Blood sugar values are out of a realistic range.');
  }

  return {
    patientId: undefined,
    systolicBP: systolic,
    diastolicBP: diastolic,
    bloodSugar: sugar,
    bloodSugarType: ['FASTING', 'POST_MEAL', 'RANDOM'].includes(bloodSugarType) ? bloodSugarType : 'RANDOM',
    symptoms: Array.isArray(symptoms) ? symptoms.map((item) => String(item).trim()).filter(Boolean) : [],
    notes: typeof notes === 'string' ? notes.trim() : '',
    loggedAt: loggedAt ? new Date(loggedAt) : new Date(),
  };
};

export const getHealthLogs = asyncHandler(async (req, res) => {
  if (req.user.role === 'PATIENT') {
    const logs = await HealthLog.find({ patientId: req.user._id }).sort({ loggedAt: -1 });
    return res.status(200).json({ success: true, data: { logs } });
  }

  const { patientId } = req.query;
  if (!patientId) {
    throw new ApiError(400, 'A patientId query parameter is required for caretaker log access.');
  }

  const connection = await CaretakerConnection.findOne({
    patientId,
    caretakerId: req.user._id,
    status: 'ACCEPTED',
  });

  if (!connection || !connection.permissions?.viewHealthLogs) {
    throw new ApiError(403, 'You do not have permission to view this patient’s health logs.');
  }

  const logs = await HealthLog.find({ patientId }).sort({ loggedAt: -1 });
  res.status(200).json({ success: true, data: { logs } });
});

export const createHealthLog = asyncHandler(async (req, res) => {
  if (req.user.role !== 'PATIENT') {
    throw new ApiError(403, 'Only patients can record health logs.');
  }

  const payload = normalizeLogPayload(req.body);
  const healthLog = await HealthLog.create({
    ...payload,
    patientId: req.user._id,
  });

  res.status(201).json({
    success: true,
    message: 'Health log saved successfully.',
    data: { log: healthLog },
  });
});
