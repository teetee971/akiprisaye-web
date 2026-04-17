/**
 * IndiceVieChere Component
 *
 * Displays the "Cost of Living Index" for DOM-COM territories
 * Uses real observatoire price snapshots (public/data/observatoire/*.json)
 * — zero fictional data.
 */

import { useState, useEffect } from 'react';
import { Card } from './ui/card.jsx';

/** Territories that have real observatoire snapshots */
const TERRITORY_STEMS = [
  { code: 'GP', name: 'Guadeloupe', flag: '🇬🇵', stem: 'guadeloupe' },
  { code: 'MQ', name: 'Martinique', flag: '🇲🇶', stem: 'martinique' },
  { code: 'GF', name: 'Guyane', flag: '🇬🇫', stem: 'guyane' },
  { code: 'RE', name: 'La Réunion', flag: '🇷🇪', stem: 'la_r\u00e9union' },
  { code: 'YT', name: 'Mayotte', flag: '🇾🇹', stem: 'mayotte' },
  { code: 'BL', name: 'Saint-Barthélemy', flag: '🇧🇱', stem: 'saint_barthelemy' },
  { code: 'MF', name: 'Saint-Martin', flag: '🇲🇫', stem: 'saint_martin' },
  { code: 'PM', name: 'Saint-Pierre-et-Miquelon', flag: '🇵🇲', stem: 'saint_pierre_et_miquelon' },
];

const CURRENT_MONTH = '2026-03';
const PREVIOUS_MONTH = '2026-02';
const BASE_URL = typeof import.meta !== 'undefined' ? (import.meta.env?.BASE_URL ?? '/') : '/';

async function fetchSnapshot(stem, month) {
  try {
    const r = await fetch(`${BASE_URL}data/observatoire/${stem}_${month}.json`);
    if (!r.ok) return null;
    return r.json();
  } catch {
    return null;
  }
}

function avgPrices(snapshot) {
  if (!snapshot?.donnees?.length) return 0;
  const sum = snapshot.donnees.reduce((s, d) => s + d.prix, 0);
  return sum / snapshot.donnees.length;
}

export function IndiceVieChere({ selectedTerritory = null }) {
  const [indices, setIndices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    loadIndices();
  }, [selectedTerritory, selectedCategory]);

  async function loadIndices() {
    setLoading(true);
    setError(null);

    try {
      // Load hexagone as baseline
      const hexSnap = await fetchSnapshot('hexagone', CURRENT_MONTH);
      const hexAvg = avgPrices(hexSnap);

      const results = await Promise.all(
        TERRITORY_STEMS.map(async (t) => {
          const [curr, prev] = await Promise.all([
            fetchSnapshot(t.stem, CURRENT_MONTH),
            fetchSnapshot(t.stem, PREVIOUS_MONTH),
          ]);
          if (!curr) return null;

          const currAvg = avgPrices(curr);
          const prevAvg = avgPrices(prev);
          const vsMetropole = hexAvg > 0 ? ((currAvg - hexAvg) / hexAvg) * 100 : 0;

          let trend = 'stable';
          let trendPercent = 0;
          if (prevAvg > 0) {
            const delta = ((currAvg - prevAvg) / prevAvg) * 100;
            trendPercent = Math.abs(delta);
            trend = delta > 0.1 ? 'up' : delta < -0.1 ? 'down' : 'stable';
          }

          return {
            territory: t.code,
            territoryName: t.name,
            flag: t.flag,
            avgPrice: Math.round(currAvg * 100) / 100,
            productCount: curr.donnees.length,
            vsMetropole: Math.round(vsMetropole * 10) / 10,
            trend,
            trendPercent: Math.round(trendPercent * 10) / 10,
          };
        })
      );

      let data = results.filter(Boolean).sort((a, b) => b.vsMetropole - a.vsMetropole);

      if (selectedTerritory) {
        data = data.filter((i) => i.territory === selectedTerritory);
      }

      setIndices(data);
      setLoading(false);
    } catch (err) {
      console.error('Error loading observatoire indices:', err);
      setError(err.message);
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

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <p className="text-red-800 dark:text-red-200">
          ⚠️ Erreur lors du chargement des indices : {error}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-500 to-primary-700 rounded-lg p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">📊 Indice Vie Chère DOM-COM</h2>
        <p className="text-primary-50">Comparaison des prix moyens par territoire</p>
      </div>

      {/* Category filter */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            selectedCategory === 'all'
              ? 'bg-primary-500 text-white'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          Tous
        </button>
        <button
          onClick={() => setSelectedCategory('food')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            selectedCategory === 'food'
              ? 'bg-primary-500 text-white'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          Alimentation
        </button>
        <button
          onClick={() => setSelectedCategory('hygiene')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            selectedCategory === 'hygiene'
              ? 'bg-primary-500 text-white'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          Hygiène
        </button>
      </div>

      {/* Indices list */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {indices.map((indice, index) => (
          <Card key={indice.territory} className="p-4 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-2xl">{indice.flag}</span>
                  <h3 className="font-semibold text-lg">{indice.territoryName}</h3>
                </div>
                {index === 0 && (
                  <span className="inline-block px-2 py-1 text-xs font-semibold bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 rounded">
                    🔴 Plus cher
                  </span>
                )}
                {index === indices.length - 1 && indices.length > 1 && (
                  <span className="inline-block px-2 py-1 text-xs font-semibold bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 rounded">
                    🟢 Plus abordable
                  </span>
                )}
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                  {indice.avgPrice.toFixed(0)}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">indice</div>
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">vs Métropole</span>
                <span className="font-semibold text-orange-600 dark:text-orange-400">
                  +{indice.vsMetropole.toFixed(1)}%
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Produits</span>
                <span className="font-medium">{indice.productCount}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Tendance</span>
                <span
                  className={`flex items-center gap-1 ${
                    indice.trend === 'up'
                      ? 'text-red-600 dark:text-red-400'
                      : 'text-green-600 dark:text-green-400'
                  }`}
                >
                  {indice.trend === 'up' ? '↗' : '↘'}
                  {indice.trendPercent.toFixed(1)}%
                </span>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {indices.length === 0 && (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          Aucune donnée disponible pour ce territoire.
        </div>
      )}

      {/* Footer info */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <p className="text-sm text-blue-800 dark:text-blue-200">
          ℹ️ L'indice vie chère est calculé sur la base des prix moyens de{' '}
          {indices.reduce((sum, i) => sum + i.productCount, 0)} produits. Données mises à jour
          quotidiennement.
        </p>
      </div>
    </div>
  );
}
