/**
 * Tests — compare.service aggregation utilities
 *
 * These functions are pure (no DB, no HTTP) so they are tested here
 * in the frontend vitest harness by duplicating the logic inline.
 * Any change to the canonical logic in backend/src/services/compare.service.ts
 * must be reflected here.
 */

import { describe, it, expect } from 'vitest';

// ── Types (mirrors backend/src/services/compare.service.ts) ──────────────────

interface PriceObservationRow {
  retailer: string;
  territory: string;
  price: number;
  currency: 'EUR';
  observedAt: string;
  source: 'open_food_facts' | 'open_prices' | 'internal' | 'mock';
}

// ── Aggregation logic (mirrors backend) ───────────────────────────────────────

const RETAILER_CANON: Record<string, string> = {
  'leader price':     'Leader Price',
  'leaderprice':      'Leader Price',
  'carrefour market': 'Carrefour Market',
  'carrefour':        'Carrefour',
  'super u':          'Super U',
  'superu':           'Super U',
  'e.leclerc':        'E.Leclerc',
  'leclerc':          'E.Leclerc',
  'match':            'Match',
  'simply market':    'Simply Market',
  'intermarché':      'Intermarché',
  'intermarche':      'Intermarché',
  'casino':           'Casino',
  'lidl':             'Lidl',
  'aldi':             'Aldi',
};

function normalizeRetailer(name: string): string {
  const lower = name.trim().toLowerCase();
  return RETAILER_CANON[lower] ?? name.trim();
}

function deduplicateObservations(obs: PriceObservationRow[]): PriceObservationRow[] {
  const map = new Map<string, PriceObservationRow>();
  for (const o of obs) {
    const normalized = normalizeRetailer(o.retailer);
    const key = `${normalized.toLowerCase()}|${o.territory.toUpperCase()}`;
    const existing = map.get(key);
    if (!existing || o.observedAt > existing.observedAt) {
      map.set(key, { ...o, retailer: normalized });
    }
  }
  return Array.from(map.values());
}

function interpolatedQuartile(sorted: number[], p: number): number {
  const idx = (sorted.length - 1) * p;
  const lo  = Math.floor(idx);
  const hi  = Math.ceil(idx);
  return lo === hi ? sorted[lo] : sorted[lo] + (idx - lo) * (sorted[hi] - sorted[lo]);
}

