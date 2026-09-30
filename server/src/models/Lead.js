import mongoose from 'mongoose';

const emailSchema = new mongoose.Schema(
  {
    email: { type: String, lowercase: true, trim: true },
    category: { type: String, enum: ['hr', 'sales', 'support', 'generic', 'personal', 'other'], default: 'other' },
    foundOn: String,
    confidence: { type: Number, default: 0.5 },
    mxValid: Boolean,
  },
  { _id: false },
);

const leadSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    job: { type: mongoose.Schema.Types.ObjectId, ref: 'SearchJob', required: true, index: true },
    name: { type: String, required: true },
    category: String,
    address: String,
    city: String,
    phone: String,
    website: String,
    domain: { type: String, index: true },
    emails: [emailSchema],
    primaryEmail: String,
    primaryEmailCategory: String,
    linkedinUrl: String,
    instagramUrl: String,
    facebookUrl: String,
    rating: Number,
    reviewsCount: Number,
    lat: Number,
    lng: Number,
    sources: [String],
    score: { type: Number, default: 0 },
    aiNote: String,
    rank: Number,
    verification: { type: String, enum: ['verified', 'likely'] },
    matchReason: String,
    matchedLocation: String,
    aiVerified: Boolean,
    siteTitle: String,
    dedupeKey: { type: String, index: true },
    discoveredAt: { type: Date, index: true },
    reusedFrom: { type: mongoose.Schema.Types.ObjectId, ref: 'SearchJob' },
  },
  { timestamps: true },
);

leadSchema.index({ job: 1, rank: 1 });
leadSchema.index({ job: 1, dedupeKey: 1 }, { unique: true, partialFilterExpression: { dedupeKey: { $type: 'string' } } });

export const Lead = mongoose.model('Lead', leadSchema);
