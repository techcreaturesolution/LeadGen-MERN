import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  analyzeCompanies,
  assembleSinglePageHtmlTemplate,
  buildPrompt,
  detectIndustryKey,
  extractSearchContext,
  INDUSTRY_THEMES,
  INDUSTRY_VISUAL_ASSETS,
  isSafePublicUrl,
  sanitizeSvg,
  validateTemplateDraft,
} from '../src/services/agent/templateAgent.js';
import { htmlToPlainText, isEmailHtml, renderEmail, unknownFields } from '../src/services/mail/template.js';

test('detectIndustryKey classifies search query and company context into appropriate industry themes', () => {
  // 1. Bakery shop search
  assert.equal(detectIndustryKey({ query: 'bakery shop in Gandhinagar' }), 'bakery_food');
  assert.equal(detectIndustryKey({ query: 'cake shops and pastry makers in Ahmedabad' }), 'bakery_food');

  // 2. Pharmaceutical companies search
  assert.equal(detectIndustryKey({ query: 'pharmaceutical companies in Ahmedabad' }), 'pharma');
  assert.equal(detectIndustryKey({ query: 'biotech and clinical research labs' }), 'pharma');
  assert.equal(detectIndustryKey({ businessType: 'healthcare and medical equipment' }), 'pharma');

  // 3. Real estate builders search
  assert.equal(detectIndustryKey({ query: 'real estate builders in Surat' }), 'real_estate');
  assert.equal(detectIndustryKey({ query: 'housing developers and commercial architects' }), 'real_estate');

  // 4. IT companies search
  assert.equal(detectIndustryKey({ query: 'IT companies in Pune' }), 'technology');
  assert.equal(detectIndustryKey({ query: 'software SaaS startups and cloud developers' }), 'technology');

  // Manufacturing companies
  assert.equal(detectIndustryKey({ query: 'manufacturing companies in Pune' }), 'manufacturing');
  assert.equal(detectIndustryKey({ query: 'industrial machinery plants and steel fabricators' }), 'manufacturing');

  // Manufacturing subcategories
  assert.equal(detectIndustryKey({ query: 'chemical manufacturing companies in Vadodara' }), 'manufacturing_chemical');
  assert.equal(detectIndustryKey({ query: 'automotive manufacturers and auto component plants in Pune' }), 'manufacturing_automotive');
  assert.equal(detectIndustryKey({ query: 'electronics manufacturing and PCB assembly in Bangalore' }), 'manufacturing_electronics');
  assert.equal(detectIndustryKey({ query: 'CNC machining and precision engineering in Rajkot' }), 'manufacturing_metal');

  // 5. Ambiguous or mixed-industry search
  assert.equal(detectIndustryKey({ query: 'consulting partners in Mumbai' }), 'general_professional');
  assert.equal(detectIndustryKey({ query: 'top businesses in Vadodara' }), 'general_professional');
});

test('assembleSinglePageHtmlTemplate generates warm bakery design for bakery searches', () => {
  const bakeryTheme = INDUSTRY_THEMES.bakery_food;
  const bakeryHtml = assembleSinglePageHtmlTemplate({
    theme: bakeryTheme,
    colors: bakeryTheme.colors,
    heading: 'Help Your Bakery Reach More Customers',
    mainMessage: 'I came across {{business}} while exploring popular bakeries and cake shops in Gandhinagar.',
    highlights: ['Online cake and pastry orders', 'Local customer visibility in Gandhinagar'],
    calloutMessage: 'Would you be open to a brief chat this week about customer reach and orders?',
    ctaText: 'Discuss Requirements',
  });

  // Verify email-compatible HTML structure and warm colors
  assert.ok(isEmailHtml(bakeryHtml));
  assert.ok(bakeryHtml.includes('max-width:580px'));
  assert.ok(bakeryHtml.includes('#7A3E2E')); // Warm brown primary
  assert.ok(bakeryHtml.includes('#FFF9F0')); // Warm cream background
  assert.ok(bakeryHtml.includes('#DFA5A0')); // Warm rose/accent
  assert.ok(bakeryHtml.includes('Bakery & Food Retail'));
  assert.ok(bakeryHtml.includes('Hi {{business|there}} team,'));
  assert.ok(bakeryHtml.includes('Help Your Bakery Reach More Customers'));
  assert.ok(bakeryHtml.includes('Discuss Requirements'));

  // Verify actual rendered bakery visual objects (celebration cake, cupcake, bread)
  assert.ok(bakeryHtml.includes('<svg'));
  assert.ok(bakeryHtml.includes('Centerpiece 2-Tier Celebration Cake') || bakeryHtml.includes('ellipse cx="35" cy="73"'));
  assert.ok(bakeryHtml.includes('Swirled Cupcake') || bakeryHtml.includes('polygon points="26,65'));
  assert.ok(bakeryHtml.includes('Artisan Bread Loaf') || bakeryHtml.includes('Sourdough score cuts'));

  // Ensure NO generic B2B partnership or IT phrasing exists
  assert.ok(!bakeryHtml.includes('B2B Strategic Partnership'));
  assert.ok(!bakeryHtml.includes('IT Consulting'));
});

