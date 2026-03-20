import { useEffect, useRef, useState } from 'react';
import { fetchProductsApi } from '../services/products.api';
import type { CompareProduct } from '../types/compare';

const DEBOUNCE_MS = 450;

export function useProducts(query: string): { data: CompareProduct[]; loading: boolean } {
  const [data, setData] = useState<CompareProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const requestIdRef = useRef(0);

  useEffect(() => {
    if (!query.trim()) {
      setData([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const id = ++requestIdRef.current;

    const timer = setTimeout(async () => {
      try {
        const result = await fetchProductsApi(query.trim());
        if (id === requestIdRef.current) setData(result);
      } catch {
        if (id === requestIdRef.current) setData([]);
      } finally {
        if (id === requestIdRef.current) setLoading(false);
      }
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [query]);

  return { data, loading };
}
