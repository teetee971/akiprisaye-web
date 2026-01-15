import { useState, useEffect } from 'react';
import { storage } from '../services/storageService';

const FAVORITES_KEY = 'akiprisaye_favorites';

/**
 * Custom hook for managing favorite products
 * Persists to localStorage and provides CRUD operations
 */
export function useFavorites() {
  const [favorites, setFavorites] = useState<string[]>(() => {
    return storage.get<string[]>(FAVORITES_KEY, []);
  });

  useEffect(() => {
    storage.set(FAVORITES_KEY, favorites);
  }, [favorites]);

  const addFavorite = (productId: string) => {
    setFavorites(prev => {
      if (prev.includes(productId)) return prev;
      return [...prev, productId];
    });
  };

  const removeFavorite = (productId: string) => {
    setFavorites(prev => prev.filter(id => id !== productId));
  };

  const isFavorite = (productId: string): boolean => {
    return favorites.includes(productId);
  };

  const clearAll = () => {
    setFavorites([]);
  };

  return {
    favorites,
    addFavorite,
    removeFavorite,
    isFavorite,
    clearAll
  };
}
