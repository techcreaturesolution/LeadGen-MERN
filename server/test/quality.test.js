import assert from 'node:assert/strict';
import { test } from 'node:test';
import { ruleBasedPlan } from '../src/services/agent/leadAgent.js';
import { assessRelevance, cleanEmails, dedupeKey, dedupeLeads, planTerms } from '../src/services/agent/qualityAgent.js';
import { isAdLocked, publicAdGate } from '../src/models/SearchJob.js';
import { buildLeadsWorkbook } from '../src/services/excel.js';
import ExcelJS from 'exceljs';

const rec = (o) => ({ sources: ['google_maps'], rawEmails: [], ...o });

test('plans multi-location query "Engineering college details in Gandhinagar & Ahmedabad"', () => {
  const plan = ruleBasedPlan('Engineering college details in Gandhinagar & Ahmedabad');
  assert.deepEqual(plan.locations, ['Gandhinagar', 'Ahmedabad']);
  assert.equal(plan.location, 'Gandhinagar & Ahmedabad');
  assert.match(plan.businessType, /^engineering college$/i);
  assert.deepEqual(plan.searchQueries, ['Engineering college in Gandhinagar', 'Engineering college in Ahmedabad']);
  assert.deepEqual(ruleBasedPlan('IT companies in Surat, Vadodara and Rajkot').locations, ['Surat', 'Vadodara', 'Rajkot']);
});

test('merges duplicates by domain, name+area and nearby names, keeps same name in other cities', () => {
  const { leads, removed } = dedupeLeads([
    rec({ name: 'L.D. College of Engineering', city: 'Ahmedabad', lat: 23.0355, lng: 72.5463 }),
    rec({ name: 'LD College of Engineering', city: 'Ahmedabad', phone: '+91 79 2630 6752', sources: ['linkedin'] }),
    rec({ name: 'Nirma University', domain: 'nirmauni.ac.in', website: 'https://nirmauni.ac.in' }),
    rec({ name: 'Nirma Univ. - Institute of Technology', domain: 'nirmauni.ac.in', website: 'https://nirmauni.ac.in/itnu' }),
    rec({ name: 'Government Engineering College', city: 'Gandhinagar', lat: 23.2156, lng: 72.6369 }),
    rec({ name: 'Government Engineering College', city: 'Ahmedabad', lat: 23.02, lng: 72.57 }),
    rec({ name: 'Adani Institute of Infrastructure Engineering', lat: 23.001, lng: 72.5 }),
    rec({ name: 'Adani Institute of Infrastructure Engineering Campus', lat: 23.0012, lng: 72.5001 }),
  ]);
  assert.equal(removed, 3);
  assert.equal(leads.length, 5);
  const ld = leads.find((l) => /l\.?d\.? college/i.test(l.name));
  assert.deepEqual(ld.sources.sort(), ['google_maps', 'linkedin']);
  assert.ok(ld.phone && ld.lat);
  assert.equal(leads.filter((l) => l.name === 'Government Engineering College').length, 2);
});

test('relevance agent verifies engineering colleges and rejects schools, hostels and other cities', () => {
  const plan = ruleBasedPlan('Engineering college details in Gandhinagar & Ahmedabad');
  assert.deepEqual(planTerms(plan).map((t) => t.word), ['engineering', 'college']);
  const v = (l) => assessRelevance(rec(l), plan);
  assert.equal(v({ name: 'Gujarat Technological University', category: 'university', address: 'Chandkheda, Ahmedabad' }).verification, 'verified');
  assert.equal(v({ name: 'Silver Oak University', category: 'university', city: 'Ahmedabad', siteTitle: 'Silver Oak College of Engineering & Technology' }).verification, 'verified');
  assert.equal(v({ name: "St. Xavier's College", category: 'college', city: 'Ahmedabad' }).verification, 'likely');
  assert.equal(v({ name: 'Delhi Public School', category: 'school', city: 'Gandhinagar' }).verification, 'rejected');
  assert.equal(v({ name: 'LDCE Boys Hostel', category: 'college', city: 'Ahmedabad' }).verification, 'rejected');
  const far = v({ name: 'SVNIT Engineering College', category: 'college', address: 'Ichchhanath, Surat, Gujarat' });
  assert.equal(far.verification, 'rejected');
  assert.equal(v({ name: 'GEC Gandhinagar', category: 'college', address: 'Sector 28, Gandhinagar' }).matchedLocation, 'Gandhinagar');
  const inArea = v({ name: 'Karnavati University', category: 'university', address: 'Uvarsad', areaMatched: 'Gandhinagar' });
  assert.equal(inArea.matchedLocation, 'Gandhinagar');
  assert.notEqual(inArea.verification, 'rejected');
  assert.equal(v({ name: 'Indian Institute of Management', category: 'college', city: 'Ahmedabad', siteDescription: 'technology and management' }).verification, 'likely');
});

