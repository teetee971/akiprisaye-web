import { useEffect, useRef, useState } from 'react';
import { fetchHistoryApi } from '../services/history.api';
import type { HistoryPoint } from '../types/api';

const DEBOUNCE_MS = 450;

export function useHistory(
  productId: string,
  territory: string,
  range: '7d' | '30d'
): { data: HistoryPoint[]; loading: boolean } {
  const [data, setData] = useState<HistoryPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const requestIdRef = useRef(0);

  useEffect(() => {
    if (!productId) {
      setData([]);
      return;
    }

    setLoading(true);
    const id = ++requestIdRef.current;

    const timer = setTimeout(async () => {
      try {
        const result = await fetchHistoryApi(productId, territory, range);
        if (id === requestIdRef.current) setData(result);
      } catch {
        if (id === requestIdRef.current) setData([]);
      } finally {
        if (id === requestIdRef.current) setLoading(false);
      }
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [productId, territory, range]);

  return { data, loading };
}
