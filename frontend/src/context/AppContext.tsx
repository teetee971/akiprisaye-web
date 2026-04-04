import React, { createContext, useContext, useState, useEffect } from 'react';

const AppContext = createContext<any>(null);

export const AppProvider = ({ children }: { children: React.ReactNode }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulation de chargement de la DB locale
    setTimeout(() => {
      setProducts([
        { id: 1, name: "Banane Pays", price: 1.20, shop: "Super U", territory: "GP", impact: 98, category: "Frais" },
        { id: 2, name: "Poulet Frais", price: 8.50, shop: "Carrefour", territory: "MQ", impact: 85, category: "Viande" },
        { id: 3, name: "Riz Long Grain", price: 2.10, shop: "Leclerc", territory: "GF", impact: 40, category: "Épicerie" }
      ] as any);
      setLoading(false);
    }, 1000);
  }, []);

  const addScannedProduct = (newProduct: any) => {
    setProducts((prev: any) => [newProduct, ...prev]);
  };

  return (
    <AppContext.Provider value={{ products, loading, addScannedProduct }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