test('assembleSinglePageHtmlTemplate generates clean clinical design for pharma searches', () => {
  const pharmaHtml = assembleSinglePageHtmlTemplate({
    theme: INDUSTRY_THEMES.pharma,
    colors: INDUSTRY_THEMES.pharma.colors,
    heading: 'Clinical & Operational Excellence for {{business}}',
    mainMessage: 'We assist healthcare organizations in {{city|your area}} in streamlining compliance and supply chains.',
    highlights: ['Regulatory compliance support', 'Rapid turnaround times'],
    calloutMessage: 'Would you be open to a 10-minute introductory call next Tuesday?',
    ctaText: 'Discuss Collaboration',
  });

  // Verify email-compatible HTML structure
  assert.ok(isEmailHtml(pharmaHtml));
  assert.ok(pharmaHtml.includes('max-width:580px'));
  assert.ok(pharmaHtml.includes(INDUSTRY_THEMES.pharma.colors.headerBg));
  assert.ok(pharmaHtml.includes(INDUSTRY_THEMES.pharma.colors.badgeBg));
  assert.ok(pharmaHtml.includes(INDUSTRY_THEMES.pharma.tagline));
  assert.ok(pharmaHtml.includes('Hi {{business|there}} team,'));
  assert.ok(pharmaHtml.includes('Clinical & Operational Excellence for {{business}}'));
  assert.ok(pharmaHtml.includes('Discuss Collaboration'));

  // Verify rendered pharma visual assets (flask, capsules, healthcare shield)
  assert.ok(pharmaHtml.includes('<svg'));
  assert.ok(pharmaHtml.includes('Laboratory Flask') || pharmaHtml.includes('Rising bubbles'));
  assert.ok(pharmaHtml.includes('Dual Capsules') || pharmaHtml.includes('Healthcare Trust Shield'));

  // Verify plain text alternative generation cleanly strips SVG tags
  const plainText = htmlToPlainText(pharmaHtml);
  assert.ok(plainText.includes('Hi {{business|there}} team,'));
  assert.ok(plainText.includes('Clinical & Operational Excellence for {{business}}'));
  assert.ok(!plainText.includes('<table'));
  assert.ok(!plainText.includes('</td>'));
  assert.ok(!plainText.includes('<svg'));
});

test('assembleSinglePageHtmlTemplate generates real estate property skyline visuals', () => {
  const estateTheme = INDUSTRY_THEMES.real_estate;
  const estateHtml = assembleSinglePageHtmlTemplate({
    theme: estateTheme,
    colors: estateTheme.colors,
    heading: 'Showcasing Premier Properties for {{business}}',
    mainMessage: 'We help leading property builders in Surat connect with qualified buyers.',
    calloutMessage: 'Would you be open to a brief conversation this week?',
    ctaText: 'View Property Solutions',
  });

  assert.ok(isEmailHtml(estateHtml));
  assert.ok(estateHtml.includes('<svg'));
  assert.ok(estateHtml.includes('Construction Crane') || estateHtml.includes('High-Rise Cityscape') || estateHtml.includes('Villa Silhouette'));
  assert.ok(estateHtml.includes('Residential & Commercial'));
  assert.ok(estateHtml.includes('Buyer Engagement'));
});

