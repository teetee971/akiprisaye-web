/**
 * conversionTracker.ts — CRO tracking for CTA click variants.
 * RGPD: localStorage only, no external calls, 30-day TTL, max 500 events.
 */

import { safeLocalStorage } from './safeLocalStorage';
import { getSEOPageStats } from './statsTracker';

// ── Constants ─────────────────────────────────────────────────────────────────

const KEY = 'akp:cro:v1';
const MAX_EVENTS = 500;
const TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ConversionEvent {
  pageUrl: string;
  retailer: string;
  productName: string;
  variant: 'A' | 'B' | 'C';
  clickedAt: string;   // ISO date
  territory?: string;
  price?: number;
}

export interface CROStats {
  totalClicks: number;
  byVariant: Record<string, number>;
  topRetailers: { retailer: string; clicks: number }[];
  topPages: { url: string; clicks: number }[];
  conversionRate: number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function readEvents(): ConversionEvent[] {
  try {
    const raw = safeLocalStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ConversionEvent[];
    const cutoff = new Date(Date.now() - TTL_MS).toISOString();
    return Array.isArray(parsed)
      ? parsed.filter((e) => e.clickedAt >= cutoff)
      : [];
  } catch {
    return [];
  }
}

function writeEvents(events: ConversionEvent[]): void {
  try {
    safeLocalStorage.setItem(KEY, JSON.stringify(events.slice(-MAX_EVENTS)));
  } catch {
    // silent
  }
}

// ── djb2-based deterministic hash ────────────────────────────────────────────

function djb2Hash(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) ^ str.charCodeAt(i);
    hash = hash >>> 0;
  }
  return hash;
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Deterministic variant assignment based on URL hash — no randomness.
 */
export function getVariantForPage(pageUrl: string): 'A' | 'B' | 'C' {
  const variants: Array<'A' | 'B' | 'C'> = ['A', 'B', 'C'];
  return variants[djb2Hash(pageUrl) % 3];
}

export function trackConversionEvent(event: ConversionEvent): void {
  const events = readEvents();
  events.push(event);
  writeEvents(events);
}

export function getConversionEvents(): ConversionEvent[] {
  return readEvents();
}

export function getCROStats(): CROStats {
  const events = readEvents();

  const byVariant: Record<string, number> = { A: 0, B: 0, C: 0 };
  const retailerMap: Record<string, number> = {};
  const pageMap: Record<string, number> = {};

  for (const e of events) {
    byVariant[e.variant] = (byVariant[e.variant] ?? 0) + 1;
    retailerMap[e.retailer] = (retailerMap[e.retailer] ?? 0) + 1;
    pageMap[e.pageUrl] = (pageMap[e.pageUrl] ?? 0) + 1;
  }

  const topRetailers = Object.entries(retailerMap)
    .map(([retailer, clicks]) => ({ retailer, clicks }))
    .sort((a, b) => b.clicks - a.clicks)
    .slice(0, 5);

  const topPages = Object.entries(pageMap)
    .map(([url, clicks]) => ({ url, clicks }))
    .sort((a, b) => b.clicks - a.clicks)
    .slice(0, 5);

  // Estimate total views from statsTracker
  let totalViews = 0;
  try {
    const stats = getSEOPageStats();
    totalViews = stats.reduce((acc, s) => acc + s.views, 0);
  } catch {
    totalViews = 0;
  }

  const conversionRate =
    totalViews > 0 ? events.length / totalViews : 0;

  return {
    totalClicks: events.length,
    byVariant,
    topRetailers,
    topPages,
    conversionRate,
  };
}

export function clearConversionData(): void {
  safeLocalStorage.removeItem(KEY);
}
