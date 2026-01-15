/**
 * Price History Page
 * Display price evolution charts and statistics
 */

import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Info, TrendingUp, AlertCircle } from 'lucide-react';
import { PriceHistoryChart } from '../components/PriceHistoryChart';
import { historyService } from '../services/historyService';
import type { PriceHistoryPoint, Timeframe } from '../types/priceHistory';

export default function PriceHistoryPage() {
  const [data, setData] = useState<PriceHistoryPoint[]>([]);
  const [timeframe, setTimeframe] = useState<Timeframe>('30d');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    loadHistory();
  }, [timeframe]);

  const loadHistory = async () => {
    setLoading(true);
    setError(false);
    try {
      // TODO: Replace with actual product EAN from URL params or search
      const mockEan = '3017620422003';
      const history = await historyService.getPriceHistory(mockEan, timeframe);
      setData(history.dataPoints);
    } catch (err) {
      console.error('Failed to load price history:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Historique des Prix Observés - A KI PRI SA YÉ</title>
        <meta 
          name="description" 
          content="Évolution réelle des prix dans le temps à partir des données collectées localement" 
        />
      </Helmet>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-8">
        <div className="container mx-auto px-4">
          {/* En-tête explicatif */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
              Historique des prix observés
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              Évolution réelle des prix dans le temps à partir des données collectées
            </p>
          </div>

          {/* Contexte avant graphique */}
          <div className="mb-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-blue-800 dark:text-blue-200">
                Les variations peuvent être liées à la saisonnalité, au transport ou à l'offre locale
              </p>
            </div>
          </div>

          {/* Timeframe Selector */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Période affichée: <strong>{timeframe === '7d' && '7 jours'}{timeframe === '30d' && '30 jours'}{timeframe === '90d' && '90 jours'}{timeframe === '365d' && '1 an'}</strong>
            </label>
            <div className="flex gap-2">
              {(['7d', '30d', '90d', '365d'] as Timeframe[]).map(tf => (
                <button
                  key={tf}
                  onClick={() => setTimeframe(tf)}
                  className={`
                    px-4 py-2 rounded-lg font-semibold transition-colors
                    ${timeframe === tf 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }
                  `}
                >
                  {tf === '7d' && '7 jours'}
                  {tf === '30d' && '30 jours'}
                  {tf === '90d' && '90 jours'}
                  {tf === '365d' && '1 an'}
                </button>
              ))}
            </div>
          </div>

          {/* Loading state avec skeleton */}
          {loading ? (
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg animate-pulse">
              <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-1/3 mb-4"></div>
              <div className="h-96 bg-slate-200 dark:bg-slate-700 rounded"></div>
            </div>
          ) : error ? (
            /* État erreur */
            <div className="bg-white dark:bg-slate-800 rounded-xl p-12 shadow-lg text-center">
              <AlertCircle className="w-12 h-12 text-orange-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                Données temporairement indisponibles
              </h3>
              <p className="text-slate-600 dark:text-slate-400 mb-6">
                Nous ne pouvons pas charger l'historique pour le moment
              </p>
              <button
                onClick={loadHistory}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
              >
                Réessayer
              </button>
            </div>
          ) : (
            <PriceHistoryChart data={data} showTrendLine showAverage />
          )}

          {/* CTA discret */}
          {!loading && !error && data.length > 0 && (
            <div className="mt-8 bg-gradient-to-r from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-700 rounded-lg p-6 border border-slate-200 dark:border-slate-600">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-blue-600" />
                    Voir l'impact sur l'inflation globale
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Découvrez comment ces variations affectent le pouvoir d'achat local
                  </p>
                </div>
                <a
                  href="/inflation"
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold whitespace-nowrap"
                >
                  Voir l'inflation
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
