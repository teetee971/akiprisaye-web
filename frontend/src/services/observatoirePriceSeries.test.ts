import { afterEach, describe, expect, it, vi } from 'vitest';
import { buildObservatoirePriceSeries, getLatestSnapshotStats } from './observatoirePriceSeries';

// ─── helpers ──────────────────────────────────────────────────────────────────

function makeSnapshot(
  date: string,
  products: Array<{ produit: string; prix: number; enseigne?: string }>
) {
  return {
    territoire: 'Test',
    date_snapshot: date,
    source: 'test',
    qualite: 'verifie',
    donnees: products.map((p) => ({ ...p, commune: 'TestCity', categorie: 'test', unite: '1L' })),
  };
}

// ─── buildObservatoirePriceSeries ─────────────────────────────────────────────

describe('buildObservatoirePriceSeries', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns [] for an unknown territory stem', async () => {
    const series = await buildObservatoirePriceSeries(
      'unknown_territory_xyz',
      'Lait demi-écrémé UHT 1L'
    );
    expect(series).toEqual([]);
  });

  it('returns [] when all fetches fail (network error)', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network error')));
    const series = await buildObservatoirePriceSeries('mq', 'Lait demi-écrémé UHT 1L');
    expect(series).toEqual([]);
  });

  it('returns [] when snapshots return non-ok HTTP status', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 404 }));
    const series = await buildObservatoirePriceSeries('mq', 'Riz long blanc 1kg');
    expect(series).toEqual([]);
  });

  it('builds a price series from multiple snapshots', async () => {
    const snapshots = [
      makeSnapshot('2026-01-05', [
        { produit: 'Lait demi-écrémé UHT 1L', prix: 1.45, enseigne: 'Carrefour' },
        { produit: 'Lait demi-écrémé UHT 1L', prix: 1.41, enseigne: 'Leclerc' },
      ]),
      makeSnapshot('2026-02-05', [
        { produit: 'Lait demi-écrémé UHT 1L', prix: 1.55, enseigne: 'Carrefour' },
      ]),
      makeSnapshot('2026-03-05', [
        { produit: 'Lait demi-écrémé UHT 1L', prix: 1.5, enseigne: 'Carrefour' },
        { produit: 'Lait demi-écrémé UHT 1L', prix: 1.48, enseigne: 'Hyper U' },
      ]),
    ];

    let callIdx = 0;
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(() => {
        const snap = snapshots[callIdx++] ?? null;
        if (!snap) return Promise.resolve({ ok: false, status: 404 });
        return Promise.resolve({ ok: true, json: () => Promise.resolve(snap) });
      })
    );

    const series = await buildObservatoirePriceSeries('mq', 'Lait demi-écrémé UHT 1L');

    expect(series).toHaveLength(3);
    // First snapshot: avg of 1.45 and 1.41
    expect(series[0].price).toBeCloseTo(1.43, 1);
    // Second snapshot: 1.55
    expect(series[1].price).toBeCloseTo(1.55, 1);
    // Third snapshot: avg of 1.50 and 1.48
    expect(series[2].price).toBeCloseTo(1.49, 1);
    // Should be chronologically sorted
    expect(series[0].date).toBe('2026-01-05');
    expect(series[2].date).toBe('2026-03-05');
  });

  it('performs case-insensitive and diacritic-insensitive product matching', async () => {
    const snap = makeSnapshot('2026-01-05', [{ produit: 'LAIT DEMI-ÉCRÉMÉ UHT 1L', prix: 1.5 }]);
    let callIdx = 0;
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(() => {
        if (callIdx++ === 0)
          return Promise.resolve({ ok: true, json: () => Promise.resolve(snap) });
        return Promise.resolve({ ok: false, status: 404 });
      })
    );

    const series = await buildObservatoirePriceSeries('mq', 'lait demi-ecreme uht 1l');
    expect(series.length).toBeGreaterThan(0);
    expect(series[0].price).toBe(1.5);
  });

  it('skips snapshots that have 0 matching products', async () => {
    const snap = makeSnapshot('2026-01-05', [{ produit: 'Riz long blanc 1kg', prix: 2.5 }]);
    let callIdx = 0;
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(() => {
        if (callIdx++ === 0)
          return Promise.resolve({ ok: true, json: () => Promise.resolve(snap) });
        return Promise.resolve({ ok: false, status: 404 });
      })
    );

    const series = await buildObservatoirePriceSeries('mq', 'Lait demi-écrémé UHT 1L');
    // no matching products → empty
    expect(series).toEqual([]);
  });
});

// ─── getLatestSnapshotStats ───────────────────────────────────────────────────

describe('getLatestSnapshotStats', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns null when fetch fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network')));
    const stats = await getLatestSnapshotStats('mq', 'Lait demi-écrémé UHT 1L');
    expect(stats).toBeNull();
  });

  it('computes min/max/avg/storeCount from latest snapshot', async () => {
    const snap = makeSnapshot('2026-03-05', [
      { produit: 'Lait demi-écrémé UHT 1L', prix: 1.4, enseigne: 'Leclerc' },
      { produit: 'Lait demi-écrémé UHT 1L', prix: 1.6, enseigne: 'Carrefour' },
      { produit: 'Lait demi-écrémé UHT 1L', prix: 1.5, enseigne: 'Hyper U' },
      { produit: 'Riz long blanc 1kg', prix: 2.5, enseigne: 'Carrefour' }, // different product
    ]);

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(snap),
      })
    );

    const stats = await getLatestSnapshotStats('mq', 'Lait demi-écrémé UHT 1L');

    expect(stats).not.toBeNull();
    expect(stats!.min).toBeCloseTo(1.4, 2);
    expect(stats!.max).toBeCloseTo(1.6, 2);
    expect(stats!.avg).toBeCloseTo(1.5, 2);
    expect(stats!.storeCount).toBe(3);
    expect(stats!.date).toBe('2026-03-05');
  });
});
