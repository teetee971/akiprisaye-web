/**
 * useNearbyStores Hook
 * Fetches and manages nearby stores with automatic refetch on options change
 */

import { useState, useEffect, useCallback } from 'react';

interface Store {
  id: string;
  name: string;
  chain: string;
  lat: number;
  lon: number;
  address?: string;
  city?: string;
  territory: string;
  distance?: number;
  travelTimeSeconds?: number;
  priceIndex?: number;
}

interface UseNearbyStoresOptions {
  lat?: number;
  lon?: number;
  radius?: number; // in km (1-50)
  chains?: string[];
  maxResults?: number;
  autoFetch?: boolean; // Automatically fetch when options change
}

interface UseNearbyStoresReturn {
  stores: Store[];
  loading: boolean;
  error: string | null;
  fetchStores: () => Promise<void>;
  refetch: () => Promise<void>;
  clear: () => void;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

/**
 * Custom hook to fetch nearby stores
 * @param options Search options
 * @returns Nearby stores state and controls
 */
export function useNearbyStores(options: UseNearbyStoresOptions = {}): UseNearbyStoresReturn {
  const { lat, lon, radius = 10, chains, maxResults, autoFetch = true } = options;

  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch stores from API
  const fetchStores = useCallback(async () => {
    // Validate required parameters
    if (!lat || !lon) {
      setError('Location coordinates are required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Build query params
      const params = new URLSearchParams({
        lat: lat.toString(),
        lon: lon.toString(),
        radius: radius.toString(),
      });

      if (chains && chains.length > 0) {
        params.append('chains', chains.join(','));
      }

      if (maxResults) {
        params.append('maxResults', maxResults.toString());
      }

      const response = await fetch(`${API_BASE_URL}/api/map/nearby?${params.toString()}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success && data.data) {
        setStores(data.data.stores || []);
        setError(null);
      } else {
        throw new Error(data.error || 'Failed to fetch stores');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch nearby stores';
      setError(errorMessage);
      setStores([]);
    } finally {
      setLoading(false);
    }
  }, [lat, lon, radius, chains, maxResults]);

  // Refetch stores (alias for fetchStores for clarity)
  const refetch = useCallback(() => {
    return fetchStores();
  }, [fetchStores]);

  // Clear stores
  const clear = useCallback(() => {
    setStores([]);
    setError(null);
    setLoading(false);
  }, []);

  // Auto-fetch when options change
  useEffect(() => {
    if (autoFetch && lat && lon) {
      fetchStores();
    }
  }, [autoFetch, lat, lon, radius, chains, maxResults, fetchStores]);

  return {
    stores,
    loading,
    error,
    fetchStores,
    refetch,
    clear,
  };
}
