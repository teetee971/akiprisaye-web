import { useState, useEffect } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface TerritoryInflation {
  territory: string;
  territoryName: string;
  overallInflationRate: number;
  comparedToMetropole: number;
  lastUpdated: string;
  categories: CategoryInflation[];
}

interface CategoryInflation {
  category: string;
  currentAverage: number;
  previousAverage: number;
  inflationRate: number;
  priceChange: number;
}

interface InflationData {
  globalRate: number;
  territories: TerritoryInflation[];
  period: string;
}

export const useInflationData = (period: string = '3m', territoryCode?: string) => {
  const [data, setData] = useState<InflationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInflationData = async () => {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({ period });
        if (territoryCode && territoryCode !== 'all') {
          params.append('territory', territoryCode);
        }

        const response = await fetch(
          `${API_BASE_URL}/api/inflation/overview?${params.toString()}`
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        setData(result);
      } catch (err) {
        console.error('Error fetching inflation data:', err);
        setError(err instanceof Error ? err.message : 'Une erreur est survenue');
        
        // Fallback to mock data for development
        setData({
          globalRate: 5.2,
          period,
          territories: [
            {
              territory: 'GP',
              territoryName: 'Guadeloupe',
              overallInflationRate: 5.8,
              comparedToMetropole: 28.5,
              lastUpdated: new Date().toISOString(),
              categories: [
                {
                  category: 'Alimentation',
                  currentAverage: 6.2,
                  previousAverage: 5.5,
                  inflationRate: 12.7,
                  priceChange: 0.7,
                },
                {
                  category: 'Hygiène',
                  currentAverage: 4.8,
                  previousAverage: 4.5,
                  inflationRate: 6.7,
                  priceChange: 0.3,
                },
              ],
            },
            {
              territory: 'MQ',
              territoryName: 'Martinique',
              overallInflationRate: 5.3,
              comparedToMetropole: 25.8,
              lastUpdated: new Date().toISOString(),
              categories: [],
            },
            {
              territory: 'GF',
              territoryName: 'Guyane',
              overallInflationRate: 6.1,
              comparedToMetropole: 32.4,
              lastUpdated: new Date().toISOString(),
              categories: [],
            },
            {
              territory: 'RE',
              territoryName: 'La Réunion',
              overallInflationRate: 4.9,
              comparedToMetropole: 22.1,
              lastUpdated: new Date().toISOString(),
              categories: [],
            },
          ],
        });
      } finally {
        setLoading(false);
      }
    };

    fetchInflationData();
  }, [period, territoryCode]);

  const refetch = () => {
    setLoading(true);
    setError(null);
  };

  return { data, loading, error, refetch };
};
