/**
 * useRoute Hook
 * Calculates routes between two points with clear functionality
 */

import { useState, useCallback } from 'react';
import { buildApiUrl } from '../utils/apiBaseUrl';

interface RoutePoint {
  lat: number;
  lon: number;
}

interface RouteData {
  from: RoutePoint;
  to: RoutePoint;
  distance: {
    km: number;
    meters: number;
  };
  estimatedTime: {
    seconds: number;
    minutes: number;
  };
  note?: string;
}

interface UseRouteReturn {
  route: RouteData | null;
  loading: boolean;
  error: string | null;
  calculateRoute: (from: RoutePoint, to: RoutePoint) => Promise<void>;
  clearRoute: () => void;
}

/**
 * Custom hook to calculate routes
 * @returns Route state and controls
 */
export function useRoute(): UseRouteReturn {
  const [route, setRoute] = useState<RouteData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Calculate route between two points
  const calculateRoute = useCallback(
    async (from: RoutePoint, to: RoutePoint) => {
      setLoading(true);
      setError(null);

      try {
        // Build query params
        const params = new URLSearchParams({
          from: `${from.lat},${from.lon}`,
          to: `${to.lat},${to.lon}`,
        });

        const response = await fetch(
          buildApiUrl(`/api/map/route?${params.toString()}`)
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (data.success && data.data) {
          setRoute(data.data);
          setError(null);
        } else {
          throw new Error(data.error || 'Failed to calculate route');
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to calculate route';
        setError(errorMessage);
        setRoute(null);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Clear route
  const clearRoute = useCallback(() => {
    setRoute(null);
    setError(null);
    setLoading(false);
  }, []);

  return {
    route,
    loading,
    error,
    calculateRoute,
    clearRoute,
  };
}
