/**
 * PalmaresEnseignes Component
 * 
 * Rankings of stores based on price competitiveness
 * Shows best and worst performers
 */

import { useState, useEffect } from 'react';
import { Card } from './ui/card.jsx';
import { liveApiFetchJson } from '../services/liveApiClient';

export function PalmaresEnseignes({ territoire = null }) {
  const [rankings, setRankings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('avgPrice'); // avgPrice, productCount, priceChanges

  useEffect(() => {
    fetchRankings();
  }, [territoire, sortBy]);

  async function fetchRankings() {
    setLoading(true);

    try {
      const payload = await liveApiFetchJson(
        `/rankings/stores?territoire=${encodeURIComponent(territoire || 'GP')}`,
        { incidentReason: 'store_rankings_api_unavailable', timeoutMs: 10000 },
      );
      const apiRankings = Array.isArray(payload?.rankings) ? payload.rankings : [];

      // Sort by selected criteria
      const sorted = [...apiRankings];
      if (sortBy === 'avgPrice') {
        sorted.sort((a, b) => a.avgPrice - b.avgPrice);
      } else if (sortBy === 'productCount') {
        sorted.sort((a, b) => b.productCount - a.productCount);
      } else if (sortBy === 'priceChanges') {
        sorted.sort((a, b) => a.priceChangePercent - b.priceChangePercent);
      }

      setRankings(sorted);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching rankings:', err);
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-yellow-500 to-yellow-700 rounded-lg p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">
          🏆 Palmarès des Enseignes
        </h2>
        <p className="text-yellow-50">
          Classement des magasins selon leur compétitivité prix
        </p>
      </div>

      {/* Sorting options */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setSortBy('avgPrice')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            sortBy === 'avgPrice'
              ? 'bg-primary-500 text-white'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          💰 Prix moyen
        </button>
        <button
          onClick={() => setSortBy('productCount')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            sortBy === 'productCount'
              ? 'bg-primary-500 text-white'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          🛒 Nombre de produits
        </button>
        <button
          onClick={() => setSortBy('priceChanges')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            sortBy === 'priceChanges'
              ? 'bg-primary-500 text-white'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          📊 Évolution prix
        </button>
      </div>

      {/* Rankings list */}
      <div className="space-y-4">
        {rankings.map((store, index) => (
          <Card 
            key={store.id} 
            className={`p-4 transition-all hover:shadow-lg ${
              index < 3 ? 'border-2 border-yellow-400 dark:border-yellow-600' : ''
            }`}
          >
            <div className="flex items-start gap-4">
              {/* Rank */}
              <div className="flex-shrink-0">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold ${
                  index === 0 
                    ? 'bg-yellow-400 text-yellow-900'
                    : index === 1
                      ? 'bg-gray-300 text-gray-700'
                      : index === 2
                        ? 'bg-orange-400 text-orange-900'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                }`}>
                  {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}
                </div>
              </div>

              {/* Store info */}
              <div className="flex-grow">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {store.name}
                    </h3>
                    {store.badge && (
                      <span className="inline-block mt-1 px-3 py-1 text-xs font-semibold bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 rounded-full">
                        {store.badge}
                      </span>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                      {store.score}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      /100
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 mt-3">
                  <div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                      Prix moyen
                    </div>
                    <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {store.avgPrice.toFixed(2)}€
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                      Produits
                    </div>
                    <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {store.productCount}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                      Évolution
                    </div>
                    <div className={`text-lg font-semibold ${
                      store.priceChangePercent < 0
                        ? 'text-green-600 dark:text-green-400'
                        : store.priceChangePercent > 0
                          ? 'text-red-600 dark:text-red-400'
                          : 'text-gray-600 dark:text-gray-400'
                    }`}>
                      {store.priceChangePercent > 0 ? '+' : ''}{store.priceChangePercent.toFixed(1)}%
                    </div>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mt-3">
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        store.score >= 80
                          ? 'bg-green-500'
                          : store.score >= 60
                            ? 'bg-yellow-500'
                            : 'bg-orange-500'
                      }`}
                      style={{ width: `${store.score}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Info footer */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <p className="text-sm text-blue-800 dark:text-blue-200">
          ℹ️ Le score est calculé sur la base du prix moyen, de la diversité des produits,
          et de l'évolution des prix. Données mises à jour quotidiennement.
        </p>
      </div>
    </div>
  );
}
