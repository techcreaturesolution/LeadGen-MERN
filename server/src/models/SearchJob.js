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
      locations: [String],
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
    quality: {
      rawResults: Number,
      duplicatesRemoved: Number,
      rejected: Number,
      likely: Number,
      verified: Number,
      emailsRemoved: Number,
      aiChecked: Boolean,
    },
    logs: [{ at: { type: Date, default: Date.now }, level: String, message: String }],
    adGate: {
      required: { type: Boolean, default: false },
      seconds: Number,
      ad: { type: mongoose.Schema.Types.ObjectId, ref: 'Ad' },
      watchedMs: { type: Number, default: 0 },
      lastBeatAt: Date,
      startedAt: Date,
      completedAt: Date,
    },
    leadCount: { type: Number, default: 0 },
    summary: String,
    error: String,
    startedAt: Date,
    finishedAt: Date,
  },
  { timestamps: true },
);

export const isAdLocked = (job) => Boolean(job?.adGate?.required && !job.adGate.completedAt);

export function publicAdGate(job) {
  const g = job.adGate || {};
  return {
    required: Boolean(g.required),
    seconds: g.seconds || 0,
    watchedSeconds: Math.floor((g.watchedMs || 0) / 1000),
    completed: !isAdLocked(job),
  };
}

export const SearchJob = mongoose.model('SearchJob', searchJobSchema);
