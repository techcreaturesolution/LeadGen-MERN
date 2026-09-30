import { Router } from 'express';
import { z } from 'zod';
import { EmailTemplate } from '../models/EmailTemplate.js';
import { LeadGroup } from '../models/LeadGroup.js';
import { llmEnabled, llmJson } from '../services/agent/llm.js';
import { MERGE_FIELDS, renderEmail, TEMPLATE_PRESETS, textToHtml, unknownFields } from '../services/mail/template.js';
import { HttpError } from '../utils/httpError.js';

const router = Router();

const schema = z.object({
  name: z.string().trim().min(1).max(120),
  subject: z.string().trim().min(1).max(250),
  body: z.string().trim().min(1).max(20000),
});

function validate(body) {
  const t = schema.parse(body);
  const bad = unknownFields(t.subject, t.body);
  if (bad.length) throw new HttpError(400, `Unknown merge field(s): ${bad.map((f) => `{{${f}}}`).join(', ')}`);
  return t;
}

export const SAMPLE_RECIPIENT = { email: 'hr@example-company.com', business: 'Example Industries Pvt Ltd', city: 'Gandhinagar', website: 'https://example-company.com', category: 'Manufacturing' };

router.get('/meta', (_req, res) => {
  res.json({ fields: MERGE_FIELDS, presets: TEMPLATE_PRESETS, ai: llmEnabled() });
});

router.get('/', async (req, res) => {
  res.json({ items: await EmailTemplate.find({ owner: req.user._id }).sort({ updatedAt: -1 }).lean() });
});

router.post('/', async (req, res) => {
  res.status(201).json({ template: await EmailTemplate.create({ ...validate(req.body), owner: req.user._id }) });
});

router.put('/:id', async (req, res) => {
  const template = await EmailTemplate.findOneAndUpdate({ _id: req.params.id, owner: req.user._id }, { $set: validate(req.body) }, { returnDocument: 'after' });
  if (!template) throw new HttpError(404, 'Template not found');
  res.json({ template });
});

router.delete('/:id', async (req, res) => {
  const r = await EmailTemplate.deleteOne({ _id: req.params.id, owner: req.user._id });
  if (!r.deletedCount) throw new HttpError(404, 'Template not found');
  res.json({ ok: true });
});

router.post('/preview', async (req, res) => {
  const { subject, body, groupId } = z.object({ subject: z.string().default(''), body: z.string().default(''), groupId: z.string().optional() }).parse(req.body);
  let recipient = SAMPLE_RECIPIENT;
  if (groupId) {
    const g = await LeadGroup.findOne({ _id: groupId, owner: req.user._id }, { members: { $slice: 1 } }).lean();
    if (g?.members?.[0]) recipient = g.members[0];
  }
  const sender = { email: req.user.gmail?.email || req.user.email, name: req.user.name };
  const out = renderEmail({ subject, body }, recipient, sender);
  res.json({ ...out, html: textToHtml(out.text), recipient, from: sender, unknown: unknownFields(subject, body) });
});

router.post('/draft', async (req, res) => {
  const { offer, audience, tone } = z
    .object({ offer: z.string().trim().min(3).max(300), audience: z.string().trim().max(200).optional(), tone: z.string().trim().max(50).optional() })
    .parse(req.body);
  if (!llmEnabled()) throw new HttpError(503, 'AI drafting needs OPENAI_API_KEY on the server. Start from a ready-made template instead.');
  const out = await llmJson(
    'You write short, polite B2B cold emails (under 140 words) from a small Indian IT/services company to a business. ' +
      'Only use these merge fields where useful: {{business}}, {{city}}, {{website}}, {{category}}, {{my_name}}, {{my_email}}. ' +
      'Fallbacks look like {{business|there}}. No fake claims or statistics. End with {{my_name}} and {{my_email}}. ' +
      'Return JSON {"name": short template name, "subject": subject line, "body": plain text body}.',
    JSON.stringify({ offer, audience: audience || 'businesses from my lead list', tone: tone || 'friendly, professional' }),
  );
  if (!out?.subject || !out?.body) throw new HttpError(502, 'AI did not return a template, try again');
  const draft = { name: String(out.name || offer).slice(0, 120), subject: String(out.subject).slice(0, 250), body: String(out.body) };
  res.json({ draft, unknown: unknownFields(draft.subject, draft.body) });
});

export default router;
