import mongoose from 'mongoose';

const jobSearchSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    prompt: { type: String, trim: true, default: '' },
    level: String,
    category: String,
    education: String,
    verifiedOnly: Boolean,
    state: String,
    city: String,
    postedWithin: Number,
    query: String,
    providers: [String],
    resultCount: { type: Number, default: 0 },
    durationMs: Number,
    jobs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'JobPosting' }],
  },
  { timestamps: true },
);

export const JobSearch = mongoose.model('JobSearch', jobSearchSchema);
