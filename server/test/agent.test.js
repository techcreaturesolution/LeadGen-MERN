import assert from 'node:assert/strict';
import { test } from 'node:test';
import { rankEmails, ruleBasedPlan, scoreLead } from '../src/services/agent/leadAgent.js';
import { categorizeEmail, decodeCfEmail, extractEmails } from '../src/services/emails.js';

test('plans "HR email of IT companies in Ahmedabad"', () => {
  const plan = ruleBasedPlan('HR email of IT Companies in Ahmedabad');
  assert.equal(plan.targetRole, 'hr');
  assert.match(plan.businessType, /IT Compan/i);
  assert.equal(plan.location, 'Ahmedabad');
  assert.ok(plan.emailPrefixes.includes('hr'));
});

test('detects sales role and location', () => {
  const plan = ruleBasedPlan('sales contacts of real estate builders in Surat');
  assert.equal(plan.targetRole, 'sales');
  assert.equal(plan.location, 'Surat');
});

test('extracts and categorizes emails', () => {
  const found = extractEmails('Write to hr@acme.in or careers@acme.in, logo@2x.png, sales@acme.in.');
  assert.deepEqual(found.sort(), ['careers@acme.in', 'hr@acme.in', 'sales@acme.in']);
  assert.equal(categorizeEmail('hr@acme.in'), 'hr');
  assert.equal(categorizeEmail('sales@acme.in'), 'sales');
  assert.equal(categorizeEmail('info@acme.in'), 'generic');
});

test('decodes Cloudflare obfuscated email', () => {
  const email = 'hr@acme.in';
  const key = 0x42;
  const hex = [key, ...[...email].map((c) => c.charCodeAt(0) ^ key)].map((b) => b.toString(16).padStart(2, '0')).join('');
  assert.equal(decodeCfEmail(hex), email);
});

test('ranks role emails first and scores leads', () => {
  const plan = ruleBasedPlan('HR email of IT companies in Ahmedabad');
  const ranked = rankEmails(['info@acme.in', 'hr@acme.in', 'someone@gmail.com'].map((email) => ({ email, foundOn: 'https://acme.in' })), plan, 'https://acme.in');
  assert.equal(ranked[0].email, 'hr@acme.in');
  const withHr = scoreLead({ primaryEmail: 'hr@acme.in', primaryEmailCategory: 'hr', website: 'https://acme.in', phone: '1' }, plan);
  const none = scoreLead({ website: 'https://acme.in' }, plan);
  assert.ok(withHr > none);
});

test('drops emails glued to neighbouring text', () => {
  const found = extractEmails('Ahmedabad 380013sales@acme.in sales@acme.in sales@acme.inreact');
  assert.deepEqual(found, ['sales@acme.in']);
});
