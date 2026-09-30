import { COLUMNS, leadRows, uniqueRows } from './excel.js';

// Quotes a value and neutralises spreadsheet formulas (=, @, and +/- not followed by a plain number) so opening the file in Excel is safe.
export function csvCell(value) {
  if (value === null || value === undefined) return '';
  let s = String(value);
  if (/^[=@\t\r]/.test(s) || /^[+-](?![\d\s().-]*$)/.test(s)) s = `'${s}`;
  return /[",\n\r]/.test(s) || s !== s.trim() ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCsv(columns, rows) {
  const lines = [columns.map((c) => csvCell(c.header)).join(','), ...rows.map((r) => columns.map((c) => csvCell(r[c.key])).join(','))];
  return `\uFEFF${lines.join('\r\n')}\r\n`;
}

export function buildLeadsCsv(leads) {
  return toCsv(COLUMNS, leadRows(uniqueRows(leads)));
}
