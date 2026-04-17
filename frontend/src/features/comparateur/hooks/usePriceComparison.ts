import { useEffect, useMemo, useState } from 'react';
import type { Territory } from '../../../types/comparatorCommon';

interface TerritoryPrice {
  territory: Territory;
  price: number;
}

interface Stats {
  min: number;
  max: number;
  average: number;
  range: number;
}

interface PriceComparisonResult {
  comparisonData: TerritoryPrice[];
  stats: Stats | null;
  loading: boolean;
}

/**
 * SAFE price comparison hook
 * - no throw
 * - no undefined
 * - no crash
 */
export function usePriceComparison(
  productId: string,
  territories: Territory[]
): PriceComparisonResult {
  const [comparisonData, setComparisonData] = useState<TerritoryPrice[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);

        if (!productId || !Array.isArray(territories) || territories.length === 0) {
          if (!cancelled) setComparisonData([]);
          return;
        }

        // ⚠️ TEMPORAIRE : données simulées SAFE
        const simulated = territories.map((t) => ({
          territory: t,
          price: Number((Math.random() * 3 + 1).toFixed(2)),
        }));

        if (!cancelled) {
          setComparisonData(simulated);
        }
      } catch (err) {
        console.error('[usePriceComparison] runtime error', err);
        if (!cancelled) {
          setComparisonData([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [productId, territories]);

  const stats: Stats | null = useMemo(() => {
    if (!comparisonData.length) return null;

    const prices = comparisonData.map((p) => p.price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const average = prices.reduce((a, b) => a + b, 0) / prices.length;

    return {
      min,
      max,
      average,
      range: max - min,
    };
  }, [comparisonData]);

  return {
    comparisonData,
    stats,
    loading,
  };
}
