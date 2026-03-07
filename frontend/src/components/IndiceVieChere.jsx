 
/**
 * IndiceVieChere Component
 * 
 * Displays the "Cost of Living Index" for DOM-COM territories
 * Shows average prices, comparisons, and territory rankings
 */

import { useState, useEffect } from 'react';

const TERRITORIES = [
  { code: 'GP', name: 'Guadeloupe', flag: '🇬🇵' },
  { code: 'MQ', name: 'Martinique', flag: '🇲🇶' },
  { code: 'GF', name: 'Guyane', flag: '🇬🇫' },
  { code: 'RE', name: 'La Réunion', flag: '🇷🇪' },
  { code: 'YT', name: 'Mayotte', flag: '🇾🇹' },
  { code: 'PM', name: 'Saint-Pierre-et-Miquelon', flag: '🇵🇲' },
  { code: 'BL', name: 'Saint-Barthélemy', flag: '🇧🇱' },
  { code: 'MF', name: 'Saint-Martin', flag: '🇲🇫' },
  { code: 'WF', name: 'Wallis-et-Futuna', flag: '🇼🇫' },
  { code: 'PF', name: 'Polynésie française', flag: '🇵🇫' },
  { code: 'NC', name: 'Nouvelle-Calédonie', flag: '🇳🇨' },
  { code: 'TF', name: 'TAAF', flag: '🇹🇫' },
];

export function IndiceVieChere({ selectedTerritory = null }) {
  const [indices, setIndices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    fetchIndices();
  }, [selectedTerritory, selectedCategory]);

  /**
   * Fetch cost of living indices from Firestore
   * TODO: Connect to real Firestore data
   */
  async function fetchIndices() {
    setLoading(true);
    setError(null);

    try {
      // TODO: PRODUCTION IMPLEMENTATION
      // const db = getFirestore();
      // const pricesRef = collection(db, 'prices');
      // const query = query(pricesRef, where('expiresAt', '>', Date.now()));
      // const snapshot = await getDocs(query);
      // 
      // Calculate average prices by territory:
      // const territoryAverages = {};
      // snapshot.forEach(doc => {
      //   const data = doc.data();
      //   if (!territoryAverages[data.territory]) {
      //     territoryAverages[data.territory] = { sum: 0, count: 0 };
      //   }
      //   territoryAverages[data.territory].sum += data.price;
      //   territoryAverages[data.territory].count += 1;
      // });
      // 
      // const indices = Object.entries(territoryAverages).map(([code, data]) => ({
      //   territory: code,
      //   avgPrice: data.sum / data.count,
      //   productCount: data.count,
      // }));

      // Mock data for development
      const mockIndices = TERRITORIES.map((territory, index) => ({
        territory: territory.code,
        territoryName: territory.name,
        flag: territory.flag,
        avgPrice: 100 + (index * 5) + Math.random() * 10,
        productCount: 150 + Math.floor(Math.random() * 100),
        vsMetropole: 15 + (index * 2) + Math.random() * 5,
        trend: Math.random() > 0.5 ? 'up' : 'down',
        trendPercent: Math.random() * 3,
      }));

      // Sort by avgPrice (descending)
      mockIndices.sort((a, b) => b.avgPrice - a.avgPrice);

      // Filter by selected territory if specified
      if (selectedTerritory) {
        const filtered = mockIndices.filter(
          i => i.territory === selectedTerritory,
        );
        setIndices(filtered);
      } else {
        setIndices(mockIndices);
      }

      setLoading(false);
    } catch (err) {
      console.error('Error fetching indices:', err);
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
        <h2 className="text-2xl font-bold mb-2">
          📊 Indice Vie Chère DOM-COM
        </h2>
        <p className="text-primary-50">
          Comparaison des prix moyens par territoire
        </p>
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
                  <h3 className="font-semibold text-lg">
                    {indice.territoryName}
                  </h3>
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
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  indice
                </div>
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">
                  vs Métropole
                </span>
                <span className="font-semibold text-orange-600 dark:text-orange-400">
                  +{indice.vsMetropole.toFixed(1)}%
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">
                  Produits
                </span>
                <span className="font-medium">
                  {indice.productCount}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">
                  Tendance
                </span>
                <span className={`flex items-center gap-1 ${
                  indice.trend === 'up'
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-green-600 dark:text-green-400'
                }`}>
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
          ℹ️ L'indice vie chère est calculé sur la base des prix moyens de {indices.reduce((sum, i) => sum + i.productCount, 0)} produits.
          Données mises à jour quotidiennement.
        </p>
      </div>
    </div>
  );
}
