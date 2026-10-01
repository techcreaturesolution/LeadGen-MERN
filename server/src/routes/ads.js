import { Router } from 'express';
import { z } from 'zod';
import { Ad, AD_PLACEMENTS } from '../models/Ad.js';
import { env } from '../config/env.js';
import { HttpError } from '../utils/httpError.js';
import { DEMO_VIDEO_AD, pickVideoAd } from '../services/videoAds.js';

const router = Router();

export function activeFilter(placement) {
  const now = new Date();
  return {
    active: true,
    ...(placement ? { placement } : {}),
    $and: [
      { $or: [{ startDate: null }, { startDate: { $exists: false } }, { startDate: { $lte: now } }] },
      { $or: [{ endDate: null }, { endDate: { $exists: false } }, { endDate: { $gte: now } }] },
    ],
  };
}

router.get('/', async (req, res) => {
  const { placement, limit } = z
    .object({ placement: z.enum(AD_PLACEMENTS).optional(), limit: z.coerce.number().min(1).max(10).default(3) })
    .parse(req.query);
  const pool = await Ad.find(activeFilter(placement)).select('-impressions -clicks -createdBy').lean();
  const picked = pool
    .map((a) => ({ a, w: Math.random() * (1 + Math.max(0, a.priority || 0)) }))
    .sort((x, y) => y.w - x.w)
    .slice(0, limit)
    .map((x) => x.a);
  if (picked.length) await Ad.updateMany({ _id: { $in: picked.map((a) => a._id) } }, { $inc: { impressions: 1 } });
  res.json({ items: picked });
});

router.get('/video/next', async (req, res) => {
  const exempt = env.videoAd.exemptAdmins && req.user.role === 'admin';
  if (!env.videoAd.duringCampaigns || exempt) return res.json({ enabled: false, ad: null });
  const exclude = /^[a-f0-9]{24}$/i.test(String(req.query.exclude || '')) ? req.query.exclude : undefined;
  const ad = await pickVideoAd({ exclude });
  if (ad) await Ad.updateOne({ _id: ad._id }, { $inc: { impressions: 1 } });
  res.json({ enabled: true, ad: ad || DEMO_VIDEO_AD });
});

router.post('/:id/video-complete', async (req, res) => {
  await Ad.updateOne({ _id: req.params.id, placement: 'video' }, { $inc: { completedViews: 1 } });
  res.json({ ok: true });
});

router.post('/:id/click', async (req, res) => {
  const ad = await Ad.findOneAndUpdate({ _id: req.params.id, active: true }, { $inc: { clicks: 1 } }, { returnDocument: 'after' });
  if (!ad) throw new HttpError(404, 'Ad not found');
  res.json({ url: ad.targetUrl });
});

export default router;
