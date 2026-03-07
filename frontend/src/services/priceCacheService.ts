/**
 * Price Data Cache (IndexedDB)
 *
 * Module A – Persistance locale + cache
 *
 * Caches price observations locally for offline access.
 * Features:
 *  - IndexedDB store with TTL enforcement (default 24h)
 *  - Versioned schema with migration path
 *  - Median / min / max / freshness / outlier calculations
 *  - Territory-scoped keys
 *  - Purge of stale entries on open
 */

const DB_NAME = 'akiprisaye-price-cache';
const DB_VERSION = 1;
const STORE_NAME = 'price_observations';

/** TTL for cached price records (ms) */
const DEFAULT_TTL_MS = 24 * 60 * 60 * 1000; // 24 h

export interface CachedPriceRecord {
  /** Composite key: "{territory}:{ean}" */
  key: string;
  territory: string;
  ean: string;
  productName: string;
  observations: CachedObservation[];
  /** Unix timestamp (ms) when the record was last updated */
  cachedAt: number;
  /** Unix timestamp (ms) after which the record should be refreshed */
  expiresAt: number;
}

export interface CachedObservation {
  storeName: string;
  price: number;
  currency: string;
  /** ISO date string */
  observedAt: string;
  source: string;
}

export interface PriceStats {
  min: number;
  max: number;
  median: number;
  mean: number;
  count: number;
  /** Freshness score 0–1 (1 = all observations recent) */
  freshness: number;
  /** Outliers removed from statistics */
  outliers: number;
}

// ---------------------------------------------------------------------------
// DB helpers
// ---------------------------------------------------------------------------

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve(req.result);
    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'key' });
        store.createIndex('territory', 'territory', { unique: false });
        store.createIndex('expiresAt', 'expiresAt', { unique: false });
      }
    };
  });
}

function tx(db: IDBDatabase, mode: IDBTransactionMode) {
  return db.transaction(STORE_NAME, mode).objectStore(STORE_NAME);
}

function idbGet<T>(store: IDBObjectStore, key: IDBValidKey): Promise<T | undefined> {
  return new Promise((resolve, reject) => {
    const req = store.get(key);
    req.onsuccess = () => resolve(req.result as T | undefined);
    req.onerror = () => reject(req.error);
  });
}

function idbPut(store: IDBObjectStore, value: unknown): Promise<void> {
  return new Promise((resolve, reject) => {
    const req = store.put(value);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

function idbDelete(store: IDBObjectStore, key: IDBValidKey): Promise<void> {
  return new Promise((resolve, reject) => {
    const req = store.delete(key);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

function idbGetAllKeys(store: IDBObjectStore): Promise<IDBValidKey[]> {
  return new Promise((resolve, reject) => {
    const req = store.getAllKeys();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

// ---------------------------------------------------------------------------
// Statistics
// ---------------------------------------------------------------------------

/**
 * Compute price statistics with outlier detection (IQR method).
 */
export function computePriceStats(observations: CachedObservation[]): PriceStats | null {
  if (!observations.length) return null;

  const prices = observations.map((o) => o.price).sort((a, b) => a - b);
  const count = prices.length;

  // IQR outlier detection
  const q1 = prices[Math.floor(count * 0.25)];
  const q3 = prices[Math.floor(count * 0.75)];
  const iqr = q3 - q1;
  const lo = q1 - 1.5 * iqr;
  const hi = q3 + 1.5 * iqr;
  const inliers = prices.filter((p) => p >= lo && p <= hi);
  const outlierCount = count - inliers.length;

  if (!inliers.length) return null;

  const min = inliers[0];
  const max = inliers[inliers.length - 1];
  const mean = inliers.reduce((s, p) => s + p, 0) / inliers.length;
  const mid = Math.floor(inliers.length / 2);
  const median =
    inliers.length % 2 === 0
      ? (inliers[mid - 1] + inliers[mid]) / 2
      : inliers[mid];

  // Freshness: proportion of observations < 7 days old
  const now = Date.now();
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
  const recent = observations.filter(
    (o) => now - new Date(o.observedAt).getTime() < sevenDaysMs,
  ).length;
  const freshness = recent / count;

  return { min, max, median, mean, count, freshness, outliers: outlierCount };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Read a record from the cache.
 * Returns `null` if absent or expired (unless `ignoreExpiry` is set).
 */
export async function getCachedPrices(
  territory: string,
  ean: string,
  ignoreExpiry = false,
): Promise<CachedPriceRecord | null> {
  if (!('indexedDB' in window)) return null;
  try {
    const db = await openDB();
    const record = await idbGet<CachedPriceRecord>(tx(db, 'readonly'), `${territory}:${ean}`);
    if (!record) return null;
    if (!ignoreExpiry && record.expiresAt < Date.now()) return null;
    return record;
  } catch {
    return null;
  }
}

/**
 * Write (or update) a price record in the cache.
 */
export async function setCachedPrices(
  territory: string,
  ean: string,
  productName: string,
  observations: CachedObservation[],
  ttlMs = DEFAULT_TTL_MS,
): Promise<void> {
  if (!('indexedDB' in window)) return;
  try {
    const now = Date.now();
    const record: CachedPriceRecord = {
      key: `${territory}:${ean}`,
      territory,
      ean,
      productName,
      observations,
      cachedAt: now,
      expiresAt: now + ttlMs,
    };
    const db = await openDB();
    await idbPut(tx(db, 'readwrite'), record);
  } catch {
    // Non-blocking – ignore write errors
  }
}

/**
 * Delete all expired records.
 * Call on app startup or periodically.
 */
export async function purgeExpiredPriceCache(): Promise<number> {
  if (!('indexedDB' in window)) return 0;
  try {
    const db = await openDB();
    const store = tx(db, 'readwrite');
    const keys = await idbGetAllKeys(store);
    let purged = 0;
    const now = Date.now();
    for (const key of keys) {
      const record = await idbGet<CachedPriceRecord>(store, key);
      if (record && record.expiresAt < now) {
        await idbDelete(store, key);
        purged++;
      }
    }
    return purged;
  } catch {
    return 0;
  }
}

/** Wipe the entire price cache (e.g., after user revokes consent). */
export async function clearPriceCache(): Promise<void> {
  if (!('indexedDB' in window)) return;
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const req = tx(db, 'readwrite').clear();
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch {
    // ignore
  }
}
