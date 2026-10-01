import { env } from '../config/env.js';
import { Lead } from '../models/Lead.js';
import { SearchJob } from '../models/SearchJob.js';

const HOUR = 3600 * 1000;

// Deletes every user's searches (and their leads) older than the retention window, admins included.
export async function purgeExpired(now = Date.now()) {
  const cutoff = new Date(now - env.dataRetentionDays * 24 * HOUR);
  const [ids, running] = await Promise.all([
    SearchJob.find({ createdAt: { $lt: cutoff }, status: { $ne: 'running' } }).distinct('_id'),
    SearchJob.find({ status: 'running' }).distinct('_id'),
  ]);
  const [leads, searches] = await Promise.all([
    Lead.deleteMany({ $or: [{ job: { $in: ids } }, { createdAt: { $lt: cutoff }, job: { $nin: running } }] }),
    SearchJob.deleteMany({ _id: { $in: ids } }),
  ]);
  return { cutoff, searches: searches.deletedCount, leads: leads.deletedCount };
}

export function startRetention(intervalMs = HOUR) {
  const run = () =>
    purgeExpired()
      .then((r) => (r.searches || r.leads) && console.log(`[retention] removed ${r.searches} searches and ${r.leads} leads older than ${env.dataRetentionDays} days`))
      .catch((err) => console.error('[retention] purge failed', err));
  run();
  return setInterval(run, intervalMs).unref();
}
