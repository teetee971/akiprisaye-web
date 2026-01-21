import { useEffect, useState, useMemo } from 'react';
import type { TerritoryPrice } from '../types';
import type { Territory } from '../../../types/comparatorCommon';
import { calculateMedian } from '../utils/statsUtils';
import { TERRITORY_FILE_MAP } from '../constants';

/**
 * Mock function to get store count for a territory
 * In production, this would fetch from a real data source
 */
function getStoreCount(territory: Territory): number {
  const storeCounts: Record<Territory, number> = {
    GP: 45,
    MQ: 38,
    GF: 22,
    RE: 52,
    YT: 15,
    MF: 8,
    BL: 6,
    PM: 4,
    WF: 3,
    PF: 18,
    NC: 25
  };
  return storeCounts[territory] || 0;
}

export function usePriceComparison(productId: string, territories: Territory[]) {
  const [comparisonData, setComparisonData] = useState<TerritoryPrice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const loadComparisonData = async () => {
      setLoading(true);
      
      try {
        // Load prices from each territory
        const promises = territories.map(async (territory) => {
          try {
            // Validate territory code before using in URL
            if (!TERRITORY_FILE_MAP[territory]) {
              console.warn(`Invalid territory code: ${territory}`);
              return null;
            }
            
            // Try to load from split files (Mission I format)
            const territoryFilename = TERRITORY_FILE_MAP[territory];
            const response = await fetch(`/data/territories/${territoryFilename}.json`);
            
            if (!response.ok) {
              // Fallback: territory not available yet
              return null;
            }
            
            const data = await response.json();
            const product = Array.isArray(data) 
              ? data.find((p: { id: string }) => p.id === productId)
              : null;
            
            if (!product) {
              return null;
            }

            // Ensure we have a valid price before including in comparison
            const price = product.basePrice || product.prix_unitaire;
            if (typeof price !== 'number' || price <= 0) {
              console.warn(`Invalid price for product ${productId} in territory ${territory}`);
              return null;
            }

            return {
              territory,
              price,
              available: true,
              storeCount: getStoreCount(territory)
            };
          } catch {
            // Territory file doesn't exist or parsing failed
            return null;
          }
        });

        const results = await Promise.all(promises);
        
        if (!cancelled) {
          // Filter out null results (unavailable territories)
          const validResults = results.filter((r): r is TerritoryPrice => r !== null && r.available);
          setComparisonData(validResults);
        }
      } catch (error) {
        console.error('Error loading comparison data:', error);
        if (!cancelled) {
          setComparisonData([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadComparisonData();

    return () => {
      cancelled = true;
    };
  }, [productId, territories]);

  const stats = useMemo(() => {
    if (comparisonData.length === 0) {
      return {
        min: 0,
        max: 0,
        average: 0,
        median: 0,
        range: 0
      };
    }

    const prices = comparisonData.map(d => d.price);
    const sum = prices.reduce((a, b) => a + b, 0);
    const min = Math.min(...prices);
    const max = Math.max(...prices);

    return {
      min,
      max,
      average: sum / prices.length,
      median: calculateMedian(prices),
      range: max - min
    };
  }, [comparisonData]);

  return { comparisonData, stats, loading };
}
