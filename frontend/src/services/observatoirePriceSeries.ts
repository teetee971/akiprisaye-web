/**
 * Observatoire Price Series
 *
 * Builds a time-series of price observations from the monthly observatoire
 * snapshots for a given territory + product name.
 *
 * Used to feed the `computePrediction()` function from predictionService.ts
 * with real historical data so price-trend badges are data-driven.
 */

import type { Observation } from './predictionService';

const BASE_URL = import.meta.env.BASE_URL ?? '/';

/** Map territory codes to observatoire snapshot stem prefixes */
const TERRITORY_STEMS: Record<string, string> = {
  gp: 'guadeloupe',
  guadeloupe: 'guadeloupe',
  mq: 'martinique',
  martinique: 'martinique',
  gf: 'guyane',
  guyane: 'guyane',
  re: 'la_réunion',
  reunion: 'la_réunion',
  'la_réunion': 'la_réunion',
  yt: 'mayotte',
  mayotte: 'mayotte',
  fr: 'hexagone',
  hexagone: 'hexagone',
  pm: 'saint_pierre_et_miquelon',
  saint_pierre_et_miquelon: 'saint_pierre_et_miquelon',
  mf: 'saint_martin',
  saint_martin: 'saint_martin',
  bl: 'saint_barthelemy',
  saint_barthelemy: 'saint_barthelemy',
};

/**
 * Available month snapshots per territory stem.
 * Ordered chronologically (oldest first) so we can build a time-series.
 */
const SNAPSHOT_MONTHS: Record<string, string[]> = {
  guadeloupe: ['2025-11', '2025-12', '2026-01', '2026-02', '2026-03'],
  martinique: ['2026-01', '2026-02', '2026-03'],
  guyane: ['2026-01', '2026-02', '2026-03'],
  'la_réunion': ['2026-01', '2026-02', '2026-03'],
  mayotte: ['2026-01', '2026-02', '2026-03'],
  hexagone: ['2025-11', '2025-12', '2026-01', '2026-02', '2026-03'],
  saint_pierre_et_miquelon: ['2026-01', '2026-02', '2026-03'],
  saint_martin: ['2026-01', '2026-02', '2026-03'],
  saint_barthelemy: ['2026-01', '2026-02', '2026-03'],
};

interface SnapshotRow {
  produit?: string;
  prix?: number;
  enseigne?: string;
  commune?: string;
}

interface Snapshot {
  date_snapshot?: string;
  donnees?: SnapshotRow[];
}

/** Normalise a product name for comparison: lowercase, trim, remove diacritics. */
function normaliseName(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim();
}

/** Fetch and parse a single snapshot file (returns null on 404/error). */
async function fetchSnapshot(stem: string, month: string): Promise<Snapshot | null> {
  const url = `${BASE_URL}data/observatoire/${encodeURIComponent(stem)}_${month}.json`;
  try {
    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!res.ok) return null;
    return (await res.json()) as Snapshot;
  } catch {
    return null;
  }
}

/**
 * Build a time-series of average prices across observatoire monthly snapshots.
 *
 * @param territory  Territory code (e.g. "mq", "martinique", "gp")
 * @param productName  Product name as it appears in snapshot data (e.g. "Lait demi-écrémé UHT 1L")
 * @returns  Array of `Observation` sorted chronologically, empty if no data.
 */
export async function buildObservatoirePriceSeries(
  territory: string,
  productName: string,
): Promise<Observation[]> {
  const stem = TERRITORY_STEMS[territory.toLowerCase()] ?? territory.toLowerCase();
  const months = SNAPSHOT_MONTHS[stem] ?? [];

  if (months.length === 0) return [];

  const normProduct = normaliseName(productName);

  // Fetch all snapshots in parallel
  const snapshots = await Promise.all(months.map((m) => fetchSnapshot(stem, m)));

  const series: Observation[] = [];

  for (let i = 0; i < months.length; i++) {
    const snap = snapshots[i];
    if (!snap || !snap.donnees || !snap.date_snapshot) continue;

    // Collect all prices for the matching product in this snapshot
    const matchingPrices = snap.donnees
      .filter((row) => row.produit && normaliseName(row.produit) === normProduct)
      .map((row) => row.prix)
      .filter((p): p is number => typeof p === 'number' && Number.isFinite(p) && p > 0);

    if (matchingPrices.length === 0) continue;

    // Use average price across all stores in this snapshot month
    const avg = matchingPrices.reduce((a, b) => a + b, 0) / matchingPrices.length;

    series.push({
      date: snap.date_snapshot,
      price: Math.round(avg * 100) / 100,
    });
  }

  return series.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

/**
 * Convenience: same as above but also compute the cross-store min/max for the latest snapshot.
 */
export async function getLatestSnapshotStats(
  territory: string,
  productName: string,
): Promise<{ min: number; max: number; avg: number; storeCount: number; date: string } | null> {
  const stem = TERRITORY_STEMS[territory.toLowerCase()] ?? territory.toLowerCase();
  const months = SNAPSHOT_MONTHS[stem] ?? [];
  if (months.length === 0) return null;

  const normProduct = normaliseName(productName);

  // Only need the latest snapshot
  const latestMonth = months[months.length - 1];
  const snap = await fetchSnapshot(stem, latestMonth);
  if (!snap || !snap.donnees || !snap.date_snapshot) return null;

  const matchingRows = snap.donnees.filter(
    (row) => row.produit && normaliseName(row.produit) === normProduct,
  );
  const prices = matchingRows
    .map((row) => row.prix)
    .filter((p): p is number => typeof p === 'number' && Number.isFinite(p) && p > 0);

  if (prices.length === 0) return null;

  return {
    min: Math.min(...prices),
    max: Math.max(...prices),
    avg: Math.round((prices.reduce((a, b) => a + b, 0) / prices.length) * 100) / 100,
    storeCount: prices.length,
    date: snap.date_snapshot,
  };
}

/** Exported list of well-known products available across many snapshots. */
export const KNOWN_OBSERVATOIRE_PRODUCTS = [
  'Lait demi-écrémé UHT 1L',
  'Riz long blanc 1kg',
  'Huile de tournesol 1L',
  'Gel douche 250ml',
  'Sucre blanc 1kg',
  'Lessive liquide 1.5L',
  'Eau minérale 1.5L',
  'Yaourt nature 4x125g',
  'Liquide vaisselle 500ml',
  'Pâtes spaghetti 500g',
  'Tomates rondes 1kg',
  'Poulet entier 1kg',
  'Café moulu 250g',
] as const;
