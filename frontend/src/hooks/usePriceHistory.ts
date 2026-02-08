/**
 * usePriceHistory Hook
 * 
 * Fetch price history with loading states
 */

import { useState, useEffect } from 'react';

interface PriceDataPoint {
  date: Date | string;
  price: number;
  confidenceScore: number;
  source: string;
}

interface PriceHistoryStats {
  currentPrice?: number;
  averagePrice: number;
  minPrice: number;
  maxPrice: number;
  priceRange: number;
  volatility: number;
  trendDirection: 'UP' | 'DOWN' | 'STABLE';
  trendPercentage: number;
  dataPoints: number;
}

interface UsePriceHistoryResult {
  history: PriceDataPoint[];
  stats: PriceHistoryStats | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function usePriceHistory(
  productId: string,
  storeId: string,
  days: number = 90,
  minConfidence: number = 0
): UsePriceHistoryResult {
  const [history, setHistory] = useState<PriceDataPoint[]>([]);
  const [stats, setStats] = useState<PriceHistoryStats | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/prices/history/${productId}?storeId=${storeId}&days=${days}&minConfidence=${minConfidence}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        setHistory(result.data);
        setStats(result.stats);
      } else {
        throw new Error(result.error || 'Failed to fetch price history');
      }
    } catch (err) {
      console.error('Error fetching price history:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (productId && storeId) {
      fetchHistory();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId, storeId, days, minConfidence]);

  return {
    history,
    stats,
    isLoading,
    error,
    refetch: fetchHistory,
  };
}
