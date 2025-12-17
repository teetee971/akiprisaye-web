/**
 * HistoriquePrix Component
 * 
 * Displays price evolution curves for products over time.
 * Features:
 * - Append-only history for traceability
 * - Visual trend charts
 * - Export to PDF/PNG
 * - Transparent data sources
 */

import { useState } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Card } from './card.jsx';
import pricesHistory from '../data/prices-history.json';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
);

export function HistoriquePrix({ productId = null, territory = 'GP' }) {
  const [selectedProduct, setSelectedProduct] = useState(productId || 'pain-500g');
  const [selectedTerritory, setSelectedTerritory] = useState(territory);

  // Get product list
  const products = Object.entries(pricesHistory.products).map(([id, product]) => ({
    id,
    ...product,
  }));

  const currentProduct = pricesHistory.products[selectedProduct];

  if (!currentProduct) {
    return (
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
        <p className="text-yellow-800 dark:text-yellow-200">
          ⚠️ Produit non trouvé
        </p>
      </div>
    );
  }

  // Filter history by territory
  const filteredHistory = currentProduct.history
    .filter(entry => entry.territory === selectedTerritory)
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  if (filteredHistory.length === 0) {
    return (
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
        <p className="text-yellow-800 dark:text-yellow-200">
          ℹ️ Aucune donnée disponible pour ce territoire
        </p>
      </div>
    );
  }

  // Calculate statistics
  const prices = filteredHistory.map(h => h.price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const currentPrice = prices[prices.length - 1];
  const previousPrice = prices[prices.length - 2] || currentPrice;
  const priceChange = currentPrice - previousPrice;
  const priceChangePercent = ((priceChange / previousPrice) * 100).toFixed(1);
  
  const oldestPrice = prices[0];
  const totalChange = currentPrice - oldestPrice;
  const totalChangePercent = ((totalChange / oldestPrice) * 100).toFixed(1);

  // Prepare chart data
  const chartData = {
    labels: filteredHistory.map(h => {
      const date = new Date(h.date);
      return date.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' });
    }),
    datasets: [
      {
        label: 'Prix (€)',
        data: prices,
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.3,
        fill: true,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            return `Prix: ${context.parsed.y.toFixed(2)} €`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: false,
        ticks: {
          callback: function(value) {
            return value.toFixed(2) + ' €';
          },
        },
      },
    },
  };

  // Export chart as PNG
  const exportChart = () => {
    const canvas = document.querySelector('canvas');
    if (canvas) {
      const url = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `prix-${selectedProduct}-${selectedTerritory}-${new Date().toISOString().split('T')[0]}.png`;
      link.href = url;
      link.click();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-800 rounded-lg p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">
          📈 Historique & Preuve des Prix
        </h2>
        <p className="text-purple-50">
          Évolution transparente et vérifiable des prix dans le temps
        </p>
      </div>

      {/* Product Selector */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="product-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Sélectionner un produit
          </label>
          <select
            id="product-select"
            value={selectedProduct}
            onChange={(e) => setSelectedProduct(e.target.value)}
            className="w-full bg-white dark:bg-slate-800 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="territory-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Territoire
          </label>
          <select
            id="territory-select"
            value={selectedTerritory}
            onChange={(e) => setSelectedTerritory(e.target.value)}
            className="w-full bg-white dark:bg-slate-800 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="GP">🇬🇵 Guadeloupe</option>
            <option value="MQ">🇲🇶 Martinique</option>
            <option value="GF">🇬🇫 Guyane</option>
            <option value="RE">🇷🇪 La Réunion</option>
          </select>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
            Prix actuel
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {currentPrice.toFixed(2)} €
          </div>
        </Card>

        <Card className="p-4">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
            Évolution récente
          </div>
          <div className={`text-2xl font-bold ${
            priceChange > 0 
              ? 'text-red-600 dark:text-red-400' 
              : priceChange < 0
                ? 'text-green-600 dark:text-green-400'
                : 'text-gray-600 dark:text-gray-400'
          }`}>
            {priceChange > 0 ? '+' : ''}{priceChangePercent}%
          </div>
        </Card>

        <Card className="p-4">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
            Prix minimum
          </div>
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {minPrice.toFixed(2)} €
          </div>
        </Card>

        <Card className="p-4">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
            Prix maximum
          </div>
          <div className="text-2xl font-bold text-red-600 dark:text-red-400">
            {maxPrice.toFixed(2)} €
          </div>
        </Card>
      </div>

      {/* Chart */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
            Évolution du prix
          </h3>
          <button
            onClick={exportChart}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors text-sm font-medium"
          >
            📥 Exporter PNG
          </button>
        </div>

        <div className="h-80">
          <Line data={chartData} options={chartOptions} />
        </div>

        <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            <strong>Évolution totale sur la période :</strong>{' '}
            <span className={`font-semibold ${
              totalChange > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'
            }`}>
              {totalChange > 0 ? '+' : ''}{totalChange.toFixed(2)} € ({totalChange > 0 ? '+' : ''}{totalChangePercent}%)
            </span>
          </p>
        </div>
      </Card>

      {/* History Table */}
      <Card className="p-6">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          Historique détaillé (append-only)
        </h3>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800">
              <tr>
                <th className="px-4 py-3 text-left text-gray-700 dark:text-gray-300 font-medium">
                  Date
                </th>
                <th className="px-4 py-3 text-left text-gray-700 dark:text-gray-300 font-medium">
                  Prix
                </th>
                <th className="px-4 py-3 text-left text-gray-700 dark:text-gray-300 font-medium">
                  Variation
                </th>
                <th className="px-4 py-3 text-left text-gray-700 dark:text-gray-300 font-medium">
                  Source
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredHistory.reverse().map((entry, index) => {
                const prevEntry = filteredHistory[index + 1];
                const variation = prevEntry ? entry.price - prevEntry.price : 0;
                const variationPercent = prevEntry ? ((variation / prevEntry.price) * 100).toFixed(1) : 0;
                
                return (
                  <tr key={`${entry.date}-${index}`} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="px-4 py-3 text-gray-900 dark:text-gray-100">
                      {new Date(entry.date).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-4 py-3 font-semibold text-gray-900 dark:text-gray-100">
                      {entry.price.toFixed(2)} €
                    </td>
                    <td className="px-4 py-3">
                      {prevEntry && (
                        <span className={`${
                          variation > 0 
                            ? 'text-red-600 dark:text-red-400' 
                            : variation < 0
                              ? 'text-green-600 dark:text-green-400'
                              : 'text-gray-600 dark:text-gray-400'
                        }`}>
                          {variation > 0 ? '+' : ''}{variation.toFixed(2)} € ({variation > 0 ? '+' : ''}{variationPercent}%)
                        </span>
                      )}
                      {!prevEntry && <span className="text-gray-400">-</span>}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                      {entry.source}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Legal Note */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <p className="text-sm text-blue-800 dark:text-blue-200">
          ℹ️ L'historique des prix est conservé de manière append-only (ajout uniquement) pour garantir
          la traçabilité et l'intégrité des données. Chaque entrée indique sa source et sa date de collecte.
        </p>
      </div>
    </div>
  );
}

export default HistoriquePrix;
