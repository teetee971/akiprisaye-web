/**
 * useNearbyStores Hook
 * Fetch stores near a location
 */

import { useState, useEffect, useCallback } from 'react';
import { StoreMarker, NearbyStoresOptions } from '../types/map';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export function useNearbyStores(options: NearbyStoresOptions | null) {
  const [stores, setStores] = useState<StoreMarker[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStores = useCallback(async (opts: NearbyStoresOptions) => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        lat: opts.lat.toString(),
        lon: opts.lon.toString(),
        radius: opts.radius.toString(),
      });

      if (opts.chains && opts.chains.length > 0) {
        params.append('chains', opts.chains.join(','));
      }

      if (opts.limit) {
        params.append('limit', opts.limit.toString());
      }

      if (opts.sortBy) {
        params.append('sortBy', opts.sortBy);
      }

      const response = await fetch(
        `${API_BASE_URL}/api/map/nearby?${params.toString()}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch nearby stores');
      }

      const data = await response.json();

      if (data.success && data.data && data.data.stores) {
        setStores(data.data.stores);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to fetch stores';
      setError(errorMessage);
      console.error('Error fetching nearby stores:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const refetch = useCallback(() => {
    if (options) {
      fetchStores(options);
    }
  }, [options, fetchStores]);

  useEffect(() => {
    if (options) {
      fetchStores(options);
    }
  }, [options, fetchStores]);

  return {
    stores,
    loading,
    error,
    refetch,
  };
}