test('assembleSinglePageHtmlTemplate generates SaaS dashboard visuals for technology searches', () => {
  const techTheme = INDUSTRY_THEMES.technology;
  const techHtml = assembleSinglePageHtmlTemplate({
    theme: techTheme,
    colors: techTheme.colors,
    heading: 'Modern Digital Platforms for {{business}}',
    mainMessage: 'We engineer cloud-native web and SaaS applications for tech companies.',
    calloutMessage: 'Would you be open to an exploratory tech chat this Thursday?',
    ctaText: 'Explore Tech Solutions',
  });

  assert.ok(isEmailHtml(techHtml));
  assert.ok(techHtml.includes('<svg'));
  assert.ok(techHtml.includes('Floating SaaS Dashboard') || techHtml.includes('Window Controls') || techHtml.includes('Cloud Node'));
  assert.ok(techHtml.includes('Digital Platforms & SaaS'));
  assert.ok(techHtml.includes('Tech Modernization'));
});

test('assembleSinglePageHtmlTemplate generates light modern manufacturing design with conveyor & facility visuals', () => {
  const manufTheme = INDUSTRY_THEMES.manufacturing;
  const manufHtml = assembleSinglePageHtmlTemplate({
    theme: manufTheme,
    colors: manufTheme.colors,
    heading: 'Modern Operational Solutions for {{business}}',
    mainMessage: 'We assist manufacturing facilities in {{city|your area}} in streamlining throughput and plant reliability.',
    calloutMessage: 'Would you be open to an exploratory 15-minute call next week?',
    ctaText: 'Discuss Requirements',
  });

  // 1. Verify email-compatible HTML structure and LIGHT industrial palette
  assert.ok(isEmailHtml(manufHtml));
  assert.ok(manufHtml.includes('max-width:580px'));
  assert.ok(manufHtml.includes('#F4F7FA')); // Light secondary background
  assert.ok(manufHtml.includes('#FFFFFF')); // Crisp white main card/header
  assert.ok(manufHtml.includes('#1E3A5F')); // Deep industrial slate blue heading
  assert.ok(manufHtml.includes('#E99A35')); // Restrained warm amber accent
  assert.ok(manufHtml.includes('#DCE4EC')); // Clean subtle border
  assert.ok(manufHtml.includes('Industrial & Manufacturing'));
  assert.ok(manufHtml.includes('Hi {{business|there}} team,'));
  assert.ok(manufHtml.includes('Modern Operational Solutions for {{business}}'));
  assert.ok(manufHtml.includes('Discuss Requirements'));

  // 2. Avoid dark navy or dark orange panels
  assert.ok(!manufHtml.includes('#1E293B')); // No dark navy header background
  assert.ok(!manufHtml.includes('#EA580C')); // No dark orange hero background

  // 3. Verify actual rendered manufacturing visual objects (facility, conveyor, hoist, gear)
  assert.ok(manufHtml.includes('<svg'));
  assert.ok(manufHtml.includes('viewBox="0 0 532 108"'));
  assert.ok(manufHtml.includes('Facility with saw-tooth architectural roofline') || manufHtml.includes('points="10,72 10,38'));
  assert.ok(manufHtml.includes('Automated conveyor belt') || manufHtml.includes('rect x="0" y="52" width="180"'));
  assert.ok(manufHtml.includes('Gantry hoist crane') || manufHtml.includes('circle cx="35" cy="48" r="22"'));

  // 4. Verify NO generic cards ("Precision Engineering", "Production Capacity", "Quality Assurance") are inserted when not provided
  assert.ok(!manufHtml.includes('Precision Engineering'));
  assert.ok(!manufHtml.includes('Production Capacity'));
  assert.ok(!manufHtml.includes('Quality Assurance'));
});

test('assembleSinglePageHtmlTemplate generates chemical processing equipment & tanks for chemical manufacturing', () => {
  const chemTheme = INDUSTRY_THEMES.manufacturing_chemical;
  const chemHtml = assembleSinglePageHtmlTemplate({
    theme: chemTheme,
    colors: chemTheme.colors,
    heading: 'Chemical Process Reliability for {{business}}',
    mainMessage: 'We support chemical processing plants in {{city|your area}} in ensuring storage integrity and distribution efficiency.',
    calloutMessage: 'Would you be open to an introductory discussion this Thursday?',
    ctaText: 'Connect With Us',
  });

  assert.ok(isEmailHtml(chemHtml));
  assert.ok(chemHtml.includes('#F4F7FA'));
  assert.ok(chemHtml.includes('#1E3A5F'));
  assert.ok(chemHtml.includes('Chemical Processing & Operations'));
  assert.ok(chemHtml.includes('<svg'));
  assert.ok(chemHtml.includes('Cylindrical Bulk Storage Tanks') || chemHtml.includes('C10,16 45,16 45,26'));
  assert.ok(chemHtml.includes('Distillation Column') || chemHtml.includes('pipeline with handwheel'));
  assert.ok(chemHtml.includes('Chemical Lab Testing Flask') || chemHtml.includes('Tube rack station'));
  assert.ok(!chemHtml.includes('#1E293B'));
});

