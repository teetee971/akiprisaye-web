import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

export interface Product {
  id?: string | number;
  name: string;
  price: string | number;
  category?: string;
  store?: string;
}

type AppContextValue = {
  products: Product[];
  loading: boolean;
  error: string | null;
  reloadProducts: () => Promise<void>;
};

const AppContext = createContext<AppContextValue>({
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

export const useApp = () => useContext(AppContext);

export function AppProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reloadProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      // On garde une URL stable et on demande explicitement une réponse fraîche
      const response = await fetch(`${import.meta.env.BASE_URL}data/catalogue.json`, {
        cache: 'no-store',
      });

      if (!response.ok) throw new Error(`Erreur serveur: ${response.status}`);

      const data = await response.json();

      // BLINDAGE : On vérifie si les données sont dans "data" ou dans "data.products"
      let finalArray: Product[] = [];
      if (Array.isArray(data)) {
        finalArray = data;
      } else if (data && typeof data === 'object' && Array.isArray(data.products)) {
        finalArray = data.products;
      }

      setProducts(finalArray);
    } catch (err: unknown) {
      console.error('Erreur gisement:', err);
      setError('Impossible de charger le catalogue.');
      setProducts([]); // On met une liste vide pour éviter le crash .map
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void reloadProducts();
  }, []);

  const value = useMemo(() => ({ products, loading, error, reloadProducts }), [products, loading, error, reloadProducts]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
