/**
 * useRoute Hook
 * Calculate route between two points
 */

import { useState, useCallback } from 'react';
import { RouteResult } from '../types/map';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export function useRoute() {
  const [route, setRoute] = useState<RouteResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const calculateRoute = useCallback(
    async (from: [number, number], to: [number, number]) => {
      setLoading(true);
      setError(null);
      setRoute(null);

      try {
        const params = new URLSearchParams({
          from: `${from[0]},${from[1]}`,
          to: `${to[0]},${to[1]}`,
        });

        const response = await fetch(
          `${API_BASE_URL}/api/map/route?${params.toString()}`
        );

        if (!response.ok) {
          throw new Error('Failed to calculate route');
        }

        const data = await response.json();

        if (data.success && data.data) {
          setRoute(data.data);
        } else {
          throw new Error('Invalid response format');
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to calculate route';
        setError(errorMessage);
        console.error('Error calculating route:', err);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const clearRoute = useCallback(() => {
    setRoute(null);
    setError(null);
  }, []);

  return {
    route,
    loading,
    error,
    calculateRoute,
    clearRoute,
  };
}
