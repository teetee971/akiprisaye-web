import { useCallback, useEffect, useState } from 'react';
import { safeLocalStorage } from '../utils/safeLocalStorage';

export type FavoriteType = 'product' | 'comparison';

export type FavoriteItem = {
  id: string;
  label: string;
  type: FavoriteType;
  barcode?: string;
  query?: string;
  productName?: string;
  store?: string;
  route?: string;
  createdAt: string;
};

const STORAGE_KEY = 'akiprisaye:favorites:v1';

const readFavorites = (): FavoriteItem[] => {
  if (typeof window === 'undefined' || !safeLocalStorage) {
    return [];
  }
  const raw = safeLocalStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as FavoriteItem[];
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
};

export function useFavorites() {
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);

  useEffect(() => {
    setFavorites(readFavorites());
  }, []);

  const isFavorite = useCallback(
    (id: string) => favorites.some((item) => item.id === id),
    [favorites]
  );

  const toggleFavorite = useCallback(
    (item: Omit<FavoriteItem, 'createdAt'>) => {
      setFavorites((prev) => {
        const exists = prev.some((fav) => fav.id === item.id);
        const next = exists
          ? prev.filter((fav) => fav.id !== item.id)
          : [{ ...item, createdAt: new Date().toISOString() }, ...prev];
        if (typeof window !== 'undefined' && safeLocalStorage) {
          safeLocalStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        }
        return next;
      });
    },
    []
  );

  const removeFavorite = useCallback((id: string) => {
    setFavorites((prev) => {
      const next = prev.filter((item) => item.id !== id);
      if (typeof window !== 'undefined' && safeLocalStorage) {
        safeLocalStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      }
      return next;
    });
  }, []);

  const clearFavorites = useCallback(() => {
    setFavorites([]);
    if (typeof window === 'undefined' || !safeLocalStorage) return;
    safeLocalStorage.removeItem(STORAGE_KEY);
  }, []);

  return {
    favorites,
    isFavorite,
    toggleFavorite,
    removeFavorite,
    clearFavorites,
  };
}
