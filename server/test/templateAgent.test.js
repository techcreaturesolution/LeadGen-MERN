import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  analyzeCompanies,
  buildPrompt,
  extractSearchContext,
  isSafePublicUrl,
  validateTemplateDraft,
} from '../src/services/agent/templateAgent.js';
import { renderEmail, unknownFields } from '../src/services/mail/template.js';

test('isSafePublicUrl allows valid public websites and blocks SSRF targets', () => {
  // Safe public sites
  assert.equal(isSafePublicUrl('https://example.com'), true);
  assert.equal(isSafePublicUrl('http://acmeinfotech.in/about'), true);
  assert.equal(isSafePublicUrl('https://builders.surat.co.in'), true);

  // Unsafe / SSRF / Internal addresses
  assert.equal(isSafePublicUrl('http://localhost:5000'), false);
  assert.equal(isSafePublicUrl('http://127.0.0.1/admin'), false);
  assert.equal(isSafePublicUrl('http://0.0.0.0/'), false);
  assert.equal(isSafePublicUrl('http://[::1]'), false);
  assert.equal(isSafePublicUrl('http://10.0.0.5:8080'), false);
  assert.equal(isSafePublicUrl('http://192.168.1.1'), false);
  assert.equal(isSafePublicUrl('http://172.20.0.1'), false);
  assert.equal(isSafePublicUrl('http://169.254.169.254/latest/meta-data'), false);
  assert.equal(isSafePublicUrl('http://server.local'), false);
  assert.equal(isSafePublicUrl('ftp://example.com'), false);
  assert.equal(isSafePublicUrl('javascript:alert(1)'), false);
  assert.equal(isSafePublicUrl(''), false);
  assert.equal(isSafePublicUrl(null), false);
});

test('extractSearchContext extracts business type, location, keywords and target role', () => {
  const job = {
    query: 'sales contacts of real estate builders in Surat',
    plan: {
      businessType: 'real estate builders',
      location: 'Surat',
      locations: ['Surat'],
      targetRole: 'sales',
      keywords: ['real estate', 'builders'],
    },
  };
  const ctx = extractSearchContext(job);
  assert.equal(ctx.businessType, 'real estate builders');
  assert.equal(ctx.location, 'Surat');
  assert.equal(ctx.targetRole, 'sales');
  assert.deepEqual(ctx.keywords, ['real estate', 'builders']);

  // Fallback for job without plan
  const fallbackCtx = extractSearchContext({ query: 'HR email of IT companies in Ahmedabad' });
  assert.match(fallbackCtx.businessType, /IT compan/i);
  assert.equal(fallbackCtx.location, 'Ahmedabad');
  assert.equal(fallbackCtx.targetRole, 'hr');
  assert.ok(fallbackCtx.keywords.length > 0);
});

test('analyzeCompanies aggregates company data and handles missing websites gracefully', async () => {
  const leads = [
    { name: 'ABC Realty', category: 'Real Estate', city: 'Surat', website: 'https://abcrealty.in', services: ['Residential', 'Commercial'] },
    { name: 'Sunrise Developers', category: 'Real Estate', city: 'Surat', website: 'https://sunrisedev.in', services: ['Residential'] },
    { name: 'Prime Estate', category: 'Builders', city: 'Surat', website: '', services: ['Plots'] },
    { name: 'No Web Infra', category: 'Construction', city: 'Surat' },
  ];

  const analysis = await analyzeCompanies(leads, { crawl: false });
  assert.equal(analysis.totalLeads, 4);
  assert.equal(analysis.withWebsite, 2);
  assert.deepEqual(analysis.sampleCompanies, ['ABC Realty', 'Sunrise Developers', 'Prime Estate', 'No Web Infra']);
  assert.ok(analysis.categories.includes('Real Estate'));
  assert.ok(analysis.commonServices.includes('Residential'));
  assert.deepEqual(analysis.locations, ['Surat']);
});

test('buildPrompt includes single-template rules and supported merge fields', () => {
  const searchContext = {
    query: 'sales contacts of real estate builders in Surat',
    businessType: 'real estate builders',
    location: 'Surat',
    targetRole: 'sales',
    keywords: ['real estate', 'builders', 'Surat'],
  };
  const companyAnalysis = {
    totalLeads: 10,
    withWebsite: 8,
    sampleCompanies: ['ABC Realty', 'Sunrise Developers'],
    categories: ['Real Estate'],
    commonServices: ['Residential projects'],
    locations: ['Surat'],
    siteTitles: ['ABC Realty - Premier Homes in Surat'],
  };
  const userOffer = {
    businessName: 'Tech Solutions',
    service: 'Website Development',
    offerDescription: 'Modern, responsive websites for real estate businesses.',
    mainBenefit: 'Present property projects professionally and increase buyer enquiries.',
    tone: 'professional',
    language: 'English',
  };

  const { systemPrompt, userPrompt } = buildPrompt({ searchContext, companyAnalysis, userOffer });

  assert.match(systemPrompt, /ONE reusable, professional cold email template/);
  assert.match(systemPrompt, /\{\{business\}\}/);
  assert.match(systemPrompt, /DO NOT use \{\{company_name\}\}/);
  assert.match(systemPrompt, /under 140 words/);

  const parsedUser = JSON.parse(userPrompt);
  assert.equal(parsedUser.userContext.businessName, 'Tech Solutions');
  assert.equal(parsedUser.userContext.service, 'Website Development');
  assert.equal(parsedUser.search.location, 'Surat');

  // Direct generation without offer:
  const direct = buildPrompt({ searchContext, companyAnalysis, userOffer: {} });
  assert.match(direct.systemPrompt, /No specific service or product was specified/);
  assert.match(direct.systemPrompt, /\{\{business\}\}/);
});

