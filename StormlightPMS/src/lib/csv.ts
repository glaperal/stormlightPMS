import Papa from 'papaparse';

export function exportCsv(filename: string, rows: Record<string, unknown>[]): void {
  if (!rows.length) {
    triggerDownload(filename, '');
    return;
  }
  const csv = Papa.unparse(rows);
  triggerDownload(filename, csv);
}

function triggerDownload(filename: string, content: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function parseCsv<T>(file: File): Promise<{ rows: T[]; errors: Papa.ParseError[] }> {
  return new Promise((resolve, reject) => {
    Papa.parse<T>(file, {
      header: true,
      skipEmptyLines: 'greedy',
      complete: (result) => resolve({ rows: result.data, errors: result.errors }),
      error: (err) => reject(err),
    });
  });
}
