/**
 * Cache service — production-grade abstraction
 *
 * Architecture:
 *   CacheStore interface  — defines the contract (get / set / del)
 *   MemoryStore           — in-process implementation, used by default
 *   withCache()           — cache-aside pattern helper
 *
 * To plug in Redis / Cloudflare KV / Firestore, implement CacheStore
 * and call setCacheStore(yourStore) at process startup.  All callers
 * (compare, products, signal) remain untouched.
 *
 * Key format convention: `<service>:<territory>:<query>:<extra|all>`
 */

// ── TTL constants (milliseconds) ──────────────────────────────────────────────

/** Price comparison results — refreshed every 10 minutes. */
export const CACHE_TTL_COMPARE_MS  = 10 * 60 * 1000;

/** Product identity / enrichment — refreshed every 60 minutes. */
export const CACHE_TTL_PRODUCT_MS  = 60 * 60 * 1000;

/** Buy/wait signal — refreshed every 15 minutes. */
export const CACHE_TTL_SIGNAL_MS   = 15 * 60 * 1000;

/** Price history — refreshed every 30 minutes. */
export const CACHE_TTL_HISTORY_MS  = 30 * 60 * 1000;

/** Default fallback TTL — 5 minutes. */
export const CACHE_TTL_DEFAULT_MS  =  5 * 60 * 1000;

// ── CacheStore interface ──────────────────────────────────────────────────────

/**
 * Minimal interface that any cache backend must satisfy.
 * Implement this to swap from MemoryStore to Redis / KV / Firestore.
 */
export interface CacheStore {
  /** Return the stored value, or null if missing or expired. */
  get<T>(key: string): T | null;
  /** Store a value for the given TTL (milliseconds). */
  set<T>(key: string, value: T, ttlMs: number): void;
  /** Remove a single key. */
  del(key: string): void;
  /** Flush all entries (testing / admin). */
  clear(): void;
}

// ── MemoryStore implementation ────────────────────────────────────────────────

interface MemoryEntry<T> {
  value: T;
  expiresAt: number;
}

class MemoryStore implements CacheStore {
  private readonly store = new Map<string, MemoryEntry<unknown>>();

  get<T>(key: string): T | null {
    const entry = this.store.get(key) as MemoryEntry<T> | undefined;
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.value;
  }

  set<T>(key: string, value: T, ttlMs: number): void {
    this.store.set(key, { value, expiresAt: Date.now() + ttlMs });
  }

  del(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }
}

// ── Active store (swappable at runtime) ───────────────────────────────────────

let activeStore: CacheStore = new MemoryStore();

/**
 * Replace the active cache store.  Call at process startup before serving
 * requests, e.g.:
 * ```ts
 * setCacheStore(new RedisStore(redisClient));
 * ```
 */
export function setCacheStore(store: CacheStore): void {
  activeStore = store;
}

// ── Backward-compatible primitives (used by existing callers) ─────────────────

/** Retrieve a cached value, or null if missing / expired. */
export function getCache<T>(key: string): T | null {
  return activeStore.get<T>(key);
}

/** Store a value with the given TTL (default 5 min). */
export function setCache<T>(key: string, value: T, ttlMs = CACHE_TTL_DEFAULT_MS): void {
  activeStore.set(key, value, ttlMs);
}

/** Remove a specific key. */
export function invalidateCache(key: string): void {
  activeStore.del(key);
}

/** Flush the entire cache — useful for tests or admin resets. */
export function clearCache(): void {
  activeStore.clear();
}

// ── High-level helper ─────────────────────────────────────────────────────────

/**
 * Cache-aside pattern.
 *
 * Returns the cached value for `key` if fresh; otherwise calls `fn()`,
 * caches the result with `ttlMs`, and returns it.
 *
 * @example
 * const result = await withCache(
 *   `compare:${territory}:${query}:all`,
 *   CACHE_TTL_COMPARE_MS,
 *   () => heavyQuery(),
 * );
 */
export async function withCache<T>(
  key: string,
  ttlMs: number,
  fn: () => Promise<T>,
): Promise<T> {
  const cached = activeStore.get<T>(key);
  if (cached !== null) return cached;

  const value = await fn();
  activeStore.set(key, value, ttlMs);
  return value;
}
