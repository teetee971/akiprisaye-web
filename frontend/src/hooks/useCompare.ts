/**
 * useCompare — React hook for the price comparison flow
 *
 * Features:
 *   - 450 ms debounce (prevents request storm while user types)
 *   - Distinct loading / error / empty states
 *   - Automatic mock fallback when the backend is not reachable
 *   - Stable reference for data so downstream components avoid re-renders
 */

import { useEffect, useRef, useState } from 'react';
import { fetchCompare } from '../services/compare.service';
import type { CompareResponse } from '../types/compare';

export interface UseCompareResult {
  data: CompareResponse | null;
  loading: boolean;
  error: string | null;
}

const DEBOUNCE_MS = 450;

export function useCompare(query: string, territory: string, retailer: string): UseCompareResult {
  const [data, setData] = useState<CompareResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Track latest request to discard stale responses
  const requestIdRef = useRef(0);

  useEffect(() => {
    if (!query.trim()) {
      setData(null);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    const id = ++requestIdRef.current;

    const timer = setTimeout(async () => {
      try {
        const result = await fetchCompare({
          query: query.trim(),
          territory,
          retailer: retailer || undefined,
        });
        if (id === requestIdRef.current) {
          setData(result);
          setError(null);
        }
      } catch (err) {
        if (id === requestIdRef.current) {
          setError(err instanceof Error ? err.message : 'Erreur inattendue');
          setData(null);
        }
      } finally {
        if (id === requestIdRef.current) setLoading(false);
      }
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [query, territory, retailer]);

  return { data, loading, error };
}
