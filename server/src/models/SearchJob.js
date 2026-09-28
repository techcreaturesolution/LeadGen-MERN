import mongoose from 'mongoose';

export const SOURCES = ['google_maps', 'linkedin', 'instagram'];
export const TARGET_COUNTS = [20, 40, 60];

const searchJobSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    query: { type: String, required: true, trim: true },
    sources: [{ type: String, enum: SOURCES }],
    targetCount: { type: Number, enum: TARGET_COUNTS, default: 20 },
    plan: {
      businessType: String,
      location: String,
      targetRole: String,
      keywords: [String],
      emailPrefixes: [String],
      searchQueries: [String],
      planner: String,
    },
    status: { type: String, enum: ['queued', 'running', 'completed', 'failed'], default: 'queued', index: true },
    progress: {
      stage: { type: String, default: 'queued' },
      discovered: { type: Number, default: 0 },
      crawled: { type: Number, default: 0 },
      withEmail: { type: Number, default: 0 },
      withRoleEmail: { type: Number, default: 0 },
    },
    sourceStats: { type: Map, of: Number, default: {} },
    logs: [{ at: { type: Date, default: Date.now }, level: String, message: String }],
    leadCount: { type: Number, default: 0 },
    summary: String,
    error: String,
    startedAt: Date,
    finishedAt: Date,
  },
  { timestamps: true },
);

export const SearchJob = mongoose.model('SearchJob', searchJobSchema);
