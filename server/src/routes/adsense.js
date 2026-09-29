import { Router } from 'express';
import { env } from '../config/env.js';

const router = Router();

router.get('/config', (_req, res) => {
  const { client, slots, testMode, demo } = env.adsense;
  res.json({ client: client || null, slots, testMode, demo });
});

export function adsTxt(_req, res) {
  res.type('text/plain');
  if (!env.adsense.client) return res.status(404).send('');
  res.send(`google.com, ${env.adsense.client.replace(/^ca-/, '')}, DIRECT, f08c47fec0942fa0\n`);
}

export default router;
