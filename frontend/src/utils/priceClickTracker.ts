/**
 * priceClickTracker.ts
 *
 * Lightweight usage analytics stored in localStorage.
 * No external service — all data stays on the user's device.
 *
 * Tracks:
 *   - product page views (barcode + name)
 *   - retailer click-throughs from price rows
 *
 * Data is capped (max 50 entries) and aged out after 30 days
 * so it never grows unbounded.
 *
 * RGPD: data never leaves the browser. No network call is made.
 * Can be cleared by calling clearPriceClickData().
 */

import { safeLocalStorage } from './safeLocalStorage';

// ── Constants ─────────────────────────────────────────────────────────────────

const KEY_VIEWS    = 'akp:price:views:v1';
const KEY_CLICKS   = 'akp:price:clicks:v1';
const MAX_ENTRIES  = 50;
const TTL_MS       = 30 * 24 * 60 * 60 * 1000; // 30 days

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ProductViewEntry {
  barcode:  string;
  name:     string;
  territory: string;
  viewedAt: number; // epoch ms
  count:    number;
}

export interface RetailerClickEntry {
  barcode:  string;
  retailer: string;
  territory: string;
  price:    number;
  clickedAt: number; // epoch ms
}

// ── Internal helpers ──────────────────────────────────────────────────────────

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = safeLocalStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T): void {
  try {
    safeLocalStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Silently fail if storage is full or unavailable
  }
}

function prune<T extends { viewedAt?: number; clickedAt?: number }>(
  entries: T[],
): T[] {
  const cutoff = Date.now() - TTL_MS;
  return entries
    .filter((e) => (e.viewedAt ?? e.clickedAt ?? 0) > cutoff)
    .slice(-MAX_ENTRIES);
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Record a product page view.
 * If the barcode was already viewed in this session, increments the counter.
 */
export function trackProductView(
  barcode: string,
  name: string,
  territory: string,
): void {
  const views = readJson<ProductViewEntry[]>(KEY_VIEWS, []);
  const existing = views.find(
    (v) => v.barcode === barcode && v.territory === territory,
  );

  if (existing) {
    existing.count    += 1;
    existing.viewedAt  = Date.now();
  } else {
    views.push({ barcode, name, territory, viewedAt: Date.now(), count: 1 });
  }

  writeJson(KEY_VIEWS, prune(views));
}

/**
 * Record a retailer link click from the price comparison table.
 * Appends a new entry even when the same retailer was already clicked.
 */
export function trackRetailerClick(
  barcode: string,
  retailer: string,
  territory: string,
  price: number,
): void {
  const clicks = readJson<RetailerClickEntry[]>(KEY_CLICKS, []);
  clicks.push({ barcode, retailer, territory, price, clickedAt: Date.now() });
  writeJson(KEY_CLICKS, prune(clicks));
}

/**
 * Return product view history, most-viewed first.
 * Useful for a "recently viewed" or "trending" UI block.
 */
export function getTopViewedProducts(limit = 10): ProductViewEntry[] {
  const views = readJson<ProductViewEntry[]>(KEY_VIEWS, []);
  return prune(views)
    .sort((a, b) => b.count - a.count || b.viewedAt - a.viewedAt)
    .slice(0, limit);
}

/**
 * Return recent retailer clicks, newest first.
 */
export function getRecentRetailerClicks(limit = 20): RetailerClickEntry[] {
  const clicks = readJson<RetailerClickEntry[]>(KEY_CLICKS, []);
  return prune(clicks)
    .sort((a, b) => b.clickedAt - a.clickedAt)
    .slice(0, limit);
}

/**
 * Wipe all tracking data — call on user logout or RGPD erasure request.
 */
export function clearPriceClickData(): void {
  safeLocalStorage.removeItem(KEY_VIEWS);
  safeLocalStorage.removeItem(KEY_CLICKS);
}
