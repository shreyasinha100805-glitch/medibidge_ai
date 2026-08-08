import mongoose from 'mongoose';

const aiInteractionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    question: {
      type: String,
      required: true,
    },
    response: {
      type: String,
      required: true,
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

aiInteractionSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.model('AIInteraction', aiInteractionSchema);
