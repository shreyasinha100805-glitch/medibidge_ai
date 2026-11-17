import Medicine from '../models/Medicine.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';

const VALID_UNITS = ['mg', 'ml', 'tablet', 'capsule', 'drop', 'unit'];
const VALID_CATEGORIES = ['Vitamin', 'Antibiotic', 'Painkiller', 'Chronic', 'Supplement', 'Other'];
const VALID_FREQUENCIES = ['DAILY', 'ALTERNATE_DAYS', 'WEEKLY', 'AS_NEEDED'];
const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

function validateMedicinePayload(body, { partial = false } = {}) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new ApiError(400, 'A medicine details object is required.');
  }

  const { name, dosage, unit, category, scheduledTime, frequency, startDate, endDate } = body;

  if (!partial || name !== undefined) {
    if (typeof name !== 'string' || !name.trim() || name.trim().length > 100) {
      throw new ApiError(400, 'Medicine name must contain 1 to 100 characters.');
    }
  }
  if (!partial || dosage !== undefined) {
    if (
      (typeof dosage !== 'number' && typeof dosage !== 'string') ||
      !Number.isFinite(Number(dosage)) ||
      Number(dosage) <= 0
    ) {
      throw new ApiError(400, 'Dosage must be a positive number.');
    }
  }
  if ((!partial || unit !== undefined) && !VALID_UNITS.includes(unit)) {
    throw new ApiError(400, `Unit must be one of: ${VALID_UNITS.join(', ')}`);
  }
  if (category !== undefined && !VALID_CATEGORIES.includes(category)) {
    throw new ApiError(400, `Category must be one of: ${VALID_CATEGORIES.join(', ')}`);
  }
  if (body.instructions !== undefined && (typeof body.instructions !== 'string' || body.instructions.length > 500)) {
    throw new ApiError(400, 'Instructions must be text with at most 500 characters.');
  }
  if (body.activeIngredient !== undefined && (typeof body.activeIngredient !== 'string' || body.activeIngredient.length > 100)) {
    throw new ApiError(400, 'Active ingredient must be text with at most 100 characters.');
  }
  if (body.duration !== undefined && (typeof body.duration !== 'string' || body.duration.length > 100)) {
    throw new ApiError(400, 'Duration must be text with at most 100 characters.');
  }
  if (body.isActive !== undefined && typeof body.isActive !== 'boolean') {
    throw new ApiError(400, 'isActive must be true or false.');
  }
  if (!partial) {
    const timeRequired = frequency !== 'AS_NEEDED';
    if ((timeRequired && !scheduledTime) || (scheduledTime && !TIME_REGEX.test(scheduledTime))) {
      throw new ApiError(400, 'scheduledTime must be in HH:mm format (e.g. "08:00").');
    }
  } else {
    const timeRequired = frequency !== undefined && frequency !== 'AS_NEEDED';
    if (timeRequired && !scheduledTime) {
      throw new ApiError(400, 'scheduledTime is required unless frequency is AS_NEEDED.');
    }
    if (scheduledTime && !TIME_REGEX.test(scheduledTime)) {
      throw new ApiError(400, 'scheduledTime must be in HH:mm format (e.g. "08:00").');
    }
  }
  if ((!partial || frequency !== undefined) && !VALID_FREQUENCIES.includes(frequency)) {
    throw new ApiError(400, `Frequency must be one of: ${VALID_FREQUENCIES.join(', ')}`);
  }
  if (startDate !== undefined && isNaN(new Date(startDate).getTime())) {
    throw new ApiError(400, 'startDate must be a valid date.');
  }
  if (endDate !== undefined && endDate !== null && isNaN(new Date(endDate).getTime())) {
    throw new ApiError(400, 'endDate must be a valid date or null.');
  }
  if (startDate && endDate && new Date(endDate) < new Date(startDate)) {
    throw new ApiError(400, 'endDate cannot be before startDate.');
  }
}

/**
 * @route   POST /api/medicines
 * @access  Private (PATIENT only)
 */