function discardOutliers(obs: PriceObservationRow[]): PriceObservationRow[] {
  if (obs.length < 4) return obs;

  const sorted = [...obs].map((o) => o.price).sort((a, b) => a - b);

  const q1  = interpolatedQuartile(sorted, 0.25);
  const q3  = interpolatedQuartile(sorted, 0.75);
  const iqr = q3 - q1;

  if (iqr === 0) return obs; // all prices identical — keep everything

  const lower = q1 - 1.5 * iqr;
  const upper = q3 + 1.5 * iqr;

  return obs.filter((o) => o.price >= lower && o.price <= upper);
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeObs(overrides: Partial<PriceObservationRow> & { price: number }): PriceObservationRow {
  return {
    retailer:   'Carrefour',
    territory:  'GP',
    currency:   'EUR',
    observedAt: '2026-03-20T10:00:00Z',
    source:     'open_prices',
    ...overrides,
  };
}

// ── normalizeRetailer ─────────────────────────────────────────────────────────

describe('normalizeRetailer', () => {
  it('maps known lowercase variant to canonical name', () => {
    expect(normalizeRetailer('leclerc')).toBe('E.Leclerc');
    expect(normalizeRetailer('leader price')).toBe('Leader Price');
    expect(normalizeRetailer('intermarche')).toBe('Intermarché');
  });

  it('is case-insensitive for input', () => {
    expect(normalizeRetailer('SUPER U')).toBe('Super U');
    expect(normalizeRetailer('Carrefour')).toBe('Carrefour');
  });

  it('passes through unknown retailer names unchanged', () => {
    expect(normalizeRetailer('BioCoop Antilles')).toBe('BioCoop Antilles');
  });

  it('trims surrounding whitespace', () => {
    expect(normalizeRetailer('  match  ')).toBe('Match');
  });
});

// ── deduplicateObservations ───────────────────────────────────────────────────

describe('deduplicateObservations', () => {
  it('keeps only one row per (retailer, territory)', () => {
    const obs = [
      makeObs({ retailer: 'Carrefour', territory: 'GP', price: 3.50, observedAt: '2026-03-19T08:00:00Z' }),
      makeObs({ retailer: 'Carrefour', territory: 'GP', price: 3.20, observedAt: '2026-03-20T08:00:00Z' }),
    ];
    const result = deduplicateObservations(obs);
    expect(result).toHaveLength(1);
    // keeps the most recent
    expect(result[0].price).toBe(3.20);
  });

  it('treats name variants as the same retailer', () => {
    const obs = [
      makeObs({ retailer: 'leclerc',  territory: 'MQ', price: 2.90, observedAt: '2026-03-19T10:00:00Z' }),
      makeObs({ retailer: 'E.Leclerc', territory: 'MQ', price: 2.80, observedAt: '2026-03-20T10:00:00Z' }),
    ];
    const result = deduplicateObservations(obs);
    expect(result).toHaveLength(1);
    expect(result[0].retailer).toBe('E.Leclerc');
    expect(result[0].price).toBe(2.80);
  });

  it('keeps separate rows for different territories', () => {
    const obs = [
      makeObs({ retailer: 'Carrefour', territory: 'GP', price: 3.20 }),
      makeObs({ retailer: 'Carrefour', territory: 'MQ', price: 3.05 }),
    ];
    expect(deduplicateObservations(obs)).toHaveLength(2);
  });

  it('normalizes retailer name in output', () => {
    const obs = [makeObs({ retailer: 'super u', price: 3.60 })];
    expect(deduplicateObservations(obs)[0].retailer).toBe('Super U');
  });
});

// ── discardOutliers ───────────────────────────────────────────────────────────

describe('discardOutliers', () => {
  it('removes extreme high price outliers', () => {
    const obs = [
      makeObs({ price: 2.80 }),
      makeObs({ price: 2.90 }),
      makeObs({ price: 3.00 }),
      makeObs({ price: 3.10 }),
      makeObs({ price: 99.99 }), // extreme outlier
    ];
    const result = discardOutliers(obs);
    expect(result.some((o) => o.price === 99.99)).toBe(false);
    expect(result.length).toBe(4);
  });

  it('removes extreme low price outliers', () => {
    const obs = [
      makeObs({ price: 0.01 }), // extreme outlier
      makeObs({ price: 2.90 }),
      makeObs({ price: 3.00 }),
      makeObs({ price: 3.10 }),
      makeObs({ price: 3.20 }),
    ];
    const result = discardOutliers(obs);
    expect(result.some((o) => o.price === 0.01)).toBe(false);
  });

  it('returns input unchanged when fewer than 4 observations', () => {
    const obs = [
      makeObs({ price: 1.00 }),
      makeObs({ price: 5.00 }),
      makeObs({ price: 100.00 }),
    ];
    expect(discardOutliers(obs)).toHaveLength(3);
  });

  it('keeps all observations when prices are clustered', () => {
    const obs = [
      makeObs({ price: 2.95 }),
      makeObs({ price: 3.00 }),
      makeObs({ price: 3.05 }),
      makeObs({ price: 3.10 }),
    ];
    expect(discardOutliers(obs)).toHaveLength(4);
  });

  it('keeps all observations when all prices are identical (IQR = 0)', () => {
    const obs = [
      makeObs({ price: 2.99 }),
      makeObs({ price: 2.99 }),
      makeObs({ price: 2.99 }),
      makeObs({ price: 2.99 }),
    ];
    expect(discardOutliers(obs)).toHaveLength(4);
  });
});
