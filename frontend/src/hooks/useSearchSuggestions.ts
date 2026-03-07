/**
 * useSearchSuggestions
 *
 * Debounced autocomplete suggestions for the search bar.
 * Uses enhancedPriceService for fuzzy matching.
 *
 * Features:
 *  - 250 ms debounce to avoid hammering the service on every keystroke
 *  - Cancels in-flight search when query changes
 *  - Returns at most MAX_SUGGESTIONS results
 *  - Cleared when query is empty / too short
 */
import { useState, useEffect, useRef } from 'react';
import { searchProducts } from '../services/enhancedPriceService';
import type { TerritoryCode } from '../constants/territories';

const MIN_QUERY_LENGTH = 2;
const MAX_SUGGESTIONS = 8;
const DEBOUNCE_MS = 250;

export interface SearchSuggestion {
  id: string;
  label: string;
  brand?: string;
  category?: string;
  ean?: string;
}

export function useSearchSuggestions(query: string, territory?: TerritoryCode) {
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const abortRef = useRef<{ cancelled: boolean }>({ cancelled: false });

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < MIN_QUERY_LENGTH) {
      setSuggestions([]);
      setLoading(false);
      return;
    }

    const handle = setTimeout(async () => {
      const token = { cancelled: false };
      abortRef.current = token;
      setLoading(true);

      try {
        const results = await searchProducts({ query: trimmed, territory });
        if (token.cancelled) return;

        const mapped: SearchSuggestion[] = results
          .slice(0, MAX_SUGGESTIONS)
          .map((r) => ({
            id: r.product.canonicalId,
            label: r.product.name,
            brand: r.product.brand,
            category: r.product.category,
            ean: r.product.ean,
          }));

        setSuggestions(mapped);
      } catch {
        if (!token.cancelled) setSuggestions([]);
      } finally {
        if (!token.cancelled) setLoading(false);
      }
    }, DEBOUNCE_MS);

    return () => {
      abortRef.current.cancelled = true;
      clearTimeout(handle);
    };
  }, [query, territory]);

  return { suggestions, loading };
}
