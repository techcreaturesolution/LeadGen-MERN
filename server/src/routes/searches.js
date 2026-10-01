import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { env } from '../config/env.js';
import { Lead } from '../models/Lead.js';
import { Ad } from '../models/Ad.js';
import { expiresAt, isAdLocked, publicAdGate, SearchJob, SOURCES, TARGET_COUNTS } from '../models/SearchJob.js';
import { enqueueJob } from '../services/jobQueue.js';
import { DEMO_VIDEO_AD, pickVideoAd } from '../services/videoAds.js';
import { mapsProvider } from '../services/sources/googleMaps.js';
import { webSearchProvider } from '../services/sources/webSearch.js';
import { llmEnabled } from '../services/agent/llm.js';
import { ruleBasedPlan } from '../services/agent/leadAgent.js';
import { HttpError } from '../utils/httpError.js';

const router = Router();

const BEAT_CREDIT_MS = 3000;

export function serializeJob(job) {
  const out = job.toObject ? job.toObject() : { ...job };
  out.adGate = publicAdGate(job);
  out.expiresAt = expiresAt(job, env.dataRetentionDays);
  delete out.cacheKey;
  if (out.cache) delete out.cache.sourceJobs;
  if (isAdLocked(job)) {
    delete out.summary;
    out.locked = true;
  }
  return out;
}

const createLimiter = rateLimit({ windowMs: 60_000, limit: 10, standardHeaders: 'draft-7', legacyHeaders: false });

const createSchema = z.object({
  query: z.string().trim().min(3).max(200),
  sources: z.array(z.enum(SOURCES)).min(1).default(['google_maps']),
  targetCount: z.coerce.number().refine((n) => TARGET_COUNTS.includes(n), 'targetCount must be 20, 40 or 60').default(20),
});

router.get('/capabilities', (_req, res) => {
  res.json({
    maps: mapsProvider(),
    webSearch: webSearchProvider(),
    ai: llmEnabled() ? 'openai' : 'rules',
    targetCounts: TARGET_COUNTS,
    sources: SOURCES,
    retentionDays: env.dataRetentionDays,
    sharedResults: env.sharedLeadCache,
  });
});

router.post('/preview-plan', (req, res) => {
  const { query } = z.object({ query: z.string().trim().min(3).max(200) }).parse(req.body);
  res.json({ plan: ruleBasedPlan(query) });
});

router.post('/', createLimiter, async (req, res) => {
  const body = createSchema.parse(req.body);
  const since = new Date(Date.now() - 24 * 3600 * 1000);
  if (req.user.role !== 'admin') {
    const today = await SearchJob.countDocuments({ owner: req.user._id, createdAt: { $gte: since } });
    if (today >= env.dailySearchLimit) throw new HttpError(429, `Daily search limit (${env.dailySearchLimit}) reached`);
  }
  const { required, seconds, exemptAdmins } = env.videoAd;
  const needsAd = required && !(exemptAdmins && req.user.role === 'admin');
  const job = await SearchJob.create({ ...body, owner: req.user._id, adGate: { required: needsAd, seconds } });
  enqueueJob(job._id);
  res.status(201).json({ job: serializeJob(job) });
});

router.get('/', async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Number(req.query.limit) || 20);
  const filter = { owner: req.user._id };
  const [items, total] = await Promise.all([
    SearchJob.find(filter).select('-logs').sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    SearchJob.countDocuments(filter),
  ]);
  res.json({ items: items.map(serializeJob), total, page, limit });
});

router.get('/:id', async (req, res) => {
  const job = await SearchJob.findOne({ _id: req.params.id, owner: req.user._id });
  if (!job) throw new HttpError(404, 'Search not found');
  res.json({ job: serializeJob(job) });
});

router.get('/:id/ad', async (req, res) => {
  const job = await SearchJob.findOne({ _id: req.params.id, owner: req.user._id });
  if (!job) throw new HttpError(404, 'Search not found');
  if (!isAdLocked(job)) return res.json({ adGate: publicAdGate(job), ad: null });
  let ad = job.adGate.ad ? await Ad.findById(job.adGate.ad).select('advertiser title description videoUrl targetUrl ctaText').lean() : null;
  if (!ad && !job.adGate.startedAt) ad = await pickVideoAd();
  if (ad && !job.adGate.ad) {
    job.adGate.ad = ad._id;
    await job.save();
  }
  res.json({ adGate: publicAdGate(job), ad: ad || DEMO_VIDEO_AD, vastTag: env.videoAd.vastTag || null });
});

router.post('/:id/ad', async (req, res) => {
  const { event } = z.object({ event: z.enum(['play', 'tick', 'pause', 'complete']) }).parse(req.body);
  const job = await SearchJob.findOne({ _id: req.params.id, owner: req.user._id });
  if (!job) throw new HttpError(404, 'Search not found');
  const g = job.adGate;
  if (!isAdLocked(job)) return res.json({ adGate: publicAdGate(job) });
  const now = new Date();
  if (event === 'play') {
    if (!g.startedAt) {
      g.startedAt = now;
      if (g.ad) await Ad.updateOne({ _id: g.ad }, { $inc: { impressions: 1 } });
    }
    g.lastBeatAt = now;
  } else if (event === 'tick' || event === 'pause') {
    if (g.lastBeatAt) g.watchedMs = (g.watchedMs || 0) + Math.min(now - g.lastBeatAt, BEAT_CREDIT_MS);
    g.lastBeatAt = event === 'tick' ? now : null;
  } else {
    if (g.lastBeatAt) g.watchedMs = (g.watchedMs || 0) + Math.min(now - g.lastBeatAt, BEAT_CREDIT_MS);
    g.lastBeatAt = null;
    const remaining = Math.ceil((g.seconds * 1000 - g.watchedMs) / 1000);
    if (remaining > 1) {
      await job.save();
      throw new HttpError(409, `Keep watching: ${remaining}s of the video ad left`);
    }
    g.completedAt = now;
    if (g.ad) await Ad.updateOne({ _id: g.ad }, { $inc: { completedViews: 1 } });
  }
  await job.save();
  res.json({ adGate: publicAdGate(job) });
});

router.delete('/:id', async (req, res) => {
  const job = await SearchJob.findOne({ _id: req.params.id, owner: req.user._id });
  if (!job) throw new HttpError(404, 'Search not found');
  if (job.status === 'running') throw new HttpError(409, 'Cannot delete a running search');
  await Promise.all([Lead.deleteMany({ job: job._id }), job.deleteOne()]);
  res.json({ ok: true });
});

export default router;
