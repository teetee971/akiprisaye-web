/**
 * CORE MODULE 3: Citizen Observatory Dashboard
 * 
 * CRITICAL FEATURE: Neutral observatory of daily life costs
 * - Most volatile products
 * - Products with repeated increases
 * - Shrinkflation-flagged products
 * - Territorial price comparisons
 * 
 * ALL RESULTS ARE REPRODUCIBLE AND FACT-BASED
 */

import { useState, useMemo } from 'react';
import { Card } from '../components/card.jsx';
import pricesHistory from '../data/prices-history.json';
import {
  calculatePriceStabilityIndex,
  calculatePricePressureIndicator,
  detectShrinkflation,
  calculateTerritorialGapIndex
} from '../utils/priceIndicators.js';

export function CitizenObservatory() {
  const [selectedTerritory, setSelectedTerritory] = useState('ALL');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [timeRange, setTimeRange] = useState('12M'); // 1M, 3M, 6M, 12M, ALL

  const territories = [
    { code: 'ALL', name: 'Tous les territoires' },
    { code: 'GP', name: '🇬🇵 Guadeloupe' },
    { code: 'MQ', name: '🇲🇶 Martinique' },
    { code: 'GF', name: '🇬🇫 Guyane' },
    { code: 'RE', name: '🇷🇪 La Réunion' },
  ];

  const categories = [
    { code: 'ALL', name: 'Toutes catégories' },
    { code: 'alimentation', name: 'Alimentation' },
    { code: 'hygiene', name: 'Hygiène' },
    { code: 'transport', name: 'Transport' },
  ];

  const timeRanges = [
    { code: '1M', name: '1 mois', months: 1 },
    { code: '3M', name: '3 mois', months: 3 },
    { code: '6M', name: '6 mois', months: 6 },
    { code: '12M', name: '12 mois', months: 12 },
    { code: 'ALL', name: 'Tout l\'historique', months: 999 },
  ];

  // Filter history based on selected filters
  const filterHistory = (history) => {
    const selectedTimeRange = timeRanges.find(t => t.code === timeRange);
    const cutoffDate = new Date();
    cutoffDate.setMonth(cutoffDate.getMonth() - selectedTimeRange.months);

    return history.filter(entry => {
      const matchTerritory = selectedTerritory === 'ALL' || entry.territory === selectedTerritory;
      const matchDate = timeRange === 'ALL' || new Date(entry.date) >= cutoffDate;
      return matchTerritory && matchDate;
    });
  };

  // Analyze all products
  const analysis = useMemo(() => {
    const products = Object.entries(pricesHistory.products)
      .filter(([_, product]) => selectedCategory === 'ALL' || product.category === selectedCategory)
      .map(([id, product]) => {
        const filteredHistory = filterHistory(product.history);
        
        if (filteredHistory.length < 2) {
          return null;
        }

        const stability = calculatePriceStabilityIndex(filteredHistory);
        const pressure = calculatePricePressureIndicator(filteredHistory);
        const shrinkflation = detectShrinkflation(filteredHistory);
        const territorialGap = calculateTerritorialGapIndex(filteredHistory);

        return {
          id,
          name: product.name,
          category: product.category,
          stability,
          pressure,
          shrinkflation,
          territorialGap,
          observationCount: filteredHistory.length
        };
      })
      .filter(p => p !== null);

    // Sort by different criteria
    const mostVolatile = [...products]
      .filter(p => p.stability.index !== null)
      .sort((a, b) => a.stability.index - b.stability.index)
      .slice(0, 10);

    const mostIncreases = [...products]
      .sort((a, b) => b.pressure.increases - a.pressure.increases)
      .slice(0, 10);

    const shrinkflationProducts = products
      .filter(p => p.shrinkflation.detected)
      .sort((a, b) => b.shrinkflation.cases.length - a.shrinkflation.cases.length);

    const highestTerritorialGaps = [...products]
      .filter(p => p.territorialGap.gaps.length > 0)
      .sort((a, b) => parseFloat(b.territorialGap.maxGapPercent || 0) - parseFloat(a.territorialGap.maxGapPercent || 0))
      .slice(0, 10);

    return {
      mostVolatile,
      mostIncreases,
      shrinkflationProducts,
      highestTerritorialGaps,
      totalProducts: products.length
    };
  }, [selectedTerritory, selectedCategory, timeRange]);

  // Export current view as CSV
  const exportAsCSV = () => {
    const rows = [
      ['Catégorie', 'Produit', 'Indice Stabilité', 'Hausses', 'Baisses', 'Réduflation', 'Écart Max (%)', 'Observations']
    ];

    Object.values(pricesHistory.products)
      .filter(product => selectedCategory === 'ALL' || product.category === selectedCategory)
      .forEach(product => {
        const filteredHistory = filterHistory(product.history);
        if (filteredHistory.length >= 2) {
          const stability = calculatePriceStabilityIndex(filteredHistory);
          const pressure = calculatePricePressureIndicator(filteredHistory);
          const shrinkflation = detectShrinkflation(filteredHistory);
          const territorialGap = calculateTerritorialGapIndex(filteredHistory);

          rows.push([
            product.category,
            product.name,
            stability.index || 'N/A',
            pressure.increases,
            pressure.decreases,
            shrinkflation.detected ? 'OUI' : 'NON',
            territorialGap.maxGapPercent || 'N/A',
            filteredHistory.length
          ]);
        }
      });

    const csvContent = rows.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `observatoire-citoyen-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="space-y-6">
          {/* Mandatory Disclaimer */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 p-4 rounded">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>ℹ️ Avertissement :</strong> {pricesHistory.metadata.disclaimer}
            </p>
          </div>

          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-700 to-indigo-900 rounded-lg p-8 text-white">
            <h1 className="text-3xl font-bold mb-2">
              🏛️ Observatoire Citoyen des Prix
            </h1>
            <p className="text-indigo-100 text-lg">
              Surveillance factuelle et neutre du coût de la vie quotidienne
            </p>
            <p className="text-indigo-200 text-sm mt-2">
              Données issues de {analysis.totalProducts} produits observés • Dernière mise à jour : {pricesHistory.metadata.lastUpdate}
            </p>
          </div>

          {/* Filters */}
          <Card className="p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Filtres de l'observatoire
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Territoire
                </label>
                <select
                  value={selectedTerritory}
                  onChange={(e) => setSelectedTerritory(e.target.value)}
                  className="w-full bg-white dark:bg-slate-800 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2"
                >
                  {territories.map(t => (
                    <option key={t.code} value={t.code}>{t.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Catégorie
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full bg-white dark:bg-slate-800 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2"
                >
                  {categories.map(c => (
                    <option key={c.code} value={c.code}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Période
                </label>
                <select
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value)}
                  className="w-full bg-white dark:bg-slate-800 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2"
                >
                  {timeRanges.map(t => (
                    <option key={t.code} value={t.code}>{t.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-4 flex justify-between items-center">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Filtres actifs : {selectedTerritory === 'ALL' ? 'Tous territoires' : territories.find(t => t.code === selectedTerritory)?.name} • 
                {' '}{selectedCategory === 'ALL' ? 'Toutes catégories' : categories.find(c => c.code === selectedCategory)?.name} •
                {' '}{timeRanges.find(t => t.code === timeRange)?.name}
              </div>
              
              <button
                onClick={exportAsCSV}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm font-medium"
              >
                📥 Exporter CSV
              </button>
            </div>
          </Card>

          {/* Section 1: Most Volatile Products */}
          <Card className="p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              📉 Produits les plus volatils
              <span className="text-sm font-normal text-gray-500">(instabilité des prix observée)</span>
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-100 dark:bg-slate-800">
                  <tr>
                    <th className="px-4 py-3 text-left">Produit</th>
                    <th className="px-4 py-3 text-left">Catégorie</th>
                    <th className="px-4 py-3 text-left">Indice Stabilité</th>
                    <th className="px-4 py-3 text-left">Interprétation</th>
                    <th className="px-4 py-3 text-left">Observations</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {analysis.mostVolatile.map((product) => (
                    <tr key={product.id} className="hover:bg-slate-50 dark:hover:bg-slate-800">
                      <td className="px-4 py-3 font-medium">{product.name}</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{product.category}</td>
                      <td className="px-4 py-3">
                        <span className={`font-bold ${
                          product.stability.index >= 75 ? 'text-green-600' :
                          product.stability.index >= 50 ? 'text-yellow-600' :
                          'text-red-600'
                        }`}>
                          {product.stability.index}/100
                        </span>
                      </td>
                      <td className="px-4 py-3">{product.stability.interpretation}</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                        {product.observationCount} ({product.stability.confidenceLevel})
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Section 2: Products with Most Increases */}
          <Card className="p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              📈 Produits avec hausses répétées
              <span className="text-sm font-normal text-gray-500">(fréquence des augmentations)</span>
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-100 dark:bg-slate-800">
                  <tr>
                    <th className="px-4 py-3 text-left">Produit</th>
                    <th className="px-4 py-3 text-left">Catégorie</th>
                    <th className="px-4 py-3 text-left">Hausses</th>
                    <th className="px-4 py-3 text-left">Baisses</th>
                    <th className="px-4 py-3 text-left">Pression</th>
                    <th className="px-4 py-3 text-left">Observations</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {analysis.mostIncreases.map((product) => (
                    <tr key={product.id} className="hover:bg-slate-50 dark:hover:bg-slate-800">
                      <td className="px-4 py-3 font-medium">{product.name}</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{product.category}</td>
                      <td className="px-4 py-3">
                        <span className="text-red-600 dark:text-red-400 font-bold">
                          ↑ {product.pressure.increases}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-green-600 dark:text-green-400">
                          ↓ {product.pressure.decreases}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">{product.pressure.pressure}</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                        {product.observationCount} ({product.pressure.confidenceLevel})
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Section 3: Shrinkflation Flagged Products */}
          <Card className="p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              ⚠️ Produits signalés pour réduflation
              <span className="text-sm font-normal text-gray-500">(réduction de quantité observée)</span>
            </h2>

            {analysis.shrinkflationProducts.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                ✓ Aucune réduflation détectée sur la période sélectionnée
              </div>
            ) : (
              <div className="space-y-4">
                {analysis.shrinkflationProducts.map((product) => (
                  <div key={product.id} className="border border-red-200 dark:border-red-800 rounded-lg p-4 bg-red-50 dark:bg-red-900/10">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-bold text-gray-900 dark:text-white">{product.name}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {product.shrinkflation.cases.length} cas détectés • {product.observationCount} observations
                        </p>
                      </div>
                      <span className="px-3 py-1 bg-red-600 text-white text-xs font-bold rounded">
                        RÉDUFLATION
                      </span>
                    </div>
                    
                    <div className="mt-3 space-y-2">
                      {product.shrinkflation.cases.map((c, idx) => (
                        <div key={idx} className="text-sm bg-white dark:bg-slate-800 rounded p-2">
                          <strong>{c.date}</strong> : 
                          Quantité {c.previousQuantity} → {c.newQuantity} 
                          ({c.quantityReduction}% de réduction) • 
                          Prix {c.previousPrice}€ → {c.newPrice}€ 
                          ({c.priceChange > 0 ? '+' : ''}{c.priceChange}%)
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Section 4: Territorial Price Gaps */}
          <Card className="p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              🗺️ Écarts territoriaux importants
              <span className="text-sm font-normal text-gray-500">(différences de prix entre territoires)</span>
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-100 dark:bg-slate-800">
                  <tr>
                    <th className="px-4 py-3 text-left">Produit</th>
                    <th className="px-4 py-3 text-left">Écart Maximum</th>
                    <th className="px-4 py-3 text-left">Écart %</th>
                    <th className="px-4 py-3 text-left">Interprétation</th>
                    <th className="px-4 py-3 text-left">Observations</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {analysis.highestTerritorialGaps.map((product) => (
                    <tr key={product.id} className="hover:bg-slate-50 dark:hover:bg-slate-800">
                      <td className="px-4 py-3 font-medium">{product.name}</td>
                      <td className="px-4 py-3">
                        <span className="font-bold text-orange-600 dark:text-orange-400">
                          {product.territorialGap.maxGap} €
                        </span>
                      </td>
                      <td className="px-4 py-3 font-bold">
                        {product.territorialGap.maxGapPercent}%
                      </td>
                      <td className="px-4 py-3 text-sm">{product.territorialGap.interpretation}</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                        {product.observationCount} ({product.territorialGap.confidenceLevel})
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Methodology & Transparency */}
          <Card className="p-6 bg-slate-100 dark:bg-slate-800">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              📚 Méthodologie & Reproductibilité
            </h2>
            
            <div className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
              <div>
                <strong>Indice de Stabilité :</strong> Calculé à partir de l'écart-type des prix divisé par le prix moyen. 
                Plus l'indice est élevé (proche de 100), plus le prix est stable.
              </div>
              
              <div>
                <strong>Pression sur les Prix :</strong> Comptage des hausses, baisses et stabilités observées entre chaque relevé successif.
                Aucune interprétation, uniquement des faits.
              </div>
              
              <div>
                <strong>Réduflation :</strong> Détectée lorsque la quantité diminue sans baisse proportionnelle du prix.
                Exemple : -10% de quantité mais prix identique ou en hausse.
              </div>
              
              <div>
                <strong>Écart Territorial :</strong> Différence absolue et relative entre les prix moyens observés dans différents territoires
                pour le même produit.
              </div>
              
              <div className="mt-4 pt-4 border-t border-gray-300 dark:border-gray-600">
                <strong>Note :</strong> Tous les calculs sont reproductibles. Les données brutes sont exportables en CSV/JSON.
                Aucune prédiction, aucune extrapolation, uniquement des observations factuelles horodatées.
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default CitizenObservatory;
