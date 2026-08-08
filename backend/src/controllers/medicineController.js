import Medicine from '../models/Medicine.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';

const VALID_UNITS = ['mg', 'ml', 'tablet', 'capsule', 'drop', 'unit'];
const VALID_CATEGORIES = ['Vitamin', 'Antibiotic', 'Painkiller', 'Chronic', 'Supplement', 'Other'];
const VALID_FREQUENCIES = ['DAILY', 'ALTERNATE_DAYS', 'WEEKLY', 'AS_NEEDED'];
const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

function validateMedicinePayload(body, { partial = false } = {}) {
  const { name, dosage, unit, category, scheduledTime, frequency, startDate, endDate } = body;

  if (!partial || name !== undefined) {
    if (!name || !name.trim()) throw new ApiError(400, 'Medicine name is required.');
  }
  if (!partial || dosage !== undefined) {
    if (dosage === undefined || dosage === null || isNaN(Number(dosage)) || Number(dosage) <= 0) {
      throw new ApiError(400, 'Dosage must be a positive number.');
    }
  }
  if (unit !== undefined && !VALID_UNITS.includes(unit)) {
    throw new ApiError(400, `Unit must be one of: ${VALID_UNITS.join(', ')}`);
  }
  if (category !== undefined && !VALID_CATEGORIES.includes(category)) {
    throw new ApiError(400, `Category must be one of: ${VALID_CATEGORIES.join(', ')}`);
  }
  if (!partial || scheduledTime !== undefined) {
    if (!scheduledTime || !TIME_REGEX.test(scheduledTime)) {
      throw new ApiError(400, 'scheduledTime must be in HH:mm format (e.g. "08:00").');
    }
  }
  if (frequency !== undefined && !VALID_FREQUENCIES.includes(frequency)) {
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
  validateMedicinePayload(req.body);

  const { name, dosage, unit, category, scheduledTime, frequency, startDate, endDate, instructions } = req.body;

  const medicine = await Medicine.create({
    patientId: req.user._id,
    name: name.trim(),
    dosage: Number(dosage),
    unit,
    category,
    scheduledTime,
    frequency,
    startDate: startDate || Date.now(),
    endDate: endDate || null,
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
  validateMedicinePayload(req.body, { partial: true });

  const medicine = await Medicine.findOne({ _id: req.params.id, patientId: req.user._id });
  if (!medicine) {
    throw new ApiError(404, 'Medicine not found.');
  }

  const allowedFields = [
    'name', 'dosage', 'unit', 'category', 'scheduledTime',
    'frequency', 'startDate', 'endDate', 'instructions', 'isActive',
  ];

  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      medicine[field] = field === 'name' || field === 'instructions'
        ? String(req.body[field]).trim()
        : req.body[field];
    }
  });

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