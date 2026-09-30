import mongoose from 'mongoose';

const memberSchema = new mongoose.Schema(
  {
    lead: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead' },
    email: { type: String, required: true, lowercase: true, trim: true },
    business: String,
    city: String,
    website: String,
    phone: String,
    category: String,
    origin: { type: String, enum: ['search', 'leads', 'excel'] },
    addedAt: { type: Date, default: Date.now },
    emailsSent: { type: Number, default: 0 },
    lastEmailedAt: Date,
    lastTemplateName: String,
    lastCampaign: { type: mongoose.Schema.Types.ObjectId, ref: 'Campaign' },
  },
  { _id: true },
);

const leadGroupSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, trim: true, maxlength: 500 },
    sources: [{ type: { type: String }, label: String, job: { type: mongoose.Schema.Types.ObjectId, ref: 'SearchJob' }, at: Date, added: Number, _id: false }],
    members: [memberSchema],
    memberCount: { type: Number, default: 0 },
  },
  { timestamps: true },
);

leadGroupSchema.index({ owner: 1, name: 1 }, { unique: true, collation: { locale: 'en', strength: 2 } });
leadGroupSchema.pre('save', function countMembers() {
  this.memberCount = this.members.length;
});

export const LeadGroup = mongoose.model('LeadGroup', leadGroupSchema);
