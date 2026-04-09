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
});

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
