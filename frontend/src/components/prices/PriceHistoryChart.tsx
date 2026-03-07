 
/**
 * Price History Chart Component
 * Displays price trends over time
 */

import React, { useEffect, useState } from 'react';

export interface PriceHistoryChartProps {
  productId: string;
  storeId?: string;
  period: '7d' | '30d' | '90d' | '1y';
}

interface PriceDataPoint {
  date: string;
  price: number;
  avgPrice?: number;
  minPrice?: number;
  maxPrice?: number;
}

const PriceHistoryChart: React.FC<PriceHistoryChartProps> = ({
  productId,
  storeId,
  period,
}) => {
  const [data, setData] = useState<PriceDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      setError(null);

      try {
        const endpoint = storeId
          ? `/api/prices/history/${productId}?storeId=${storeId}&limit=100`
          : `/api/prices/history/${productId}/aggregated?period=${period}`;

        const response = await fetch(endpoint);
        if (!response.ok) {
          throw new Error('Failed to fetch price history');
        }

        const result = await response.json();
        
        if (storeId) {
          // Single store history - reverse to show oldest to newest
          const formattedData = result.history.map((h: any) => ({
            date: new Date(h.observedAt).toLocaleDateString('fr-FR'),
            price: h.price,
          })).reverse();
          setData(formattedData);
        } else {
          // Aggregated history
          const formattedData = result.data.map((d: any) => ({
            date: new Date(d.date).toLocaleDateString('fr-FR'),
            price: d.avgPrice,
            minPrice: d.minPrice,
            maxPrice: d.maxPrice,
          }));
          setData(formattedData);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [productId, storeId, period]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-600 text-sm">Erreur: {error}</p>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
        <p className="text-gray-500">Aucun historique de prix disponible</p>
      </div>
    );
  }

  // Calculate chart dimensions and scale
  const maxPrice = Math.max(...data.map((d) => d.maxPrice || d.price));
  const minPrice = Math.min(...data.map((d) => d.minPrice || d.price));
  const priceRange = maxPrice - minPrice;
  const chartHeight = 200;
  const chartWidth = 600;

  const getY = (price: number) => {
    if (priceRange === 0) return chartHeight / 2;
    return chartHeight - ((price - minPrice) / priceRange) * chartHeight;
  };

  // Handle single datapoint case
  if (data.length === 1) {
    const singlePoint = data[0];
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Historique des prix
        </h3>

        <div className="mb-4">
          <svg
            viewBox={`0 0 ${chartWidth} ${chartHeight}`}
            className="w-full h-48"
            preserveAspectRatio="none"
          >
            {/* Single data point */}
            <circle
              cx={chartWidth / 2}
              cy={chartHeight / 2}
              r="6"
              fill="#3b82f6"
            >
              <title>
                {singlePoint.date}: {singlePoint.price.toFixed(2)}€
              </title>
            </circle>
          </svg>
        </div>

        <div className="text-center text-sm text-gray-600">
          <div>
            <span className="font-medium">Prix unique:</span> {singlePoint.price.toFixed(2)}€
          </div>
          <div className="text-xs mt-1 text-gray-500">
            Historique insuffisant pour afficher une tendance
          </div>
        </div>
      </div>
    );
  }

  const pathData = data
    .map((d, i) => {
      const x = (i / (data.length - 1)) * chartWidth;
      const y = getY(d.price);
      return i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
    })
    .join(' ');

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">
        Historique des prix
      </h3>

      <div className="mb-4">
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          className="w-full h-48"
          preserveAspectRatio="none"
        >
          {/* Grid lines */}
          <line
            x1="0"
            y1={chartHeight / 2}
            x2={chartWidth}
            y2={chartHeight / 2}
            stroke="#e5e7eb"
            strokeDasharray="5,5"
          />

          {/* Price line */}
          <path
            d={pathData}
            fill="none"
            stroke="#3b82f6"
            strokeWidth="2"
            strokeLinejoin="round"
          />

          {/* Data points */}
          {data.map((d, i) => (
            <circle
              key={i}
              cx={(i / (data.length - 1)) * chartWidth}
              cy={getY(d.price)}
              r="4"
              fill="#3b82f6"
            >
              <title>
                {d.date}: {d.price.toFixed(2)}€
              </title>
            </circle>
          ))}
        </svg>
      </div>

      <div className="flex items-center justify-between text-sm text-gray-600">
        <div>
          <span className="font-medium">Min:</span> {minPrice.toFixed(2)}€
        </div>
        <div>
          <span className="font-medium">Actuel:</span> {data[data.length - 1]?.price.toFixed(2)}€
        </div>
        <div>
          <span className="font-medium">Max:</span> {maxPrice.toFixed(2)}€
        </div>
      </div>
    </div>
  );
};

export default PriceHistoryChart;
