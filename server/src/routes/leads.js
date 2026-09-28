import { Router } from 'express';
import { z } from 'zod';
import { Lead } from '../models/Lead.js';
import { SearchJob } from '../models/SearchJob.js';
import { buildLeadsWorkbook } from '../services/excel.js';
import { HttpError } from '../utils/httpError.js';

const router = Router();

function buildFilter(user, q) {
  const filter = { owner: user._id };
  if (q.jobId) filter.job = q.jobId;
  if (q.hasEmail === 'true') filter.primaryEmail = { $exists: true, $nin: [null, ''] };
  if (q.emailType) filter.primaryEmailCategory = q.emailType;
  if (q.source) filter.sources = q.source;
  if (q.search) {
    const rx = new RegExp(String(q.search).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    filter.$or = [{ name: rx }, { primaryEmail: rx }, { website: rx }, { city: rx }, { category: rx }];
  }
  return filter;
}

router.get('/', async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Number(req.query.limit) || 20);
  const filter = buildFilter(req.user, req.query);
  const sort = req.query.jobId ? { rank: 1 } : { createdAt: -1, rank: 1 };
  const [items, total] = await Promise.all([
    Lead.find(filter).sort(sort).skip((page - 1) * limit).limit(limit).lean(),
    Lead.countDocuments(filter),
  ]);
  res.json({ items, total, page, limit });
});

router.get('/stats', async (req, res) => {
  const owner = req.user._id;
  const [totalLeads, withEmail, hr, searches, completed] = await Promise.all([
    Lead.countDocuments({ owner }),
    Lead.countDocuments({ owner, primaryEmail: { $exists: true, $nin: [null, ''] } }),
    Lead.countDocuments({ owner, primaryEmailCategory: 'hr' }),
    SearchJob.countDocuments({ owner }),
    SearchJob.countDocuments({ owner, status: 'completed' }),
  ]);
  res.json({ totalLeads, withEmail, hr, searches, completed });
});

router.get('/export', async (req, res) => {
  const { count } = z.object({ count: z.enum(['20', '40', '60', 'all']).default('20') }).parse(req.query);
  const filter = buildFilter(req.user, req.query);
  let title = 'All leads';
  let jobs = [];
  if (req.query.jobId) {
    const job = await SearchJob.findOne({ _id: req.query.jobId, owner: req.user._id }).lean();
    if (!job) throw new HttpError(404, 'Search not found');
    title = job.query;
    jobs = [job];
  }
  let q = Lead.find(filter).sort(req.query.jobId ? { rank: 1 } : { score: -1, createdAt: -1 });
  if (count !== 'all') q = q.limit(Number(count));
  const leads = await q.lean();
  const buffer = await buildLeadsWorkbook({ title, leads, count, jobs });
  const safe = title.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').slice(0, 50) || 'leads';
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="${safe}-${count}.xlsx"`);
  res.send(Buffer.from(buffer));
});

router.delete('/:id', async (req, res) => {
  const r = await Lead.deleteOne({ _id: req.params.id, owner: req.user._id });
  if (!r.deletedCount) throw new HttpError(404, 'Lead not found');
  res.json({ ok: true });
});

export default router;
