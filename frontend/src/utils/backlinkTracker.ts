/**
 * backlinkTracker.ts — Backlink record storage.
 * RGPD: localStorage only, no external calls.
 */

import { safeLocalStorage } from './safeLocalStorage';

// ── Constants ─────────────────────────────────────────────────────────────────

const KEY = 'akp:backlinks:v1';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface BacklinkRecord {
  sourceDomain: string;
  sourceUrl?: string;
  targetUrl: string;
  anchor?: string;
  status: 'pending' | 'live' | 'lost';
  firstSeenAt?: string; // ISO date
  lastCheckedAt?: string;
  trafficClicks?: number;
  territory?: string;
  pageType?: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function readAll(): BacklinkRecord[] {
  try {
    const raw = safeLocalStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as BacklinkRecord[]) : [];
  } catch {
    return [];
  }
}

function writeAll(items: BacklinkRecord[]): void {
  try {
    safeLocalStorage.setItem(KEY, JSON.stringify(items));
  } catch {
    // silent
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

export function getBacklinks(): BacklinkRecord[] {
  return readAll();
}

export function saveBacklinks(items: BacklinkRecord[]): void {
  writeAll(items);
}

export function addBacklink(record: BacklinkRecord): void {
  const items = readAll();
  items.push(record);
  writeAll(items);
}

export function updateBacklinkStatus(sourceDomain: string, status: BacklinkRecord['status']): void {
  const items = readAll().map((item) =>
    item.sourceDomain === sourceDomain
      ? { ...item, status, lastCheckedAt: new Date().toISOString() }
      : item
  );
  writeAll(items);
}

export function getBacklinkStats(): {
  total: number;
  live: number;
  pending: number;
  lost: number;
  topPages: { url: string; count: number }[];
} {
  const items = readAll();

  const pageCount: Record<string, number> = {};
  let live = 0;
  let pending = 0;
  let lost = 0;

  for (const item of items) {
    if (item.status === 'live') live++;
    else if (item.status === 'pending') pending++;
    else if (item.status === 'lost') lost++;

    pageCount[item.targetUrl] = (pageCount[item.targetUrl] ?? 0) + 1;
  }

  const topPages = Object.entries(pageCount)
    .map(([url, count]) => ({ url, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return { total: items.length, live, pending, lost, topPages };
}

export function clearBacklinks(): void {
  safeLocalStorage.removeItem(KEY);
}
