/**
 * analytics.ts — Lightweight event instrumentation (V1)
 *
 * RGPD: localStorage only, no PII, no external calls, capped at 1 000 events.
 * Provides logEvent() for all conversion touchpoints and helpers to compute
 * live KPIs for the Executive Dashboard.
 */

import { safeLocalStorage } from '../utils/safeLocalStorage';

// ── Constants ─────────────────────────────────────────────────────────────────

const KEY = 'akp:events:v1';
const AB_KEY = 'akp:ab:cta:v1';
const MAX = 1000;

// ── Types ─────────────────────────────────────────────────────────────────────

export interface AnalyticsEvent {
  t: number; // Unix timestamp ms
  type: string;
  [key: string]: unknown;
}

export interface AnalyticsKpis {
  totalViews: number;
  totalClicks: number;
  ctr: number; // 0–1
  favoritesAdded: number;
  topProducts: { id: string; clicks: number }[];
  ctaVariantWinner: 'A' | 'B' | null;
}

// ── Core helpers ──────────────────────────────────────────────────────────────

function readEvents(): AnalyticsEvent[] {
  try {
    const raw = safeLocalStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeEvents(events: AnalyticsEvent[]): void {
  try {
    safeLocalStorage.setItem(KEY, JSON.stringify(events.slice(-MAX)));
  } catch {
    // Quota exceeded — silent
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Log a named event with an optional payload.
 *
 * @example
 * logEvent('view_product', { id: 'huile-1l', price: 3.99 });
 * logEvent('cta_click',    { id: 'huile-1l', price: 3.99 });
 * logEvent('add_favorite', { id: 'huile-1l' });
 */
export function logEvent(type: string, payload: Record<string, unknown> = {}): void {
  const events = readEvents();
  events.push({ t: Date.now(), type, ...payload });
  writeEvents(events);
}

/** Return all stored events (read-only snapshot). */
export function getEvents(): AnalyticsEvent[] {
  return readEvents();
}

/** Clear all stored events (e.g. privacy reset). */
export function clearEvents(): void {
  safeLocalStorage.setItem(KEY, '[]');
}

// ── A/B test ─────────────────────────────────────────────────────────────────

/**
 * Deterministic A/B variant for the CTA label.
 * Assigns once per device, stored in localStorage.
 *
 * Variant A: "Voir le meilleur prix maintenant"
 * Variant B: "Acheter au meilleur prix"
 */
export function getCTAVariant(): 'A' | 'B' {
  const stored = safeLocalStorage.getItem(AB_KEY);
  if (stored === 'A' || stored === 'B') return stored;
  const variant: 'A' | 'B' = Math.random() > 0.5 ? 'A' : 'B';
  safeLocalStorage.setItem(AB_KEY, variant);
  logEvent('cta_variant', { variant });
  return variant;
}

export const CTA_LABELS: Record<'A' | 'B', string> = {
  A: '🔥 Voir le prix le moins cher maintenant',
  B: 'Acheter au meilleur prix →',
};

// ── KPI computation ───────────────────────────────────────────────────────────

/**
 * Derive live KPIs from the stored event log.
 * Cheap to call — reads localStorage once.
 */
export function computeKpis(): AnalyticsKpis {
  const events = readEvents();

  const views = events.filter((e) => e.type === 'view_product').length;
  const clicks = events.filter((e) => e.type === 'cta_click').length;
  const favorites = events.filter((e) => e.type === 'add_favorite' && e.action !== 'remove').length;

  // Top products by click count
  const clickMap: Record<string, number> = {};
  for (const e of events) {
    if (e.type === 'cta_click' && typeof e.id === 'string') {
      clickMap[e.id] = (clickMap[e.id] ?? 0) + 1;
    }
  }
  const topProducts = Object.entries(clickMap)
    .map(([id, clicks]) => ({ id, clicks }))
    .sort((a, b) => b.clicks - a.clicks)
    .slice(0, 5);

  // Which A/B variant got more clicks
  const aClicks = events.filter((e) => e.type === 'cta_click' && e.variant === 'A').length;
  const bClicks = events.filter((e) => e.type === 'cta_click' && e.variant === 'B').length;
  const ctaVariantWinner: 'A' | 'B' | null =
    aClicks + bClicks === 0 ? null : aClicks >= bClicks ? 'A' : 'B';

  return {
    totalViews: views,
    totalClicks: clicks,
    ctr: views > 0 ? clicks / views : 0,
    favoritesAdded: favorites,
    topProducts,
    ctaVariantWinner,
  };
}
