/**
 * Water Cut History Component
 * Historique des coupures d'eau par commune
 */

import { useEffect, useState } from 'react';
import type { WaterCutHistory } from '../../types/waterComparison';
import {
  getCutHistory,
  calculateCutStatistics,
} from '../../services/waterAvailabilityService';

interface WaterCutHistoryProps {
  commune: string;
  startDate?: string;
  endDate?: string;
}

export default function WaterCutHistoryComponent({
  commune,
  startDate,
  endDate,
}: WaterCutHistoryProps) {
  const [history, setHistory] = useState<WaterCutHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Default to last 30 days
  const defaultStartDate = new Date();
  defaultStartDate.setDate(defaultStartDate.getDate() - 30);
  const defaultEndDate = new Date();

  const searchStartDate = startDate || defaultStartDate.toISOString();
  const searchEndDate = endDate || defaultEndDate.toISOString();

  useEffect(() => {
    loadHistory();
  }, [commune, searchStartDate, searchEndDate]);

  async function loadHistory() {
    if (!commune) return;

    try {
      setLoading(true);
      setError(null);
      const data = await getCutHistory(commune, searchStartDate, searchEndDate);
      setHistory(data);
    } catch (err) {
      console.error('Error loading cut history:', err);
      setError('Erreur lors du chargement de l\'historique');
    } finally {
      setLoading(false);
    }
  }

  const stats = calculateCutStatistics(history);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 bg-slate-900 rounded-lg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto mb-4"></div>
          <p className="text-slate-300">Chargement de l\'historique...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-6 text-center text-red-400">
        <p className="text-xl mb-2">❌ {error}</p>
        <button
          onClick={loadHistory}
          className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors"
        >
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-800 rounded-lg p-4">
          <div className="text-3xl font-bold text-cyan-400 mb-1">
            {stats.totalCuts}
          </div>
          <div className="text-sm text-slate-400">Coupures totales</div>
        </div>

        <div className="bg-slate-800 rounded-lg p-4">
          <div className="text-3xl font-bold text-cyan-400 mb-1">
            {Math.round(stats.averageDuration / 60)}h
          </div>
          <div className="text-sm text-slate-400">Durée moyenne</div>
        </div>

        <div className="bg-slate-800 rounded-lg p-4">
          <div className="text-3xl font-bold text-cyan-400 mb-1">
            {Math.round(stats.longestCut / 60)}h
          </div>
          <div className="text-sm text-slate-400">Plus longue</div>
        </div>

        <div className="bg-slate-800 rounded-lg p-4">
          <div className="text-3xl font-bold text-cyan-400 mb-1">
            {stats.frequencyPerWeek.toFixed(1)}
          </div>
          <div className="text-sm text-slate-400">Par semaine</div>
        </div>
      </div>

      {/* History list */}
      {history.length === 0 ? (
        <div className="bg-slate-800 rounded-lg p-8 text-center text-slate-400">
          <p className="text-lg">
            Aucune coupure enregistrée pour cette période
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-white">
            Historique des coupures ({history.length})
          </h3>

          {history.map((cut) => (
            <div
              key={cut.id}
              className="bg-slate-800 rounded-lg p-4 hover:bg-slate-750 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h4 className="font-medium text-white">
                    {cut.location.commune}
                    {cut.location.quartier && ` - ${cut.location.quartier}`}
                  </h4>
                  <p className="text-sm text-slate-400 mt-1">
                    {new Date(cut.startDate).toLocaleString('fr-FR')}
                    {cut.endDate && (
                      <> → {new Date(cut.endDate).toLocaleString('fr-FR')}</>
                    )}
                  </p>
                </div>

                <div className="text-right">
                  <div
                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                      cut.scheduled
                        ? 'bg-orange-500/20 text-orange-400'
                        : 'bg-red-500/20 text-red-400'
                    }`}
                  >
                    {cut.scheduled ? '📅 Programmée' : '🚨 Imprévue'}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm mt-3">
                <div>
                  <span className="text-slate-400">Durée:</span>
                  <span className="ml-2 text-white font-medium">
                    {Math.round(cut.duration / 60)}h {cut.duration % 60}min
                  </span>
                </div>

                {cut.affectedHouseholds && (
                  <div>
                    <span className="text-slate-400">Foyers touchés:</span>
                    <span className="ml-2 text-white font-medium">
                      {cut.affectedHouseholds.toLocaleString()}
                    </span>
                  </div>
                )}

                {cut.reason && (
                  <div className="col-span-2 md:col-span-1">
                    <span className="text-slate-400">Raison:</span>
                    <span className="ml-2 text-white">{cut.reason}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Timeline visualization (simplified) */}
      {history.length > 0 && (
        <div className="bg-slate-800 rounded-lg p-6">
          <h3 className="text-lg font-bold text-white mb-4">
            Chronologie des coupures
          </h3>

          <div className="space-y-2">
            {history.slice(0, 10).map((cut) => {
              const duration = cut.duration / 60; // hours
              const maxWidth = 100;
              const widthPercent = Math.min((duration / 24) * 100, maxWidth);

              return (
                <div key={cut.id} className="flex items-center gap-3">
                  <div className="text-xs text-slate-400 w-32 flex-shrink-0">
                    {new Date(cut.startDate).toLocaleDateString('fr-FR', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </div>

                  <div className="flex-1">
                    <div
                      className={`h-6 rounded ${
                        cut.scheduled ? 'bg-orange-500/40' : 'bg-red-500/40'
                      } relative`}
                      style={{ width: `${widthPercent}%` }}
                      title={`${Math.round(duration)}h`}
                    >
                      <span className="absolute inset-0 flex items-center justify-center text-xs text-white font-medium">
                        {Math.round(duration)}h
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {history.length > 10 && (
            <p className="text-xs text-slate-400 mt-4 text-center">
              Affichage des 10 coupures les plus récentes
            </p>
          )}
        </div>
      )}
    </div>
  );
}
