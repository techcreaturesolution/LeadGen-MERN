import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export function signUnsubscribe(owner, email) {
  return jwt.sign({ o: String(owner), e: email, p: 'unsub' }, env.jwtSecret);
}

export function verifyUnsubscribe(token) {
  const p = jwt.verify(token, env.jwtSecret);
  if (p.p !== 'unsub' || !p.o || !p.e) throw new Error('Invalid link');
  return { owner: p.o, email: p.e };
}
