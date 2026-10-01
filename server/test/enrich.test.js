import assert from 'node:assert/strict';
import { test } from 'node:test';
import ExcelJS from 'exceljs';
import { ruleBasedPlan, rankEmails } from '../src/services/agent/leadAgent.js';
import { assessRelevance } from '../src/services/agent/qualityAgent.js';
import { fromApolloOrg, peopleSearchParams } from '../src/services/enrich/apollo.js';
import { fromHunter } from '../src/services/enrich/hunter.js';
import { enrichCompanies, enrichContacts, mergeContacts, sameCompany } from '../src/services/enrich/index.js';
import { buildLeadsWorkbook, formatContacts } from '../src/services/excel.js';
import { buildLeadsCsv } from '../src/services/csv.js';

const silent = () => {};
const plan = ruleBasedPlan('HR email of IT Companies in Ahmedabad');

const ORG = {
  name: 'Acme Infotech',
  website_url: 'http://www.acmeinfotech.in',
  primary_domain: 'acmeinfotech.in',
  industry: 'information technology & services',
  short_description: 'Custom software and\n mobile app development.',
  keywords: ['software development', 'mobile apps'],
  estimated_num_employees: 120,
  founded_year: 2011,
  linkedin_url: 'http://www.linkedin.com/company/acme-infotech',
  primary_phone: { sanitized_number: '+917912345678' },
  raw_address: 'SG Highway, Ahmedabad, Gujarat, India',
  city: 'Ahmedabad',
};

const HUNTER = {
  domain: 'acmeinfotech.in',
  emails: [
    { value: 'Priya@acmeinfotech.in', first_name: 'Priya', last_name: 'Shah', position: 'HR Manager', department: 'hr', seniority: 'senior', verification: { status: 'valid' } },
    { value: 'info@acmeinfotech.in', type: 'generic', department: null },
    { value: 'old@acmeinfotech.in', first_name: 'Old', position: 'Developer', verification: { status: 'invalid' } },
  ],
};

test('maps Apollo organization to lead fields', () => {
  const c = fromApolloOrg(ORG);
  assert.equal(c.companyType, 'information technology & services');
  assert.equal(c.description, 'Custom software and mobile app development.');
  assert.deepEqual(c.services, ['software development', 'mobile apps']);
  assert.equal(c.employeeCount, 120);
  assert.equal(c.foundedYear, 2011);
  assert.equal(c.phone, '+917912345678');
  assert.equal(fromApolloOrg(null), null);
});

test('builds Apollo people search params for the requested role', () => {
  const hr = peopleSearchParams('acmeinfotech.in', 'hr', 5);
  assert.deepEqual(hr.getAll('q_organization_domains_list[]'), ['acmeinfotech.in']);
  assert.ok(hr.getAll('person_titles[]').includes('talent acquisition'));
  assert.equal(hr.get('per_page'), '5');
  const generic = peopleSearchParams('acmeinfotech.in', 'generic', 3);
  assert.deepEqual(generic.getAll('person_seniorities[]'), ['owner', 'founder', 'c_suite', 'partner', 'director']);
  assert.equal(generic.getAll('person_titles[]').length, 0);
});

test('maps Hunter domain search, skipping invalid emails and tagging department', () => {
  const { emails, contacts } = fromHunter(HUNTER);
  assert.deepEqual(emails.map((e) => e.email), ['priya@acmeinfotech.in', 'info@acmeinfotech.in']);
  assert.equal(emails[0].category, 'hr');
  assert.equal(emails[1].category, undefined);
  assert.deepEqual(contacts, [{ name: 'Priya Shah', title: 'HR Manager', department: 'hr', seniority: 'senior', email: 'priya@acmeinfotech.in', linkedinUrl: undefined, source: 'hunter' }]);
  assert.deepEqual(fromHunter(null), { emails: [], contacts: [] });
});

test('Hunter department makes a personal HR email rank as the HR email', () => {
  const ranked = rankEmails(fromHunter(HUNTER).emails, plan, 'https://acmeinfotech.in');
  assert.equal(ranked[0].email, 'priya@acmeinfotech.in');
  assert.equal(ranked[0].category, 'hr');
});

test('Apollo fills only missing fields and resolves website by name + city', async () => {
  const calls = [];
  const organization = async (q) => {
    calls.push(q);
    return q.name === 'Acme Infotech Pvt Ltd' ? ORG : { ...ORG, name: 'Other Co', website_url: 'https://otherco.com', city: 'Pune' };
  };
  const leads = [
    { name: 'Acme Infotech Pvt Ltd', city: 'Ahmedabad', phone: '079 111', verification: 'verified' },
    { name: 'Zeta Systems', city: 'Ahmedabad', verification: 'likely' },
    { name: 'Has Everything', website: 'https://x.in', domain: 'x.in', companyType: 'IT', verification: 'verified' },
    { name: 'Rejected', verification: 'rejected' },
  ];
  const n = await enrichCompanies(leads, silent, { organization, max: 10 });
  assert.equal(n, 1);
  assert.deepEqual(calls, [{ name: 'Acme Infotech Pvt Ltd' }, { name: 'Zeta Systems' }]);
  assert.equal(leads[0].website, 'http://www.acmeinfotech.in/');
  assert.equal(leads[0].domain, 'acmeinfotech.in');
  assert.equal(leads[0].phone, '079 111');
  assert.equal(leads[0].employeeCount, 120);
  assert.deepEqual(leads[0].enrichedBy, ['apollo']);
  assert.equal(leads[1].website, undefined);
  assert.equal(sameCompany({ name: 'Acme Infotech', city: 'Surat' }, fromApolloOrg(ORG)), false);
});

