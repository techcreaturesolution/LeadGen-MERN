import ExcelJS from 'exceljs';

const COLUMNS = [
  { header: '#', key: 'rank', width: 5 },
  { header: 'Company / Business', key: 'name', width: 34 },
  { header: 'Primary Email', key: 'primaryEmail', width: 32 },
  { header: 'Email Type', key: 'primaryEmailCategory', width: 11 },
  { header: 'Other Emails', key: 'otherEmails', width: 40 },
  { header: 'Phone', key: 'phone', width: 18 },
  { header: 'Website', key: 'website', width: 32 },
  { header: 'Category', key: 'category', width: 20 },
  { header: 'Address', key: 'address', width: 40 },
  { header: 'City', key: 'city', width: 14 },
  { header: 'Rating', key: 'rating', width: 8 },
  { header: 'Reviews', key: 'reviewsCount', width: 9 },
  { header: 'LinkedIn', key: 'linkedinUrl', width: 32 },
  { header: 'Instagram', key: 'instagramUrl', width: 32 },
  { header: 'Sources', key: 'sources', width: 22 },
  { header: 'Lead Score', key: 'score', width: 10 },
  { header: 'AI Note', key: 'aiNote', width: 45 },
];

const SOURCE_LABEL = { google_maps: 'Google Maps', linkedin: 'LinkedIn', instagram: 'Instagram' };

function styleHeader(row) {
  row.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E40AF' } };
  row.alignment = { vertical: 'middle' };
  row.height = 20;
}

export async function buildLeadsWorkbook({ title, leads, count, jobs = [] }) {
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
  if (jobs.length) {
    summary.addRow({});
    jobs.forEach((j) => summary.addRow({ metric: `Search: ${j.query}`, value: j.summary || j.status }));
  }

  const sheet = wb.addWorksheet('Leads', { views: [{ state: 'frozen', ySplit: 1 }] });
  sheet.columns = COLUMNS;
  styleHeader(sheet.getRow(1));
  leads.forEach((l, i) => {
    sheet.addRow({
      ...l,
      rank: i + 1,
      primaryEmailCategory: (l.primaryEmailCategory || '').toUpperCase(),
      otherEmails: (l.emails || [])
        .slice(1)
        .map((e) => e.email)
        .join(', '),
      sources: (l.sources || []).map((s) => SOURCE_LABEL[s] || s).join(', '),
    });
  });
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
