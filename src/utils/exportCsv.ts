/**
 * Utility function to export a dataset to a CSV file and trigger download.
 * @param filename The desired filename (e.g., 'sales_data.csv')
 * @param data Array of objects representing the rows of data
 */
export function exportToCSV(filename: string, data: any[]): void {
  if (!data || !data.length) {
    console.warn('No data provided to export.');
    return;
  }

  // Extract headers
  const headers = Object.keys(data[0]);

  // Create CSV content
  const csvRows = [];
  
  // 1. Add headers row
  csvRows.push(headers.map((header) => `"${String(header).replace(/"/g, '""')}"`).join(','));

  // 2. Add data rows
  for (const row of data) {
    const values = headers.map((header) => {
      const val = row[header];
      const stringVal = val === null || val === undefined ? '' : String(val);
      // Escape double quotes by replacing " with ""
      return `"${stringVal.replace(/"/g, '""')}"`;
    });
    csvRows.push(values.join(','));
  }

  const csvContent = csvRows.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });

  // Trigger download
  const link = document.createElement('a');
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}
