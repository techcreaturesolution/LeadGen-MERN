import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { env } from '../config/env.js';
import { Campaign, CAMPAIGN_ACTIVE } from '../models/Campaign.js';
import { EmailTemplate } from '../models/EmailTemplate.js';
import { LeadGroup } from '../models/LeadGroup.js';
import { Suppression } from '../models/Suppression.js';
import { User } from '../models/User.js';
import { composeMessage, gmailSentLast24h, startCampaign } from '../services/campaignQueue.js';
import { GmailAuthError, gmailConfigured, gmailSender } from '../services/mail/gmail.js';
import { unknownFields } from '../services/mail/template.js';
import { HttpError } from '../utils/httpError.js';
import { SAMPLE_RECIPIENT } from './templates.js';

const router = Router();
const createLimiter = rateLimit({ windowMs: 60_000, limit: 10, standardHeaders: 'draft-7', legacyHeaders: false });

async function ownCampaign(req, projection) {
  const c = await Campaign.findOne({ _id: req.params.id, owner: req.user._id }).select(projection);
  if (!c) throw new HttpError(404, 'Campaign not found');
  return c;
}

function gmailReady(user) {
  if (env.mail.dryRun) throw new HttpError(400, 'Real sending is switched off on this server (EMAIL_DRY_RUN=true). Use a test run.');
  if (!gmailConfigured()) throw new HttpError(400, 'Gmail sending is not configured on the server yet. Use a test run.');
  if (!user.gmail?.email) throw new HttpError(400, 'Connect your Gmail account first');
}

export async function buildRecipients({ owner, group, templateId, skipAlreadyEmailed }) {
  const emails = group.members.map((m) => m.email);
  const [suppressed, prior] = await Promise.all([
    Suppression.find({ owner, email: { $in: emails } }).distinct('email'),
    skipAlreadyEmailed
      ? Campaign.aggregate([
          { $match: { owner, template: templateId, mode: 'gmail' } },
          { $unwind: '$recipients' },
          { $match: { 'recipients.status': 'sent' } },
          { $group: { _id: '$recipients.email' } },
        ]).then((rows) => rows.map((r) => r._id))
      : [],
  ]);
  const skip = new Map([...prior.map((e) => [e, 'Already emailed with this template']), ...suppressed.map((e) => [e, 'Unsubscribed'])]);
  const seen = new Set();
  const recipients = [];
  for (const m of group.members) {
    if (seen.has(m.email)) continue;
    seen.add(m.email);
    const { lead, email, business, city, website, phone, category } = m;
    const reason = skip.get(email);
    recipients.push({ lead, email, business, city, website, phone, category, status: reason ? 'skipped' : 'pending', error: reason });
  }
  return recipients;
}

const createSchema = z.object({
  name: z.string().trim().max(160).optional(),
  groupId: z.string(),
  templateId: z.string(),
  mode: z.enum(['gmail', 'dry_run']).default('dry_run'),
  skipAlreadyEmailed: z.boolean().default(true),
});

router.get('/', async (req, res) => {
  const filter = { owner: req.user._id, ...(req.query.groupId ? { group: String(req.query.groupId) } : {}) };
  res.json({ items: await Campaign.find(filter).select('-recipients -body').sort({ createdAt: -1 }).limit(100).lean() });
});

