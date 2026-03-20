/**
 * In-memory cache service
 *
 * Provides a lightweight TTL cache used by the compare and products
 * services to avoid hammering external APIs on every request.
 *
 * Key format convention: `<service>:<territory>:<query>:<retailer|all>`
 *
 * For production, swap the backing store with Redis / Cloudflare KV /
 * Firestore — the `withCache` helper isolates all callers from that change.
 */

// ── TTL constants (milliseconds) ──────────────────────────────────────────────

/** Price comparison results — refreshed every 10 minutes. */
export const CACHE_TTL_COMPARE_MS = 10 * 60 * 1000;

/** Product identity / enrichment — refreshed every 60 minutes. */
export const CACHE_TTL_PRODUCT_MS = 60 * 60 * 1000;

/** Default TTL used when no specific constant is given — 5 minutes. */
export const CACHE_TTL_DEFAULT_MS = 5 * 60 * 1000;

// ── Internal entry shape ──────────────────────────────────────────────────────

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

// Single shared store per Node process
const store = new Map<string, CacheEntry<unknown>>();

// ── Low-level primitives ──────────────────────────────────────────────────────

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
export function setCache<T>(key: string, value: T, ttlMs = CACHE_TTL_DEFAULT_MS): void {
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

// ── High-level helper ─────────────────────────────────────────────────────────

/**
 * Cache-aside pattern.
 *
 * Returns the cached value for `key` if fresh; otherwise calls `fn()`,
 * caches the result with `ttlMs`, and returns it.
 *
 * Usage:
 * ```ts
 * const result = await withCache('compare:GP:riz:all', CACHE_TTL_COMPARE_MS, () =>
 *   expensiveQuery(),
 * );
 * ```
 */
export async function withCache<T>(
  key: string,
  ttlMs: number,
  fn: () => Promise<T>,
): Promise<T> {
  const cached = getCache<T>(key);
  if (cached !== null) return cached;

  const value = await fn();
  setCache(key, value, ttlMs);
  return value;
}
