/**
 * CORE MODULE 3: Enhanced Price History Component
 * 
 * ABSOLUTE RULE:
 * - NO PRICE PREDICTION
 * - NO FUTURE GUESSING  
 * - NO SYNTHETIC DATA
 * - ONLY OBSERVED, TIMESTAMPED, SOURCE-IDENTIFIED DATA
 * 
 * This module is FACTUAL, AUDITABLE, and PUBLIC-TRUST-ORIENTED.
 */

import { useState, useMemo } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Card } from './card.jsx';
import pricesHistory from '../data/prices-history.json';
import { getAllIndicators } from '../utils/priceIndicators.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export function EnhancedHistoriquePrix({ productId = null, territory = 'GP' }) {
  const [selectedProduct, setSelectedProduct] = useState(productId || 'pain-500g');
  const [selectedTerritories, setSelectedTerritories] = useState([territory]);
  const [showQuantityOverlay, setShowQuantityOverlay] = useState(true);
  const [comparisonMode, setComparisonMode] = useState(false);

  // Get product list
  const products = Object.entries(pricesHistory.products).map(([id, product]) => ({
    id,
    ...product
  }));

  const currentProduct = pricesHistory.products[selectedProduct];

  // Territories list
  const territories = [
    { code: 'GP', name: '🇬🇵 Guadeloupe', type: 'DOM' },
    { code: 'MQ', name: '🇲🇶 Martinique', type: 'DOM' },
    { code: 'GF', name: '🇬🇫 Guyane', type: 'DOM' },
    { code: 'RE', name: '🇷🇪 La Réunion', type: 'DOM' },
    { code: 'YT', name: '🇾🇹 Mayotte', type: 'COM' }
  ];

  // Toggle territory selection for comparison
  const toggleTerritory = (territoryCode) => {
    if (comparisonMode) {
      setSelectedTerritories(prev => {
        if (prev.includes(territoryCode)) {
          return prev.filter(t => t !== territoryCode);
        } else {
          return [...prev, territoryCode];
        }
      });
    } else {
      setSelectedTerritories([territoryCode]);
    }
  };

  // Calculate indicators
  const indicators = useMemo(() => {
    if (!currentProduct) return null;
    
    // Get all history for this product (all territories)
    const allHistory = currentProduct.history;
    
    return getAllIndicators(allHistory);
  }, [currentProduct]);

  // Filter history by selected territories
  const filteredHistoryByTerritory = useMemo(() => {
    if (!currentProduct) return {};
    
    const result = {};
    selectedTerritories.forEach(territory => {
      const history = currentProduct.history
        .filter(entry => entry.territory === territory)
        .sort((a, b) => new Date(a.date) - new Date(b.date));
      
      if (history.length > 0) {
        result[territory] = history;
      }
    });
    
    return result;
  }, [currentProduct, selectedTerritories]);

  // Prepare chart data with multi-territory support
  const chartData = useMemo(() => {
    const datasets = [];
    const colors = ['rgb(59, 130, 246)', 'rgb(239, 68, 68)', 'rgb(34, 197, 94)', 'rgb(251, 146, 60)', 'rgb(168, 85, 247)'];
    
    let allDates = new Set();
    
    Object.entries(filteredHistoryByTerritory).forEach(([territory, history], idx) => {
      history.forEach(h => allDates.add(h.date));
      
      const prices = history.map(h => h.price);
      const quantities = history.map(h => h.quantity);
      
      datasets.push({
        label: `Prix - ${territories.find(t => t.code === territory)?.name || territory}`,
        data: prices,
        borderColor: colors[idx % colors.length],
        backgroundColor: colors[idx % colors.length].replace('rgb', 'rgba').replace(')', ', 0.1)'),
        tension: 0.3,
        fill: true,
        yAxisID: 'y'
      });
      
      if (showQuantityOverlay) {
        datasets.push({
          label: `Quantité - ${territories.find(t => t.code === territory)?.name || territory}`,
          data: quantities,
          borderColor: colors[idx % colors.length].replace('rgb', 'rgba').replace(')', ', 0.5)'),
          backgroundColor: 'transparent',
          borderDash: [5, 5],
          tension: 0.3,
          fill: false,
          yAxisID: 'y1',
          hidden: !showQuantityOverlay
        });
      }
    });
    
    const labels = Array.from(allDates).sort().map(date => {
      const d = new Date(date);
      return d.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' });
    });
    
    return {
      labels,
      datasets
    };
  }, [filteredHistoryByTerritory, showQuantityOverlay, territories]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        display: true,
        position: 'top',
      },
      title: {
        display: false
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const label = context.dataset.label || '';
            if (label.includes('Prix')) {
              return `${label}: ${context.parsed.y.toFixed(2)} €`;
            } else {
              return `${label}: ${context.parsed.y}`;
            }
          }
        }
      }
    },
    scales: {
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        title: {
          display: true,
          text: 'Prix (€)'
        },
        ticks: {
          callback: function(value) {
            return value.toFixed(2) + ' €';
          }
        }
      },
      y1: {
        type: 'linear',
        display: showQuantityOverlay,
        position: 'right',
        title: {
          display: true,
          text: 'Quantité'
        },
        grid: {
          drawOnChartArea: false,
        }
      }
    }
  };

  // Export to CSV
  const exportToCSV = () => {
    const rows = [
      ['Date', 'Territoire', 'Magasin', 'Prix', 'Quantité', 'Unité', 'Source', 'Niveau de confiance']
    ];
    
    Object.values(filteredHistoryByTerritory).flat().forEach(entry => {
      rows.push([
        entry.date,
        entry.territory,
        entry.store_name,
        entry.price,
        entry.quantity,
        entry.unit,
        entry.data_source,
        entry.confidence_level
      ]);
    });
    
    const csvContent = rows.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `prix-${selectedProduct}-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  // Export to JSON
  const exportToJSON = () => {
    const data = {
      product: currentProduct.name,
      product_id: selectedProduct,
      exported_at: new Date().toISOString(),
      disclaimer: pricesHistory.metadata.disclaimer,
      territories: selectedTerritories,
      data: Object.values(filteredHistoryByTerritory).flat()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `prix-${selectedProduct}-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  };

  // Export chart as PNG
  const exportChart = () => {
    const canvas = document.querySelector('canvas');
    if (canvas) {
      const url = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `graphique-prix-${selectedProduct}-${new Date().toISOString().split('T')[0]}.png`;
      link.href = url;
      link.click();
    }
  };

  if (!currentProduct) {
    return (
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
        <p className="text-yellow-800 dark:text-yellow-200">
          ⚠️ Produit non trouvé
        </p>
      </div>
    );
  }

  const totalObservations = Object.values(filteredHistoryByTerritory).reduce((sum, history) => sum + history.length, 0);

  return (
    <div className="space-y-6">
      {/* Mandatory Disclaimer */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 p-4 rounded">
        <p className="text-sm text-blue-800 dark:text-blue-200">
          <strong>ℹ️ Avertissement :</strong> {pricesHistory.metadata.disclaimer}
        </p>
      </div>

      {/* Header */}
      <div className="bg-gradient-to-r from-slate-700 to-slate-900 rounded-lg p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">
          📊 Historique & Observatoire des Prix
        </h2>
        <p className="text-slate-200">
          Évolution factuelle et vérifiable des prix - Aucune prédiction, uniquement des observations
        </p>
        <p className="text-slate-300 text-sm mt-2">
          Dernière mise à jour : {pricesHistory.metadata.lastUpdate}
        </p>
      </div>

      {/* Product Selector */}
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="product-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Sélectionner un produit
            </label>
            <select
              id="product-select"
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(e.target.value)}
              className="w-full bg-white dark:bg-slate-800 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Mode de comparaison
            </label>
            <button
              onClick={() => {
                setComparisonMode(!comparisonMode);
                if (!comparisonMode) {
                  setSelectedTerritories([selectedTerritories[0] || 'GP']);
                }
              }}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                comparisonMode
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
              }`}
            >
              {comparisonMode ? '✓ Comparaison multi-territoires' : 'Mode simple'}
            </button>
          </div>
        </div>

        {/* Territory Selector */}
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {comparisonMode ? 'Sélectionner les territoires à comparer' : 'Territoire'}
          </label>
          <div className="flex flex-wrap gap-2">
            {territories.map((territory) => (
              <button
                key={territory.code}
                onClick={() => toggleTerritory(territory.code)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedTerritories.includes(territory.code)
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                }`}
              >
                {territory.name}
              </button>
            ))}
          </div>
        </div>

        {/* Controls */}
        <div className="mt-4 flex flex-wrap gap-2">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={showQuantityOverlay}
              onChange={(e) => setShowQuantityOverlay(e.target.checked)}
              className="rounded"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Afficher la courbe de quantité (détection réduflation)
            </span>
          </label>
        </div>
      </Card>

      {/* Data Transparency Metadata */}
      <Card className="p-4 bg-slate-50 dark:bg-slate-800/50">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-6">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Observations</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalObservations}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Territoires</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{selectedTerritories.length}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Sources</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {[...new Set(currentProduct.history.map(h => h.data_source))].join(', ')}
              </p>
            </div>
          </div>
          
          {totalObservations < 5 && (
            <div className="bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-300 dark:border-yellow-700 rounded px-3 py-2">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                ⚠️ Données limitées - Interprétation avec prudence
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* Chart */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
            Évolution des prix observés
          </h3>
          <div className="flex gap-2">
            <button
              onClick={exportChart}
              className="px-3 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg transition-colors text-sm font-medium"
            >
              📥 PNG
            </button>
            <button
              onClick={exportToCSV}
              className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm font-medium"
            >
              📄 CSV
            </button>
            <button
              onClick={exportToJSON}
              className="px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors text-sm font-medium"
            >
              📋 JSON
            </button>
          </div>
        </div>

        <div className="h-96">
          <Line data={chartData} options={chartOptions} />
        </div>

        <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
          Basé sur {totalObservations} observations réelles • Sources : {[...new Set(currentProduct.history.map(h => h.data_source))].join(', ')}
        </p>
      </Card>

      {/* Factual Indicators */}
      {indicators && (
        <Card className="p-6">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Indicateurs factuels (aucune prédiction)
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Price Stability Index */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                📉 Indice de stabilité des prix
              </h4>
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                {indicators.stability.index !== null ? `${indicators.stability.index}/100` : 'N/A'}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                {indicators.stability.interpretation}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500">
                {indicators.stability.methodology} • {indicators.stability.dataPoints} observations • 
                Confiance: {indicators.stability.confidenceLevel}
              </p>
            </div>

            {/* Price Pressure Indicator */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                📈 Indicateur de pression sur les prix
              </h4>
              <div className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                {indicators.pressure.pressure}
              </div>
              <div className="flex gap-4 text-sm mb-2">
                <span className="text-red-600 dark:text-red-400">↑ {indicators.pressure.increases} hausses</span>
                <span className="text-green-600 dark:text-green-400">↓ {indicators.pressure.decreases} baisses</span>
                <span className="text-gray-600 dark:text-gray-400">→ {indicators.pressure.stable} stables</span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-500">
                {indicators.pressure.methodology} • Confiance: {indicators.pressure.confidenceLevel}
              </p>
            </div>

            {/* Shrinkflation Flag */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                ⚠️ Détection de réduflation
              </h4>
              <div className={`text-2xl font-bold mb-2 ${
                indicators.shrinkflation.detected 
                  ? 'text-red-600 dark:text-red-400' 
                  : 'text-green-600 dark:text-green-400'
              }`}>
                {indicators.shrinkflation.detected ? '⚠️ DÉTECTÉ' : '✓ Aucune'}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                {indicators.shrinkflation.description}
              </p>
              {indicators.shrinkflation.cases.length > 0 && (
                <div className="mt-2 space-y-1">
                  {indicators.shrinkflation.cases.map((c, idx) => (
                    <div key={idx} className="text-xs bg-red-50 dark:bg-red-900/20 p-2 rounded">
                      {c.date} : {c.previousQuantity} → {c.newQuantity} ({c.quantityReduction}% de réduction)
                    </div>
                  ))}
                </div>
              )}
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                {indicators.shrinkflation.methodology} • Confiance: {indicators.shrinkflation.confidenceLevel}
              </p>
            </div>

            {/* Territorial Gap Index */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                🗺️ Indice d'écart territorial
              </h4>
              <div className="text-2xl font-bold text-orange-600 dark:text-orange-400 mb-2">
                {indicators.territorialGap.maxGap ? `${indicators.territorialGap.maxGap} €` : 'N/A'}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                {indicators.territorialGap.interpretation}
              </p>
              {indicators.territorialGap.gaps.length > 0 && (
                <div className="mt-2 space-y-1">
                  {indicators.territorialGap.gaps.slice(0, 3).map((g, idx) => (
                    <div key={idx} className="text-xs bg-slate-50 dark:bg-slate-800 p-2 rounded">
                      {g.territory1} ({g.price1}€) ↔ {g.territory2} ({g.price2}€) : {g.gap}€ ({g.gapPercent}%)
                    </div>
                  ))}
                </div>
              )}
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                {indicators.territorialGap.methodology} • Confiance: {indicators.territorialGap.confidenceLevel}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* History Table with Source Information */}
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
                  Territoire
                </th>
                <th className="px-4 py-3 text-left text-gray-700 dark:text-gray-300 font-medium">
                  Magasin
                </th>
                <th className="px-4 py-3 text-left text-gray-700 dark:text-gray-300 font-medium">
                  Prix
                </th>
                <th className="px-4 py-3 text-left text-gray-700 dark:text-gray-300 font-medium">
                  Quantité
                </th>
                <th className="px-4 py-3 text-left text-gray-700 dark:text-gray-300 font-medium">
                  Source
                </th>
                <th className="px-4 py-3 text-left text-gray-700 dark:text-gray-300 font-medium">
                  Confiance
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {Object.values(filteredHistoryByTerritory)
                .flat()
                .sort((a, b) => new Date(b.date) - new Date(a.date))
                .map((entry, index) => (
                  <tr key={`${entry.date}-${entry.territory}-${index}`} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="px-4 py-3 text-gray-900 dark:text-gray-100">
                      {new Date(entry.date).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-4 py-3 text-gray-900 dark:text-gray-100">
                      {entry.territory}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                      {entry.store_name}
                    </td>
                    <td className="px-4 py-3 font-semibold text-gray-900 dark:text-gray-100">
                      {entry.price.toFixed(2)} €
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                      {entry.quantity} {entry.unit}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400 text-xs">
                      {entry.data_source}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        entry.confidence_level === 'HIGH' 
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200'
                          : entry.confidence_level === 'MEDIUM'
                          ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200'
                          : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200'
                      }`}>
                        {entry.confidence_level}
                      </span>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Legal & Transparency Note */}
      <div className="bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-4">
        <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
          📋 Transparence & Méthodologie
        </h4>
        <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
          <li>✓ Données append-only : aucune modification ni suppression d'historique</li>
          <li>✓ Sources identifiées pour chaque observation</li>
          <li>✓ Pas de prédiction ni d'extrapolation</li>
          <li>✓ Calculs reproductibles avec méthodologie affichée</li>
          <li>✓ Export disponible pour vérification indépendante</li>
        </ul>
      </div>
    </div>
  );
}

export default EnhancedHistoriquePrix;
