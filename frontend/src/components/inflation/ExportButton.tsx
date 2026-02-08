import React, { useState } from 'react';
import { Download, FileText, FileSpreadsheet, File } from 'lucide-react';
import * as XLSX from 'xlsx';

interface ExportButtonProps {
  data: any;
  filename?: string;
}

export const ExportButton: React.FC<ExportButtonProps> = ({ 
  data, 
  filename = 'inflation-report' 
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const exportCSV = () => {
    const csv = convertToCSV(data);
    downloadFile(csv, `${filename}.csv`, 'text/csv');
    setIsOpen(false);
  };

  const exportJSON = () => {
    const json = JSON.stringify(data, null, 2);
    downloadFile(json, `${filename}.json`, 'application/json');
    setIsOpen(false);
  };

  const exportXLSX = () => {
    const worksheet = XLSX.utils.json_to_sheet(flattenData(data));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Inflation');
    XLSX.writeFile(workbook, `${filename}.xlsx`);
    setIsOpen(false);
  };

  const convertToCSV = (obj: any): string => {
    const flattened = flattenData(obj);
    if (flattened.length === 0) return '';
    
    const headers = Object.keys(flattened[0]);
    const csvRows = [
      headers.join(','),
      ...flattened.map(row => 
        headers.map(header => JSON.stringify(row[header] ?? '')).join(',')
      )
    ];
    
    return csvRows.join('\n');
  };

  const flattenData = (obj: any): any[] => {
    if (Array.isArray(obj)) {
      return obj.map(item => flattenObject(item));
    }
    return [flattenObject(obj)];
  };

  const flattenObject = (obj: any, prefix = ''): any => {
    return Object.keys(obj).reduce((acc: any, key: string) => {
      const prefixedKey = prefix ? `${prefix}_${key}` : key;
      
      if (obj[key] && typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
        Object.assign(acc, flattenObject(obj[key], prefixedKey));
      } else if (Array.isArray(obj[key])) {
        acc[prefixedKey] = obj[key].join('; ');
      } else {
        acc[prefixedKey] = obj[key];
      }
      
      return acc;
    }, {});
  };

  const downloadFile = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <Download size={18} />
        Exporter
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
          <div 
            className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20"
            role="menu"
          >
            <button
              onClick={exportCSV}
              className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2 text-sm"
              role="menuitem"
            >
              <FileText size={16} />
              Format CSV
            </button>
            <button
              onClick={exportJSON}
              className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2 text-sm"
              role="menuitem"
            >
              <File size={16} />
              Format JSON
            </button>
            <button
              onClick={exportXLSX}
              className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2 text-sm"
              role="menuitem"
            >
              <FileSpreadsheet size={16} />
              Format Excel
            </button>
          </div>
        </>
      )}
    </div>
  );
};
