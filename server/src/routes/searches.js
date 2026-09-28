import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { env } from '../config/env.js';
import { Lead } from '../models/Lead.js';
import { SearchJob, SOURCES, TARGET_COUNTS } from '../models/SearchJob.js';
import { enqueueJob } from '../services/jobQueue.js';
import { mapsProvider } from '../services/sources/googleMaps.js';
import { webSearchProvider } from '../services/sources/webSearch.js';
import { llmEnabled } from '../services/agent/llm.js';
import { ruleBasedPlan } from '../services/agent/leadAgent.js';
import { HttpError } from '../utils/httpError.js';

const router = Router();

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
  const job = await SearchJob.create({ ...body, owner: req.user._id });
  enqueueJob(job._id);
  res.status(201).json({ job });
});

router.get('/', async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Number(req.query.limit) || 20);
  const filter = { owner: req.user._id };
  const [items, total] = await Promise.all([
    SearchJob.find(filter).select('-logs').sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    SearchJob.countDocuments(filter),
  ]);
  res.json({ items, total, page, limit });
});

router.get('/:id', async (req, res) => {
  const job = await SearchJob.findOne({ _id: req.params.id, owner: req.user._id });
  if (!job) throw new HttpError(404, 'Search not found');
  res.json({ job });
});

router.delete('/:id', async (req, res) => {
  const job = await SearchJob.findOne({ _id: req.params.id, owner: req.user._id });
  if (!job) throw new HttpError(404, 'Search not found');
  if (job.status === 'running') throw new HttpError(409, 'Cannot delete a running search');
  await Promise.all([Lead.deleteMany({ job: job._id }), job.deleteOne()]);
  res.json({ ok: true });
});

export default router;
