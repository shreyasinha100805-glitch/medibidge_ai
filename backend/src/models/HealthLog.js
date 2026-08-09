import mongoose from 'mongoose';

const healthLogSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    systolicBP: {
      type: Number,
    },
    diastolicBP: {
      type: Number,
    },
    bloodSugar: {
      type: Number,
    },
    bloodSugarType: {
      type: String,
      enum: ['FASTING', 'POST_MEAL', 'RANDOM'],
      default: 'RANDOM',
    },
    symptoms: [
      {
        type: String,
      },
    ],
    notes: {
      type: String,
      trim: true,
    },
    loggedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

healthLogSchema.index({ patientId: 1, loggedAt: -1 });

export default mongoose.model('HealthLog', healthLogSchema);
