import mongoose from 'mongoose';

const suppressionSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    reason: { type: String, default: 'unsubscribed' },
  },
  { timestamps: true },
);

suppressionSchema.index({ owner: 1, email: 1 }, { unique: true });

export const Suppression = mongoose.model('Suppression', suppressionSchema);
