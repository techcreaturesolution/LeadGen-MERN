import ExcelJS from 'exceljs';
import { isEmail } from './mail/mime.js';

export const MAX_GROUP_MEMBERS = 5000;

export function leadToMember(lead, origin) {
  return {
    lead: lead._id,
    email: lead.primaryEmail,
    business: lead.name,
    city: lead.city,
    website: lead.website,
    phone: lead.phone,
    category: lead.category,
    origin,
  };
}

export function mergeMembers(existing, incoming) {
  const seen = new Set(existing.map((m) => String(m.email).toLowerCase()));
  const added = [];
  let duplicates = 0;
  let invalid = 0;
  for (const m of incoming) {
    const email = String(m.email || '').trim().toLowerCase();
    if (!isEmail(email)) {
      invalid += 1;
      continue;
    }
    if (seen.has(email)) {
      duplicates += 1;
      continue;
    }
    if (existing.length + added.length >= MAX_GROUP_MEMBERS) break;
    seen.add(email);
    added.push({ ...m, email });
  }
  return { added, duplicates, invalid };
}

const COLUMN_RULES = [
  ['email', /^(primary\s*)?e-?mail(\s*(address|id))?$/i],
  ['business', /^(company|business|company\s*\/\s*business|organi[sz]ation|name|company name|business name)$/i],
  ['city', /^(city|town|location)$/i],
  ['website', /^(website|web|url|site)$/i],
  ['phone', /^(phone|mobile|contact|phone number|contact number)$/i],
  ['category', /^(category|industry|type|business type)$/i],
];

function headerMap(row) {
  const map = {};
  row.eachCell((cell, col) => {
    const h = String(cell.text || '').trim();
    for (const [key, rx] of COLUMN_RULES) if (!map[key] && rx.test(h)) map[key] = col;
  });
  return map;
}

export async function parseLeadsWorkbook(buffer) {
  const wb = new ExcelJS.Workbook();
  try {
    await wb.xlsx.load(buffer);
  } catch {
    throw new Error('Could not read the file. Upload an .xlsx Excel workbook.');
  }
  const sheets = [...wb.worksheets].sort((a, b) => (b.name === 'Leads') - (a.name === 'Leads'));
  for (const ws of sheets) {
    for (let r = 1; r <= Math.min(10, ws.rowCount); r += 1) {
      const map = headerMap(ws.getRow(r));
      if (!map.email) continue;
      const rows = [];
      for (let i = r + 1; i <= ws.rowCount; i += 1) {
        const row = ws.getRow(i);
        const val = (k) => (map[k] ? String(row.getCell(map[k]).text || '').trim() : '');
        const email = val('email').replace(/^mailto:/i, '').split(/[\s,;]+/)[0];
        if (!email && !val('business')) continue;
        rows.push({ email, business: val('business'), city: val('city'), website: val('website'), phone: val('phone'), category: val('category'), origin: 'excel' });
      }
      return { sheet: ws.name, rows };
    }
  }
  throw new Error('No "Email" column found. The first rows of the sheet need a header such as "Email" or "Primary Email".');
}
