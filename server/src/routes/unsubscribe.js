import { Router } from 'express';
import { Suppression } from '../models/Suppression.js';
import { verifyUnsubscribe } from '../services/unsubscribe.js';

const router = Router();

const page = (msg) =>
  `<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><title>Unsubscribe</title><body style="font-family:Arial,sans-serif;max-width:480px;margin:60px auto;padding:0 16px;color:#1e293b">${msg}</body>`;

async function handle(req, res, confirm) {
  let data;
  try {
    data = verifyUnsubscribe(req.params.token);
  } catch {
    return res.status(400).send(page('<h2>Invalid unsubscribe link</h2>'));
  }
  if (!confirm) {
    return res.send(
      page(`<h2>Unsubscribe ${data.email.replace(/[<>&"]/g, '')}?</h2><form method="post"><button style="padding:10px 18px;font-size:15px">Unsubscribe</button></form>`),
    );
  }
  await Suppression.updateOne({ owner: data.owner, email: data.email }, { $setOnInsert: { reason: 'unsubscribed' } }, { upsert: true });
  res.send(page('<h2>You are unsubscribed</h2><p>You will not receive more emails from this sender through LeadGen AI.</p>'));
}

router.get('/:token', (req, res) => handle(req, res, false));
router.post('/:token', (req, res) => handle(req, res, true));

export default router;