test('Hunter runs only when the role email is missing; Apollo adds decision-makers; quota errors stop a provider', async () => {
  let hunterCalls = 0;
  const domainSearch = async () => {
    hunterCalls += 1;
    return HUNTER;
  };
  let peopleCalls = 0;
  const people = async () => {
    peopleCalls += 1;
    const err = new Error('forbidden');
    err.response = { status: 403, data: { error: 'plan does not include this endpoint' } };
    throw err;
  };
  const leads = [
    { name: 'A', domain: 'acmeinfotech.in', rawEmails: [{ email: 'info@acmeinfotech.in' }], verification: 'verified' },
    { name: 'B', domain: 'b.in', rawEmails: [{ email: 'careers@b.in' }], verification: 'verified' },
    { name: 'C', domain: 'c.in', rawEmails: [], verification: 'likely' },
  ];
  const logs = [];
  const stats = await enrichContacts(leads, plan, (lvl, m) => logs.push(m), { domainSearch, people, max: 10, perCompany: 5 });
  assert.equal(hunterCalls, 2);
  assert.equal(stats.hunter, 2);
  assert.equal(peopleCalls, 1);
  assert.equal(stats.apollo, 0);
  assert.ok(logs.some((m) => /Apollo.io people search: stopped/.test(m)));
  assert.equal(leads[0].contacts[0].name, 'Priya Shah');
  assert.ok(leads[0].rawEmails.some((e) => e.email === 'priya@acmeinfotech.in' && e.category === 'hr'));
  assert.equal(leads[1].contacts, undefined);
});

test('merges contacts without duplicates and respects the cap', () => {
  const merged = mergeContacts([{ name: 'Priya Shah', email: 'priya@a.in' }], [{ name: 'Priya Shah', email: 'priya@a.in' }, { name: 'Raj K.', title: 'CEO' }, { name: 'Raj K.', title: 'CEO' }, { name: 'Z', title: 'CTO' }], 2);
  assert.deepEqual(merged.map((c) => c.name), ['Priya Shah', 'Raj K.']);
});

test('Apollo industry counts as relevance evidence', () => {
  const lead = { name: 'Acme Solutions', city: 'Ahmedabad', address: 'Ahmedabad', companyType: 'information technology & services' };
  assert.equal(assessRelevance(lead, plan).verification, 'verified');
});

test('Excel and CSV include company type, what they do, contacts and enrichment source', async () => {
  const lead = {
    name: 'Acme Infotech',
    primaryEmail: 'priya@acmeinfotech.in',
    companyType: 'information technology & services',
    description: 'Custom software',
    services: ['software development', 'mobile apps'],
    employeeCount: 120,
    foundedYear: 2011,
    contacts: [{ name: 'Priya Shah', title: 'HR Manager', email: 'priya@acmeinfotech.in' }, { name: 'Raj K.', title: 'CEO' }],
    enrichedBy: ['apollo', 'hunter'],
    mapsUrl: 'https://maps.google.com/?cid=1',
    dedupeKey: 'acme',
  };
  assert.equal(formatContacts(lead.contacts), 'Priya Shah - HR Manager - priya@acmeinfotech.in; Raj K. - CEO');
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(await buildLeadsWorkbook({ title: 't', leads: [lead], count: 'all' }));
  const sheet = wb.getWorksheet('Leads');
  const headers = sheet.getRow(1).values.filter(Boolean);
  const row = Object.fromEntries(headers.map((h, i) => [h, sheet.getRow(2).getCell(i + 1).text]));
  assert.equal(row['Company Type / Industry'], 'information technology & services');
  assert.equal(row['What They Do'], 'Custom software');
  assert.equal(row['Services / Keywords'], 'software development, mobile apps');
  assert.equal(row.Employees, '120');
  assert.equal(row['Key Contacts (Name - Designation - Email)'], 'Priya Shah - HR Manager - priya@acmeinfotech.in; Raj K. - CEO');
  assert.equal(row['Data Enriched By'], 'Apollo.io, Hunter.io');
  const csv = buildLeadsCsv([lead]);
  assert.match(csv, /Company Type \/ Industry/);
  assert.match(csv, /Priya Shah - HR Manager - priya@acmeinfotech\.in; Raj K\. - CEO/);
});
