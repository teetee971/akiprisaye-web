/**
 * Simple Price History Chart Component
 *
 * Displays a minimal price history chart with clear explanations.
 * PROMPT 5: Historique de prix simplifié (lisible)
 *
 * - Shows 7, 30, or 90 day history
 * - Simple line chart with sober colors
 * - No AI/prediction language
 * - Clear "insufficient data" messaging
 */

import React, { useState } from 'react';

// SVG Chart constants for maintainability
const CHART_WIDTH = 100; // percentage
const CHART_HEIGHT = 60; // pixels
const CHART_PADDING = 5; // pixels
const HALF_HEIGHT = 30; // for grid line positioning

export interface PriceHistoryPoint {
  date: string;
  price: number;
}

interface SimplePriceHistoryProps {
  productName: string;
  priceHistory: PriceHistoryPoint[];
  currentPrice?: number;
}

export default function SimplePriceHistory({
  productName,
  priceHistory,
  currentPrice,
}: SimplePriceHistoryProps) {
  const [period, setPeriod] = useState<7 | 30 | 90>(30);

  // Filter data for selected period
  const getFilteredHistory = () => {
    const now = new Date();
    const cutoffDate = new Date(now.getTime() - period * 24 * 60 * 60 * 1000);

    return priceHistory
      .filter((point) => new Date(point.date) >= cutoffDate)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  const filteredHistory = getFilteredHistory();
  const hasData = filteredHistory.length >= 2;

  // Calculate min and max for scaling
  const prices = filteredHistory.map((p) => p.price);
  const minPrice = hasData ? Math.min(...prices) : 0;
  const maxPrice = hasData ? Math.max(...prices) : 0;
  const priceRange = maxPrice - minPrice;

  // Generate SVG path for the line
  const generatePath = () => {
    if (!hasData) return '';

    const points = filteredHistory.map((point, index) => {
      const x = (index / (filteredHistory.length - 1)) * CHART_WIDTH;
      const y =
        priceRange > 0
          ? CHART_HEIGHT -
            CHART_PADDING -
            ((point.price - minPrice) / priceRange) * (CHART_HEIGHT - 2 * CHART_PADDING)
          : HALF_HEIGHT;

      return `${x},${y}`;
    });

    return `M ${points.join(' L ')}`;
  };

  const path = generatePath();

  // Calculate price change
  const priceChange =
    hasData && filteredHistory.length >= 2
      ? ((filteredHistory[filteredHistory.length - 1].price - filteredHistory[0].price) /
          filteredHistory[0].price) *
        100
      : 0;

  return (
    <div className="bg-slate-800 rounded-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">📈 Historique des prix</h3>

        {/* Period Selector */}
        <div className="flex gap-2">
          {[7, 30, 90].map((days) => (
            <button
              key={days}
              onClick={() => setPeriod(days as 7 | 30 | 90)}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                period === days
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
              }`}
            >
              {days}j
            </button>
          ))}
        </div>
      </div>

      {/* Insufficient Data Message */}
      {!hasData && (
        <div className="py-8 text-center">
          <div className="text-4xl mb-3">📊</div>
          <p className="text-gray-300 mb-2">Historique insuffisant</p>
          <p className="text-gray-400 text-sm">
            Pas assez de données sur cette période pour afficher l'historique.
            {priceHistory.length > 0 && (
              <span className="block mt-1">Essayez une période plus longue.</span>
            )}
          </p>
        </div>
      )}

      {/* Chart */}
      {hasData && (
        <div>
          {/* Price Info */}
          <div className="flex items-center justify-between mb-4 text-sm">
            <div>
              <span className="text-gray-400">Min: </span>
              <span className="text-white font-medium">{minPrice.toFixed(2)} €</span>
            </div>
            {currentPrice !== undefined && (
              <div>
                <span className="text-gray-400">Actuel: </span>
                <span className="text-white font-semibold">{currentPrice.toFixed(2)} €</span>
              </div>
            )}
            <div>
              <span className="text-gray-400">Max: </span>
              <span className="text-white font-medium">{maxPrice.toFixed(2)} €</span>
            </div>
          </div>

          {/* SVG Chart */}
          <div className="relative bg-slate-900 rounded p-4 h-32 overflow-hidden">
            <svg
              viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
              preserveAspectRatio="none"
              className="w-full h-full"
            >
              {/* Grid lines */}
              <line
                x1="0"
                y1={HALF_HEIGHT}
                x2={CHART_WIDTH}
                y2={HALF_HEIGHT}
                stroke="#374151"
                strokeWidth="0.3"
                strokeDasharray="2,2"
              />

              {/* Price line */}
              <path
                d={path}
                fill="none"
                stroke="#3B82F6"
                strokeWidth="2"
                vectorEffect="non-scaling-stroke"
              />

              {/* Data points */}
              {filteredHistory.map((point, index) => {
                const x = (index / (filteredHistory.length - 1)) * CHART_WIDTH;
                const y =
                  priceRange > 0
                    ? CHART_HEIGHT -
                      CHART_PADDING -
                      ((point.price - minPrice) / priceRange) * (CHART_HEIGHT - 2 * CHART_PADDING)
                    : HALF_HEIGHT;

                return (
                  <circle
                    key={point.date}
                    cx={x}
                    cy={y}
                    r="1.5"
                    fill="#3B82F6"
                    vectorEffect="non-scaling-stroke"
                  />
                );
              })}
            </svg>
          </div>

          {/* Price Change Indicator */}
          {priceChange !== 0 && (
            <div className="mt-3 text-center">
              <span
                className={`text-sm font-medium ${
                  priceChange > 0
                    ? 'text-amber-400'
                    : priceChange < 0
                      ? 'text-green-400'
                      : 'text-blue-400'
                }`}
              >
                {priceChange > 0 ? '↑' : priceChange < 0 ? '↓' : '='}
                {Math.abs(priceChange).toFixed(1)}% sur {period} jours
              </span>
            </div>
          )}

          {/* Explanation */}
          <div className="mt-4 pt-4 border-t border-slate-700 text-xs text-gray-400">
            <p>
              <strong className="text-gray-300">Explication :</strong> Ce graphique montre
              l'évolution des prix observés sur les {period} derniers jours. Les données proviennent
              d'observations déclarées. Aucune prédiction n'est effectuée.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
