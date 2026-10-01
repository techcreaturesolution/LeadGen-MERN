import { OAuth2Client } from 'google-auth-library';
import { env } from '../../config/env.js';
import { decrypt } from '../../utils/crypto.js';
import { toBase64Url } from './mime.js';

export const GMAIL_SEND_SCOPE = 'https://www.googleapis.com/auth/gmail.send';
const SEND_URL = 'https://gmail.googleapis.com/gmail/v1/users/me/messages/send';

export function gmailConfigured() {
  return Boolean(env.googleClientId && env.googleClientSecret);
}

function client() {
  return new OAuth2Client({ clientId: env.googleClientId, clientSecret: env.googleClientSecret, redirectUri: env.mail.redirectUri });
}

export function gmailAuthUrl({ state, loginHint }) {
  return client().generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    include_granted_scopes: true,
    scope: ['openid', 'email', 'profile', GMAIL_SEND_SCOPE],
    state,
    login_hint: loginHint,
  });
}

export async function exchangeGmailCode(code) {
  const c = client();
  const { tokens } = await c.getToken(code);
  if (!tokens.refresh_token) throw new Error('Google did not return a refresh token. Remove the app from your Google account permissions and connect again.');
  if (!String(tokens.scope || '').split(' ').includes(GMAIL_SEND_SCOPE)) throw new Error('Gmail send permission was not granted');
  const ticket = await c.verifyIdToken({ idToken: tokens.id_token, audience: env.googleClientId });
  const p = ticket.getPayload();
  if (!p?.email || !p.email_verified) throw new Error('Google account email is not verified');
  return { email: p.email.toLowerCase(), name: p.name, refreshToken: tokens.refresh_token, scope: tokens.scope };
}

export async function revokeGmail(encryptedRefreshToken) {
  await client().revokeToken(decrypt(encryptedRefreshToken));
}

export class GmailAuthError extends Error {}

export function gmailSender(encryptedRefreshToken) {
  const c = client();
  c.setCredentials({ refresh_token: decrypt(encryptedRefreshToken) });
  return async (mime) => {
    try {
      const res = await c.request({ url: SEND_URL, method: 'POST', data: { raw: toBase64Url(mime) } });
      return { messageId: res.data?.id };
    } catch (err) {
      const status = err.response?.status || err.status;
      const reason = err.response?.data?.error?.message || err.response?.data?.error_description || err.message;
      if (status === 401 || /invalid_grant|insufficient.*scope|unauthorized/i.test(String(reason))) throw new GmailAuthError(reason, { cause: err });
      throw new Error(reason, { cause: err });
    }
  };
}
