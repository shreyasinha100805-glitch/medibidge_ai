import mongoose from 'mongoose';

const medicationLogSchema = new mongoose.Schema(
  {
    medicineId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Medicine',
      required: true,
    },
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // Exact scheduled datetime for THIS specific dose (date + medicine's scheduledTime combined)
    scheduledTime: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ['TAKEN', 'MISSED', 'PENDING'],
      default: 'PENDING',
      required: true,
    },
    takenAt: {
      type: Date,
      default: null,
    },
    missedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: { createdAt: true, updatedAt: true } }
);

// Prevent duplicate logs for the same medicine + same scheduled dose time
medicationLogSchema.index({ medicineId: 1, scheduledTime: 1 }, { unique: true });
medicationLogSchema.index({ patientId: 1, status: 1 });
medicationLogSchema.index({ patientId: 1, scheduledTime: -1 });

export default mongoose.model('MedicationLog', medicationLogSchema);
