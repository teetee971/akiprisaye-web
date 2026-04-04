import React, { createContext, useContext, useState, useEffect } from 'react';

const AppContext = createContext<any>(null);

export const AppProvider = ({ children }: { children: React.ReactNode }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Charger les données au démarrage
  useEffect(() => {
    const saved = localStorage.getItem('aki_db');
    if (saved) {
      setProducts(JSON.parse(saved));
    } else {
      // Data par défaut si vide
      setProducts([
        { id: 1, name: "Banane Pays", price: 1.20, shop: "Super U", territory: "GP", impact: 98, category: "Frais" },
        { id: 2, name: "Poulet Frais", price: 8.50, shop: "Carrefour", territory: "MQ", impact: 85, category: "Viande" }
      ] as any);
    }
    setLoading(false);
  }, []);

  // Sauvegarder à chaque changement
  useEffect(() => {
    if (products.length > 0) {
      localStorage.setItem('aki_db', JSON.stringify(products));
    }
  }, [products]);

  const addScannedProduct = (newProduct: any) => {
    setProducts((prev: any) => [newProduct, ...prev]);
  };

  const clearDB = () => {
    localStorage.removeItem('aki_db');
    window.location.reload();
  };

  return (
    <AppContext.Provider value={{ products, loading, addScannedProduct, clearDB }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
