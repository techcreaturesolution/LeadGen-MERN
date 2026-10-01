import mongoose from 'mongoose';
import { Router } from 'express';
import { z } from 'zod';
import { env } from '../config/env.js';
import { Campaign, CAMPAIGN_ACTIVE } from '../models/Campaign.js';
import { EmailTemplate } from '../models/EmailTemplate.js';
import { Lead } from '../models/Lead.js';
import { LeadGroup } from '../models/LeadGroup.js';
import { expiresAt, SearchJob } from '../models/SearchJob.js';
import { Suppression } from '../models/Suppression.js';
import { User } from '../models/User.js';
import { EXPORT_FORMATS, sendLeadsFile, sendTableFile } from '../services/exportFile.js';
import { dedupeLeads } from '../services/agent/qualityAgent.js';
import { HttpError } from '../utils/httpError.js';
import { exportSchema } from './leads.js';

const router = Router();

const oid = (v) => (v && mongoose.isValidObjectId(v) ? new mongoose.Types.ObjectId(String(v)) : null);
const escapeRx = (s) => new RegExp(String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
const paging = (q, max = 100) => {
  const page = Math.max(1, Number(q.page) || 1);
  const limit = Math.min(max, Math.max(1, Number(q.limit) || 25));
  return { page, limit, skip: (page - 1) * limit };
};
const countBy = async (Model, ids, match = {}, sum = 1) => {
  const rows = await Model.aggregate([{ $match: { owner: { $in: ids }, ...match } }, { $group: { _id: '$owner', n: { $sum: sum }, last: { $max: '$createdAt' } } }]);
  return new Map(rows.map((r) => [String(r._id), r]));
};

export async function clientStats(ids) {
  const [searches, leads, withEmail, groups, templates, campaigns, sent, tests] = await Promise.all([
    countBy(SearchJob, ids),
    countBy(Lead, ids),
    countBy(Lead, ids, { primaryEmail: { $exists: true, $nin: [null, ''] } }),
    countBy(LeadGroup, ids),
    countBy(EmailTemplate, ids),
    countBy(Campaign, ids),
    countBy(Campaign, ids, { mode: 'gmail' }, '$counts.sent'),
    countBy(Campaign, ids, { mode: 'dry_run' }, '$counts.sent'),
  ]);
  return (id) => {
    const k = String(id);
    return {
      searches: searches.get(k)?.n || 0,
      lastSearchAt: searches.get(k)?.last || null,
      leads: leads.get(k)?.n || 0,
      leadsWithEmail: withEmail.get(k)?.n || 0,
      groups: groups.get(k)?.n || 0,
      templates: templates.get(k)?.n || 0,
      campaigns: campaigns.get(k)?.n || 0,
      emailsSent: sent.get(k)?.n || 0,
      testEmails: tests.get(k)?.n || 0,
    };
  };
}

const publicClient = (u, stats) => ({
  _id: u._id,
  name: u.name,
  email: u.email,
  picture: u.picture,
  role: u.role,
  active: u.active,
  googleLinked: Boolean(u.googleId),
  gmail: u.gmail?.email ? { email: u.gmail.email, connectedAt: u.gmail.connectedAt, lastError: u.gmail.lastError || null } : null,
  lastLoginAt: u.lastLoginAt,
  createdAt: u.createdAt,
  ...stats(u._id),
});

function userFilter(q) {
  const f = {};
  if (q.search) f.$or = [{ email: escapeRx(q.search) }, { name: escapeRx(q.search) }];
  if (['user', 'admin'].includes(q.role)) f.role = q.role;
  if (q.status === 'active') f.active = true;
  if (q.status === 'disabled') f.active = false;
  return f;
}

router.get('/users', async (req, res) => {
  const { page, limit, skip } = paging(req.query, 200);
  const filter = userFilter(req.query);
  const [users, total] = await Promise.all([User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(), User.countDocuments(filter)]);
  const stats = await clientStats(users.map((u) => u._id));
  res.json({ items: users.map((u) => publicClient(u, stats)), total, page, limit });
});

const CLIENT_COLUMNS = [
  { header: 'Name', key: 'name', width: 24 },
  { header: 'Email', key: 'email', width: 32 },
  { header: 'Role', key: 'role', width: 8 },
  { header: 'Status', key: 'status', width: 10 },
  { header: 'Gmail connected', key: 'gmail', width: 30 },
  { header: 'Joined', key: 'createdAt', width: 20 },
  { header: 'Last login', key: 'lastLoginAt', width: 20 },
  { header: 'Searches', key: 'searches', width: 10 },
  { header: 'Last search', key: 'lastSearchAt', width: 20 },
  { header: 'Leads', key: 'leads', width: 8 },
  { header: 'Leads with email', key: 'leadsWithEmail', width: 14 },
  { header: 'Lead groups', key: 'groups', width: 11 },
  { header: 'Templates', key: 'templates', width: 10 },
  { header: 'Campaigns', key: 'campaigns', width: 10 },
  { header: 'Emails sent (Gmail)', key: 'emailsSent', width: 16 },
  { header: 'Test-run emails', key: 'testEmails', width: 14 },
];

const fmt = (d) => (d ? new Date(d).toISOString().replace('T', ' ').slice(0, 16) : '');

router.get('/users/export', async (req, res) => {
  const { format } = z.object({ format: z.enum(EXPORT_FORMATS).default('xlsx') }).parse(req.query);
  const users = await User.find(userFilter(req.query)).sort({ createdAt: -1 }).lean();
  const stats = await clientStats(users.map((u) => u._id));
  const rows = users.map((u) => {
    const c = publicClient(u, stats);
    return { ...c, status: c.active ? 'Active' : 'Disabled', gmail: c.gmail?.email || '', createdAt: fmt(c.createdAt), lastLoginAt: fmt(c.lastLoginAt), lastSearchAt: fmt(c.lastSearchAt) };
  });
  await sendTableFile(res, { title: `clients-${new Date().toISOString().slice(0, 10)}`, sheet: 'Clients', columns: CLIENT_COLUMNS, rows, format });
});

router.get('/users/:id', async (req, res) => {
  const user = await User.findById(oid(req.params.id)).lean();
  if (!user) throw new HttpError(404, 'Client not found');
  const stats = await clientStats([user._id]);
  const [searches, groups, templates, campaigns, suppressions] = await Promise.all([
    SearchJob.find({ owner: user._id }).select('query sources targetCount status leadCount progress.withEmail cache createdAt adGate.required adGate.completedAt').sort({ createdAt: -1 }).limit(100).lean(),
    LeadGroup.find({ owner: user._id }).select('name description memberCount updatedAt createdAt').sort({ updatedAt: -1 }).lean(),
    EmailTemplate.find({ owner: user._id }).select('name subject updatedAt').sort({ updatedAt: -1 }).lean(),
    Campaign.find({ owner: user._id }).select('name groupName templateName mode status counts createdAt finishedAt').sort({ createdAt: -1 }).limit(100).lean(),
    Suppression.countDocuments({ owner: user._id }),
  ]);
  res.json({
    client: publicClient(user, stats),
    searches: searches.map((s) => ({ ...s, expiresAt: expiresAt(s, env.dataRetentionDays) })),
    groups,
    templates,
    campaigns,
    suppressions,
  });
});

router.delete('/users/:id', async (req, res) => {
  const user = await User.findById(oid(req.params.id));
  if (!user) throw new HttpError(404, 'Client not found');
  if (String(user._id) === String(req.user._id)) throw new HttpError(400, 'You cannot delete your own account');
  const busy = await Promise.all([
    Campaign.exists({ owner: user._id, status: { $in: CAMPAIGN_ACTIVE } }),
    SearchJob.exists({ owner: user._id, status: { $in: ['queued', 'running'] } }),
  ]);
  if (busy.some(Boolean)) throw new HttpError(409, 'This client has a search or campaign in progress. Pause or wait for it to finish first.');
  const owner = { owner: user._id };
  const [leads, searches, groups, templates, campaigns] = await Promise.all([
    Lead.deleteMany(owner),
    SearchJob.deleteMany(owner),
    LeadGroup.deleteMany(owner),
    EmailTemplate.deleteMany(owner),
    Campaign.deleteMany(owner),
    Suppression.deleteMany(owner),
  ]);
  await user.deleteOne();
  res.json({ ok: true, deleted: { leads: leads.deletedCount, searches: searches.deletedCount, groups: groups.deletedCount, templates: templates.deletedCount, campaigns: campaigns.deletedCount } });
});

function leadFilter(q) {
  const f = {};
  if (q.owner) f.owner = oid(q.owner) || null;
  if (q.jobId) f.job = oid(q.jobId) || null;
  if (q.hasEmail === 'true') f.primaryEmail = { $exists: true, $nin: [null, ''] };
  if (q.emailType) f.primaryEmailCategory = String(q.emailType);
  if (q.source) f.sources = String(q.source);
  if (q.search) {
    const rx = escapeRx(q.search);
    f.$or = [{ name: rx }, { primaryEmail: rx }, { website: rx }, { city: rx }, { category: rx }];
  }
  return f;
}

router.get('/leads', async (req, res) => {
  const { page, limit, skip } = paging(req.query);
  const filter = leadFilter(req.query);
  const [items, total] = await Promise.all([
    Lead.find(filter).sort({ createdAt: -1, rank: 1 }).skip(skip).limit(limit).populate('owner', 'name email').populate('job', 'query').lean(),
    Lead.countDocuments(filter),
  ]);
  res.json({ items, total, page, limit });
});

router.get('/leads/export', async (req, res) => {
  const { count, format } = exportSchema.parse(req.query);
  const filter = leadFilter(req.query);
  let title = 'All clients leads';
  if (filter.owner) title = `${(await User.findById(filter.owner).select('email').lean())?.email || 'client'} leads`;
  if (filter.job) title = (await SearchJob.findById(filter.job).select('query').lean())?.query || title;
  let leads = await Lead.find(filter).sort(filter.job ? { rank: 1 } : { createdAt: -1, score: -1 }).lean();
  if (!filter.job) {
    leads = dedupeLeads(leads.map((l) => ({ ...l, rawEmails: [] }))).leads;
    leads.sort((a, b) => (b.score || 0) - (a.score || 0));
  }
  if (count !== 'all') leads = leads.slice(0, Number(count));
  await sendLeadsFile(res, { title, leads, count, format });
});

router.delete('/leads/:id', async (req, res) => {
  const lead = await Lead.findOneAndDelete({ _id: oid(req.params.id) });
  if (!lead) throw new HttpError(404, 'Lead not found');
  await SearchJob.updateOne({ _id: lead.job, leadCount: { $gt: 0 } }, { $inc: { leadCount: -1 } });
  res.json({ ok: true });
});

router.get('/searches', async (req, res) => {
  const { page, limit, skip } = paging(req.query);
  const filter = {};
  if (req.query.owner) filter.owner = oid(req.query.owner) || null;
  if (req.query.status) filter.status = String(req.query.status);
  if (req.query.search) filter.query = escapeRx(req.query.search);
  const [items, total] = await Promise.all([
    SearchJob.find(filter).select('-logs').sort({ createdAt: -1 }).skip(skip).limit(limit).populate('owner', 'name email').lean(),
    SearchJob.countDocuments(filter),
  ]);
  res.json({ items: items.map((j) => ({ ...j, expiresAt: expiresAt(j, env.dataRetentionDays) })), total, page, limit, retentionDays: env.dataRetentionDays });
});

router.delete('/searches/:id', async (req, res) => {
  const job = await SearchJob.findById(oid(req.params.id));
  if (!job) throw new HttpError(404, 'Search not found');
  if (job.status === 'running') throw new HttpError(409, 'Cannot delete a running search');
  await Promise.all([Lead.deleteMany({ job: job._id }), job.deleteOne()]);
  res.json({ ok: true });
});

export default router;
