import React, { createContext, useContext, useState, useEffect } from 'react';

const AppContext = createContext<any>(null);

export const AppProvider = ({ children }: { children: React.ReactNode }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Simulation d'un appel API vers ton futur Backend
  useEffect(() => {
    setTimeout(() => {
      setProducts([
        { id: 1, name: "Banane Pays", price: 1.20, shop: "Super U", territory: "GP", impact: 98 },
        { id: 2, name: "Poulet Frais", price: 8.50, shop: "Carrefour", territory: "MQ", impact: 85 }
      ] as any);
      setLoading(false);
    }, 1500);
  }, []);

  return (
    <AppContext.Provider value={{ products, loading }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