test('IT company relevance uses category and website title', () => {
  const plan = ruleBasedPlan('HR email of IT companies in Ahmedabad');
  assert.equal(assessRelevance(rec({ name: 'Bacancy', category: 'it', city: 'Ahmedabad' }), plan).verification, 'verified');
  assert.equal(assessRelevance(rec({ name: 'Radix', category: 'company', city: 'Ahmedabad', siteTitle: 'Radixweb - Software Development Company' }), plan).verification, 'verified');
  assert.equal(assessRelevance(rec({ name: 'Shree Ganesh Sweets', category: 'shop', city: 'Ahmedabad' }), plan).verification, 'rejected');
});

test('removes emails shared by unrelated businesses but keeps the owner copy', async () => {
  const leads = [
    rec({ name: 'A', domain: 'acme.in', rawEmails: [{ email: 'hr@acme.in' }, { email: 'info@webagency.io' }] }),
    rec({ name: 'B', domain: 'beta.in', rawEmails: [{ email: 'hr@acme.in' }, { email: 'info@webagency.io' }, { email: 'jobs@beta.in' }] }),
  ];
  const { env } = await import('../src/config/env.js');
  const prev = env.emailMxCheck;
  env.emailMxCheck = false;
  const removed = await cleanEmails(leads);
  env.emailMxCheck = prev;
  assert.equal(removed, 3);
  assert.deepEqual(leads[0].rawEmails.map((e) => e.email), ['hr@acme.in']);
  assert.deepEqual(leads[1].rawEmails.map((e) => e.email), ['jobs@beta.in']);
});

test('ad gate locks until completed and is off for jobs without it', () => {
  assert.equal(isAdLocked({ adGate: { required: true, seconds: 60 } }), true);
  assert.equal(isAdLocked({ adGate: { required: true, seconds: 60, completedAt: new Date() } }), false);
  assert.equal(isAdLocked({}), false);
  assert.deepEqual(publicAdGate({ adGate: { required: true, seconds: 60, watchedMs: 12500 } }), { required: true, seconds: 60, watchedSeconds: 12, completed: false });
});

test('Excel report has unique rows and verification columns', async () => {
  const lead = { name: 'GEC Gandhinagar', domain: 'gecg28.ac.in', city: 'Gandhinagar', verification: 'verified', matchReason: 'Matches engineering + college', primaryEmail: 'info@gecg28.ac.in', emails: [{ email: 'info@gecg28.ac.in', mxValid: true }], sources: ['google_maps'] };
  lead.dedupeKey = dedupeKey(lead);
  const buf = await buildLeadsWorkbook({ title: 't', leads: [lead, { ...lead }, { ...lead, dedupeKey: undefined, name: 'Other', domain: 'other.in' }], count: 'all' });
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buf);
  const sheet = wb.getWorksheet('Leads');
  assert.equal(sheet.rowCount, 3);
  const headers = sheet.getRow(1).values.filter(Boolean);
  const col = (h) => headers.indexOf(h) + 1;
  assert.equal(sheet.getRow(2).getCell(col('Match')).value, 'Verified');
  assert.equal(sheet.getRow(2).getCell(col('Email Domain Check')).value, 'Mail server OK');
});
