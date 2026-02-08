/**
 * PriceHistoryChart Component
 * 
 * SVG price trends visualization with statistics
 */

import React from 'react';

interface PriceDataPoint {
  date: Date | string;
  price: number;
  confidenceScore: number;
}

interface PriceHistoryChartProps {
  data: PriceDataPoint[];
  width?: number;
  height?: number;
  showStats?: boolean;
  currency?: string;
}

const PriceHistoryChart: React.FC<PriceHistoryChartProps> = ({
  data,
  width = 600,
  height = 300,
  showStats = true,
  currency = '€',
}) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg border border-gray-200">
        <p className="text-gray-500">Aucune donnée disponible</p>
      </div>
    );
  }

  // Prepare data
  const prices = data.map(d => d.price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const avgPrice = prices.reduce((sum, p) => sum + p, 0) / prices.length;
  
  // Chart dimensions
  const padding = { top: 20, right: 40, bottom: 40, left: 60 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Price range with some padding
  const priceRange = maxPrice - minPrice || 1;
  const yMin = minPrice - priceRange * 0.1;
  const yMax = maxPrice + priceRange * 0.1;

  // Generate SVG path
  const generatePath = (): string => {
    if (data.length === 0) return '';

    const points = data.map((point, index) => {
      const x = padding.left + (index / (data.length - 1 || 1)) * chartWidth;
      const y = padding.top + chartHeight - ((point.price - yMin) / (yMax - yMin)) * chartHeight;
      return `${x},${y}`;
    });

    return `M ${points.join(' L ')}`;
  };

  // Generate area path (filled)
  const generateAreaPath = (): string => {
    if (data.length === 0) return '';

    const path = generatePath();
    const lastX = padding.left + chartWidth;
    const bottomY = padding.top + chartHeight;
    
    return `${path} L ${lastX},${bottomY} L ${padding.left},${bottomY} Z`;
  };

  // Format price
  const formatPrice = (price: number): string => {
    return `${price.toFixed(2)}${currency}`;
  };

  // Format date
  const formatDate = (date: Date | string): string => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
  };

  // Calculate trend
  const trend = prices[prices.length - 1] - prices[0];
  const trendPercent = ((trend / prices[0]) * 100).toFixed(1);
  const isUp = trend > 0;

  return (
    <div className="w-full">
      <svg
        width={width}
        height={height}
        className="bg-white rounded-lg border border-gray-200"
        role="img"
        aria-label="Graphique d'historique des prix"
      >
        {/* Grid lines */}
        <g className="grid">
          {[0, 0.25, 0.5, 0.75, 1].map((fraction, i) => {
            const y = padding.top + chartHeight * (1 - fraction);
            const price = yMin + (yMax - yMin) * fraction;
            return (
              <g key={i}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={padding.left + chartWidth}
                  y2={y}
                  stroke="#e5e7eb"
                  strokeWidth="1"
                />
                <text
                  x={padding.left - 10}
                  y={y + 4}
                  textAnchor="end"
                  fontSize="12"
                  fill="#6b7280"
                >
                  {formatPrice(price)}
                </text>
              </g>
            );
          })}
        </g>

        {/* Area fill */}
        <path
          d={generateAreaPath()}
          fill="rgba(59, 130, 246, 0.1)"
          strokeWidth="0"
        />

        {/* Line */}
        <path
          d={generatePath()}
          fill="none"
          stroke="#3b82f6"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Data points */}
        {data.map((point, index) => {
          const x = padding.left + (index / (data.length - 1 || 1)) * chartWidth;
          const y = padding.top + chartHeight - ((point.price - yMin) / (yMax - yMin)) * chartHeight;
          
          // Color based on confidence
          const color = point.confidenceScore >= 70 ? '#10b981' : point.confidenceScore >= 50 ? '#f59e0b' : '#ef4444';

          return (
            <circle
              key={index}
              cx={x}
              cy={y}
              r="4"
              fill={color}
              stroke="white"
              strokeWidth="2"
            />
          );
        })}

        {/* X-axis labels */}
        {data.length > 1 && [0, Math.floor(data.length / 2), data.length - 1].map((index) => {
          const point = data[index];
          const x = padding.left + (index / (data.length - 1)) * chartWidth;
          return (
            <text
              key={index}
              x={x}
              y={height - padding.bottom + 20}
              textAnchor="middle"
              fontSize="12"
              fill="#6b7280"
            >
              {formatDate(point.date)}
            </text>
          );
        })}
      </svg>

      {/* Statistics */}
      {showStats && (
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
            <div className="text-xs text-gray-600 mb-1">Prix actuel</div>
            <div className="text-lg font-semibold text-gray-900">
              {formatPrice(prices[prices.length - 1])}
            </div>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
            <div className="text-xs text-gray-600 mb-1">Prix moyen</div>
            <div className="text-lg font-semibold text-gray-900">
              {formatPrice(avgPrice)}
            </div>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
            <div className="text-xs text-gray-600 mb-1">Prix min/max</div>
            <div className="text-lg font-semibold text-gray-900">
              {formatPrice(minPrice)} / {formatPrice(maxPrice)}
            </div>
          </div>
          
          <div className={`rounded-lg p-3 border ${isUp ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
            <div className="text-xs text-gray-600 mb-1">Tendance</div>
            <div className={`text-lg font-semibold ${isUp ? 'text-red-700' : 'text-green-700'}`}>
              {isUp ? '↑' : '↓'} {Math.abs(Number(trendPercent))}%
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PriceHistoryChart;
