import { useEffect, useMemo, useState } from 'react';
import { PriceAggregator } from '../services/priceProviders/PriceAggregator';
import type { ProductPrice } from '../types/ProductPrice';

interface ProductSearchState {
  results: ProductPrice[];
  loading: boolean;
  error: string | null;
  hasQuery: boolean;
}

const DEBOUNCE_MS = 350;

export function useProductSearch(query: string): ProductSearchState {
  const provider = useMemo(() => new PriceAggregator(), []);
  const [state, setState] = useState<ProductSearchState>({
    results: [],
    loading: false,
    error: null,
    hasQuery: false,
  });

  useEffect(() => {
    const trimmed = query.trim();

    if (trimmed.length < 2) {
      setState({
        results: [],
        loading: false,
        error: null,
        hasQuery: trimmed.length > 0,
      });
      return;
    }

    let isActive = true;
    const timer = window.setTimeout(() => {
      setState((prev) => ({
        ...prev,
        loading: true,
        error: null,
        hasQuery: true,
      }));

      provider
        .search(trimmed)
        .then((results) => {
          if (!isActive) {
            return;
          }
          setState({
            results,
            loading: false,
            error: null,
            hasQuery: true,
          });
        })
        .catch(() => {
          if (!isActive) {
            return;
          }
          setState({
            results: [],
            loading: false,
            error: 'Sources de données temporairement indisponibles.',
            hasQuery: true,
          });
        });
    }, DEBOUNCE_MS);

    return () => {
      isActive = false;
      window.clearTimeout(timer);
    };
  }, [provider, query]);

  return state;
}
