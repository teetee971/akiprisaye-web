/**
 * Module 5: Factual Price Trend Analysis (Historical Only)
 * 
 * ABSOLUTE NON-NEGOTIABLE RULES:
 * - NO FUTURE PRICE PREDICTION
 * - NO FORECAST CURVES
 * - NO "EXPECTED PRICE"
 * - NO AI MODEL GUESSING
 * - ONLY HISTORICAL, OBSERVED, TIMESTAMPED DATA
 * 
 * This module answers: "What has happened?" NOT "What will happen?"
 */

import { useState, useMemo } from 'react';
import { Card } from '../components/card.jsx';
import pricesHistoryData from '../data/prices-history.json';
import { DataSourceWarning } from '../components/DataSourceWarning.jsx';

// Constants
const PRICE_CHANGE_THRESHOLD = 0.01; // Minimum price difference (in €) to consider as a change
const MS_PER_MONTH = 1000 * 60 * 60 * 24 * 30; // Approximate milliseconds per month

export function PriceTrendAnalysis() {
  // Extract products list
  const products = useMemo(() => 
    Object.entries(pricesHistoryData.products).map(([id, data]) => ({
      id,
      name: data.name,
      category: data.category,
      unit: data.unit
    }))
  , []);

  const [selectedProduct, setSelectedProduct] = useState(products.length > 0 ? products[0].id : '');
  const [timeWindow, setTimeWindow] = useState('12months');
  const [selectedTerritory, setSelectedTerritory] = useState('all');
  const [notification, setNotification] = useState(null);

  // Show notification
  const showNotification = (message) => {
    setNotification(message);
    setTimeout(() => setNotification(null), 3000);
  };

  const currentProduct = pricesHistoryData.products[selectedProduct];

  // Calculate date range based on time window
  const getDateRange = () => {
    const now = new Date();
    let startDate = new Date();

    switch (timeWindow) {
      case '30days':
        startDate.setDate(now.getDate() - 30);
        break;
      case '90days':
        startDate.setDate(now.getDate() - 90);
        break;
      case '6months':
        startDate.setMonth(now.getMonth() - 6);
        break;
      case '12months':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate.setFullYear(now.getFullYear() - 1);
    }

    return { startDate, endDate: now };
  };

  // Filter and analyze historical data
  const analysis = useMemo(() => {
    if (!currentProduct || !currentProduct.history) {
      return null;
    }

    const { startDate, endDate } = getDateRange();
    
    // Filter observations by date and territory
    let filteredHistory = currentProduct.history.filter(obs => {
      const obsDate = new Date(obs.date);
      const inDateRange = obsDate >= startDate && obsDate <= endDate;
      const inTerritory = selectedTerritory === 'all' || obs.territory === selectedTerritory;
      return inDateRange && inTerritory;
    });

    // Sort by date (oldest first)
    filteredHistory = filteredHistory.sort((a, b) => 
      new Date(a.date) - new Date(b.date)
    );

    // Insufficient data check
    if (filteredHistory.length < 2) {
      return {
        insufficient: true,
        observations: filteredHistory.length
      };
    }

    // Calculate trend metrics
    const prices = filteredHistory.map(obs => obs.price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const avgPrice = prices.reduce((sum, p) => sum + p, 0) / prices.length;

    // Direction Trend (descriptive, not predictive)
    let increases = 0;
    let decreases = 0;
    let noChange = 0;

    for (let i = 1; i < filteredHistory.length; i++) {
      const diff = filteredHistory[i].price - filteredHistory[i - 1].price;
      if (diff > PRICE_CHANGE_THRESHOLD) increases++;
      else if (diff < -PRICE_CHANGE_THRESHOLD) decreases++;
      else noChange++;
    }

    let directionTrend = 'Stable';
    if (increases > decreases && increases > noChange) {
      directionTrend = 'Mostly increasing';
    } else if (decreases > increases && decreases > noChange) {
      directionTrend = 'Mostly decreasing';
    }

    // Volatility Trend (frequency of changes)
    const totalChanges = increases + decreases;
    const changeRate = totalChanges / (filteredHistory.length - 1);
    let volatility = 'Low volatility';
    if (changeRate > 0.66) {
      volatility = 'High volatility';
    } else if (changeRate > 0.33) {
      volatility = 'Medium volatility';
    }

    // Frequency Indicator
    const priceChanges = increases + decreases;
    const periodMonths = Math.round((endDate - startDate) / MS_PER_MONTH);

    // Get territories and stores involved
    const territories = [...new Set(filteredHistory.map(obs => obs.territory))];
    const sources = [...new Set(filteredHistory.map(obs => obs.source))];

    return {
      insufficient: false,
      observations: filteredHistory.length,
      history: filteredHistory,
      metrics: {
        minPrice,
        maxPrice,
        avgPrice,
        directionTrend,
        volatility,
        priceChanges,
        periodMonths,
        increases,
        decreases,
        noChange
      },
      context: {
        territories,
        sources,
        startDate,
        endDate
      }
    };
  }, [currentProduct, timeWindow, selectedTerritory]);

  // Time window options
  const timeWindows = [
    { value: '30days', label: '30 days' },
    { value: '90days', label: '90 days' },
    { value: '6months', label: '6 months' },
    { value: '12months', label: '12 months' }
  ];

  // Territory options
  const territories = [
    { value: 'all', label: 'All territories' },
    { value: 'GP', label: '🇬🇵 Guadeloupe' },
    { value: 'MQ', label: '🇲🇶 Martinique' },
    { value: 'GF', label: '🇬🇫 Guyane' },
    { value: 'RE', label: '🇷🇪 La Réunion' }
  ];

  return (
    <div className="space-y-6">
      {/* Notification Toast */}
      {notification && (
        <div className="fixed top-4 right-4 z-50 bg-blue-600 text-white px-6 py-3 rounded-lg shadow-lg animate-fade-in">
          {notification}
        </div>
      )}

      {/* Critical Data Warning */}
      {pricesHistoryData.metadata && (
        <DataSourceWarning 
          dataStatus="DEMONSTRATION"
          requiredSources={[
            "Official price observatories (OPMR, etc.)",
            "Verified citizen observations with proof",
            "Government statistical agencies"
          ]}
        />
      )}

      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">
          📊 Module 5: Factual Price Trend Analysis
        </h2>
        <p className="text-blue-50">
          Historical price observation analysis - NO predictions, only facts
        </p>
      </div>

      {/* Configuration */}
      <Card className="p-6">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          ⚙️ Analysis Configuration
        </h3>
        
        <div className="space-y-4">
          {/* Product Selection */}
          <div>
            <label htmlFor="product-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Select Product
            </label>
            <select
              id="product-select"
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(e.target.value)}
              className="w-full bg-white dark:bg-slate-800 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.category})
                </option>
              ))}
            </select>
          </div>

          {/* Time Window Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Time Window (Historical Period)
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {timeWindows.map((tw) => (
                <button
                  key={tw.value}
                  onClick={() => setTimeWindow(tw.value)}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    timeWindow === tw.value
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-blue-300'
                  }`}
                >
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {tw.label}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Territory Filter */}
          <div>
            <label htmlFor="territory-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Territory Filter
            </label>
            <select
              id="territory-select"
              value={selectedTerritory}
              onChange={(e) => setSelectedTerritory(e.target.value)}
              className="w-full bg-white dark:bg-slate-800 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            >
              {territories.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Analysis Results */}
      {analysis && (
        <>
          {analysis.insufficient ? (
            <Card className="p-6 border-2 border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20">
              <div className="flex items-start gap-4">
                <div className="text-5xl">⚠️</div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-amber-800 dark:text-amber-200 mb-2">
                    Insufficient data to analyze
                  </h3>
                  <p className="text-amber-700 dark:text-amber-300">
                    Only {analysis.observations} observation(s) found for the selected period and territory.
                  </p>
                  <p className="text-sm text-amber-600 dark:text-amber-400 mt-2">
                    At least 2 observations are required to perform trend analysis.
                  </p>
                </div>
              </div>
            </Card>
          ) : (
            <>
              {/* HOW THIS WAS CALCULATED Panel */}
              <Card className="p-6 bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                  📋 HOW THIS WAS CALCULATED
                </h3>
                <div className="space-y-2 text-gray-700 dark:text-gray-300">
                  <p>
                    <strong>Number of observations:</strong> {analysis.observations}
                  </p>
                  <p>
                    <strong>Period covered:</strong>{' '}
                    {new Date(analysis.context.startDate).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'short' 
                    })} to{' '}
                    {new Date(analysis.context.endDate).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'short' 
                    })}
                  </p>
                  <p>
                    <strong>Territories involved:</strong> {analysis.context.territories.join(', ')}
                  </p>
                  <p>
                    <strong>Data sources:</strong> {analysis.context.sources.join(', ')}
                  </p>
                  <p className="text-sm italic pt-2 border-t border-blue-300 dark:border-blue-700">
                    This trend is based on {analysis.observations} recorded prices 
                    between {new Date(analysis.context.startDate).toLocaleDateString('en-US', { 
                      month: 'short', 
                      year: 'numeric' 
                    })} and {new Date(analysis.context.endDate).toLocaleDateString('en-US', { 
                      month: 'short', 
                      year: 'numeric' 
                    })}.
                  </p>
                </div>
              </Card>

              {/* Trend Analysis Results */}
              <Card className="p-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                  📈 Observed Trend (Descriptive)
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Direction Trend */}
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                      Direction Trend
                    </div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                      {analysis.metrics.directionTrend}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-500">
                      Based on {analysis.metrics.increases} increases, {analysis.metrics.decreases} decreases
                    </div>
                  </div>

                  {/* Volatility */}
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                      Volatility Trend
                    </div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                      {analysis.metrics.volatility}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-500">
                      {analysis.metrics.priceChanges} changes over {analysis.metrics.periodMonths} months
                    </div>
                  </div>
                </div>

                {/* Price Range */}
                <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                    Historical Price Range
                  </h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">Minimum</div>
                      <div className="text-xl font-bold text-green-600 dark:text-green-400">
                        {analysis.metrics.minPrice.toFixed(2)} €
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">Average</div>
                      <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
                        {analysis.metrics.avgPrice.toFixed(2)} €
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">Maximum</div>
                      <div className="text-xl font-bold text-red-600 dark:text-red-400">
                        {analysis.metrics.maxPrice.toFixed(2)} €
                      </div>
                    </div>
                  </div>
                </div>

                {/* Frequency Indicator */}
                <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    <strong>Frequency Indicator:</strong> {analysis.metrics.priceChanges} price changes 
                    observed over {analysis.metrics.periodMonths} months
                  </p>
                </div>
              </Card>

              {/* Historical Data Table */}
              <Card className="p-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                  📝 Observed Price Points (Exact Data)
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-100 dark:bg-slate-800">
                      <tr>
                        <th className="p-3 text-left text-gray-700 dark:text-gray-300">Date</th>
                        <th className="p-3 text-left text-gray-700 dark:text-gray-300">Price</th>
                        <th className="p-3 text-left text-gray-700 dark:text-gray-300">Change</th>
                        <th className="p-3 text-left text-gray-700 dark:text-gray-300">Territory</th>
                        <th className="p-3 text-left text-gray-700 dark:text-gray-300">Source</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analysis.history.map((obs, index) => {
                        const prevPrice = index > 0 ? analysis.history[index - 1].price : obs.price;
                        const change = obs.price - prevPrice;
                        const changePercent = prevPrice > 0 ? (change / prevPrice * 100) : 0;

                        return (
                          <tr key={index} className="border-b border-gray-200 dark:border-gray-700">
                            <td className="p-3 text-gray-900 dark:text-white">
                              {new Date(obs.date).toLocaleDateString('en-US', { 
                                year: 'numeric', 
                                month: 'short', 
                                day: 'numeric' 
                              })}
                            </td>
                            <td className="p-3 font-semibold text-gray-900 dark:text-white">
                              {obs.price.toFixed(2)} €
                            </td>
                            <td className="p-3">
                              {index === 0 ? (
                                <span className="text-gray-500 dark:text-gray-500">-</span>
                              ) : change > 0.01 ? (
                                <span className="text-red-600 dark:text-red-400">
                                  ▲ +{change.toFixed(2)} € ({changePercent.toFixed(1)}%)
                                </span>
                              ) : change < -0.01 ? (
                                <span className="text-green-600 dark:text-green-400">
                                  ▼ {change.toFixed(2)} € ({changePercent.toFixed(1)}%)
                                </span>
                              ) : (
                                <span className="text-gray-500 dark:text-gray-500">No change</span>
                              )}
                            </td>
                            <td className="p-3 text-gray-700 dark:text-gray-300">{obs.territory}</td>
                            <td className="p-3 text-gray-700 dark:text-gray-300 text-xs">{obs.source}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </Card>

              {/* Mandatory Disclaimer */}
              <div className="bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-400 dark:border-amber-600 rounded-lg p-6">
                <h4 className="text-lg font-bold text-amber-900 dark:text-amber-200 mb-3">
                  ⚠️ MANDATORY DISCLAIMER
                </h4>
                <p className="text-amber-800 dark:text-amber-200 font-medium">
                  This analysis describes past observed price behavior. It does NOT predict future prices.
                </p>
                <p className="text-sm text-amber-700 dark:text-amber-300 mt-2">
                  All data shown represents actual recorded observations with timestamps. 
                  No forecasting, smoothing, or prediction algorithms were used.
                </p>
              </div>
            </>
          )}
        </>
      )}

      {/* Methodology */}
      <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg p-4">
        <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
          📝 Methodology
        </h4>
        <div className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
          <p>
            <strong>Direction Trend:</strong> Overall direction over selected period based on majority of observed changes (Mostly increasing / Mostly decreasing / Stable)
          </p>
          <p>
            <strong>Volatility Trend:</strong> Frequency of price changes (Low / Medium / High volatility)
          </p>
          <p>
            <strong>Frequency Indicator:</strong> Total number of price changes observed over the period
          </p>
          <p className="text-xs pt-2 border-t border-gray-300 dark:border-gray-600">
            Version {pricesHistoryData.metadata?.version || '1.0.0'} • 
            Last updated: {pricesHistoryData.metadata?.lastUpdate || 'N/A'}
          </p>
        </div>
      </div>

      {/* Export Options */}
      <Card className="p-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
          📤 Export & Public Value
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Export this analysis for citizen awareness, consumer associations, journalistic investigation, or public policy review.
        </p>
        <div className="flex gap-3">
          <button 
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            onClick={() => showNotification('📊 CSV export feature coming soon')}
          >
            📊 Export CSV
          </button>
          <button 
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            onClick={() => showNotification('🖼️ Image export feature coming soon')}
          >
            🖼️ Export as Image
          </button>
          <button 
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            onClick={() => showNotification('📄 Report generation feature coming soon')}
          >
            📄 Generate Report
          </button>
        </div>
      </Card>
    </div>
  );
}

export default PriceTrendAnalysis;
