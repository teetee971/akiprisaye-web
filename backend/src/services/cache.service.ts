/**
 * In-memory cache service
 *
 * Provides a lightweight TTL cache used by the compare and products
 * services to avoid hammering external APIs on every request.
 *
 * Key format convention: `<service>:<territory>:<query>:<retailer|all>`
 * Default TTL: 5 minutes
 *
 * For production, swap this with Redis / Cloudflare KV / Firestore.
 */

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

// Single shared store per Node process
const store = new Map<string, CacheEntry<unknown>>();

/**
 * Retrieve a cached value, or null if missing / expired.
 */
export function getCache<T>(key: string): T | null {
  const entry = store.get(key) as CacheEntry<T> | undefined;
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    store.delete(key);
    return null;
  }
  return entry.value;
}

/**
 * Store a value with the given TTL (default 5 min).
 */
export function setCache<T>(key: string, value: T, ttlMs = 5 * 60 * 1000): void {
  store.set(key, { value, expiresAt: Date.now() + ttlMs });
}

/**
 * Remove a specific key, e.g. after a manual correction.
 */
export function invalidateCache(key: string): void {
  store.delete(key);
}

/**
 * Flush the entire cache — useful for tests or admin resets.
 */
export function clearCache(): void {
  store.clear();
}
