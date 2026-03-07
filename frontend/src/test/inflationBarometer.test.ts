/**
 * Unit tests — InflationBarometerWidget basket computation logic
 *
 * Uses REAL observatoire JSON files from public/data/observatoire/.
 * No mocking — tests run against actual collected data.
 *
 * Validates:
 * - Basket computation from real snapshots (≥5 products required)
 * - Month-over-month trend calculation (Jan→Mar 2026)
 * - Hexagone comparison delta
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const DATA_DIR = resolve(
  fileURLToPath(import.meta.url),
  '../../../public/data/observatoire',
);

const BASKET_PRODUCTS = [
  'Lait demi-écrémé UHT 1L',
  'Riz long blanc 1kg',
  'Eau minérale 1.5L',
  'Pâtes spaghetti 500g',
  'Sucre blanc 1kg',
  'Huile de tournesol 1L',
];

interface ObsEntry {
  produit: string;
  prix: number;
}

interface Snapshot {
  territoire: string;
  donnees: ObsEntry[];
}

function loadSnapshot(filename: string): Snapshot {
  const raw = readFileSync(join(DATA_DIR, filename), 'utf-8');
  return JSON.parse(raw) as Snapshot;
}

function computeBasket(donnees: ObsEntry[]): number | null {
  const sums: Record<string, { total: number; count: number }> = {};
  for (const e of donnees) {
    if (BASKET_PRODUCTS.includes(e.produit)) {
      if (!sums[e.produit]) sums[e.produit] = { total: 0, count: 0 };
      sums[e.produit].total += e.prix;
      sums[e.produit].count++;
    }
  }
  const avgs = Object.values(sums).map((s) => s.total / s.count);
  if (avgs.length < 5) return null;
  const total = avgs.reduce((a, b) => a + b, 0);
  if (avgs.length < 6) return (total / avgs.length) * 6;
  return total;
}

describe('InflationBarometerWidget — basket computation', () => {
  it('computes a valid basket for Hexagone Jan 2026', () => {
    const snap = loadSnapshot('hexagone_2026-01.json');
    const basket = computeBasket(snap.donnees);
    expect(basket).not.toBeNull();
    expect(basket!).toBeGreaterThan(5);
    expect(basket!).toBeLessThan(15);
  });

  it('computes a valid basket for Hexagone Mar 2026', () => {
    const snap = loadSnapshot('hexagone_2026-03.json');
    const basket = computeBasket(snap.donnees);
    expect(basket).not.toBeNull();
    expect(basket!).toBeGreaterThan(5);
    expect(basket!).toBeLessThan(15);
  });

  it('computes a valid basket for Guadeloupe Jan 2026', () => {
    const snap = loadSnapshot('guadeloupe_2026-01.json');
    const basket = computeBasket(snap.donnees);
    expect(basket).not.toBeNull();
    expect(basket!).toBeGreaterThan(8);
    expect(basket!).toBeLessThan(20);
  });

  it('Guadeloupe basket is more expensive than Hexagone in Mar 2026', () => {
    const hexSnap = loadSnapshot('hexagone_2026-03.json');
    const gpSnap = loadSnapshot('guadeloupe_2026-03.json');
    const hexBasket = computeBasket(hexSnap.donnees);
    const gpBasket = computeBasket(gpSnap.donnees);
    expect(hexBasket).not.toBeNull();
    expect(gpBasket).not.toBeNull();
    expect(gpBasket!).toBeGreaterThan(hexBasket!);
  });

  it('computes month-over-month trend for Hexagone (Jan→Mar 2026)', () => {
    const snapJan = loadSnapshot('hexagone_2026-01.json');
    const snapMar = loadSnapshot('hexagone_2026-03.json');
    const jan = computeBasket(snapJan.donnees);
    const mar = computeBasket(snapMar.donnees);
    expect(jan).not.toBeNull();
    expect(mar).not.toBeNull();
    const trendPct = ((mar! - jan!) / jan!) * 100;
    // Hexagone inflation should be moderate (< 5% over 3 months)
    expect(Math.abs(trendPct)).toBeLessThan(5);
  });

  it('all 6 basket products present in Hexagone Mar 2026', () => {
    const snap = loadSnapshot('hexagone_2026-03.json');
    const foundProducts = new Set(
      snap.donnees.map((e) => e.produit).filter((p) => BASKET_PRODUCTS.includes(p)),
    );
    expect(foundProducts.size).toBe(6);
  });

  it('all 6 basket products present in Guadeloupe Mar 2026', () => {
    const snap = loadSnapshot('guadeloupe_2026-03.json');
    const foundProducts = new Set(
      snap.donnees.map((e) => e.produit).filter((p) => BASKET_PRODUCTS.includes(p)),
    );
    expect(foundProducts.size).toBe(6);
  });

  it('Guyane basket in Mar 2026 is higher than Hexagone (reflects real cost of living)', () => {
    const hexSnap = loadSnapshot('hexagone_2026-03.json');
    const guyaneSnap = loadSnapshot('guyane_2026-03.json');
    const hexBasket = computeBasket(hexSnap.donnees);
    const guyaneBasket = computeBasket(guyaneSnap.donnees);
    expect(hexBasket).not.toBeNull();
    expect(guyaneBasket).not.toBeNull();
    expect(guyaneBasket!).toBeGreaterThan(hexBasket!);
  });
});
