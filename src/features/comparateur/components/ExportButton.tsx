import { useState } from 'react';
import { useExport } from '../hooks/useExport';
import { toast } from '../utils/toast';

interface ExportButtonProps {
  data: Record<string, unknown>[];
  filename?: string;
  formats?: ('csv' | 'pdf' | 'json')[];
}

export function ExportButton({ 
  data, 
  filename = 'export', 
  formats = ['csv', 'pdf', 'json'] 
}: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const { exportToCSV, exportToPDF, exportToJSON } = useExport();

  const handleExport = async (format: 'csv' | 'pdf' | 'json') => {
    setIsExporting(true);
    setShowMenu(false);

    try {
      switch (format) {
        case 'csv':
          await exportToCSV(data, filename);
          break;
        case 'pdf':
          await exportToPDF(data, filename);
          break;
        case 'json':
          exportToJSON(data, filename);
          break;
      }
      
      toast.success(`Export ${format.toUpperCase()} réussi!`);
    } catch (error) {
      toast.error('Erreur lors de l\'export');
      console.error(error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="relative">
      <button 
        onClick={() => setShowMenu(!showMenu)}
        disabled={isExporting}
        className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded-lg transition-colors font-medium"
        aria-label="Exporter les données"
      >
        {isExporting ? '⏳ Export...' : '📥 Exporter'}
      </button>

      {showMenu && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowMenu(false)}
            aria-hidden="true"
          />

          {/* Menu */}
          <div className="absolute right-0 mt-2 w-48 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-20 overflow-hidden">
            {formats.includes('csv') && (
              <button 
                onClick={() => handleExport('csv')}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-700 transition-colors text-left"
              >
                <span>📊</span>
                <span className="text-sm text-gray-200">Export CSV</span>
              </button>
            )}
            {formats.includes('pdf') && (
              <button 
                onClick={() => handleExport('pdf')}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-700 transition-colors text-left"
              >
                <span>📄</span>
                <span className="text-sm text-gray-200">Export PDF</span>
              </button>
            )}
            {formats.includes('json') && (
              <button 
                onClick={() => handleExport('json')}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-700 transition-colors text-left"
              >
                <span>💾</span>
                <span className="text-sm text-gray-200">Export JSON</span>
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
