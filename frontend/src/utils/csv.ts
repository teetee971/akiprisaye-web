// src/utils/csv.ts
// Minimal CSV parser to avoid adding a dependency. Returns an array of objects

export function parseCsv(content: string, delimiter = ','): Record<string, string>[] {
  const lines = content.split(/\r?\n/).filter(Boolean);
  if (lines.length === 0) return [];

  const headers = lines[0].split(delimiter).map((h) => h.trim());

  return lines.slice(1).map((line) => {
    const cols = line.split(delimiter);
    const record: Record<string, string> = {};
    headers.forEach((h, i) => {
      record[h] = (cols[i] ?? '').trim();
    });
    return record;
  });
}

export function stringifyCsv(rows: Record<string, any>[], delimiter = ',') {
  if (!rows || rows.length === 0) return '';
  const headers = Object.keys(rows[0]);
  const lines = [headers.join(delimiter)];
  rows.forEach((r) => {
    const line = headers.map((h) => {
      const cell = r[h] == null ? '' : String(r[h]);
      // simple escaping
      if (
        cell.includes(delimiter) ||
        cell.includes('"') ||
        cell.includes('\n') ||
        cell.includes('\r')
      ) {
        return `"${cell.replace(/"/g, '""')}"`;
      }
      return cell;
    });
    lines.push(line.join(delimiter));
  });
  return lines.join('\n');
}
