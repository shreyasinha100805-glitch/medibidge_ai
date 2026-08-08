import mongoose from 'mongoose';

const caretakerConnectionSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    caretakerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['PENDING', 'ACCEPTED', 'REJECTED'],
      default: 'PENDING',
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

// A given patient+caretaker pair should only have one connection record
caretakerConnectionSchema.index({ patientId: 1, caretakerId: 1 }, { unique: true });
caretakerConnectionSchema.index({ caretakerId: 1, status: 1 });
caretakerConnectionSchema.index({ patientId: 1, status: 1 });

export default mongoose.model('CaretakerConnection', caretakerConnectionSchema);
