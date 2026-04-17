/**
 * ImportPreview Component
 * Display CSV data preview with validation errors
 */
import { useMemo } from 'react';
import { useReactTable, getCoreRowModel, flexRender, type ColumnDef } from '@tanstack/react-table';
import { AlertTriangle, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ImportError } from '@/services/csvImportService';

export interface ImportPreviewProps {
  data: any[];
  errors: ImportError[];
  maxRows?: number;
  onValidationComplete?: (validCount: number, errorCount: number) => void;
}

export function ImportPreview({
  data,
  errors,
  maxRows = 20,
  onValidationComplete,
}: ImportPreviewProps) {
  // Group errors by row
  const errorsByRow = useMemo(() => {
    const map = new Map<number, ImportError[]>();
    errors.forEach((error) => {
      const existing = map.get(error.row) || [];
      existing.push(error);
      map.set(error.row, existing);
    });
    return map;
  }, [errors]);

  // Calculate statistics
  const validRows = useMemo(() => {
    const uniqueErrorRows = new Set(errors.map((e) => e.row));
    return data.length - uniqueErrorRows.size;
  }, [data, errors]);

  const errorRows = useMemo(() => {
    return new Set(errors.map((e) => e.row)).size;
  }, [errors]);

  // Notify parent of validation results
  useMemo(() => {
    onValidationComplete?.(validRows, errorRows);
  }, [validRows, errorRows, onValidationComplete]);

  // Generate columns from data
  const columns = useMemo<ColumnDef<any>[]>(() => {
    if (data.length === 0) return [];

    const keys = Object.keys(data[0]);
    return keys.map((key) => ({
      accessorKey: key,
      header: key,
      cell: ({ row, getValue }) => {
        const rowNumber = row.index + 2; // +2 for 0-index and header row
        const rowErrors = errorsByRow.get(rowNumber);
        const fieldError = rowErrors?.find((e) => e.field === key);
        const value = getValue() as string;

        return (
          <div className="relative group">
            <span className={cn(fieldError && 'text-red-400 font-medium')}>{value || '-'}</span>
            {fieldError && (
              <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block z-10 w-64">
                <div className="bg-red-500/90 backdrop-blur-sm text-white text-xs p-2 rounded-lg shadow-lg">
                  {fieldError.message}
                </div>
              </div>
            )}
          </div>
        );
      },
    }));
  }, [data, errorsByRow]);

  const previewData = useMemo(() => data.slice(0, maxRows), [data, maxRows]);

  const table = useReactTable({
    data: previewData,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (data.length === 0) {
    return <div className="py-8 text-center text-slate-600">Aucune donnée à afficher</div>;
  }

  return (
    <div className="space-y-4">
      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-lg border border-slate-300 bg-white p-4 backdrop-blur-sm">
          <div className="text-2xl font-bold text-slate-900">{data.length}</div>
          <div className="text-sm text-slate-600">Total de lignes</div>
        </div>
        <div className="p-4 bg-green-500/10 backdrop-blur-sm border border-green-500/30 rounded-lg">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-5 h-5 text-green-400" />
            <div className="text-2xl font-bold text-green-400">{validRows}</div>
          </div>
          <div className="text-sm text-slate-600">Lignes valides</div>
        </div>
        <div className="p-4 bg-red-500/10 backdrop-blur-sm border border-red-500/30 rounded-lg">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            <div className="text-2xl font-bold text-red-400">{errorRows}</div>
          </div>
          <div className="text-sm text-slate-600">Lignes avec erreurs</div>
        </div>
      </div>

      {/* Error Summary */}
      {errorRows > 0 && (
        <div className="p-4 bg-yellow-500/10 backdrop-blur-sm border border-yellow-500/30 rounded-lg">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-yellow-400 mb-1">
                Attention: {errorRows} ligne{errorRows > 1 ? 's' : ''} contient
                {errorRows > 1 ? '' : ''} des erreurs
              </p>
              <p className="text-xs text-slate-700">
                Les lignes avec erreurs seront ignorées lors de l'import. Survolez les champs en
                rouge pour voir les détails des erreurs.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Preview Table */}
      <div className="overflow-x-auto rounded-lg border border-slate-300">
        <table className="w-full text-sm">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="border-b border-slate-200 bg-slate-50">
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-700">
                  #
                </th>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-700"
                  >
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-slate-100">
            {table.getRowModel().rows.map((row) => {
              const rowNumber = row.index + 2;
              const hasError = errorsByRow.has(rowNumber);

              return (
                <tr
                  key={row.id}
                  className={cn(
                    'transition-colors',
                    hasError ? 'bg-red-500/5 hover:bg-red-500/10' : 'hover:bg-slate-50'
                  )}
                >
                  <td className="px-4 py-3 font-mono text-xs text-slate-500">{rowNumber}</td>
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-3 text-slate-800">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {data.length > maxRows && (
        <div className="py-2 text-center text-sm text-slate-600">
          Affichage de {maxRows} lignes sur {data.length}
        </div>
      )}

      {/* Detailed Error List */}
      {errors.length > 0 && (
        <details className="mt-4">
          <summary className="mb-2 cursor-pointer text-sm font-medium text-slate-700 hover:text-slate-900">
            Voir la liste détaillée des erreurs ({errors.length})
          </summary>
          <div className="mt-2 space-y-2 max-h-64 overflow-y-auto">
            {errors.map((error, index) => (
              <div
                key={`${error.row}-${error.field ?? 'general'}-${index}`}
                className="p-3 bg-red-500/5 border border-red-500/20 rounded-lg text-sm"
              >
                <div className="flex items-start space-x-2">
                  <span className="text-red-400 font-mono text-xs">Ligne {error.row}</span>
                  {error.field && (
                    <span className="text-xs text-slate-500">· Champ: {error.field}</span>
                  )}
                </div>
                <p className="mt-1 text-slate-800">{error.message}</p>
                {error.value && (
                  <p className="mt-1 text-xs text-slate-500">Valeur: "{error.value}"</p>
                )}
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}
