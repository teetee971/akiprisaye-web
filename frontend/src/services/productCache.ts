import type { OffProductMinimal, OffFetchStatus } from './openFoodFacts';

type CacheEntry = {
  at: number;
  data: OffProductMinimal | null;
  status: OffFetchStatus;
};

type CachePayload = Record<string, CacheEntry>;

const CACHE_KEY = 'akp_off_cache_v1';
const MAX_ENTRIES = 300;
const DEFAULT_TTL_MS = 24 * 60 * 60 * 1000;

const memoryCache = new Map<string, CacheEntry>();
let hydrated = false;
let persistTimer: number | null = null;

function now(): number {
  return Date.now();
}

function isExpired(entry: CacheEntry, ttlMs = DEFAULT_TTL_MS): boolean {
  return now() - entry.at > ttlMs;
}

function canUseStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function hydrateFromStorage(): void {
  if (hydrated || !canUseStorage()) {
    hydrated = true;
    return;
  }

  try {
    const raw = window.localStorage.getItem(CACHE_KEY);
    if (!raw) {
      hydrated = true;
      return;
    }

    const parsed = JSON.parse(raw) as CachePayload;
    Object.entries(parsed).forEach(([barcode, entry]) => {
      if (entry && typeof entry.at === 'number' && typeof entry.status === 'string') {
        memoryCache.set(barcode, entry);
      }
    });
  } catch {
    // no-op: cache corruption should not break product page
  } finally {
    hydrated = true;
  }
}

function flushPersistToStorage(): void {
  if (!canUseStorage()) {
    return;
  }

  try {
    const payload = Object.fromEntries(memoryCache.entries());
    window.localStorage.setItem(CACHE_KEY, JSON.stringify(payload));
  } catch {
    // ignore quota/storage errors
  }
}

function schedulePersist(): void {
  if (!canUseStorage()) {
    return;
  }

  if (persistTimer !== null) {
    return;
  }

  persistTimer = window.setTimeout(() => {
    persistTimer = null;
    flushPersistToStorage();
  }, 1200);
}

export function pruneCache(): void {
  hydrateFromStorage();

  for (const [barcode, entry] of memoryCache.entries()) {
    if (isExpired(entry)) {
      memoryCache.delete(barcode);
    }
  }

  const entries = [...memoryCache.entries()].sort((a, b) => a[1].at - b[1].at);
  while (entries.length > MAX_ENTRIES) {
    const oldest = entries.shift();
    if (!oldest) {
      break;
    }

    memoryCache.delete(oldest[0]);
  }

  schedulePersist();
}

export function getCached(barcode: string, ttlMs = DEFAULT_TTL_MS): CacheEntry | null {
  hydrateFromStorage();

  const entry = memoryCache.get(barcode);
  if (!entry) {
    return null;
  }

  if (isExpired(entry, ttlMs)) {
    memoryCache.delete(barcode);
    schedulePersist();
    return null;
  }

  return entry;
}

export function setCached(barcode: string, payload: { data: OffProductMinimal | null; status: OffFetchStatus }): void {
  hydrateFromStorage();
  memoryCache.set(barcode, {
    at: now(),
    data: payload.data,
    status: payload.status,
  });

  pruneCache();
}
