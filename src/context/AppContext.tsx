import React, { createContext, useContext, useState, useEffect } from 'react';

const AppContext = createContext<any>(null);

export const AppProvider = ({ children }: { children: React.ReactNode }) => {
  // Initialisation forcée en tableau vide pour éviter le crash .map
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Récupération du gisement Cloudflare
        const response = await fetch('/data/panier-anticrise.json?v=' + Date.now());
        if (response.ok) {
          const data = await response.json();
          // On vérifie que c'est un tableau, sinon on met vide
          setProducts(Array.isArray(data) ? data : []);
        } else {
          setProducts([]);
        }
      } catch (err) {
        console.error("Erreur gisement:", err);
        setProducts([]); 
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <AppContext.Provider value={{ products, loading }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);