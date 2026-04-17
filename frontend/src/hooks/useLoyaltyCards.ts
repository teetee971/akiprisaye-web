// src/hooks/useLoyaltyCards.ts
import { useCallback, useEffect, useState } from 'react';
import { safeLocalStorage } from '../utils/safeLocalStorage';

export interface LoyaltyCard {
  id: string;
  storeName: string;
  cardNumber: string;
  color: string;
  createdAt: string;
}

const STORAGE_KEY = 'akiprisaye:loyalty_cards:v1';

const CARD_COLORS = [
  '#1d4ed8', // blue
  '#15803d', // green
  '#b45309', // amber
  '#7c3aed', // violet
  '#be123c', // rose
  '#0f766e', // teal
  '#9333ea', // purple
  '#0369a1', // sky
];

/** Preset stores common in French Caribbean territories */
export const PRESET_STORES: Array<{ name: string; color: string }> = [
  { name: 'Carrefour', color: '#1d4ed8' },
  { name: 'Super U', color: '#15803d' },
  { name: 'Leader Price', color: '#be123c' },
  { name: 'Géant Casino', color: '#b45309' },
  { name: 'Champion', color: '#0369a1' },
  { name: 'Hyper U', color: '#15803d' },
  { name: 'Leclerc', color: '#1d4ed8' },
  { name: 'Intermarché', color: '#be123c' },
  { name: 'Spar', color: '#b45309' },
  { name: 'Jumbo Score', color: '#0f766e' },
  { name: 'Score', color: '#0f766e' },
  { name: 'Autre', color: '#7c3aed' },
];

const readCards = (): LoyaltyCard[] => {
  if (typeof window === 'undefined' || !safeLocalStorage) return [];
  const raw = safeLocalStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as LoyaltyCard[];
  } catch {
    return [];
  }
};

let colorIndex = 0;

export function useLoyaltyCards() {
  const [cards, setCards] = useState<LoyaltyCard[]>([]);

  useEffect(() => {
    setCards(readCards());
  }, []);

  const addCard = useCallback((storeName: string, cardNumber: string, color?: string) => {
    const resolvedColor =
      color ??
      PRESET_STORES.find((s) => s.name === storeName)?.color ??
      CARD_COLORS[colorIndex++ % CARD_COLORS.length];
    const newCard: LoyaltyCard = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      storeName: storeName.trim(),
      cardNumber: cardNumber.trim(),
      color: resolvedColor,
      createdAt: new Date().toISOString(),
    };
    setCards((prev) => {
      const next = [newCard, ...prev];
      safeLocalStorage?.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const removeCard = useCallback((id: string) => {
    setCards((prev) => {
      const next = prev.filter((c) => c.id !== id);
      safeLocalStorage?.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  return { cards, addCard, removeCard };
}
