import { buildLeadsCsv, toCsv } from './csv.js';
import { buildLeadsWorkbook } from './excel.js';
import ExcelJS from 'exceljs';

export const EXPORT_FORMATS = ['xlsx', 'csv'];

const XLSX_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

export const safeName = (title, fallback = 'leads') => String(title || '').replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').slice(0, 50) || fallback;

function send(res, { name, format, body }) {
  res.setHeader('Content-Type', format === 'csv' ? 'text/csv; charset=utf-8' : XLSX_TYPE);
  res.setHeader('Content-Disposition', `attachment; filename="${name}.${format}"`);
  res.send(Buffer.from(body));
}

export async function sendLeadsFile(res, { title, leads, count, jobs = [], format = 'xlsx' }) {
  const body = format === 'csv' ? buildLeadsCsv(leads) : await buildLeadsWorkbook({ title, leads, count, jobs });
  send(res, { name: `${safeName(title)}-${count}`, format, body });
}

export async function sendTableFile(res, { title, sheet, columns, rows, format = 'xlsx' }) {
  let body;
  if (format === 'csv') body = toCsv(columns, rows);
  else {
    const wb = new ExcelJS.Workbook();
    wb.creator = 'LeadGen AI';
    const ws = wb.addWorksheet(sheet, { views: [{ state: 'frozen', ySplit: 1 }] });
    ws.columns = columns;
    ws.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    ws.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E40AF' } };
    ws.addRows(rows);
    ws.autoFilter = { from: 'A1', to: { row: 1, column: columns.length } };
    body = await wb.xlsx.writeBuffer();
  }
  send(res, { name: safeName(title, 'export'), format, body });
}
