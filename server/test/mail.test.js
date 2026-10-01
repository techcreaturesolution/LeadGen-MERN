import assert from 'node:assert/strict';
import { test } from 'node:test';
import ExcelJS from 'exceljs';
import { buildLeadsWorkbook } from '../src/services/excel.js';
import { leadToMember, mergeMembers, parseLeadsWorkbook } from '../src/services/groups.js';
import { buildMime, encodeWord, formatAddress, isEmail, toBase64Url } from '../src/services/mail/mime.js';
import { renderEmail, TEMPLATE_PRESETS, textToHtml, unknownFields } from '../src/services/mail/template.js';
import { decrypt, encrypt } from '../src/utils/crypto.js';
import { signUnsubscribe, verifyUnsubscribe } from '../src/services/unsubscribe.js';

const decodeParts = (mime) =>
  [...mime.matchAll(/Content-Transfer-Encoding: base64\r\n\r\n([\s\S]*?)\r\n--/g)].map((m) => Buffer.from(m[1].replace(/\s+/g, ''), 'base64').toString('utf8'));

test('renders merge fields with per-lead values and fallbacks', () => {
  const t = { subject: 'Website for {{business}} in {{ city }}', body: 'Hi {{business|there}},\nSee {{website|your site}}.\n{{my_name}} <{{my_email}}>' };
  const out = renderEmail(t, { business: 'Acme Pvt Ltd', city: 'Gandhinagar' }, { name: 'Ravi', email: 'ravi@gmail.com' });
  assert.equal(out.subject, 'Website for Acme Pvt Ltd in Gandhinagar');
  assert.equal(out.text, 'Hi Acme Pvt Ltd,\nSee your site.\nRavi <ravi@gmail.com>');
  assert.equal(renderEmail(t, {}, {}).text.startsWith('Hi there,'), true);
});

test('flags unknown merge fields; presets only use known ones', () => {
  assert.deepEqual(unknownFields('Hi {{business}}', 'from {{company_name}} and {{foo|x}}'), ['company_name', 'foo']);
  for (const p of TEMPLATE_PRESETS) assert.deepEqual(unknownFields(p.subject, p.body), [], p.key);
});

test('textToHtml escapes HTML and links URLs', () => {
  const html = textToHtml('<b>Hi</b>\nVisit https://example.com.');
  assert.match(html, /&lt;b&gt;Hi&lt;\/b&gt;<br>/);
  assert.match(html, /<a href="https:\/\/example.com">https:\/\/example.com<\/a>\./);
});

test('builds a Gmail-ready MIME message from the user\'s own address', () => {
  const mime = buildMime({
    from: { email: 'owner@gmail.com', name: 'Tech Creature' },
    to: { email: 'hr@acme.in', name: 'Acme' },
    subject: 'Offer for Acme ✓',
    text: 'Hello ₹ world',
    html: '<p>Hello ₹ world</p>',
    headers: { 'List-Unsubscribe': '<https://x/u>' },
  });
  assert.match(mime, /^From: "Tech Creature" <owner@gmail.com>\r\n/);
  assert.match(mime, /\r\nTo: "Acme" <hr@acme.in>\r\n/);
  assert.match(mime, /\r\nSubject: =\?UTF-8\?B\?/);
  assert.match(mime, /List-Unsubscribe: <https:\/\/x\/u>/);
  assert.deepEqual(decodeParts(mime), ['Hello ₹ world', '<p>Hello ₹ world</p>']);
  assert.doesNotMatch(toBase64Url(mime), /[+/=]/);
});

test('blocks header injection and invalid addresses', () => {
  assert.equal(encodeWord('Hi\r\nBcc: evil@x.com'), 'Hi Bcc: evil@x.com');
  assert.throws(() => formatAddress('a@b.com\r\nBcc: x@y.com'));
  assert.equal(isEmail('hr@acme.co.in'), true);
  assert.equal(isEmail('not-an-email'), false);
});

test('group merge drops duplicates (case-insensitive) and rows without email', () => {
  const existing = [{ email: 'hr@acme.in' }];
  const r = mergeMembers(existing, [{ email: 'HR@Acme.in' }, { email: 'info@beta.com' }, { email: 'info@beta.com' }, { email: '' }, { email: 'bad' }]);
  assert.deepEqual(r.added.map((m) => m.email), ['info@beta.com']);
  assert.equal(r.duplicates, 2);
  assert.equal(r.invalid, 2);
  assert.equal(leadToMember({ _id: 'x', name: 'Acme', primaryEmail: 'a@acme.in', city: 'Gandhinagar' }, 'search').business, 'Acme');
});

test('imports members from an exported LeadGen Excel report', async () => {
  const leads = [
    { rank: 1, name: 'GIDC Plastics', primaryEmail: 'sales@gidcplastics.in', city: 'Gandhinagar', website: 'https://gidcplastics.in', sources: ['google_maps'], emails: [] },
    { rank: 2, name: 'No Mail Works', city: 'Gandhinagar', sources: ['google_maps'], emails: [] },
  ];
  const buf = await buildLeadsWorkbook({ title: 'GIDC Gandhinagar', leads, count: 'all', jobs: [] });
  const { sheet, rows } = await parseLeadsWorkbook(Buffer.from(buf));
  assert.equal(sheet, 'Leads');
  assert.equal(rows[0].email, 'sales@gidcplastics.in');
  assert.equal(rows[0].business, 'GIDC Plastics');
  assert.equal(rows[0].city, 'Gandhinagar');
  assert.equal(mergeMembers([], rows).added.length, 1);
});

test('imports a plain spreadsheet with Email/Company headers', async () => {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Sheet1');
  ws.addRow(['Company Name', 'Email', 'City']);
  ws.addRow(['Zeta Infotech', 'mailto:hr@zeta.in', 'Ahmedabad']);
  const { rows } = await parseLeadsWorkbook(Buffer.from(await wb.xlsx.writeBuffer()));
  assert.deepEqual(rows[0], { email: 'hr@zeta.in', business: 'Zeta Infotech', city: 'Ahmedabad', website: '', phone: '', category: '', origin: 'excel' });
  await assert.rejects(parseLeadsWorkbook(Buffer.from('not excel')), /xlsx/);
});

test('encrypts Gmail refresh tokens and signs unsubscribe links', () => {
  const enc = encrypt('1//refresh-token');
  assert.doesNotMatch(enc, /refresh-token/);
  assert.equal(decrypt(enc), '1//refresh-token');
  assert.throws(() => decrypt(`${enc.slice(0, -2)}xx`));
  const tok = signUnsubscribe('507f1f77bcf86cd799439011', 'hr@acme.in');
  assert.deepEqual(verifyUnsubscribe(tok), { owner: '507f1f77bcf86cd799439011', email: 'hr@acme.in' });
});
