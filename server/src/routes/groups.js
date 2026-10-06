import express, { Router } from 'express';
import { z } from 'zod';
import { Campaign } from '../models/Campaign.js';
import { Lead } from '../models/Lead.js';
import { LeadGroup } from '../models/LeadGroup.js';
import { SearchJob } from '../models/SearchJob.js';
import { leadToMember, MAX_GROUP_MEMBERS, mergeMembers, parseLeadsWorkbook } from '../services/groups.js';
import { HttpError } from '../utils/httpError.js';
import { buildFilter } from './leads.js';

const router = Router();

const metaSchema = z.object({
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().max(500).optional().default(''),
});

async function ownGroup(req) {
  const g = await LeadGroup.findOne({ _id: req.params.id, owner: req.user._id });
  if (!g) throw new HttpError(404, 'Group not found');
  return g;
}

async function addMembers(group, incoming, source) {
  const { added, duplicates, invalid } = mergeMembers(group.members, incoming);
  group.members.push(...added);
  group.sources.push({ ...source, at: new Date(), added: added.length });
  await group.save();
  return { added: added.length, duplicates, withoutEmail: invalid, total: group.members.length, limit: MAX_GROUP_MEMBERS };
}

function saveErr(err) {
  if (err?.code === 11000) throw new HttpError(409, 'A group with this name already exists');
  throw err;
}

router.get('/', async (req, res) => {
  const items = await LeadGroup.find({ owner: req.user._id }).select('-members').sort({ updatedAt: -1 }).lean();
  const stats = await Campaign.aggregate([
    { $match: { owner: req.user._id, group: { $in: items.map((g) => g._id) } } },
    { $group: { _id: '$group', campaigns: { $sum: 1 }, sent: { $sum: '$counts.sent' }, lastAt: { $max: '$createdAt' } } },
  ]);
  const byId = Object.fromEntries(stats.map((s) => [String(s._id), s]));
  res.json({ items: items.map((g) => ({ ...g, campaigns: byId[g._id]?.campaigns || 0, sent: byId[g._id]?.sent || 0, lastCampaignAt: byId[g._id]?.lastAt || null })) });
});

router.post('/', async (req, res) => {
  const body = metaSchema.parse(req.body);
  const group = await LeadGroup.create({ ...body, owner: req.user._id }).catch(saveErr);
  res.status(201).json({ group });
});

router.get('/:id', async (req, res) => {
  res.json({ group: await ownGroup(req) });
});

router.patch('/:id', async (req, res) => {
  const group = await ownGroup(req);
  Object.assign(group, metaSchema.partial().parse(req.body));
  await group.save().catch(saveErr);
  res.json({ group });
});

router.delete('/:id', async (req, res) => {
  const group = await ownGroup(req);
  if (await Campaign.exists({ group: group._id, status: { $in: ['queued', 'sending'] } })) {
    throw new HttpError(409, 'A campaign is sending to this group. Pause or cancel it first.');
  }
  await group.deleteOne();
  res.json({ ok: true });
});

const addSchema = z
  .object({
    jobId: z.string().optional(),
    leadIds: z.array(z.string()).max(MAX_GROUP_MEMBERS).optional(),
    filters: z.object({ search: z.string().optional(), emailType: z.string().optional(), source: z.string().optional() }).optional(),
  })
  .refine((b) => b.jobId || b.leadIds?.length || b.filters, 'Provide jobId, leadIds or filters');

router.post('/:id/members', async (req, res) => {
  const group = await ownGroup(req);
  const body = addSchema.parse(req.body);
  let filter;
  let source;
  if (body.jobId) {
    filter = await buildFilter(req.user, { jobId: body.jobId, hasEmail: 'true' });
    const job = await SearchJob.findById(body.jobId).select('query').lean();
    source = { type: 'search', job: body.jobId, label: job?.query };
  } else {
    filter = await buildFilter(req.user, { ...(body.filters || {}), hasEmail: 'true' });
    if (body.leadIds?.length) filter._id = { $in: body.leadIds };
    source = { type: 'leads', label: body.leadIds?.length ? `${body.leadIds.length} selected leads` : 'All leads (filtered)' };
  }
  const leads = await Lead.find(filter).sort({ createdAt: -1, rank: 1 }).limit(MAX_GROUP_MEMBERS).lean();
  const origin = body.jobId ? 'search' : 'leads';
  res.json(await addMembers(group, leads.map((l) => leadToMember(l, origin)), source));
});

router.post('/:id/import', express.raw({ type: () => true, limit: '10mb' }), async (req, res) => {
  const group = await ownGroup(req);
  if (!Buffer.isBuffer(req.body) || !req.body.length) throw new HttpError(400, 'Upload an .xlsx file');
  let parsed;
  try {
    parsed = await parseLeadsWorkbook(req.body);
  } catch (err) {
    throw new HttpError(400, err.message);
  }
  const fileName = String(req.query.fileName || 'Excel upload').slice(0, 120);
  res.json({ sheet: parsed.sheet, rows: parsed.rows.length, ...(await addMembers(group, parsed.rows, { type: 'excel', label: fileName })) });
});

const manualSchema = z.object({
  email: z.string().email(),
  business: z.string().trim().optional(),
  city: z.string().trim().optional(),
  phone: z.string().trim().optional(),
  website: z.string().trim().optional(),
});

router.post('/:id/members/manual', async (req, res) => {
  const group = await ownGroup(req);
  const body = manualSchema.parse(req.body);
  const member = { ...body, origin: 'manual', createdAt: new Date() };
  res.json(await addMembers(group, [member], { type: 'manual', label: 'Manual Entry' }));
});

router.delete('/:id/members/:memberId', async (req, res) => {
  const group = await ownGroup(req);
  group.members.pull({ _id: req.params.memberId });
  await group.save();
  res.json({ total: group.members.length });
});

router.get('/:id/history', async (req, res) => {
  const group = await ownGroup(req);
  const campaigns = await Campaign.find({ owner: req.user._id, group: group._id })
    .select('-recipients -body')
    .sort({ createdAt: -1 })
    .lean();
  const contacted = group.members.filter((m) => m.lastEmailedAt).length;
  res.json({
    summary: { campaigns: campaigns.length, members: group.members.length, contacted, notContacted: group.members.length - contacted },
    campaigns,
  });
});

export default router;
