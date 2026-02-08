import { useState, useEffect } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface ProductMover {
  productName: string;
  category: string;
  previousPrice: number;
  currentPrice: number;
  priceChange: number;
  percentChange: number;
  territory: string;
}

interface TopMoversData {
  increases: ProductMover[];
  decreases: ProductMover[];
}

export const useTopMovers = (
  period: string = '3m',
  territoryCode?: string,
  limit: number = 10
) => {
  const [data, setData] = useState<TopMoversData>({ increases: [], decreases: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTopMovers = async () => {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({ period, limit: limit.toString() });
        if (territoryCode && territoryCode !== 'all') {
          params.append('territory', territoryCode);
        }

        const response = await fetch(
          `${API_BASE_URL}/api/inflation/top-movers?${params.toString()}`
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        setData(result);
      } catch (err) {
        console.error('Error fetching top movers:', err);
        setError(err instanceof Error ? err.message : 'Une erreur est survenue');
        
        // Fallback to mock data for development
        const mockIncreases: ProductMover[] = [
          {
            productName: 'Lait demi-écrémé 1L',
            category: 'Alimentation',
            previousPrice: 1.35,
            currentPrice: 1.65,
            priceChange: 0.30,
            percentChange: 22.2,
            territory: 'Guadeloupe',
          },
          {
            productName: 'Pain de mie complet',
            category: 'Alimentation',
            previousPrice: 2.10,
            currentPrice: 2.50,
            priceChange: 0.40,
            percentChange: 19.0,
            territory: 'Martinique',
          },
          {
            productName: 'Huile tournesol 1L',
            category: 'Alimentation',
            previousPrice: 2.80,
            currentPrice: 3.25,
            priceChange: 0.45,
            percentChange: 16.1,
            territory: 'Guyane',
          },
        ];

        const mockDecreases: ProductMover[] = [
          {
            productName: 'Tomates en conserve 400g',
            category: 'Alimentation',
            previousPrice: 1.50,
            currentPrice: 1.20,
            priceChange: -0.30,
            percentChange: -20.0,
            territory: 'La Réunion',
          },
          {
            productName: 'Pâtes spaghetti 500g',
            category: 'Alimentation',
            previousPrice: 1.80,
            currentPrice: 1.50,
            priceChange: -0.30,
            percentChange: -16.7,
            territory: 'Guadeloupe',
          },
        ];
        
        setData({
          increases: mockIncreases.slice(0, limit),
          decreases: mockDecreases.slice(0, limit),
        });
      } finally {
        setLoading(false);
      }
    };

    fetchTopMovers();
  }, [period, territoryCode, limit]);

  return { data, loading, error };
};
