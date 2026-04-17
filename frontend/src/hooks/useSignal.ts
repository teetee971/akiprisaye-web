import { useEffect, useRef, useState } from 'react';
import { fetchSignalApi } from '../services/signal.api';
import type { SignalResult } from '../types/api';

export function useSignal(
  productId: string,
  territory: string
): { data: SignalResult | null; loading: boolean } {
  const [data, setData] = useState<SignalResult | null>(null);
  const [loading, setLoading] = useState(false);
  const requestIdRef = useRef(0);

  useEffect(() => {
    if (!productId) {
      setData(null);
      return;
    }

    setLoading(true);
    const id = ++requestIdRef.current;

    fetchSignalApi(productId, territory)
      .then((result) => {
        if (id === requestIdRef.current) setData(result);
      })
      .catch(() => {
        if (id === requestIdRef.current) setData(null);
      })
      .finally(() => {
        if (id === requestIdRef.current) setLoading(false);
      });
  }, [productId, territory]);

  return { data, loading };
}