test('assembleSinglePageHtmlTemplate generates automotive robotic arm & brake rotor for automotive manufacturing', () => {
  const autoTheme = INDUSTRY_THEMES.manufacturing_automotive;
  const autoHtml = assembleSinglePageHtmlTemplate({
    theme: autoTheme,
    colors: autoTheme.colors,
    heading: 'Automotive Component Precision for {{business}}',
    mainMessage: 'We help automotive component manufacturers in {{city|your area}} optimize assembly throughput.',
    calloutMessage: 'Would you be open to a 10-minute introductory call next week?',
    ctaText: 'Explore Solutions',
  });

  assert.ok(isEmailHtml(autoHtml));
  assert.ok(autoHtml.includes('#F4F7FA'));
  assert.ok(autoHtml.includes('#1E3A5F'));
  assert.ok(autoHtml.includes('Automotive & Component Manufacturing'));
  assert.ok(autoHtml.includes('<svg'));
  assert.ok(autoHtml.includes('Multi-Axis Robotic Assembly Arm') || autoHtml.includes('welding nozzle'));
  assert.ok(autoHtml.includes('Ventilated Disc Brake Rotor') || autoHtml.includes('Caliper assembly'));
  assert.ok(autoHtml.includes('Transmission Drive Gear') || autoHtml.includes('Drive Gear & Shaft'));
});

test('assembleSinglePageHtmlTemplate generates PCB substrate & microprocessor for electronics manufacturing', () => {
  const elecTheme = INDUSTRY_THEMES.manufacturing_electronics;
  const elecHtml = assembleSinglePageHtmlTemplate({
    theme: elecTheme,
    colors: elecTheme.colors,
    heading: 'Precision Hardware Assembly for {{business}}',
    mainMessage: 'We assist electronics manufacturers in {{city|your area}} with reliable SMT placement and PCB testing.',
    calloutMessage: 'Would you be open to an introductory discussion this week?',
    ctaText: 'Discuss Requirements',
  });

  assert.ok(isEmailHtml(elecHtml));
  assert.ok(elecHtml.includes('#F4F7FA'));
  assert.ok(elecHtml.includes('#1E3A5F'));
  assert.ok(elecHtml.includes('Electronics & Precision Assembly'));
  assert.ok(elecHtml.includes('<svg'));
  assert.ok(elecHtml.includes('High-Density PCB Board') || elecHtml.includes('Conductive Bus Traces'));
  assert.ok(elecHtml.includes('Central QFP Processor') || elecHtml.includes('Microchip Pins'));
  assert.ok(elecHtml.includes('Automated SMT Pick-and-Place Tool Head') || elecHtml.includes('SMT tool head'));
});

test('assembleSinglePageHtmlTemplate generates CNC spindle milling & vernier caliper for metal engineering', () => {
  const metalTheme = INDUSTRY_THEMES.manufacturing_metal;
  const metalHtml = assembleSinglePageHtmlTemplate({
    theme: metalTheme,
    colors: metalTheme.colors,
    heading: 'High-Tolerance Machining for {{business}}',
    mainMessage: 'We help metal fabrication and CNC machining facilities in {{city|your area}} achieve repeatable tolerances.',
    calloutMessage: 'Would you be open to a brief call this week?',
    ctaText: 'Explore Collaboration',
  });

  assert.ok(isEmailHtml(metalHtml));
  assert.ok(metalHtml.includes('#F4F7FA'));
  assert.ok(metalHtml.includes('#1E3A5F'));
  assert.ok(metalHtml.includes('Precision Engineering & Metal Fabrication'));
  assert.ok(metalHtml.includes('<svg'));
  assert.ok(metalHtml.includes('CNC Vertical Milling Machine Spindle') || metalHtml.includes('coolant spray nozzles'));
  assert.ok(metalHtml.includes('Heavy-Duty Precision Spur Gear Pair') || metalHtml.includes('Machined drive gear'));
  assert.ok(metalHtml.includes('Digital Vernier Caliper Gauge') || metalHtml.includes('Metric measurement graduation'));
});

