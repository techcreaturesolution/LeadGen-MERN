import assert from 'node:assert/strict';
import { test } from 'node:test';
import { ruleBasedPlan } from '../src/services/agent/leadAgent.js';
import { csvCell, buildLeadsCsv } from '../src/services/csv.js';
import { mergeWithCached, pickPrimaryEmail, searchCacheKey, toReusedLead } from '../src/services/leadCache.js';
import { bestFirst } from '../src/services/pipeline.js';

const key = (q) => searchCacheKey(ruleBasedPlan(q));

test('same kind of search gets the same shared-results key', () => {
  assert.equal(key('HR email of IT Companies in Ahmedabad'), key('sales emails of IT company in ahmedabad'));
  assert.equal(key('Engineering college details in Gandhinagar & Ahmedabad'), key('engineering colleges in Ahmedabad and Gandhinagar'));
  assert.notEqual(key('IT companies in Ahmedabad'), key('IT companies in Surat'));
  assert.notEqual(key('IT companies in Ahmedabad'), key('Engineering colleges in Ahmedabad'));
});

test('reused leads pick the role email for the new search and keep original discovery time', () => {
  const lead = {
    _id: 'l1',
    owner: 'u1',
    job: 'j1',
    rank: 3,
    name: 'Acme',
    primaryEmail: 'info@acme.in',
    primaryEmailCategory: 'generic',
    emails: [
      { email: 'info@acme.in', category: 'generic' },
      { email: 'hr@acme.in', category: 'hr' },
    ],
    discoveredAt: new Date('2026-09-25'),
    dedupeKey: 'd:acme.in',
  };
  assert.deepEqual(pickPrimaryEmail(lead, 'hr'), { primaryEmail: 'hr@acme.in', primaryEmailCategory: 'hr' });
  assert.deepEqual(pickPrimaryEmail(lead, 'sales'), { primaryEmail: 'info@acme.in', primaryEmailCategory: 'generic' });
  const r = toReusedLead(lead, { targetRole: 'hr' });
  assert.equal(r.owner, undefined);
  assert.equal(r._id, undefined);
  assert.equal(r.rank, undefined);
  assert.equal(r.reusedFrom, 'j1');
  assert.equal(r.primaryEmail, 'hr@acme.in');
  assert.equal(r.discoveredAt.toISOString(), lead.discoveredAt.toISOString());
});

test('fresh leads win over cached copies and results rank verified role emails first', () => {
  const fresh = [{ dedupeKey: 'a', name: 'fresh A', verification: 'verified' }];
  const cached = [
    { dedupeKey: 'a', name: 'old A', verification: 'verified', reusedFrom: 'j' },
    { dedupeKey: 'b', name: 'B', verification: 'verified', primaryEmail: 'hr@b.in', primaryEmailCategory: 'hr', reusedFrom: 'j' },
    { dedupeKey: 'c', name: 'C', verification: 'likely', primaryEmail: 'hr@c.in', primaryEmailCategory: 'hr', reusedFrom: 'j' },
  ];
  const merged = mergeWithCached(fresh, cached);
  assert.deepEqual(merged.map((l) => l.name), ['fresh A', 'B', 'C']);
  assert.deepEqual([...merged].sort(bestFirst({ targetRole: 'hr' })).map((l) => l.name), ['B', 'fresh A', 'C']);
});

test('CSV cells are quoted and spreadsheet formulas neutralised', () => {
  assert.equal(csvCell('Acme, Pvt "Ltd"'), '"Acme, Pvt ""Ltd"""');
  assert.equal(csvCell('=HYPERLINK("x")'), '"\'=HYPERLINK(""x"")"');
  assert.equal(csvCell('@SUM(A1)'), "'@SUM(A1)");
  assert.equal(csvCell('+91 79 1234 5678'), '+91 79 1234 5678');
  assert.equal(csvCell('-cmd|calc'), "'-cmd|calc");
  assert.equal(csvCell(null), '');
});

test('CSV report has the Excel columns, a BOM and no duplicate rows', () => {
  const lead = { name: 'Acme', primaryEmail: 'hr@acme.in', primaryEmailCategory: 'hr', domain: 'acme.in', dedupeKey: 'd:acme.in', sources: ['google_maps'], emails: [{ email: 'hr@acme.in' }, { email: 'info@acme.in' }] };
  const csv = buildLeadsCsv([lead, { ...lead }]);
  assert.ok(csv.startsWith('\uFEFF#,Company / Business,Primary Email'));
  const lines = csv.trim().split('\r\n');
  assert.equal(lines.length, 2);
  assert.match(lines[1], /^1,Acme,hr@acme\.in,HR,info@acme\.in,/);
  assert.match(lines[1], /Google Maps/);
});
