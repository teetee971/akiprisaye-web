/**
 * favoritesEngine.ts — localStorage-based favorites manager (V7)
 *
 * Handles safe read/write/remove for:
 *   - favorite products
 *   - favorite retailers
 *   - favorite categories
 *
 * All operations degrade gracefully on malformed or missing storage.
 * RGPD-safe: no PII, no external calls.
 */

// ── Constants ─────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'akp:favorites:v1';
const MAX_PER_TYPE = 50;

// ── Types ─────────────────────────────────────────────────────────────────────

export interface FavoritesStore {
  products: string[];
  retailers: string[];
  categories: string[];
  territory: string | null;
  updatedAt: number;
}

type FavoriteType = 'products' | 'retailers' | 'categories';

// ── Storage helpers ───────────────────────────────────────────────────────────

function readStore(): FavoritesStore {
  const empty: FavoritesStore = {
    products: [],
    retailers: [],
    categories: [],
    territory: null,
    updatedAt: 0,
  };
  if (typeof window === 'undefined') return empty;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return empty;
    const parsed = JSON.parse(raw);
    // Validate shape
    if (typeof parsed !== 'object' || parsed === null) return empty;
    return {
      products: Array.isArray(parsed.products)
        ? parsed.products.filter((x: unknown) => typeof x === 'string')
        : [],
      retailers: Array.isArray(parsed.retailers)
        ? parsed.retailers.filter((x: unknown) => typeof x === 'string')
        : [],
      categories: Array.isArray(parsed.categories)
        ? parsed.categories.filter((x: unknown) => typeof x === 'string')
        : [],
      territory: typeof parsed.territory === 'string' ? parsed.territory : null,
      updatedAt: typeof parsed.updatedAt === 'number' ? parsed.updatedAt : 0,
    };
  } catch {
    return empty;
  }
}

function writeStore(store: FavoritesStore): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...store, updatedAt: Date.now() }));
  } catch {
    // Quota exceeded — silent no-op
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

/** Read the full favorites store. */
export function getFavorites(): FavoritesStore {
  return readStore();
}

/**
 * Add an item to a favorites list.
 * Silently deduplicates and caps at MAX_PER_TYPE.
 */
export function addFavorite(type: FavoriteType, value: string): void {
  if (!value || typeof value !== 'string') return;
  const store = readStore();
  const list = store[type];
  if (!list.includes(value)) {
    store[type] = [...list, value].slice(-MAX_PER_TYPE);
    writeStore(store);
  }
}

/**
 * Remove an item from a favorites list.
 */
export function removeFavorite(type: FavoriteType, value: string): void {
  const store = readStore();
  store[type] = store[type].filter((v) => v !== value);
  writeStore(store);
}

/**
 * Check whether an item is in a favorites list.
 */
export function isFavorite(type: FavoriteType, value: string): boolean {
  if (typeof window === 'undefined') return false;
  return readStore()[type].includes(value);
}

/**
 * Toggle a favorite (add if absent, remove if present).
 * Returns the new state (true = now a favorite).
 */
export function toggleFavorite(type: FavoriteType, value: string): boolean {
  if (isFavorite(type, value)) {
    removeFavorite(type, value);
    return false;
  }
  addFavorite(type, value);
  return true;
}

/**
 * Set the preferred territory.
 */
export function setFavoriteTerritory(territory: string | null): void {
  const store = readStore();
  store.territory = territory;
  writeStore(store);
}

/**
 * Clear all favorites (RGPD erasure).
 */
export function clearFavorites(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* silent */
  }
}

/** Return total favorite count across all types. */
export function getFavoritesCount(): number {
  const s = readStore();
  return s.products.length + s.retailers.length + s.categories.length;
}