test('sanitizeSvg blocks malicious scripts, external links and event handlers', () => {
  // Disallows script injection
  assert.equal(sanitizeSvg('<svg><script>alert("xss")</script></svg>'), '');
  // Disallows event handlers
  assert.equal(sanitizeSvg('<svg onload="evil()"><circle cx="1" cy="1" r="1"/></svg>'), '');
  assert.equal(sanitizeSvg('<svg onclick="evil()"><rect width="10" height="10"/></svg>'), '');
  // Disallows external hrefs
  assert.equal(sanitizeSvg('<svg href="https://malicious.org"><circle cx="1" cy="1" r="1"/></svg>'), '');
  // Preserves clean valid SVG
  const valid = '<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="#3B82F6"/></svg>';
  assert.equal(sanitizeSvg(valid), valid);
});

test('buildPrompt includes single-page rules, detected industry, and supported merge fields', () => {
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

  const { systemPrompt, userPrompt, detectedIndustry } = buildPrompt({ searchContext, companyAnalysis, userOffer });

  assert.equal(detectedIndustry, 'real_estate');
  assert.match(systemPrompt, /ONE single-page, professionally designed email template/);
  assert.match(systemPrompt, /ONE-PAGE COMPACT DESIGN/);
  assert.match(systemPrompt, /\{\{business\}\}/);
  assert.match(systemPrompt, /DO NOT use \{\{company_name\}\}/);
  assert.match(systemPrompt, /around 80–140 words/);

  const parsedUser = JSON.parse(userPrompt);
  assert.equal(parsedUser.userContext.businessName, 'Tech Solutions');
  assert.equal(parsedUser.userContext.service, 'Website Development');
  assert.equal(parsedUser.search.location, 'Surat');
  assert.equal(parsedUser.audienceResearch.detectedIndustry, 'real_estate');

  // Direct generation without offer:
  const direct = buildPrompt({ searchContext, companyAnalysis, userOffer: {} });
  assert.match(direct.systemPrompt, /No specific service or product was specified/);
  assert.match(direct.systemPrompt, /\{\{business\}\}/);
});

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
  assert.ok(Array.isArray(validated.visualObjects));
  assert.ok(validated.visualPlan);
  assert.ok(validated.visualPlan.visualObjects.length > 0);
  assert.ok(Array.isArray(validated.featureCards));
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

test('validateTemplateDraft sanitizes contradictory generic B2B output for bakery searches', () => {
  const genericB2bDraft = {
    name: 'Bakery Outreach',
    subject: 'B2B Strategic Partnership for {{company_name}}',
    heading: 'B2B Strategic Solutions for {{company_name}}',
    mainMessage: 'We offer IT consulting and cloud architecture for your enterprise operations in Gandhinagar.',
    highlights: ['B2B Enterprise scalability', 'Cloud management'],
    calloutMessage: 'Would you be open to an exploratory B2B call?',
    ctaText: 'Explore Collaboration',
    industry: 'technology', // Contradictory AI classification
  };

  const validated = validateTemplateDraft(genericB2bDraft, {
    fallbackIndustry: 'bakery_food',
    searchContext: { query: 'bakery shop in Gandhinagar', location: 'Gandhinagar' },
    userOffer: {}, // No IT offer
  });

  // Verify contradictory B2B/IT content is overridden
  assert.equal(validated.industry, 'bakery_food');
  assert.equal(validated.industryName, 'Bakery and Food Retail');
  assert.ok(!validated.subject.includes('B2B Strategic'));
  assert.ok(!validated.body.includes('IT consulting'));
  assert.ok(!validated.body.includes('cloud architecture'));
  assert.ok(validated.body.includes('#7A3E2E')); // Warm bakery color palette
  assert.ok(validated.body.includes('Bakery & Food Retail'));
  assert.equal(validated.colors.primary, '#7A3E2E');
  assert.equal(validated.colors.background, '#FFF9F0');
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

