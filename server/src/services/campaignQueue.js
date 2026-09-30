import { env } from '../config/env.js';
import { Campaign, CAMPAIGN_ACTIVE } from '../models/Campaign.js';
import { LeadGroup } from '../models/LeadGroup.js';
import { Suppression } from '../models/Suppression.js';
import { User } from '../models/User.js';
import { GmailAuthError, gmailSender } from './mail/gmail.js';
import { buildMime } from './mail/mime.js';
import { renderEmail, textToHtml } from './mail/template.js';
import { signUnsubscribe } from './unsubscribe.js';

const running = new Map();
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export async function gmailSentLast24h(owner) {
  const since = new Date(Date.now() - 24 * 3600 * 1000);
  const [row] = await Campaign.aggregate([
    { $match: { owner, mode: 'gmail', updatedAt: { $gte: since } } },
    { $unwind: '$recipients' },
    { $match: { 'recipients.status': 'sent', 'recipients.sentAt': { $gte: since } } },
    { $count: 'n' },
  ]);
  return row?.n || 0;
}

export function composeMessage(campaign, recipient) {
  const sender = campaign.from;
  const { subject, text } = renderEmail(campaign, recipient, sender);
  const unsubUrl = `${env.mail.publicUrl}/api/unsubscribe/${signUnsubscribe(campaign.owner, recipient.email)}`;
  const footer = `\n\n--\nDon't want emails from ${sender.name || sender.email}? Unsubscribe: ${unsubUrl}`;
  return buildMime({
    from: sender,
    to: { email: recipient.email, name: recipient.business },
    subject,
    text: text + footer,
    html: textToHtml(text + footer),
    headers: {
      'List-Unsubscribe': `<${unsubUrl}>, <mailto:${sender.email}?subject=unsubscribe>`,
      'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
    },
  });
}

async function setRecipient(campaignId, rid, from, to, extra = {}) {
  const res = await Campaign.updateOne(
    { _id: campaignId, recipients: { $elemMatch: { _id: rid, status: from } } },
    { $set: { 'recipients.$.status': to, ...Object.fromEntries(Object.entries(extra).map(([k, v]) => [`recipients.$.${k}`, v])) } },
  );
  return res.modifiedCount === 1;
}

async function runCampaign(id, { send, intervalMs = env.mail.sendIntervalMs } = {}) {
  const campaign = await Campaign.findOneAndUpdate(
    { _id: id, status: { $in: CAMPAIGN_ACTIVE } },
    { $set: { status: 'sending', lastError: null }, $min: { startedAt: new Date() } },
    { returnDocument: 'after' },
  );
  if (!campaign) return;
  const pause = (status, lastError) => Campaign.updateOne({ _id: id }, { $set: { status, lastError } });

  let sendFn = send;
  let quota = Infinity;
  if (!sendFn && campaign.mode === 'gmail') {
    const owner = await User.findById(campaign.owner).select('+gmail.refreshToken');
    if (!owner?.gmail?.refreshToken || owner.gmail.email !== campaign.from.email) {
      return pause('paused', 'Gmail is not connected for the sending address. Connect Gmail and resume.');
    }
    sendFn = gmailSender(owner.gmail.refreshToken);
    quota = env.mail.dailyLimit - (await gmailSentLast24h(campaign.owner));
  }
  if (!sendFn) sendFn = async () => ({ messageId: null });

  const suppressed = new Set(
    (await Suppression.find({ owner: campaign.owner, email: { $in: campaign.recipients.map((r) => r.email) } }).distinct('email')),
  );

  for (const r of campaign.recipients.filter((x) => x.status === 'pending')) {
    const { status } = (await Campaign.findById(id).select('status').lean()) || {};
    if (status !== 'sending') return;
    if (suppressed.has(r.email)) {
      if (await setRecipient(id, r._id, 'pending', 'skipped', { error: 'Unsubscribed' })) {
        await Campaign.updateOne({ _id: id }, { $inc: { 'counts.pending': -1, 'counts.skipped': 1 } });
      }
      continue;
    }
    if (quota <= 0) return pause('paused', `Daily Gmail limit of ${env.mail.dailyLimit} emails reached. Resume after 24 hours.`);
    if (!(await setRecipient(id, r._id, 'pending', 'sending'))) continue;
    try {
      const { messageId } = await sendFn(composeMessage(campaign, r));
      const done = campaign.mode === 'gmail' ? 'sent' : 'simulated';
      await setRecipient(id, r._id, 'sending', done, { messageId, sentAt: new Date(), error: null });
      await Campaign.updateOne({ _id: id }, { $inc: { 'counts.pending': -1, 'counts.sent': 1 } });
      if (campaign.mode === 'gmail') {
        quota -= 1;
        await LeadGroup.updateOne(
          { _id: campaign.group, 'members.email': r.email },
          {
            $set: { 'members.$.lastEmailedAt': new Date(), 'members.$.lastTemplateName': campaign.templateName, 'members.$.lastCampaign': campaign._id },
            $inc: { 'members.$.emailsSent': 1 },
          },
        );
      }
    } catch (err) {
      await setRecipient(id, r._id, 'sending', 'failed', { error: String(err.message).slice(0, 300) });
      await Campaign.updateOne({ _id: id }, { $inc: { 'counts.pending': -1, 'counts.failed': 1 } });
      if (err instanceof GmailAuthError) {
        await User.updateOne({ _id: campaign.owner }, { $set: { 'gmail.lastError': err.message } });
        return pause('paused', `Gmail rejected the request (${err.message}). Reconnect Gmail and resume.`);
      }
    }
    if (intervalMs) await sleep(intervalMs);
  }
  await Campaign.updateOne({ _id: id, status: 'sending' }, { $set: { status: 'completed', finishedAt: new Date() } });
}

export function startCampaign(id, opts) {
  const key = String(id);
  if (running.has(key)) return running.get(key);
  const p = runCampaign(key, opts)
    .catch(async (err) => {
      console.error(`[campaign] ${key} crashed`, err);
      await Campaign.updateOne({ _id: key }, { $set: { status: 'failed', lastError: err.message } });
    })
    .finally(() => running.delete(key));
  running.set(key, p);
  return p;
}

export async function recoverCampaigns() {
  const stuck = await Campaign.find({ 'recipients.status': 'sending' }).select('_id recipients');
  for (const c of stuck) {
    const n = c.recipients.filter((r) => r.status === 'sending').length;
    await Campaign.updateOne(
      { _id: c._id },
      {
        $set: { 'recipients.$[r].status': 'failed', 'recipients.$[r].error': 'Interrupted by a server restart; not retried to avoid a duplicate email' },
        $inc: { 'counts.pending': -n, 'counts.failed': n },
      },
      { arrayFilters: [{ 'r.status': 'sending' }] },
    );
  }
  const active = await Campaign.find({ status: { $in: CAMPAIGN_ACTIVE } }).sort({ createdAt: 1 }).select('_id');
  active.forEach((c) => startCampaign(c._id));
}
