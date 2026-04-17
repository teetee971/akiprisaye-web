import { normalizeText } from './normalize';

const CACHE_STORAGE_KEY = 'scanhub:provider-cache:v1';
const CACHE_SCHEMA_VERSION = 'v1';

export const TTL_MS = 10 * 60 * 1000;
export const MAX_ENTRIES = 50;

type CacheMode = 'ean' | 'query';

type CacheKeyParams = {
  territory: string;
  mode: CacheMode;
  ean?: string;
  query?: string;
};

type CacheEnvelope<T> = {
  version: string;
  entries: Record<string, CacheEntry<T>>;
};

type CacheEntry<T> = {
  value: T;
  updatedAt: number;
  lastAccessedAt: number;
};

export type CacheReadResult<T> = {
  value: T;
  updatedAt: number;
  isFresh: boolean;
};

const memoryCache = new Map<string, CacheEntry<unknown>>();
let storageDisabled = false;
let didInitialPurge = false;

const isBrowser = typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

const normalizeCacheQuery = (query?: string) => normalizeText((query ?? '').trim().toLowerCase());

export function buildCacheKey({ territory, mode, ean, query }: CacheKeyParams): string {
  const normalizedTerritory = (territory || 'fr').trim().toLowerCase();
  const normalizedMode = mode === 'ean' ? 'ean' : 'query';
  const normalizedEan = (ean ?? '').trim();
  const normalizedQuery = normalizeCacheQuery(query);

  return [
    'price-search',
    CACHE_SCHEMA_VERSION,
    normalizedTerritory || 'fr',
    `mode:${normalizedMode}`,
    `ean:${normalizedEan || 'none'}`,
    `query:${normalizedQuery || 'none'}`,
  ].join('|');
}

function safeParseEnvelope(raw: string | null): CacheEnvelope<unknown> {
  if (!raw) {
    return { version: CACHE_SCHEMA_VERSION, entries: {} };
  }

  try {
    const parsed = JSON.parse(raw) as CacheEnvelope<unknown>;
    if (!parsed || parsed.version !== CACHE_SCHEMA_VERSION || typeof parsed.entries !== 'object') {
      return { version: CACHE_SCHEMA_VERSION, entries: {} };
    }
    return parsed;
  } catch {
    return { version: CACHE_SCHEMA_VERSION, entries: {} };
  }
}

function loadFromStorage(): void {
  if (!isBrowser || storageDisabled) return;

  const envelope = safeParseEnvelope(window.localStorage.getItem(CACHE_STORAGE_KEY));
  const now = Date.now();

  Object.entries(envelope.entries).forEach(([key, entry]) => {
    if (!entry || typeof entry.updatedAt !== 'number') return;
    if (now - entry.updatedAt > TTL_MS) return;
    memoryCache.set(key, {
      value: entry.value,
      updatedAt: entry.updatedAt,
      lastAccessedAt:
        typeof entry.lastAccessedAt === 'number' ? entry.lastAccessedAt : entry.updatedAt,
    });
  });
}

function persistToStorage(): void {
  if (!isBrowser || storageDisabled) return;

  const sorted = Array.from(memoryCache.entries()).sort(
    (a, b) => b[1].lastAccessedAt - a[1].lastAccessedAt
  );
  const trimmed = sorted.slice(0, MAX_ENTRIES);

  const entries: Record<string, CacheEntry<unknown>> = {};
  trimmed.forEach(([key, value]) => {
    entries[key] = value;
  });

  try {
    window.localStorage.setItem(
      CACHE_STORAGE_KEY,
      JSON.stringify({
        version: CACHE_SCHEMA_VERSION,
        entries,
      } satisfies CacheEnvelope<unknown>)
    );
  } catch {
    storageDisabled = true;
  }
}

function ensureLoaded(): void {
  if (memoryCache.size > 0 || !isBrowser || storageDisabled) return;
  loadFromStorage();
}

function evictIfNeeded(): void {
  if (memoryCache.size <= MAX_ENTRIES) return;

  const toEvict = Array.from(memoryCache.entries())
    .sort((a, b) => a[1].lastAccessedAt - b[1].lastAccessedAt)
    .slice(0, memoryCache.size - MAX_ENTRIES);

  toEvict.forEach(([key]) => memoryCache.delete(key));
}

export function purgeExpiredCache(now = Date.now()): void {
  ensureLoaded();

  let didMutate = false;
  for (const [key, entry] of memoryCache.entries()) {
    if (now - entry.updatedAt > TTL_MS) {
      memoryCache.delete(key);
      didMutate = true;
    }
  }

  if (didMutate || !didInitialPurge) {
    persistToStorage();
  }

  didInitialPurge = true;
}

export function getCache<T>(key: string, now = Date.now()): CacheReadResult<T> | null {
  ensureLoaded();

  const entry = memoryCache.get(key) as CacheEntry<T> | undefined;
  if (!entry) return null;

  entry.lastAccessedAt = now;
  memoryCache.set(key, entry);

  return {
    value: entry.value,
    updatedAt: entry.updatedAt,
    isFresh: now - entry.updatedAt <= TTL_MS,
  };
}

export function setCache<T>(key: string, value: T, now = Date.now()): void {
  ensureLoaded();

  memoryCache.set(key, {
    value,
    updatedAt: now,
    lastAccessedAt: now,
  });

  evictIfNeeded();
  persistToStorage();
}
