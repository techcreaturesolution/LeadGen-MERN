import { Ad } from '../models/Ad.js';
import { activeFilter } from '../routes/ads.js';

export const DEMO_VIDEO_AD = {
  _id: null,
  advertiser: 'LeadGen AI',
  title: 'Your brand here: 60 second video slot',
  description: 'Demo video ad. Add a video ad in Admin to replace it.',
  videoUrl: '/demo-video-ad.mp4',
  targetUrl: null,
  ctaText: 'Advertise with us',
  demo: true,
};

export async function pickVideoAd({ exclude } = {}) {
  let pool = await Ad.find({ ...activeFilter('video'), videoUrl: { $nin: [null, ''] } })
    .select('advertiser title description videoUrl targetUrl ctaText priority')
    .lean();
  if (exclude && pool.length > 1) pool = pool.filter((a) => String(a._id) !== String(exclude));
  if (!pool.length) return null;
  const total = pool.reduce((s, a) => s + 1 + Math.max(0, a.priority || 0), 0);
  let r = Math.random() * total;
  return pool.find((a) => (r -= 1 + Math.max(0, a.priority || 0)) < 0) || pool[0];
}
