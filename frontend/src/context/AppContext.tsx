import React, { createContext, useContext, useState, useEffect } from 'react';
const AppContext = createContext<any>(null);
export const AppProvider = ({ children }: { children: React.ReactNode }) => {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/data/panier-anticrise.json?v=' + Date.now());
        if (response.ok) {
          const data = await response.json();
          setProducts(Array.isArray(data) ? data : []);
        }
      } catch (err) { setProducts([]); } finally { setLoading(false); }
    };
    fetchData();
  }, []);
  return <AppContext.Provider value={{ products, loading }}>{children}</AppContext.Provider>;
};
export const useApp = () => useContext(AppContext);