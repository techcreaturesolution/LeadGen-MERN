import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { requireAuth } from '../middleware/auth.js';
import { User } from '../models/User.js';
import { gmailSentLast24h } from '../services/campaignQueue.js';
import { exchangeGmailCode, gmailAuthUrl, gmailConfigured, revokeGmail } from '../services/mail/gmail.js';
import { encrypt } from '../utils/crypto.js';
import { HttpError } from '../utils/httpError.js';

const router = Router();

export async function gmailStatus(user) {
  return {
    configured: gmailConfigured(),
    connected: Boolean(user.gmail?.email),
    email: user.gmail?.email || null,
    connectedAt: user.gmail?.connectedAt || null,
    lastError: user.gmail?.lastError || null,
    forceDryRun: env.mail.dryRun,
    dailyLimit: env.mail.dailyLimit,
    sentLast24h: user.gmail?.email ? await gmailSentLast24h(user._id) : 0,
    sendIntervalSeconds: env.mail.sendIntervalMs / 1000,
  };
}

router.get('/status', requireAuth, async (req, res) => {
  res.json(await gmailStatus(req.user));
});

router.post('/connect', requireAuth, (req, res) => {
  if (!gmailConfigured()) throw new HttpError(503, 'Gmail sending is not configured on the server (GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET)');
  const state = jwt.sign({ sub: String(req.user._id), p: 'gmail' }, env.jwtSecret, { expiresIn: '10m' });
  res.json({ url: gmailAuthUrl({ state, loginHint: req.user.email }) });
});

router.get('/callback', async (req, res) => {
  const back = (q) => res.redirect(`${env.clientOrigins[0]}/campaigns?${new URLSearchParams(q)}`);
  if (req.query.error) return back({ gmail: 'error', reason: String(req.query.error).slice(0, 100) });
  let userId;
  try {
    const p = jwt.verify(String(req.query.state || ''), env.jwtSecret);
    if (p.p !== 'gmail') throw new Error('bad state');
    userId = p.sub;
  } catch {
    return back({ gmail: 'error', reason: 'Connection link expired, try again' });
  }
  const user = await User.findById(userId);
  if (!user?.active) return back({ gmail: 'error', reason: 'Account not found' });
  try {
    const g = await exchangeGmailCode(String(req.query.code || ''));
    if (g.email !== user.email) {
      return back({ gmail: 'error', reason: `Connect the same Gmail you log in with (${user.email}), not ${g.email}` });
    }
    user.gmail = { email: g.email, refreshToken: encrypt(g.refreshToken), scope: g.scope, connectedAt: new Date(), lastError: null };
    await user.save();
    back({ gmail: 'connected' });
  } catch (err) {
    back({ gmail: 'error', reason: String(err.message).slice(0, 200) });
  }
});

router.post('/disconnect', requireAuth, async (req, res) => {
  const user = await User.findById(req.user._id).select('+gmail.refreshToken');
  if (user.gmail?.refreshToken) await revokeGmail(user.gmail.refreshToken).catch(() => {});
  user.gmail = undefined;
  await user.save();
  res.json({ ok: true });
});

export default router;
