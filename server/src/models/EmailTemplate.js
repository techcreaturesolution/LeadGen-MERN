import mongoose from 'mongoose';

const emailTemplateSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    subject: { type: String, required: true, trim: true, maxlength: 250 },
    body: { type: String, required: true, maxlength: 20000 },
  },
  { timestamps: true },
);

export const EmailTemplate = mongoose.model('EmailTemplate', emailTemplateSchema);
