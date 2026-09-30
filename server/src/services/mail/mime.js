import crypto from 'node:crypto';

const EMAIL_RX = /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/i;

export function isEmail(v) {
  return typeof v === 'string' && v.length <= 254 && EMAIL_RX.test(v.trim());
}

const clean = (v) => String(v ?? '').replace(/[\r\n]+/g, ' ').trim();

export function encodeWord(v) {
  const s = clean(v);
  return /^[\x20-\x7e]*$/.test(s) ? s : `=?UTF-8?B?${Buffer.from(s, 'utf8').toString('base64')}?=`;
}

export function formatAddress(email, name) {
  if (!isEmail(email)) throw new Error(`Invalid email address: ${clean(email)}`);
  const n = clean(name).replace(/["\\]/g, '');
  return n ? `${/^[\x20-\x7e]*$/.test(n) ? `"${n}"` : encodeWord(n)} <${email.trim()}>` : email.trim();
}

const b64Lines = (s) => Buffer.from(s, 'utf8').toString('base64').replace(/.{1,76}/g, '$&\r\n');

export function buildMime({ from, to, subject, text, html, headers = {} }) {
  const boundary = `=_lg_${crypto.randomBytes(12).toString('hex')}`;
  const head = [
    `From: ${formatAddress(from.email, from.name)}`,
    `To: ${formatAddress(to.email, to.name)}`,
    `Subject: ${encodeWord(subject)}`,
    `Date: ${new Date().toUTCString()}`,
    'MIME-Version: 1.0',
    ...Object.entries(headers).map(([k, v]) => `${clean(k).replace(/[^A-Za-z0-9-]/g, '')}: ${clean(v)}`),
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
  ];
  const part = (type, body) =>
    [`--${boundary}`, `Content-Type: ${type}; charset="UTF-8"`, 'Content-Transfer-Encoding: base64', '', b64Lines(body)].join('\r\n');
  return [...head, '', part('text/plain', text), part('text/html', html), `--${boundary}--`, ''].join('\r\n');
}

export function toBase64Url(mime) {
  return Buffer.from(mime, 'utf8').toString('base64url');
}
