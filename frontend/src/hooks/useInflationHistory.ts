import { useState, useEffect } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface HistoricalDataPoint {
  date: string;
  rate: number;
}

export const useInflationHistory = (
  period: string = '1y',
  territoryCode?: string
) => {
  const [data, setData] = useState<HistoricalDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHistoricalData = async () => {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({ period });
        if (territoryCode && territoryCode !== 'all') {
          params.append('territory', territoryCode);
        }

        const response = await fetch(
          `${API_BASE_URL}/api/inflation/history?${params.toString()}`
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        setData(result);
      } catch (err) {
        console.error('Error fetching inflation history:', err);
        setError(err instanceof Error ? err.message : 'Une erreur est survenue');
        
        // Fallback to mock data for development
        const mockData: HistoricalDataPoint[] = [];
        const now = new Date();
        const months = period === '1m' ? 1 : period === '3m' ? 3 : period === '6m' ? 6 : 12;
        
        for (let i = months; i >= 0; i--) {
          const date = new Date(now);
          date.setMonth(date.getMonth() - i);
          mockData.push({
            date: date.toISOString(),
            rate: 3 + Math.random() * 4 + (months - i) * 0.1,
          });
        }
        
        setData(mockData);
      } finally {
        setLoading(false);
      }
    };

    fetchHistoricalData();
  }, [period, territoryCode]);

  return { data, loading, error };
};
