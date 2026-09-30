import ExcelJS from 'exceljs';

export const COLUMNS = [
  { header: '#', key: 'rank', width: 5 },
  { header: 'Company / Business', key: 'name', width: 34 },
  { header: 'Primary Email', key: 'primaryEmail', width: 32 },
  { header: 'Email Type', key: 'primaryEmailCategory', width: 11 },
  { header: 'Other Emails', key: 'otherEmails', width: 40 },
  { header: 'Phone', key: 'phone', width: 18 },
  { header: 'Website', key: 'website', width: 32 },
  { header: 'Category', key: 'category', width: 20 },
  { header: 'Match', key: 'match', width: 14 },
  { header: 'Match Evidence', key: 'matchReason', width: 40 },
  { header: 'Address', key: 'address', width: 40 },
  { header: 'City', key: 'city', width: 14 },
  { header: 'Email Domain Check', key: 'emailCheck', width: 18 },
  { header: 'Rating', key: 'rating', width: 8 },
  { header: 'Reviews', key: 'reviewsCount', width: 9 },
  { header: 'LinkedIn', key: 'linkedinUrl', width: 32 },
  { header: 'Instagram', key: 'instagramUrl', width: 32 },
  { header: 'Sources', key: 'sources', width: 22 },
  { header: 'Lead Score', key: 'score', width: 10 },
  { header: 'AI Note', key: 'aiNote', width: 45 },
];

const SOURCE_LABEL = { google_maps: 'Google Maps', linkedin: 'LinkedIn', instagram: 'Instagram' };

const clean = (v) => (typeof v === 'string' ? v.replace(/\s+/g, ' ').trim() : v);

function matchLabel(l) {
  if (!l.verification) return '';
  return `${l.verification === 'verified' ? 'Verified' : 'Likely'}${l.aiVerified ? ' (AI)' : ''}`;
}

function emailCheck(l) {
  const e = (l.emails || []).find((x) => x.email === l.primaryEmail);
  if (!e) return '';
  if (e.mxValid === true) return 'Mail server OK';
  return e.mxValid === false ? 'Unconfirmed' : '';
}

export function uniqueRows(leads) {
  const seen = new Set();
  return leads.filter((l) => {
    const key = l.dedupeKey || l.domain || `${String(l.name || '').toLowerCase().replace(/[^a-z0-9]/g, '')}|${String(l.city || '').toLowerCase()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function leadRows(leads) {
  return leads.map((l, i) => ({
    ...Object.fromEntries(COLUMNS.map((c) => [c.key, clean(l[c.key])])),
    rank: i + 1,
    primaryEmailCategory: (l.primaryEmailCategory || '').toUpperCase(),
    otherEmails: [...new Set((l.emails || []).map((e) => e.email))].filter((e) => e !== l.primaryEmail).join(', '),
    match: matchLabel(l),
    emailCheck: emailCheck(l),
    sources: (l.sources || []).map((s) => SOURCE_LABEL[s] || s).join(', '),
  }));
}

function styleHeader(row) {
  row.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E40AF' } };
  row.alignment = { vertical: 'middle' };
  row.height = 20;
}

export async function buildLeadsWorkbook({ title, leads: input, count, jobs = [] }) {
  const leads = uniqueRows(input);
  const wb = new ExcelJS.Workbook();
  wb.creator = 'LeadGen AI';
  wb.created = new Date();

  const summary = wb.addWorksheet('Summary');
  summary.columns = [
    { header: 'Metric', key: 'metric', width: 34 },
    { header: 'Value', key: 'value', width: 60 },
  ];
  styleHeader(summary.getRow(1));
  const withEmail = leads.filter((l) => l.primaryEmail).length;
  const byType = {};
  const bySource = {};
  for (const l of leads) {
    byType[l.primaryEmailCategory || 'none'] = (byType[l.primaryEmailCategory || 'none'] || 0) + 1;
    for (const s of l.sources || []) bySource[s] = (bySource[s] || 0) + 1;
  }
  summary.addRows([
    { metric: 'Report', value: title },
    { metric: 'Generated at', value: new Date().toLocaleString('en-IN') },
    { metric: 'Requested count', value: count === 'all' ? 'All' : Number(count) },
    { metric: 'Leads in report', value: leads.length },
    { metric: 'Leads with email', value: withEmail },
    { metric: 'Leads without email', value: leads.length - withEmail },
    ...Object.entries(byType).map(([k, v]) => ({ metric: `Email type: ${k.toUpperCase()}`, value: v })),
    ...Object.entries(bySource).map(([k, v]) => ({ metric: `Source: ${SOURCE_LABEL[k] || k}`, value: v })),
  ]);
  for (const b of [20, 40, 60]) {
    const slice = leads.slice(0, b);
    summary.addRow({ metric: `Top ${b}: leads / with email`, value: `${slice.length} / ${slice.filter((l) => l.primaryEmail).length}` });
  }
  const verifiedCount = leads.filter((l) => l.verification === 'verified').length;
  if (leads.some((l) => l.verification)) summary.addRow({ metric: 'Verified matches', value: `${verifiedCount} / ${leads.length}` });
  summary.addRow({ metric: 'Duplicate rows in report', value: 0 });
  if (jobs.length) {
    summary.addRow({});
    jobs.forEach((j) => {
      summary.addRow({ metric: `Search: ${j.query}`, value: j.summary || j.status });
      if (j.plan?.locations?.length) summary.addRow({ metric: 'Locations searched', value: j.plan.locations.join(', ') });
      const q = j.quality;
      if (q?.rawResults != null) {
        summary.addRows([
          { metric: 'Raw results collected', value: q.rawResults },
          { metric: 'Duplicates merged', value: q.duplicatesRemoved },
          { metric: 'Off-target businesses removed', value: q.rejected },
          { metric: 'Invalid / shared emails removed', value: q.emailsRemoved },
          { metric: 'AI verification agent', value: q.aiChecked ? 'On' : 'Off (rule-based checks only)' },
        ]);
      }
    });
  }

  const sheet = wb.addWorksheet('Leads', { views: [{ state: 'frozen', ySplit: 1 }] });
  sheet.columns = COLUMNS;
  styleHeader(sheet.getRow(1));
  sheet.addRows(leadRows(leads));
  sheet.autoFilter = { from: 'A1', to: { row: 1, column: COLUMNS.length } };
  for (const key of ['website', 'linkedinUrl', 'instagramUrl']) {
    const col = sheet.getColumn(key);
    col.eachCell((cell, rowNum) => {
      if (rowNum > 1 && typeof cell.value === 'string' && cell.value.startsWith('http')) {
        cell.value = { text: cell.value, hyperlink: cell.value };
        cell.font = { color: { argb: 'FF2563EB' }, underline: true };
      }
    });
  }
  sheet.getColumn('primaryEmail').eachCell((cell, rowNum) => {
    if (rowNum > 1 && cell.value) {
      cell.value = { text: String(cell.value), hyperlink: `mailto:${cell.value}` };
      cell.font = { color: { argb: 'FF2563EB' } };
    }
  });

  return wb.xlsx.writeBuffer();
}
