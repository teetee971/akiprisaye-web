import { useEffect, useSyncExternalStore } from 'react';
import type { TerritoryCode } from '../services/priceSearch/price.types';

export const SHOPPING_LIST_STORAGE_KEY = 'akiprisaye_watchlist_v1';

export interface PriceObservation {
  price: number;
  observedAt: string;
  source?: string;
}

export interface ShoppingItem {
  id: string;
  barcode: string;
  name: string;
  brand?: string;
  quantity?: string;
  territory: TerritoryCode;
  addedAt: number;
  desiredQuantity?: number;
  lastPrice?: number;
  lastPriceDate?: string;
  priceTrend?: 'up' | 'down' | 'stable' | 'unknown';
  recommendation?: 'buy_now' | 'wait' | 'monitor';
  priceHistory?: PriceObservation[];
}

export interface ShoppingListState {
  items: ShoppingItem[];
}

type Listener = () => void;

let state: ShoppingListState = { items: [] };
let hydrated = false;
const listeners = new Set<Listener>();

function emit() {
  listeners.forEach((listener) => listener());
}

function persist() {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(SHOPPING_LIST_STORAGE_KEY, JSON.stringify(state.items));
}

function normalizeIncomingItem(item: ShoppingItem): ShoppingItem {
  return {
    ...item,
    priceTrend: item.priceTrend ?? 'unknown',
    recommendation: item.recommendation ?? 'monitor',
    priceHistory: item.priceHistory ?? [],
  };
}

export const shoppingListStore = {
  subscribe(listener: Listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  getState(): ShoppingListState {
    return state;
  },

  hydrate() {
    if (hydrated || typeof window === 'undefined') return;
    hydrated = true;

    try {
      const raw = window.localStorage.getItem(SHOPPING_LIST_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as ShoppingItem[];
      if (!Array.isArray(parsed)) return;
      state = { items: parsed.map(normalizeIncomingItem) };
      emit();
    } catch {
      state = { items: [] };
    }
  },

  addItem(item: ShoppingItem) {
    const normalized = normalizeIncomingItem(item);
    const existing = state.items.find((entry) => entry.id === normalized.id);

    if (existing) {
      state = {
        items: state.items.map((entry) =>
          entry.id === normalized.id
            ? {
                ...entry,
                ...normalized,
                desiredQuantity: (entry.desiredQuantity ?? 1) + (normalized.desiredQuantity ?? 1),
                addedAt: entry.addedAt,
              }
            : entry,
        ),
      };
    } else {
      state = { items: [normalized, ...state.items] };
    }

    persist();
    emit();
  },

  removeItem(id: string) {
    state = { items: state.items.filter((item) => item.id !== id) };
    persist();
    emit();
  },

  clear() {
    state = { items: [] };
    persist();
    emit();
  },

  updateItem(id: string, patch: Partial<ShoppingItem>) {
    state = {
      items: state.items.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    };
    persist();
    emit();
  },
};

export function useShoppingListStore() {
  const snapshot = useSyncExternalStore(shoppingListStore.subscribe, shoppingListStore.getState, shoppingListStore.getState);

  useEffect(() => {
    shoppingListStore.hydrate();
  }, []);

  return {
    ...snapshot,
    addItem: shoppingListStore.addItem,
    removeItem: shoppingListStore.removeItem,
    clear: shoppingListStore.clear,
    updateItem: shoppingListStore.updateItem,
    hydrate: shoppingListStore.hydrate,
  };
}

export function __resetShoppingListStoreForTests() {
  state = { items: [] };
  hydrated = false;
}
