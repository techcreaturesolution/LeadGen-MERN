import assert from 'node:assert/strict';
import { test } from 'node:test';
import { searchOneLocation } from '../src/services/sources/googleMaps.js';
import { dedupeLeads } from '../src/services/agent/qualityAgent.js';

const plan = { businessType: 'IT companies', location: 'Ahmedabad' };

test('Places and SerpAPI run in parallel and overlapping places dedupe', async () => {
  let running = 0;
  let peak = 0;
  const slow = (rows) => async () => {
    running += 1;
    peak = Math.max(peak, running);
    await new Promise((r) => setTimeout(r, 30));
    running -= 1;
    return rows;
  };
  const acme = { name: 'Acme Infotech', address: 'SG Highway, Ahmedabad', website: 'https://acme.in', domain: 'acme.in', source: 'google_maps', sources: ['google_maps'] };
  const search = {
    google_places: slow([acme]),
    serpapi_google_maps: slow([{ ...acme, phone: '+91 79 1234' }, { name: 'Zeta Systems', address: 'Prahlad Nagar, Ahmedabad', source: 'google_maps', sources: ['google_maps'] }]),
  };
  const logs = [];
  const rows = await searchOneLocation(plan, 20, (l, m) => logs.push(m), { providers: ['google_places', 'serpapi_google_maps'], search });
  assert.equal(peak, 2);
  assert.equal(rows.length, 3);
  assert.ok(logs.some((m) => m.includes('via google_places + serpapi_google_maps')));
  const { leads, removed } = dedupeLeads(rows);
  assert.equal(removed, 1);
  assert.equal(leads.find((l) => l.name === 'Acme Infotech').phone, '+91 79 1234');
});

test('one Maps provider failing keeps the other results; all failing throws', async () => {
  const boom = async () => {
    throw new Error('quota');
  };
  const logs = [];
  const rows = await searchOneLocation(plan, 20, (l, m) => logs.push(m), {
    providers: ['google_places', 'serpapi_google_maps'],
    search: { google_places: boom, serpapi_google_maps: async () => [{ name: 'Zeta' }] },
  });
  assert.equal(rows.length, 1);
  assert.ok(logs.some((m) => m === 'Maps (google_places) failed: quota'));
  await assert.rejects(searchOneLocation(plan, 20, () => {}, { providers: ['google_places'], search: { google_places: boom } }), /quota/);
});
