/**
 * Export Service - Generate and download files in various formats
 */

/**
 * Generate CSV from array of objects
 */
export function generateCSV(data: Record<string, unknown>[]): string {
  if (!data || data.length === 0) return '';

  // Get headers from first object
  const headers = Object.keys(data[0]);
  
  // Create CSV rows
  const rows = data.map(item => 
    headers.map(header => {
      const value = item[header];
      const stringValue = value !== null && value !== undefined ? String(value) : '';
      // Escape quotes and wrap in quotes if contains comma, quote, or newline
      return stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')
        ? `"${stringValue.replace(/"/g, '""')}"`
        : stringValue;
    }).join(',')
  );

  return [headers.join(','), ...rows].join('\n');
}

/**
 * Generate PDF from data using jsPDF
 */
export async function generatePDF(data: Record<string, unknown>[]): Promise<Blob> {
  // Dynamic import to reduce bundle size
  const { jsPDF } = await import('jspdf');
  
  const doc = new jsPDF();
  
  // Add title
  doc.setFontSize(16);
  doc.text('Comparaison de prix', 14, 15);
  
  // Add date
  doc.setFontSize(10);
  doc.text(`Généré le ${new Date().toLocaleDateString('fr-FR')}`, 14, 25);
  
  // Add summary
  doc.setFontSize(11);
  doc.text(`Nombre d'éléments: ${data.length}`, 14, 35);
  
  // Add data in a table-like format
  doc.setFontSize(10);
  let yPosition = 45;
  const lineHeight = 7;
  const pageHeight = 280;
  
  // Get all unique keys from data
  const keys = Array.from(new Set(data.flatMap(item => Object.keys(item))));
  
  data.forEach((item, index) => {
    // Check if we need a new page
    if (yPosition > pageHeight) {
      doc.addPage();
      yPosition = 15;
    }
    
    // Item header
    doc.setFont(undefined, 'bold');
    doc.text(`#${index + 1}`, 14, yPosition);
    yPosition += lineHeight;
    
    // Item properties
    doc.setFont(undefined, 'normal');
    keys.forEach(key => {
      if (yPosition > pageHeight) {
        doc.addPage();
        yPosition = 15;
      }
      
      const value = item[key];
      const displayValue = value !== null && value !== undefined ? String(value) : 'N/A';
      const text = `  ${key}: ${displayValue}`;
      
      // Wrap text if too long
      const splitText = doc.splitTextToSize(text, 180);
      doc.text(splitText, 14, yPosition);
      yPosition += lineHeight * splitText.length;
    });
    
    yPosition += 3; // Add spacing between items
  });
  
  return doc.output('blob');
}

/**
 * Download file with given content, filename, and MIME type
 */
export function downloadFile(content: string | Blob, filename: string, mimeType: string): void {
  const blob = typeof content === 'string' 
    ? new Blob([content], { type: mimeType })
    : content;

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
