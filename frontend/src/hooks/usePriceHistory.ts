/**
 * usePriceHistory Hook
 * React hook for fetching and managing price history
 */

import { useState, useEffect, useCallback } from 'react';

export interface PriceHistoryEntry {
  price: number;
  observedAt: string;
  source: string;
  change: number;
  changeType: 'increase' | 'decrease' | 'stable';
  confidenceScore: number;
}

export interface PriceStatistics {
  minPrice: number;
  maxPrice: number;
  avgPrice: number;
  currentPrice: number;
  priceRange: number;
  volatility: number;
}

export interface PriceHistoryData {
  productId: string;
  storeId: string;
  history: PriceHistoryEntry[];
  statistics: PriceStatistics;
}

interface UsePriceHistoryResult {
  data: PriceHistoryData | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function usePriceHistory(
  productId: string,
  storeId: string,
  limit: number = 50
): UsePriceHistoryResult {
  const [data, setData] = useState<PriceHistoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = useCallback(async () => {
    if (!productId || !storeId) {
      setError('Product ID and Store ID are required');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/prices/history/${productId}?storeId=${storeId}&limit=${limit}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch price history');
    } finally {
      setLoading(false);
    }
  }, [productId, storeId, limit]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  return {
    data,
    loading,
    error,
    refetch: fetchHistory,
  };
}
