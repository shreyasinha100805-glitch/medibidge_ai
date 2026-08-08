import mongoose from 'mongoose';

const medicineSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
      required: [true, 'Medicine name is required'],
      trim: true,
    },
    dosage: {
      type: Number,
      required: [true, 'Dosage is required'],
    },
    unit: {
      type: String,
      enum: ['mg', 'ml', 'tablet', 'capsule', 'drop', 'unit'],
      default: 'tablet',
    },
    category: {
      type: String,
      enum: ['Vitamin', 'Antibiotic', 'Painkiller', 'Chronic', 'Supplement', 'Other'],
      default: 'Other',
    },
    // Time of day the medicine is scheduled, stored as "HH:mm" (24h)
    scheduledTime: {
      type: String,
      required: [true, 'Scheduled time is required'],
      match: [/^([01]\d|2[0-3]):([0-5]\d)$/, 'scheduledTime must be in HH:mm format'],
    },
    frequency: {
      type: String,
      enum: ['DAILY', 'ALTERNATE_DAYS', 'WEEKLY', 'AS_NEEDED'],
      default: 'DAILY',
    },
    startDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    endDate: {
      type: Date,
      default: null, // null = ongoing / no end date
    },
    instructions: {
      type: String,
      default: '',
      maxlength: 500,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

medicineSchema.index({ patientId: 1, isActive: 1 });
medicineSchema.index({ patientId: 1, scheduledTime: 1 });

export default mongoose.model('Medicine', medicineSchema);
