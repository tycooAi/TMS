/**
 * SRI AMMAN ARUL TRANSPORTS - CSV Export Utility
 * Handles RFC-4180 compliant CSV formatting, escaping of commas, quotes, newlines,
 * UTF-8 BOM encoding for Excel compatibility, and robust client-side download triggers.
 */

export function escapeCSV(val: any): string {
  if (val === null || val === undefined) return '';
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function downloadCSV(
  filename: string,
  headers: string[],
  rows: (string | number | undefined | null)[][]
): boolean {
  if (!rows || rows.length === 0) {
    alert('No data available to export with the current active filters.');
    return false;
  }

  // Prepend UTF-8 BOM (\uFEFF) so Excel and spreadsheet editors open international text properly
  const csvContent =
    '\uFEFF' +
    [
      headers.map(escapeCSV).join(','),
      ...rows.map((row) => row.map(escapeCSV).join(',')),
    ].join('\r\n');

  try {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const safeFilename = filename.toLowerCase().endsWith('.csv')
      ? filename
      : `${filename}.csv`;
    link.setAttribute('href', url);
    link.setAttribute('download', safeFilename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    return true;
  } catch (err: any) {
    console.error('Failed to trigger CSV download:', err);
    alert(`Failed to download CSV: ${err?.message || 'Unknown error'}`);
    return false;
  }
}