export const createMedicine = asyncHandler(async (req, res) => {
  const body = req.body && typeof req.body === 'object' && !Array.isArray(req.body) ? req.body : {};
  validateMedicinePayload(body);

  const { name, activeIngredient, dosage, unit, category, scheduledTime, frequency, startDate, endDate, duration, instructions } = body;

  const medicine = await Medicine.create({
    patientId: req.user._id,
    name: name.trim(),
    activeIngredient: activeIngredient?.trim() || '',
    dosage: Number(dosage),
    unit,
    category,
    scheduledTime,
    frequency,
    startDate: startDate || Date.now(),
    endDate: endDate || null,
    duration: duration?.trim() || '',
    instructions: instructions?.trim() || '',
  });

  res.status(201).json({
    success: true,
    message: 'Medicine added successfully.',
    data: { medicine },
  });
});

/**
 * @route   GET /api/medicines
 * @access  Private (PATIENT only) — lists the logged-in patient's own medicines
 * @query   ?active=true|false  (optional filter)
 */
export const getMedicines = asyncHandler(async (req, res) => {
  const filter = { patientId: req.user._id };

  if (req.query.active === 'true') filter.isActive = true;
  if (req.query.active === 'false') filter.isActive = false;

  const medicines = await Medicine.find(filter).sort({ scheduledTime: 1 });

  res.status(200).json({
    success: true,
    count: medicines.length,
    data: { medicines },
  });
});

/**
 * @route   GET /api/medicines/:id
 * @access  Private (PATIENT only, must own the medicine)
 */
export const getMedicineById = asyncHandler(async (req, res) => {
  const medicine = await Medicine.findOne({ _id: req.params.id, patientId: req.user._id });

  if (!medicine) {
    throw new ApiError(404, 'Medicine not found.');
  }

  res.status(200).json({
    success: true,
    data: { medicine },
  });
});

/**
 * @route   PUT /api/medicines/:id
 * @access  Private (PATIENT only, must own the medicine)
 */
export const updateMedicine = asyncHandler(async (req, res) => {
  const body = req.body && typeof req.body === 'object' && !Array.isArray(req.body) ? req.body : {};
  if (Object.keys(body).length === 0) {
    throw new ApiError(400, 'At least one medicine field is required.');
  }
  const medicine = await Medicine.findOne({ _id: req.params.id, patientId: req.user._id });
  if (!medicine) {
    throw new ApiError(404, 'Medicine not found.');
  }

  validateMedicinePayload({
    ...body,
    frequency: body.frequency === undefined ? medicine.frequency : body.frequency,
    scheduledTime: body.scheduledTime === undefined ? medicine.scheduledTime : body.scheduledTime,
  }, { partial: true });

  const effectiveStartDate = body.startDate === undefined ? medicine.startDate : new Date(body.startDate);
  const effectiveEndDate = body.endDate === undefined ? medicine.endDate : body.endDate ? new Date(body.endDate) : null;
  if (effectiveStartDate && effectiveEndDate && effectiveEndDate < effectiveStartDate) {
    throw new ApiError(400, 'endDate cannot be before startDate.');
  }

  const allowedFields = [
    'name', 'activeIngredient', 'dosage', 'unit', 'category', 'scheduledTime',
    'frequency', 'startDate', 'endDate', 'duration', 'instructions', 'isActive',
  ];

  allowedFields.forEach((field) => {
    if (body[field] !== undefined) {
      medicine[field] = ['name', 'activeIngredient', 'duration', 'instructions'].includes(field)
        ? String(body[field]).trim()
        : body[field];
    }
  });

  if (medicine.frequency === 'AS_NEEDED' && !body.scheduledTime) {
    medicine.scheduledTime = undefined;
  }

  await medicine.save();

  res.status(200).json({
    success: true,
    message: 'Medicine updated successfully.',
    data: { medicine },
  });
});

/**
 * @route   DELETE /api/medicines/:id
 * @access  Private (PATIENT only, must own the medicine)
 */
export const deleteMedicine = asyncHandler(async (req, res) => {
  const medicine = await Medicine.findOneAndDelete({ _id: req.params.id, patientId: req.user._id });

  if (!medicine) {
    throw new ApiError(404, 'Medicine not found.');
  }

  res.status(200).json({
    success: true,
    message: 'Medicine deleted successfully.',
    data: { id: req.params.id },
  });
});
