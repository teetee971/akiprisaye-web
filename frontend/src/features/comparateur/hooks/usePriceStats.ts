/**
 * Custom hook for price statistics calculation
 */

import { useMemo } from 'react';
import { calculateMedian, calculateVariance, calculateStdDev } from '../utils/statsUtils';

export function usePriceStats(prices: number[]) {
  return useMemo(() => {
    if (!prices.length) return null;

    const sorted = [...prices].sort((a, b) => a - b);
    const sum = prices.reduce((a, b) => a + b, 0);

    return {
      min: sorted[0],
      max: sorted[sorted.length - 1],
      average: sum / prices.length,
      median: calculateMedian(prices),
      range: sorted[sorted.length - 1] - sorted[0],
      variance: calculateVariance(prices),
      stdDev: calculateStdDev(prices)
    };
  }, [prices]);
}
