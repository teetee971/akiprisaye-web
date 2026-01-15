import { generateCSV, generatePDF, downloadFile } from '../services/exportService';

/**
 * Custom hook for exporting data to various formats
 */
export function useExport() {
  const exportToCSV = async (data: Record<string, unknown>[], filename: string) => {
    const csv = generateCSV(data);
    downloadFile(csv, `${filename}.csv`, 'text/csv');
  };

  const exportToPDF = async (data: Record<string, unknown>[], filename: string) => {
    const pdf = await generatePDF(data);
    downloadFile(pdf, `${filename}.pdf`, 'application/pdf');
  };

  const exportToJSON = (data: unknown, filename: string) => {
    const json = JSON.stringify(data, null, 2);
    downloadFile(json, `${filename}.json`, 'application/json');
  };

  return {
    exportToCSV,
    exportToPDF,
    exportToJSON
  };
}
