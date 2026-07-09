/**
 * Export data as a CSV file download.
 * @param data Array of objects to export
 * @param columns Column definitions: { key, header }
 * @param filename The download filename (without .csv extension)
 */
export function exportToCsv<T extends Record<string, unknown>>(
  data: T[],
  columns: { key: string; header: string }[],
  filename: string
): void {
  if (data.length === 0) return;

  // Build CSV header
  const headers = columns.map(c => escapeCell(c.header)).join(',');

  // Build CSV rows
  const rows = data.map(row =>
    columns.map(col => {
      const value = getNestedValue(row, col.key);
      return escapeCell(formatValue(value));
    }).join(',')
  );

  const csvContent = [headers, ...rows].join('\n');

  // Create download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.csv`;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function escapeCell(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (Array.isArray(value)) return value.join('; ');
  return String(value);
}

function getNestedValue(obj: Record<string, unknown>, key: string): unknown {
  return key.split('.').reduce((acc: unknown, part) => {
    if (acc && typeof acc === 'object') return (acc as Record<string, unknown>)[part];
    return undefined;
  }, obj);
}
