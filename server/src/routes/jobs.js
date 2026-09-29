import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { env } from '../config/env.js';
import { JOB_LEVELS, JobPosting } from '../models/JobPosting.js';
import { JobSearch } from '../models/JobSearch.js';
import { llmEnabled } from '../services/agent/llm.js';
import { searchJobs } from '../services/jobs/aggregator.js';
import { CATEGORY_KEYS, JOB_CATEGORIES } from '../services/jobs/categories.js';
import { EDUCATION_KEYS, EDUCATION_LEVELS } from '../services/jobs/education.js';
import { INDIAN_STATES } from '../services/jobs/india.js';
import { jobProviders } from '../services/jobs/providers.js';
import { HttpError } from '../utils/httpError.js';

const router = Router();

const searchLimiter = rateLimit({ windowMs: 60_000, limit: 6, standardHeaders: 'draft-7', legacyHeaders: false });

export const POSTED_WITHIN = [1, 3, 7, 30, 0];

const searchSchema = z
  .object({
    prompt: z.string().trim().max(200).default(''),
    level: z.enum(JOB_LEVELS),
    category: z.union([z.enum(CATEGORY_KEYS), z.literal('')]).default(''),
    education: z.union([z.enum(EDUCATION_KEYS), z.literal('')]).default(''),
    verifiedOnly: z.boolean().default(true),
    state: z.string().trim().max(60).default(''),
    city: z.string().trim().max(60).default(''),
    postedWithin: z.coerce.number().refine((n) => POSTED_WITHIN.includes(n), 'Invalid posted-within value').default(30),
  })
  .refine((d) => d.prompt.length >= 2 || d.category, { message: 'Describe the job you want or pick a category', path: ['prompt'] });

router.get('/meta', (_req, res) => {
  res.json({
    categories: JOB_CATEGORIES.map(({ key, label }) => ({ key, label })),
    levels: JOB_LEVELS,
    education: EDUCATION_LEVELS.map(({ key, label }) => ({ key, label })),
    states: INDIAN_STATES,
    postedWithin: POSTED_WITHIN,
    providers: jobProviders(),
    ai: llmEnabled() ? 'openai' : 'rules',
    dailyLimit: env.dailyJobSearchLimit,
  });
});

router.post('/search', searchLimiter, async (req, res) => {
  const body = searchSchema.parse(req.body);
  if (req.user.role !== 'admin') {
    const today = await JobSearch.countDocuments({ owner: req.user._id, createdAt: { $gte: new Date(Date.now() - 86400_000) } });
    if (today >= env.dailyJobSearchLimit) throw new HttpError(429, `Daily job search limit (${env.dailyJobSearchLimit}) reached`);
  }
  const { plan, providers, items, hiddenUnverified, durationMs } = await searchJobs(body, (level, msg) => console.log(`[jobs] ${level}: ${msg}`));
  const search = await JobSearch.create({
    ...body,
    owner: req.user._id,
    query: plan.q,
    providers,
    resultCount: items.length,
    durationMs,
    jobs: items.map((j) => j._id),
  });
  res.json({ search: { ...search.toObject(), jobs: undefined, plan, hiddenUnverified }, items });
});

router.get('/searches', async (req, res) => {
  const items = await JobSearch.find({ owner: req.user._id }).select('-jobs').sort({ createdAt: -1 }).limit(10).lean();
  res.json({ items });
});

router.get('/:id', async (req, res) => {
  const job = await JobPosting.findOne({ _id: req.params.id, active: true }).select('-key -postedBy').lean();
  if (!job) throw new HttpError(404, 'Job not found');
  res.json({ job });
});

router.post('/:id/apply', async (req, res) => {
  const job = await JobPosting.findOneAndUpdate({ _id: req.params.id, active: true }, { $inc: { applyClicks: 1 } }, { returnDocument: 'after' });
  if (!job) throw new HttpError(404, 'Job not found');
  const link = z.object({ link: z.string().url().optional() }).parse(req.body || {}).link;
  const allowed = [job.applyUrl, ...job.applyOptions.map((o) => o.link), job.sourceUrl].filter(Boolean);
  const url = (link && allowed.includes(link) ? link : allowed[0]) || (job.emails[0] ? `mailto:${job.emails[0]}?subject=${encodeURIComponent(`Application for ${job.title}`)}` : null);
  if (!url) throw new HttpError(404, 'This job has no apply link or email');
  res.json({ url });
});

export default router;
