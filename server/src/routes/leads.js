import { Router } from 'express';
import { z } from 'zod';
import { Lead } from '../models/Lead.js';
import { isAdLocked, SearchJob } from '../models/SearchJob.js';
import { dedupeLeads } from '../services/agent/qualityAgent.js';
import { EXPORT_FORMATS, sendLeadsFile } from '../services/exportFile.js';
import { HttpError } from '../utils/httpError.js';

const router = Router();

export const exportSchema = z.object({
  count: z.enum(['20', '40', '60', 'all']).default('20'),
  format: z.enum(EXPORT_FORMATS).default('xlsx'),
});

const LOCKED_MSG = 'Watch the full video ad to unlock the results of this search';

export async function buildFilter(user, q) {
  const filter = { owner: user._id };
  if (q.jobId) {
    const job = await SearchJob.findOne({ _id: q.jobId, owner: user._id }).select('adGate').lean();
    if (!job) throw new HttpError(404, 'Search not found');
    if (isAdLocked(job)) throw new HttpError(403, LOCKED_MSG);
    filter.job = job._id;
  } else {
    const locked = await SearchJob.find({ owner: user._id, 'adGate.required': true, 'adGate.completedAt': null }).distinct('_id');
    if (locked.length) filter.job = { $nin: locked };
  }
  if (q.hasEmail === 'true') filter.primaryEmail = { $exists: true, $nin: [null, ''] };
  if (q.emailType) filter.primaryEmailCategory = q.emailType;
  if (q.source) filter.sources = q.source;
  if (q.search) {
    const rx = new RegExp(String(q.search).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    filter.$or = [{ name: rx }, { primaryEmail: rx }, { website: rx }, { city: rx }, { category: rx }];
  }
  if (q.ids) {
    const idArray = String(q.ids).split(',').map((s) => s.trim()).filter(Boolean);
    if (idArray.length) filter._id = { $in: idArray };
  }
  return filter;
}

router.get('/', async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Number(req.query.limit) || 20);
  const filter = await buildFilter(req.user, req.query);
  if (req.query.jobId) {
    const [items, total] = await Promise.all([
      Lead.find(filter).sort({ rank: 1 }).skip((page - 1) * limit).limit(limit).lean(),
      Lead.countDocuments(filter),
    ]);
    return res.json({ items, total, page, limit });
  }
  const [out] = await Lead.aggregate([
    { $match: filter },
    { $sort: { createdAt: -1, rank: 1 } },
    { $group: { _id: { $ifNull: ['$dedupeKey', '$_id'] }, doc: { $first: '$$ROOT' } } },
    { $replaceRoot: { newRoot: '$doc' } },
    { $sort: { createdAt: -1, rank: 1 } },
    { $facet: { items: [{ $skip: (page - 1) * limit }, { $limit: limit }], total: [{ $count: 'n' }] } },
  ]);
  res.json({ items: out.items, total: out.total[0]?.n || 0, page, limit });
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
  const { count, format } = exportSchema.parse(req.query);
  const filter = await buildFilter(req.user, req.query);
  let title = 'All leads';
  let jobs = [];
  if (req.query.jobId) {
    const job = await SearchJob.findOne({ _id: req.query.jobId, owner: req.user._id }).lean();
    if (!job) throw new HttpError(404, 'Search not found');
    title = job.query;
    jobs = [job];
  }
  let leads = await Lead.find(filter)
    .sort(req.query.jobId ? { rank: 1 } : { createdAt: -1, score: -1 })
    .lean();
  if (!req.query.jobId) {
    leads = dedupeLeads(leads.map((l) => ({ ...l, rawEmails: [] }))).leads;
    leads.sort((a, b) => (b.score || 0) - (a.score || 0));
  }
  if (count !== 'all') leads = leads.slice(0, Number(count));
  await sendLeadsFile(res, { title, leads, count, jobs, format });
});

router.delete('/:id', async (req, res) => {
  const r = await Lead.deleteOne({ _id: req.params.id, owner: req.user._id });
  if (!r.deletedCount) throw new HttpError(404, 'Lead not found');
  res.json({ ok: true });
});

export default router;
