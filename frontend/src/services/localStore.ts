import type { LocalPriceReport, LocalProductItem } from '../types/localProduct';

const FAVORITES_KEY = 'akp_favorites_v1';
const HISTORY_KEY = 'akp_history_v1';
const REPORTS_KEY = 'akp_reports_v1';
const HISTORY_LIMIT = 50;

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

export function getFavorites(): LocalProductItem[] {
  return readJson<LocalProductItem[]>(FAVORITES_KEY, []);
}

export function toggleFavorite(item: LocalProductItem): LocalProductItem[] {
  const favorites = getFavorites();
  const exists = favorites.some((favorite) => favorite.barcode === item.barcode);
  const next = exists
    ? favorites.filter((favorite) => favorite.barcode !== item.barcode)
    : [{ ...item, lastSeenAt: new Date().toISOString() }, ...favorites];
  writeJson(FAVORITES_KEY, next);
  return next;
}

export function isFavorite(barcode: string): boolean {
  if (!barcode) return false;
  return getFavorites().some((item) => item.barcode === barcode);
}

export function removeFavorite(barcode: string): LocalProductItem[] {
  const next = getFavorites().filter((item) => item.barcode !== barcode);
  writeJson(FAVORITES_KEY, next);
  return next;
}

export function getHistory(): LocalProductItem[] {
  return readJson<LocalProductItem[]>(HISTORY_KEY, []);
}

export function pushHistory(item: LocalProductItem): LocalProductItem[] {
  const history = getHistory();
  const now = new Date().toISOString();
  const deduped = history.filter((entry) => entry.barcode !== item.barcode);
  const next = [{ ...item, lastSeenAt: now }, ...deduped].slice(0, HISTORY_LIMIT);
  writeJson(HISTORY_KEY, next);
  return next;
}

export function clearHistory(): void {
  writeJson(HISTORY_KEY, []);
}

export function removeHistoryItem(barcode: string): LocalProductItem[] {
  const next = getHistory().filter((item) => item.barcode !== barcode);
  writeJson(HISTORY_KEY, next);
  return next;
}

export function getReports(): LocalPriceReport[] {
  return readJson<LocalPriceReport[]>(REPORTS_KEY, []);
}

export function saveReport(
  payload: Omit<LocalPriceReport, 'id' | 'createdAt' | 'source' | 'currency'>
): LocalPriceReport {
  const reports = getReports();
  const report: LocalPriceReport = {
    ...payload,
    id: typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
    createdAt: new Date().toISOString(),
    source: 'user_report',
    currency: 'EUR',
  };
  const next = [report, ...reports];
  writeJson(REPORTS_KEY, next);
  return report;
}

export function getReportsByBarcode(barcode: string): LocalPriceReport[] {
  return getReports().filter((report) => report.barcode === barcode);
}
