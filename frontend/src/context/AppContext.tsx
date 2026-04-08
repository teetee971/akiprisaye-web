import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { logError, logWarn } from '../utils/logger';

export interface Product {
  id?: string | number;
  name: string;
  price: string | number;
  category?: string;
  store?: string;
  brand?: string;
  imageUrl?: string;
}

type AppContextValue = {
  products: Product[];
  loading: boolean;
  error: string | null;
  reloadProducts: () => Promise<void>;
};

const defaultValue: AppContextValue = {
  products: [],
  loading: true,
  error: null,
  reloadProducts: async () => {},
};

const CATALOGUE_CACHE_KEY = 'akp_catalogue_cache_v1';
const CATALOGUE_CACHE_TTL_MS = 60 * 60 * 1000;
const RETRY_DELAY_MS = 1500;
const CATALOGUE_BASE_URL = (import.meta.env.BASE_URL || '/').replace(/\/+$/g, '');

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const buildCatalogueUrl = () => `${CATALOGUE_BASE_URL}/data/catalogue.json`.replace(/\/{2,}/g, '/');

const normalizeCatalogue = (data: unknown): Product[] => {
  const rawProducts =
    Array.isArray(data) ? data : Array.isArray((data as { products?: unknown })?.products)
      ? (data as { products: unknown[] }).products
      : null;

  if (!rawProducts) {
    throw new Error('catalogue payload must be an array or { products: [] }');
  }

  const normalized = rawProducts.filter(
    (item): item is Product =>
      typeof item === 'object' &&
      item !== null &&
      typeof (item as { name?: unknown }).name === 'string',
  );

  if (normalized.length === 0) {
    throw new Error('catalogue payload contains no valid product entries');
  }

  return normalized;
};

const AppContext = createContext<AppContextValue>(defaultValue);

export const useApp = (): AppContextValue => useContext(AppContext);

type AppProviderProps = {
  children: ReactNode;
};

export function AppProvider({ children }: AppProviderProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reloadProducts = async () => {
    setLoading(true);
    setError(null);
    for (let attempt = 1; attempt <= 2; attempt += 1) {
      try {
        const response = await fetch(buildCatalogueUrl());
        if (!response.ok) {
          throw new Error(`catalogue fetch failed with status ${response.status}`);
        }

        const data: unknown = await response.json();
        const nextProducts = normalizeCatalogue(data);

        setProducts(nextProducts);
        localStorage.setItem(
          CATALOGUE_CACHE_KEY,
          JSON.stringify({ timestamp: Date.now(), products: nextProducts }),
        );
        setLoading(false);
        return;
      } catch (cause) {
        if (attempt === 1) {
          logWarn('catalogue_load_retry_scheduled', { attempt, cause });
          await wait(RETRY_DELAY_MS);
          continue;
        }

        logError('catalogue_load_failed', { attempt, cause });
        setError('Impossible de charger le catalogue.');
        setLoading(false);
        return;
      }
    }
  };

  useEffect(() => {
    try {
      const raw = localStorage.getItem(CATALOGUE_CACHE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as { timestamp?: number; products?: unknown };
        const isFresh =
          typeof parsed.timestamp === 'number' && Date.now() - parsed.timestamp < CATALOGUE_CACHE_TTL_MS;
        const cachedProducts = isFresh ? normalizeCatalogue(parsed.products) : null;
        if (isFresh && cachedProducts) {
          setProducts(cachedProducts);
          setLoading(false);
          return;
        }
      }
    } catch {
      logWarn('catalogue_cache_parse_failed');
    }

    void reloadProducts();
  }, []);

  const value = useMemo(
    () => ({ products, loading, error, reloadProducts }),
    [products, loading, error],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export default AppContext;