test('validateTemplateDraft normalizes company_name, enforces valid fields, and formats output', () => {
  const rawDraft = {
    name: 'Real Estate Website Outreach',
    subject: 'Modern Websites for {{company_name}} in {{city}}',
    body: 'Hi {{company_name|there}},\n\nI noticed {{company_name}} operates in {{city}}. We build fast websites for {{category}} companies.\n\nWould you be open to a 10-minute chat?\n\n{{my_name}}\n{{my_email}}',
    researchSummary: 'Verified audience of real estate builders in Surat looking for professional web presence.',
    keywords: ['real estate', 'builders', 'Surat'],
  };

  const validated = validateTemplateDraft(rawDraft);

  // {{company_name}} normalized to {{business}}
  assert.equal(validated.subject, 'Modern Websites for {{business}} in {{city}}');
  assert.ok(validated.body.includes('{{business|there}}'));
  assert.ok(validated.body.includes('{{business}} operates in {{city}}'));
  assert.ok(!validated.body.includes('company_name'));
  assert.deepEqual(unknownFields(validated.subject, validated.body), []);
  assert.equal(validated.keywords.length, 3);
});

test('validateTemplateDraft strips unsupported fields and guarantees business personalization', () => {
  const badDraft = {
    name: 'Test Offer',
    subject: 'Hi {{random_custom_tag}}',
    body: 'We help your company grow.', // Missing {{business}} and sign-off
    researchSummary: 'Summary',
    keywords: ['test'],
  };

  const validated = validateTemplateDraft(badDraft);
  assert.deepEqual(unknownFields(validated.subject, validated.body), []);
  assert.ok(validated.body.includes('{{business|there}}'));
  assert.ok(validated.body.includes('{{my_name}}'));
  assert.ok(validated.body.includes('{{my_email}}'));
});

test('Dynamic Personalization: Common template correctly personalizes company name for each recipient', () => {
  const template = {
    name: 'Surat Builders Web Outreach',
    subject: 'Modern web solutions for {{business}} in {{city}}',
    body: `Hi {{business|there}} team,

I came across {{business}} while researching real estate builders in {{city|your area}}. We build modern, mobile-friendly websites that showcase property projects professionally and generate more buyer enquiries.

Would you be open to a quick 15-minute call this week?

Best regards,
{{my_name}}
{{my_email}}`,
  };

  const sender = { name: 'Alex Johnson', email: 'alex@techsolutions.com' };

  // Recipient 1: ABC Realty
  const rec1 = { business: 'ABC Realty', city: 'Surat', email: 'sales@abcrealty.in' };
  const email1 = renderEmail(template, rec1, sender);
  assert.equal(email1.subject, 'Modern web solutions for ABC Realty in Surat');
  assert.ok(email1.text.includes('Hi ABC Realty team,'));
  assert.ok(email1.text.includes('I came across ABC Realty while researching real estate builders in Surat.'));
  assert.ok(email1.text.includes('Alex Johnson\nalex@techsolutions.com'));

  // Recipient 2: Sunrise Developers
  const rec2 = { business: 'Sunrise Developers', city: 'Surat', email: 'info@sunrisedev.in' };
  const email2 = renderEmail(template, rec2, sender);
  assert.equal(email2.subject, 'Modern web solutions for Sunrise Developers in Surat');
  assert.ok(email2.text.includes('Hi Sunrise Developers team,'));
  assert.ok(email2.text.includes('I came across Sunrise Developers while researching real estate builders in Surat.'));

  // Recipient 3: Prime Estate
  const rec3 = { business: 'Prime Estate', city: 'Surat', email: 'contact@primeestate.in' };
  const email3 = renderEmail(template, rec3, sender);
  assert.equal(email3.subject, 'Modern web solutions for Prime Estate in Surat');
  assert.ok(email3.text.includes('Hi Prime Estate team,'));
  assert.ok(email3.text.includes('I came across Prime Estate while researching real estate builders in Surat.'));

  // Recipient 4: Lead with missing business name falls back cleanly
  const rec4 = { city: 'Surat', email: 'hello@general.in' };
  const email4 = renderEmail(template, rec4, sender);
  assert.ok(email4.text.includes('Hi there team,'));

  // Core pitch text is 100% identical across all recipients
  const pitchCore = 'We build modern, mobile-friendly websites that showcase property projects professionally and generate more buyer enquiries.\n\nWould you be open to a quick 15-minute call this week?';
  assert.ok(email1.text.includes(pitchCore));
  assert.ok(email2.text.includes(pitchCore));
  assert.ok(email3.text.includes(pitchCore));
  assert.ok(email4.text.includes(pitchCore));
});

test('Search eligibility: correctly identifies completed vs running or failed searches', () => {
  const isSearchEligible = (job) => {
    if (!job) return { eligible: false, error: 'Search not found', status: 404 };
    if (job.status === 'running' || job.status === 'queued') {
      return { eligible: false, error: 'Search is still running', status: 400 };
    }
    if (job.status === 'failed') {
      return { eligible: false, error: 'Search has failed', status: 400 };
    }
    if (job.status !== 'completed') {
      return { eligible: false, error: 'Search must be completed', status: 400 };
    }
    if (job.adGate?.required && !job.adGate?.completedAt) {
      return { eligible: false, error: 'Video ad required', status: 403 };
    }
    return { eligible: true };
  };

  assert.equal(isSearchEligible({ status: 'completed' }).eligible, true);
  assert.equal(isSearchEligible({ status: 'running' }).eligible, false);
  assert.equal(isSearchEligible({ status: 'queued' }).eligible, false);
  assert.equal(isSearchEligible({ status: 'failed' }).eligible, false);
  assert.equal(isSearchEligible({ status: 'completed', adGate: { required: true, completedAt: null } }).eligible, false);
});

