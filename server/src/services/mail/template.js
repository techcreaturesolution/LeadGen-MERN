export const MERGE_FIELDS = {
  business: 'Business / company name',
  city: 'City',
  website: 'Website',
  email: 'Recipient email',
  phone: 'Phone',
  category: 'Business category',
  my_name: 'Your name',
  my_email: 'Your Gmail address',
};

const TAG_RX = /\{\{\s*([a-z_]+)\s*(?:\|([^}]*))?\}\}/gi;

export function templateFields(...texts) {
  const found = new Set();
  for (const t of texts) for (const m of String(t || '').matchAll(TAG_RX)) found.add(m[1].toLowerCase());
  return [...found];
}

export function unknownFields(...texts) {
  return templateFields(...texts).filter((f) => !(f in MERGE_FIELDS));
}

export function mergeVars(recipient = {}, sender = {}) {
  return {
    business: recipient.business || '',
    city: recipient.city || '',
    website: recipient.website || '',
    email: recipient.email || '',
    phone: recipient.phone || '',
    category: recipient.category || '',
    my_name: sender.name || '',
    my_email: sender.email || '',
  };
}

export function renderText(text, vars) {
  return String(text || '').replace(TAG_RX, (_m, key, fallback) => {
    const v = vars[key.toLowerCase()];
    return v ? String(v) : (fallback ?? '').trim();
  });
}

export function renderEmail({ subject, body }, recipient, sender) {
  const vars = mergeVars(recipient, sender);
  return { subject: renderText(subject, vars).replace(/\s+/g, ' ').trim(), text: renderText(body, vars).trim() };
}

const escapeHtml = (s) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

export function textToHtml(text) {
  const linked = escapeHtml(text).replace(/\bhttps?:\/\/[^\s<]+[^\s<.,;:!?)]/g, (u) => `<a href="${u}">${u}</a>`);
  const paras = linked.split(/\n{2,}/).map((p) => `<p style="margin:0 0 14px">${p.replace(/\n/g, '<br>')}</p>`);
  return `<div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.55;color:#1e293b">${paras.join('')}</div>`;
}

export const TEMPLATE_PRESETS = [
  {
    key: 'website',
    name: 'Website development offer',
    subject: 'A faster, modern website for {{business}}',
    body: `Hi {{business|there}} team,

I came across {{website|your business}} while looking at companies in {{city|your area}}. We build fast, mobile-friendly websites that turn visitors into enquiries: clean design, SEO basics, WhatsApp/enquiry forms and easy content updates.

Would you be open to a free 15-minute review of your current site? I will share 3 practical improvements, no obligation.

Best regards,
{{my_name}}
{{my_email}}`,
  },
  {
    key: 'software',
    name: 'Custom software development',
    subject: 'Custom software to automate work at {{business}}',
    body: `Hello {{business|there}} team,

Many {{category|businesses}} in {{city|your city}} still run key work on spreadsheets and phone calls. We build custom software (ERP, CRM, inventory, billing, dashboards and mobile apps) around the way your team already works.

If it helps, I can send two short case studies from similar companies and a rough estimate for your requirement.

Thanks,
{{my_name}}
{{my_email}}`,
  },
  {
    key: 'marketing',
    name: 'Digital marketing & SEO',
    subject: 'More enquiries for {{business}} from Google',
    body: `Hi {{business|there}},

We help businesses in {{city|your city}} get more enquiries from Google Search, Google Maps and social media with SEO, Google Ads and content.

Shall I send a free audit of how {{business|your business}} currently shows up online?

Regards,
{{my_name}}
{{my_email}}`,
  },
];
