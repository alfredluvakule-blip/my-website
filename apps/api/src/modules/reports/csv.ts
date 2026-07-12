/** Minimal, dependency-free CSV serializer for exports. RFC-4180 quoting. */

function escapeCell(value: unknown): string {
  if (value === null || value === undefined) return '';
  const s = String(value);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

/** Serialize an array of flat records to CSV. Column order = keys of row 0. */
export function toCsv<T extends object>(rows: T[]): string {
  if (rows.length === 0) return '';
  const headers = Object.keys(rows[0]!);
  const lines = [headers.map(escapeCell).join(',')];
  for (const row of rows) {
    lines.push(headers.map((h) => escapeCell((row as Record<string, unknown>)[h])).join(','));
  }
  return lines.join('\r\n');
}
