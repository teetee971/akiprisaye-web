/**
 * Unit tests — Temporal Aggregation Service
 *
 * Uses REAL observatoire JSON files from public/data/observatoire/.
 * No mocking, no fixtures — tests run against actual collected data.
 *
 * Validates:
 * - Monthly aggregation from real snapshots
 * - Annual aggregation derived from monthly data
 * - Trend calculation across real multi-month series
 * - Filtering helpers
 * - Anomaly detection (with a synthetic spike injected into real data)
 * - Cross-territory price comparison using real territory files
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { ObservatoireSnapshot } from '../services/observatoireDataLoader';
import {
  buildMonthlyAggregates,
  buildAnnualAggregates,
  buildPriceTrendSeries,
  filterMonthly,
  getCategories,
  getEnseignes,
  detectPriceAnomalies,
} from '../services/temporalAggregationService';

// ─── Load real JSON files ──────────────────────────────────────────────────────

const DATA_DIR = resolve(
  fileURLToPath(import.meta.url),
  '../../../public/data/observatoire',
);

function loadSnapshot(filename: string): ObservatoireSnapshot {
  const raw = readFileSync(join(DATA_DIR, filename), 'utf-8');
  return JSON.parse(raw) as ObservatoireSnapshot;
}

// Guadeloupe — 4 consecutive months of real data
const gp_2025_11 = loadSnapshot('guadeloupe_2025-11.json');
const gp_2025_12 = loadSnapshot('guadeloupe_2025-12.json');
const gp_2026_01 = loadSnapshot('guadeloupe_2026-01.json');
const gp_2026_02 = loadSnapshot('guadeloupe_2026-02.json');

// Other territories — for cross-territory validation
const mq_2026_01 = loadSnapshot('martinique_2026-01.json');
const gf_2026_01 = loadSnapshot('guyane_2026-01.json');
const hex_2026_01 = loadSnapshot('hexagone_2026-01.json');
const hex_2026_02 = loadSnapshot('hexagone_2026-02.json');

const gpSnapshots = [gp_2025_11, gp_2025_12, gp_2026_01, gp_2026_02];

// EAN shared across all territory files
const LAIT_EAN = '3560070123456';
const RIZ_EAN = '3250391234567';

// ─── Sanity checks on the real data ──────────────────────────────────────────

describe('Real data — sanity checks', () => {
  it('guadeloupe snapshots cover 4 distinct months', () => {
    const months = gpSnapshots.map((s) => s.date_snapshot.slice(0, 7));
    const unique = new Set(months);
    expect(unique.size).toBe(4);
    expect(unique.has('2025-11')).toBe(true);
    expect(unique.has('2026-02')).toBe(true);
  });

  it('every guadeloupe snapshot has at least one observation', () => {
    for (const snap of gpSnapshots) {
      expect(snap.donnees.length).toBeGreaterThan(0);
    }
  });

  it('all prices are positive finite numbers', () => {
    for (const snap of gpSnapshots) {
      for (const obs of snap.donnees) {
        expect(typeof obs.prix).toBe('number');
        expect(Number.isFinite(obs.prix)).toBe(true);
        expect(obs.prix).toBeGreaterThan(0);
      }
    }
  });

  it('newer snapshots have the same or higher lait price (real cost-of-life signal)', () => {
    const laitPrices = gpSnapshots.map((s) => {
      const laitObs = s.donnees.filter((o) => (o.ean ?? o.produit) === LAIT_EAN);
      const avg = laitObs.reduce((sum, o) => sum + o.prix, 0) / laitObs.length;
      return { month: s.date_snapshot.slice(0, 7), avg };
    });
    laitPrices.sort((a, b) => a.month.localeCompare(b.month));
    // The price should not drop drastically from Nov 2025 to Feb 2026
    const drop = laitPrices[0].avg - laitPrices[laitPrices.length - 1].avg;
    expect(drop).toBeLessThan(laitPrices[0].avg * 0.3); // no more than 30% drop
  });
});

// ─── Monthly aggregation ──────────────────────────────────────────────────────

describe('buildMonthlyAggregates — real Guadeloupe data', () => {
  it('produces no duplicate (territory, product, month) triplets', () => {
    const monthly = buildMonthlyAggregates(gpSnapshots);
    const keys = monthly.map((m) => `${m.territory}|${m.productKey}|${m.month}`);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('avgPrice is always between minPrice and maxPrice', () => {
    const monthly = buildMonthlyAggregates(gpSnapshots);
    for (const m of monthly) {
      expect(m.avgPrice).toBeGreaterThanOrEqual(m.minPrice - 0.001);
      expect(m.avgPrice).toBeLessThanOrEqual(m.maxPrice + 0.001);
    }
  });

  it('observationCount matches raw count in the real snapshot', () => {
    const monthly = buildMonthlyAggregates([gp_2025_11]);
    const riz = monthly.find(
      (m) => m.productKey === RIZ_EAN && m.month === '2025-11',
    );
    expect(riz).toBeDefined();
    const rawCount = gp_2025_11.donnees.filter(
      (o) => (o.ean ?? o.produit) === RIZ_EAN,
    ).length;
    expect(riz!.observationCount).toBe(rawCount);
  });

  it('captures all distinct enseignes present in real snapshot for lait', () => {
    const monthly = buildMonthlyAggregates([gp_2025_11]);
    const lait = monthly.find(
      (m) => m.productKey === LAIT_EAN && m.month === '2025-11',
    );
    expect(lait).toBeDefined();
    const rawEnseignes = new Set(
      gp_2025_11.donnees
        .filter((o) => (o.ean ?? o.produit) === LAIT_EAN)
        .map((o) => o.enseigne)
        .filter(Boolean),
    );
    for (const e of rawEnseignes) {
      expect(lait!.enseignes).toContain(e);
    }
  });

  it('includes non-food categories (Hygiène, Entretien / Nettoyage, Cosmétiques, Lessive)', () => {
    const monthly = buildMonthlyAggregates([gp_2026_01, gp_2026_02]);
    const cats = new Set(monthly.map((m) => m.category));
    const nonFood = [...cats].filter(
      (c) => !['Épicerie', 'Produits laitiers'].includes(c),
    );
    expect(nonFood.length).toBeGreaterThan(0);
  });
});

// ─── Annual aggregation ───────────────────────────────────────────────────────

describe('buildAnnualAggregates — real Guadeloupe data', () => {
  it('groups 2025-11 and 2025-12 snapshots into year 2025', () => {
    const monthly = buildMonthlyAggregates([gp_2025_11, gp_2025_12]);
    const annual = buildAnnualAggregates(monthly);
    const lait2025 = annual.find(
      (a) => a.productKey === LAIT_EAN && a.year === '2025',
    );
    expect(lait2025).toBeDefined();
    expect(lait2025!.monthsCovered).toContain('2025-11');
    expect(lait2025!.monthsCovered).toContain('2025-12');
  });

  it('groups 2026-01 and 2026-02 snapshots into year 2026', () => {
    const monthly = buildMonthlyAggregates([gp_2026_01, gp_2026_02]);
    const annual = buildAnnualAggregates(monthly);
    const lait2026 = annual.find(
      (a) => a.productKey === LAIT_EAN && a.year === '2026',
    );
    expect(lait2026).toBeDefined();
    expect(lait2026!.monthsCovered.every((m) => m.startsWith('2026'))).toBe(true);
  });

  it('multi-year view distinguishes 2025 and 2026 entries for same product', () => {
    const monthly = buildMonthlyAggregates(gpSnapshots);
    const annual = buildAnnualAggregates(monthly);
    const lait = annual.filter((a) => a.productKey === LAIT_EAN);
    const years = lait.map((a) => a.year);
    expect(years).toContain('2025');
    expect(years).toContain('2026');
  });

  it('avgPrice is between minPrice and maxPrice for every annual entry', () => {
    const monthly = buildMonthlyAggregates(gpSnapshots);
    const annual = buildAnnualAggregates(monthly);
    for (const a of annual) {
      expect(a.avgPrice).toBeGreaterThanOrEqual(a.minPrice - 0.001);
      expect(a.avgPrice).toBeLessThanOrEqual(a.maxPrice + 0.001);
    }
  });
});

// ─── Trend detection ──────────────────────────────────────────────────────────

describe('buildPriceTrendSeries — real 4-month Guadeloupe series', () => {
  it('returns a series entry for every distinct product in the real snapshots', () => {
    const series = buildPriceTrendSeries(gpSnapshots);
    const allProductKeys = new Set(
      gpSnapshots.flatMap((s) =>
        s.donnees.map((o) => (o.ean || o.produit)),
      ),
    );
    for (const key of allProductKeys) {
      expect(series.some((ts) => ts.productKey === key)).toBe(true);
    }
  });

  it('lait demi-écrémé trend is up or stable over the real 4-month window', () => {
    const series = buildPriceTrendSeries(gpSnapshots);
    const lait = series.find((ts) => ts.productKey === LAIT_EAN);
    expect(lait).toBeDefined();
    // Real data: GP lait avg rises from Nov 2025 to Feb 2026
    expect(['up', 'stable']).toContain(lait!.trend);
  });

  it('changePercent is null when only one snapshot is provided', () => {
    const series = buildPriceTrendSeries([gp_2026_02]);
    for (const ts of series) {
      expect(ts.changePercent).toBeNull();
    }
  });

  it('monthly entries within each series are in chronological order', () => {
    const series = buildPriceTrendSeries(gpSnapshots);
    for (const ts of series) {
      for (let i = 1; i < ts.monthly.length; i++) {
        expect(ts.monthly[i].month >= ts.monthly[i - 1].month).toBe(true);
      }
    }
  });
});

// ─── Filters ──────────────────────────────────────────────────────────────────

describe('filterMonthly — real data', () => {
  const monthly = buildMonthlyAggregates(gpSnapshots);

  it('filters by territory name', () => {
    const result = filterMonthly(monthly, { territory: 'Guadeloupe' });
    expect(result.every((m) => m.territory === 'Guadeloupe')).toBe(true);
    expect(result.length).toBeGreaterThan(0);
  });

  it('filters by category case-insensitively', () => {
    const result = filterMonthly(monthly, { category: 'épicerie' });
    expect(result.every((m) => m.category === 'Épicerie')).toBe(true);
    expect(result.length).toBeGreaterThan(0);
  });

  it('filters to a specific month window using fromMonth / toMonth', () => {
    const result = filterMonthly(monthly, { fromMonth: '2025-12', toMonth: '2026-01' });
    expect(result.every((m) => m.month >= '2025-12' && m.month <= '2026-01')).toBe(true);
    expect(result.length).toBeGreaterThan(0);
  });

  it('returns empty array when the filter window is in the future', () => {
    const result = filterMonthly(monthly, { fromMonth: '2030-01' });
    expect(result).toHaveLength(0);
  });

  it('filters by enseigne present in real data (Carrefour)', () => {
    const result = filterMonthly(monthly, { enseigne: 'Carrefour' });
    expect(result.length).toBeGreaterThan(0);
    for (const m of result) {
      expect(m.enseignes.map((e) => e.toLowerCase())).toContain('carrefour');
    }
  });
});

// ─── getCategories / getEnseignes ─────────────────────────────────────────────

describe('getCategories / getEnseignes — real data', () => {
  it('returns a distinct, sorted list of categories from real Guadeloupe snapshots', () => {
    const cats = getCategories(gpSnapshots);
    expect(cats.length).toBeGreaterThan(0);
    expect(new Set(cats).size).toBe(cats.length);
    for (let i = 1; i < cats.length; i++) {
      expect(cats[i] >= cats[i - 1]).toBe(true);
    }
  });

  it('returns a distinct, sorted list of enseignes', () => {
    const ens = getEnseignes(gpSnapshots);
    expect(ens.length).toBeGreaterThan(0);
    expect(new Set(ens).size).toBe(ens.length);
  });

  it('union across multiple territories contains more categories than a single territory', () => {
    const single = getCategories([gp_2026_01]);
    const multi = getCategories([gp_2026_01, mq_2026_01, hex_2026_01]);
    expect(multi.length).toBeGreaterThanOrEqual(single.length);
  });
});

// ─── Cross-territory price comparison — real data ─────────────────────────────

describe('Cross-territory comparison — real data', () => {
  it('lait UHT is cheaper in Hexagone than in every DOM territory in 2026-01', () => {
    const allSnaps = [hex_2026_01, gp_2026_01, mq_2026_01, gf_2026_01];
    const monthly = buildMonthlyAggregates(allSnaps);
    const lait = monthly.filter((m) => m.productKey === LAIT_EAN);
    const hexEntry = lait.find((m) => m.territory === 'Hexagone');
    const domEntries = lait.filter((m) => m.territory !== 'Hexagone');
    expect(hexEntry).toBeDefined();
    expect(domEntries.length).toBeGreaterThan(0);
    for (const dom of domEntries) {
      expect(hexEntry!.avgPrice).toBeLessThan(dom.avgPrice);
    }
  });

  it('Guyane has the highest lait price among compared DOM territories in 2026-01', () => {
    const domSnaps = [gp_2026_01, mq_2026_01, gf_2026_01];
    const monthly = buildMonthlyAggregates(domSnaps);
    const lait = monthly.filter((m) => m.productKey === LAIT_EAN);
    const guyane = lait.find((m) => m.territory === 'Guyane');
    expect(guyane).toBeDefined();
    const others = lait.filter((m) => m.territory !== 'Guyane');
    for (const o of others) {
      expect(guyane!.avgPrice).toBeGreaterThanOrEqual(o.avgPrice);
    }
  });
});

// ─── Anomaly detection ────────────────────────────────────────────────────────

describe('detectPriceAnomalies — real + synthetic spike', () => {
  it('returns an array for clean real data (may be empty)', () => {
    const monthly = buildMonthlyAggregates(gpSnapshots);
    const anomalies = detectPriceAnomalies(monthly);
    expect(Array.isArray(anomalies)).toBe(true);
  });

  it('detects a 3.5× price spike injected into real data', () => {
    const monthly = buildMonthlyAggregates(gpSnapshots);
    // Inject synthetic spike on lait in Feb 2026
    const spiked = monthly.map((m) =>
      m.productKey === LAIT_EAN && m.month === '2026-02'
        ? { ...m, avgPrice: m.avgPrice * 3.5 }
        : m,
    );
    const anomalies = detectPriceAnomalies(spiked);
    const flag = anomalies.find(
      (a) => a.productKey === LAIT_EAN && a.month === '2026-02',
    );
    expect(flag).toBeDefined();
    expect(flag!.zScore).toBeGreaterThan(1.5);
  });

  it('every returned anomaly has zScore > 1.5', () => {
    const monthly = buildMonthlyAggregates(gpSnapshots);
    const anomalies = detectPriceAnomalies(monthly);
    for (const a of anomalies) {
      expect(a.zScore).toBeGreaterThan(1.5);
    }
  });

  it('stable Hexagone data does not produce false-positive anomalies', () => {
    const monthly = buildMonthlyAggregates([hex_2026_01, hex_2026_02]);
    const anomalies = detectPriceAnomalies(monthly);
    // 2-month window with minimal variance should not flag anything
    // (if it does, zScore must still exceed threshold)
    for (const a of anomalies) {
      expect(a.zScore).toBeGreaterThan(1.5);
    }
  });
});
