/**
 * statsTracker.ts — SEO page view and engagement tracking
 * RGPD: localStorage only, no external calls, 30-day TTL
 */

import { safeLocalStorage } from './safeLocalStorage';

// ── Constants ─────────────────────────────────────────────────────────────────

const KEY_SEO_VIEWS = 'akp:seo:views:v1';
const MAX_ENTRIES = 200;
const TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

// ── Types ─────────────────────────────────────────────────────────────────────

export interface SEOPageEntry {
  slug: string;
  pageType: string;
  territory: string;
  views: number;
  lastViewedAt: number;
}

export interface SEOPageStats extends SEOPageEntry {
  ctr: number;
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
    // Silently fail if storage unavailable
  }
}

function pruneEntries(entries: SEOPageEntry[]): SEOPageEntry[] {
  const cutoff = Date.now() - TTL_MS;
  return entries
    .filter((e) => e.lastViewedAt > cutoff)
    .sort((a, b) => b.views - a.views)
    .slice(0, MAX_ENTRIES);
}

// ── Public API ─────────────────────────────────────────────────────────────────

/**
 * Track a view of an SEO page.
 * Increments counter if the same slug+pageType+territory was already seen.
 */
export function trackSEOPageView(pageType: string, slug: string, territory: string): void {
  const entries = readJson<SEOPageEntry[]>(KEY_SEO_VIEWS, []);
  const existing = entries.find(
    (e) => e.slug === slug && e.pageType === pageType && e.territory === territory
  );

  if (existing) {
    existing.views += 1;
    existing.lastViewedAt = Date.now();
  } else {
    entries.push({ slug, pageType, territory, views: 1, lastViewedAt: Date.now() });
  }

  writeJson(KEY_SEO_VIEWS, pruneEntries(entries));
}

/**
 * Return all SEO page entries with a computed CTR field, sorted by views desc.
 */
export function getSEOPageStats(): SEOPageStats[] {
  const entries = readJson<SEOPageEntry[]>(KEY_SEO_VIEWS, []);
  const pruned = pruneEntries(entries);
  const total = pruned.reduce((s, e) => s + e.views, 0);
  return pruned.map((e) => ({
    ...e,
    ctr: total > 0 ? e.views / total : 0,
  }));
}

/**
 * Return top N SEO page entries sorted by views.
 */
export function getSEOTopPages(limit = 10): SEOPageEntry[] {
  const entries = readJson<SEOPageEntry[]>(KEY_SEO_VIEWS, []);
  return pruneEntries(entries).slice(0, limit);
}

/**
 * Clear all SEO page view data.
 */
export function clearSEOStats(): void {
  safeLocalStorage.removeItem(KEY_SEO_VIEWS);
}
