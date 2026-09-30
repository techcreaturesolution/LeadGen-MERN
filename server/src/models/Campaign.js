import mongoose from 'mongoose';

export const CAMPAIGN_ACTIVE = ['queued', 'sending'];

const recipientSchema = new mongoose.Schema({
  lead: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead' },
  email: { type: String, required: true, lowercase: true, trim: true },
  business: String,
  city: String,
  website: String,
  phone: String,
  category: String,
  status: { type: String, enum: ['pending', 'sending', 'sent', 'simulated', 'failed', 'skipped'], default: 'pending' },
  error: String,
  messageId: String,
  sentAt: Date,
});

const campaignSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 160 },
    group: { type: mongoose.Schema.Types.ObjectId, ref: 'LeadGroup', index: true },
    groupName: String,
    template: { type: mongoose.Schema.Types.ObjectId, ref: 'EmailTemplate', index: true },
    templateName: String,
    subject: { type: String, required: true },
    body: { type: String, required: true },
    mode: { type: String, enum: ['gmail', 'dry_run'], required: true },
    from: { email: String, name: String },
    status: { type: String, enum: ['queued', 'sending', 'paused', 'completed', 'cancelled', 'failed'], default: 'queued', index: true },
    recipients: [recipientSchema],
    counts: {
      total: { type: Number, default: 0 },
      pending: { type: Number, default: 0 },
      sent: { type: Number, default: 0 },
      failed: { type: Number, default: 0 },
      skipped: { type: Number, default: 0 },
    },
    lastError: String,
    startedAt: Date,
    finishedAt: Date,
  },
  { timestamps: true },
);

export const Campaign = mongoose.model('Campaign', campaignSchema);
