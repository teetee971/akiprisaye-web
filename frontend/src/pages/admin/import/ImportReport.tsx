 
/**
 * ImportReport Component
 * Display import results and statistics
 */
import { CheckCircle, XCircle, AlertTriangle, Download, RefreshCw } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { cn } from '@/lib/utils';
import { stringifyCsv } from '@/utils/csv';
import type { ImportResult } from '@/services/csvImportService';

export interface ImportReportProps {
  result: ImportResult<any>;
  onReset: () => void;
  entityType: string; // "magasins" or "produits"
}

export function ImportReport({ result, onReset, entityType }: ImportReportProps) {
  const successRate = result.total > 0 ? (result.successful / result.total) * 100 : 0;

  const downloadErrorReport = () => {
    if (result.errors.length === 0) return;

    const errorData = result.errors.map(error => ({
      ligne: error.row,
      champ: error.field || '',
      valeur: error.value || '',
      erreur: error.message,
    }));

    const csv = stringifyCsv(errorData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `erreurs-import-${entityType}-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <GlassCard className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/10 mb-4">
          {result.success ? (
            <CheckCircle className="w-8 h-8 text-green-400" />
          ) : (
            <AlertTriangle className="w-8 h-8 text-yellow-400" />
          )}
        </div>
        <h3 className="text-2xl font-bold text-white/90 mb-2">
          {result.success ? 'Import réussi !' : 'Import terminé avec des erreurs'}
        </h3>
        <p className="text-white/60">
          {result.success
            ? `Tous les ${entityType} ont été importés avec succès`
            : `Certains ${entityType} n'ont pas pu être importés`}
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-white/5 backdrop-blur-sm border border-white/20 rounded-lg text-center">
          <div className="text-3xl font-bold text-white/90 mb-1">{result.total}</div>
          <div className="text-sm text-white/60">Total de lignes</div>
        </div>
        
        <div className="p-4 bg-green-500/10 backdrop-blur-sm border border-green-500/30 rounded-lg text-center">
          <div className="flex items-center justify-center space-x-2 mb-1">
            <CheckCircle className="w-5 h-5 text-green-400" />
            <div className="text-3xl font-bold text-green-400">{result.successful}</div>
          </div>
          <div className="text-sm text-white/60">Importés</div>
        </div>
        
        <div className="p-4 bg-red-500/10 backdrop-blur-sm border border-red-500/30 rounded-lg text-center">
          <div className="flex items-center justify-center space-x-2 mb-1">
            <XCircle className="w-5 h-5 text-red-400" />
            <div className="text-3xl font-bold text-red-400">{result.failed}</div>
          </div>
          <div className="text-sm text-white/60">Échecs</div>
        </div>
      </div>

      {/* Success Rate Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-white/70">Taux de réussite</span>
          <span className={cn(
            'font-semibold',
            successRate === 100 ? 'text-green-400' :
            successRate >= 80 ? 'text-yellow-400' :
            'text-red-400'
          )}>
            {successRate.toFixed(1)}%
          </span>
        </div>
        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
          <div
            className={cn(
              'h-full transition-all duration-500 rounded-full',
              successRate === 100 ? 'bg-green-500' :
              successRate >= 80 ? 'bg-yellow-500' :
              'bg-red-500'
            )}
            style={{ width: `${successRate}%` }}
          />
        </div>
      </div>

      {/* Error List */}
      {result.errors.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-white/90 flex items-center space-x-2">
              <XCircle className="w-4 h-4 text-red-400" />
              <span>Erreurs détectées ({result.errors.length})</span>
            </h4>
            <button
              onClick={downloadErrorReport}
              className="flex items-center space-x-2 px-3 py-1.5 text-xs font-medium text-white/80 hover:text-white bg-white/5 hover:bg-white/10 border border-white/20 rounded-lg transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Télécharger le rapport</span>
            </button>
          </div>

          <div className="max-h-64 overflow-y-auto space-y-2">
            {result.errors.slice(0, 20).map((error, index) => (
              <div
                key={`${error.row}-${error.field ?? 'general'}-${index}`}
                className="p-3 bg-red-500/5 border border-red-500/20 rounded-lg"
              >
                <div className="flex items-start space-x-2">
                  <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-red-500/20 rounded text-xs font-mono text-red-400">
                    {error.row}
                  </div>
                  <div className="flex-1 min-w-0">
                    {error.field && (
                      <div className="text-xs text-white/50 mb-1">
                        Champ: <span className="font-medium text-white/70">{error.field}</span>
                      </div>
                    )}
                    <p className="text-sm text-white/80">{error.message}</p>
                    {error.value && (
                      <p className="text-xs text-white/50 mt-1 truncate">
                        Valeur: "{error.value}"
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {result.errors.length > 20 && (
              <div className="text-center text-sm text-white/60 py-2">
                ... et {result.errors.length - 20} autres erreurs
              </div>
            )}
          </div>
        </div>
      )}

      {/* Success Message */}
      {result.success && result.successful > 0 && (
        <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
          <div className="flex items-start space-x-3">
            <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-green-400 mb-1">
                Import terminé avec succès
              </p>
              <p className="text-xs text-white/70">
                {result.successful} {entityType} ont été importés dans la base de données.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-center pt-4">
        <button
          onClick={onReset}
          className="flex items-center space-x-2 px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/30 text-white font-medium rounded-lg transition-colors"
        >
          <RefreshCw className="w-5 h-5" />
          <span>Importer un autre fichier</span>
        </button>
      </div>
    </GlassCard>
  );
}
