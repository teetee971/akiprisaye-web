import React, { createContext, useContext, useState, useEffect } from 'react';
type AppContextValue = {
  products: any[];
  loading: boolean;
};
const AppContext = createContext<AppContextValue | undefined>(undefined);
type Product = Record<string, unknown>;
type Territory = { products?: Product[] } & Record<string, unknown>;
type PanierAnticriseData = {
  version?: string;
  products?: Product[];
  territories?: Territory[];
} & Record<string, unknown>;

const extractProducts = (data: unknown): Product[] => {
  if (Array.isArray(data)) {
    return data as Product[];
  }

  if (!data || typeof data !== 'object') {
    return [];
  }

  const typedData = data as PanierAnticriseData;

  if (Array.isArray(typedData.products)) {
    return typedData.products;
  }

  if (Array.isArray(typedData.territories)) {
    return typedData.territories.flatMap((territory) =>
      Array.isArray(territory.products) ? territory.products : []
    );
  }

  return [];
};

export const AppProvider = ({ children }: { children: React.ReactNode }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(import.meta.env.BASE_URL + 'data/panier-anticrise.json', { cache: 'no-store' });
        if (response.ok) {
          const data: unknown = await response.json();
          setProducts(extractProducts(data));
        }
      } catch (err) { setProducts([]); } finally { setLoading(false); }
    };
    fetchData();
  }, []);
  return <AppContext.Provider value={{ products, loading }}>{children}</AppContext.Provider>;
};
export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};