router.post('/', createLimiter, async (req, res) => {
  const body = createSchema.parse(req.body);
  const [group, template] = await Promise.all([
    LeadGroup.findOne({ _id: body.groupId, owner: req.user._id }),
    EmailTemplate.findOne({ _id: body.templateId, owner: req.user._id }),
  ]);
  if (!group) throw new HttpError(404, 'Group not found');
  if (!template) throw new HttpError(404, 'Template not found');
  if (unknownFields(template.subject, template.body).length) throw new HttpError(400, 'Template has unknown merge fields');
  if (body.mode === 'gmail') gmailReady(req.user);
  if (await Campaign.exists({ owner: req.user._id, group: group._id, status: { $in: CAMPAIGN_ACTIVE } })) {
    throw new HttpError(409, 'A campaign is already sending to this group. Wait for it to finish, or pause/cancel it.');
  }
  const recipients = await buildRecipients({ owner: req.user._id, group, templateId: template._id, skipAlreadyEmailed: body.skipAlreadyEmailed });
  const pending = recipients.filter((r) => r.status === 'pending').length;
  if (!pending) throw new HttpError(400, 'No one left to email in this group (all are unsubscribed or were already emailed with this template)');
  if (recipients.length > env.mail.maxRecipients) throw new HttpError(400, `A campaign can have at most ${env.mail.maxRecipients} recipients`);
  const campaign = await Campaign.create({
    owner: req.user._id,
    name: body.name || `${template.name} → ${group.name}`,
    group: group._id,
    groupName: group.name,
    template: template._id,
    templateName: template.name,
    subject: template.subject,
    body: template.body,
    mode: body.mode,
    from: { email: body.mode === 'gmail' ? req.user.gmail.email : req.user.email, name: req.user.name },
    recipients,
    counts: { total: recipients.length, pending, skipped: recipients.length - pending },
  });
  startCampaign(campaign._id);
  res.status(201).json({ campaign: { ...campaign.toObject(), recipients: undefined } });
});

router.post('/test', createLimiter, async (req, res) => {
  const { templateId, groupId } = z.object({ templateId: z.string(), groupId: z.string().optional() }).parse(req.body);
  gmailReady(req.user);
  const template = await EmailTemplate.findOne({ _id: templateId, owner: req.user._id });
  if (!template) throw new HttpError(404, 'Template not found');
  const group = groupId ? await LeadGroup.findOne({ _id: groupId, owner: req.user._id }, { members: { $slice: 1 } }).lean() : null;
  const sample = group?.members?.[0] || SAMPLE_RECIPIENT;
  const user = await User.findById(req.user._id).select('+gmail.refreshToken');
  const from = { email: user.gmail.email, name: user.name };
  const mime = composeMessage(
    { owner: user._id, from, subject: `[Test] ${template.subject}`, body: template.body },
    { ...sample, email: user.gmail.email },
  );
  try {
    const { messageId } = await gmailSender(user.gmail.refreshToken)(mime);
    res.json({ ok: true, to: user.gmail.email, messageId, sentLast24h: await gmailSentLast24h(user._id) });
  } catch (err) {
    throw new HttpError(err instanceof GmailAuthError ? 401 : 502, `Gmail: ${err.message}`);
  }
});

router.get('/:id', async (req, res) => {
  res.json({ campaign: await ownCampaign(req) });
});

router.post('/:id/:action', async (req, res) => {
  const action = z.enum(['pause', 'resume', 'cancel']).parse(req.params.action);
  const c = await ownCampaign(req, '-recipients');
  const allowed = { pause: CAMPAIGN_ACTIVE, resume: ['paused'], cancel: [...CAMPAIGN_ACTIVE, 'paused'] }[action];
  if (!allowed.includes(c.status)) throw new HttpError(409, `Cannot ${action} a ${c.status} campaign`);
  if (action === 'resume' && c.mode === 'gmail') gmailReady(req.user);
  c.status = { pause: 'paused', resume: 'queued', cancel: 'cancelled' }[action];
  if (action === 'cancel') c.finishedAt = new Date();
  c.lastError = null;
  await c.save();
  if (action === 'resume') startCampaign(c._id);
  res.json({ campaign: c });
});

router.delete('/:id', async (req, res) => {
  const c = await ownCampaign(req, '-recipients');
  if (CAMPAIGN_ACTIVE.includes(c.status)) throw new HttpError(409, 'Pause or cancel the campaign before deleting it');
  await c.deleteOne();
  res.json({ ok: true });
});

export default router;
