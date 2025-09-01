import { createContext, useContext, useMemo, useState } from 'react';

const AppCtx = createContext(null);
export const useApp = () => useContext(AppCtx);

export default function AppProvider({ children }) {
  const [favorites, setFavorites] = useState(() => new Set());
  const [cart, setCart] = useState(() => new Map()); // id -> qty

  const toggleFavorite = (id) =>
    setFavorites(s => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });

  const addToCart = (id, qty = 1) =>
    setCart(m => {
      const n = new Map(m);
      n.set(id, (n.get(id) || 0) + qty);
      return n;
    });

  const removeFromCart = (id) =>
    setCart(m => {
      const n = new Map(m);
      n.delete(id);
      return n;
    });

  const value = useMemo(() => ({
    favorites, toggleFavorite, cart, addToCart, removeFromCart
  }), [favorites, cart]);

  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>;
}
