import { Router } from 'express';
import { z } from 'zod';
import { Ad, AD_PLACEMENTS } from '../models/Ad.js';
import { Lead } from '../models/Lead.js';
import { SearchJob } from '../models/SearchJob.js';
import { User } from '../models/User.js';
import { HttpError } from '../utils/httpError.js';
import { env } from '../config/env.js';
import { Campaign } from '../models/Campaign.js';
import { LeadGroup } from '../models/LeadGroup.js';
import dataRoutes from './adminData.js';

const router = Router();

const httpUrl = z
  .string()
  .trim()
  .url()
  .refine((u) => /^https?:\/\//i.test(u), 'Must be an http(s) URL');

const adSchema = z
  .object({
    advertiser: z.string().trim().min(1).max(100),
    title: z.string().trim().min(1).max(120),
    description: z.string().trim().max(300).optional().default(''),
    imageUrl: z.union([httpUrl, z.literal('')]).optional(),
    videoUrl: z.union([httpUrl, z.literal('')]).optional(),
    targetUrl: httpUrl,
    ctaText: z.string().trim().max(30).optional(),
    placement: z.enum(AD_PLACEMENTS),
    priority: z.coerce.number().min(0).max(100).default(0),
    active: z.boolean().default(true),
    startDate: z.union([z.null(), z.literal(''), z.coerce.date()]).optional(),
    endDate: z.union([z.null(), z.literal(''), z.coerce.date()]).optional(),
  })
  .refine((d) => d.placement !== 'video' || d.videoUrl, { path: ['videoUrl'], message: 'Video ads need a video URL (MP4/WebM)' });

const clean = (d) => ({ ...d, startDate: d.startDate || null, endDate: d.endDate || null });

router.get('/stats', async (_req, res) => {
  const [users, searches, leads, ads, adAgg, groups, campaigns, mailAgg, sharedSearches] = await Promise.all([
    User.countDocuments(),
    SearchJob.countDocuments(),
    Lead.countDocuments(),
    Ad.countDocuments({ active: true }),
    Ad.aggregate([{ $group: { _id: null, impressions: { $sum: '$impressions' }, clicks: { $sum: '$clicks' }, videoViews: { $sum: '$completedViews' } } }]),
    LeadGroup.countDocuments(),
    Campaign.countDocuments(),
    Campaign.aggregate([{ $match: { mode: 'gmail' } }, { $group: { _id: null, sent: { $sum: '$counts.sent' } } }]),
    SearchJob.countDocuments({ 'cache.reused': { $gt: 0 } }),
  ]);
  res.json({
    users,
    searches,
    leads,
    groups,
    campaigns,
    emailsSent: mailAgg[0]?.sent || 0,
    sharedSearches,
    retentionDays: env.dataRetentionDays,
    videoAdSeconds: env.videoAd.seconds,
    activeAds: ads,
    impressions: adAgg[0]?.impressions || 0,
    clicks: adAgg[0]?.clicks || 0,
    videoViews: adAgg[0]?.videoViews || 0,
  });
});

router.get('/ads', async (_req, res) => {
  res.json({ items: await Ad.find().sort({ createdAt: -1 }).lean() });
});

router.post('/ads', async (req, res) => {
  const ad = await Ad.create({ ...clean(adSchema.parse(req.body)), createdBy: req.user._id });
  res.status(201).json({ ad });
});

router.put('/ads/:id', async (req, res) => {
  const ad = await Ad.findByIdAndUpdate(req.params.id, clean(adSchema.parse(req.body)), { returnDocument: 'after', runValidators: true });
  if (!ad) throw new HttpError(404, 'Ad not found');
  res.json({ ad });
});

router.delete('/ads/:id', async (req, res) => {
  const r = await Ad.deleteOne({ _id: req.params.id });
  if (!r.deletedCount) throw new HttpError(404, 'Ad not found');
  res.json({ ok: true });
});

router.patch('/users/:id', async (req, res) => {
  const body = z.object({ role: z.enum(['user', 'admin']).optional(), active: z.boolean().optional() }).parse(req.body);
  if (String(req.params.id) === String(req.user._id) && (body.role === 'user' || body.active === false)) {
    throw new HttpError(400, 'You cannot demote or disable yourself');
  }
  const user = await User.findByIdAndUpdate(req.params.id, body, { returnDocument: 'after' });
  if (!user) throw new HttpError(404, 'User not found');
  res.json({ user: user.toPublic() });
});

router.use(dataRoutes);

export default router;
