import crypto from 'node:crypto';
import { env } from '../config/env.js';

function key() {
  return crypto.createHash('sha256').update(env.mail.tokenKey || env.jwtSecret).digest();
}

export function encrypt(plain) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key(), iv);
  const data = Buffer.concat([cipher.update(String(plain), 'utf8'), cipher.final()]);
  return ['v1', iv.toString('base64url'), cipher.getAuthTag().toString('base64url'), data.toString('base64url')].join('.');
}

export function decrypt(token) {
  const [v, iv, tag, data] = String(token || '').split('.');
  if (v !== 'v1' || !iv || !tag || !data) throw new Error('Unsupported encrypted value');
  const decipher = crypto.createDecipheriv('aes-256-gcm', key(), Buffer.from(iv, 'base64url'));
  decipher.setAuthTag(Buffer.from(tag, 'base64url'));
  return Buffer.concat([decipher.update(Buffer.from(data, 'base64url')), decipher.final()]).toString('utf8');
}
