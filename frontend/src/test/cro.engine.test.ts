/**
 * cro.engine.test.ts — Unit tests for the CRO engine.
 *
 * Covers:
 *   - conversionTracker: storage logic, behavior metrics
 *   - croScore: determinism, weight formula, edge cases
 *   - croAnalyzer: recommendation generation, empty metrics
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// ── Mock localStorage ─────────────────────────────────────────────────────────

const _store: Record<string, string> = {};

vi.mock('../utils/safeLocalStorage', () => ({
  safeLocalStorage: {
    getItem: (k: string) => _store[k] ?? null,
    setItem: (k: string, v: string) => {
      _store[k] = v;
    },
    removeItem: (k: string) => {
      delete _store[k];
    },
  },
}));

vi.mock('../utils/statsTracker', () => ({
  getSEOPageStats: () => [],
}));

// ── conversionTracker behavior storage ───────────────────────────────────────

describe('conversionTracker — behavior tracking', () => {
  beforeEach(() => {
    Object.keys(_store).forEach((k) => delete _store[k]);
    vi.resetModules();
  });

  it('trackPageView increments page views', async () => {
    const { trackPageView, getStoredBehaviorMetrics } = await import('../utils/conversionTracker');
    trackPageView('/produit/coca-cola-guadeloupe');
    trackPageView('/produit/coca-cola-guadeloupe');
    const metrics = getStoredBehaviorMetrics();
    expect(metrics).toHaveLength(1);
    expect(metrics[0].pageViews).toBe(2);
    expect(metrics[0].url).toBe('/produit/coca-cola-guadeloupe');
  });

  it('trackScrollDepth updates running average', async () => {
    const { trackPageView, trackScrollDepth, getStoredBehaviorMetrics } =
      await import('../utils/conversionTracker');
    const url = '/produit/test';
    trackPageView(url); // pageViews = 1
    trackScrollDepth(url, 80);
    const [m] = getStoredBehaviorMetrics();
    expect(m.avgScrollDepth).toBeGreaterThan(0);
    expect(m.avgScrollDepth).toBeLessThanOrEqual(100);
  });

  it('trackCtaClick increments ctaClicks', async () => {
    const { trackPageView, trackCtaClick, getStoredBehaviorMetrics } =
      await import('../utils/conversionTracker');
    const url = '/produit/test-cta';
    trackPageView(url);
    trackCtaClick(url, 'sticky-bar');
    trackCtaClick(url, 'hero-button');
    const [m] = getStoredBehaviorMetrics();
    expect(m.ctaClicks).toBe(2);
  });

  it('trackRetailerClick increments retailerClicks', async () => {
    const { trackPageView, trackRetailerClick, getStoredBehaviorMetrics } =
      await import('../utils/conversionTracker');
    const url = '/produit/test-retailer';
    trackPageView(url);
    trackRetailerClick(url, 'leclerc');
    const [m] = getStoredBehaviorMetrics();
    expect(m.retailerClicks).toBe(1);
  });

  it('trackCompareInteraction increments compareInteractions', async () => {
    const { trackPageView, trackCompareInteraction, getStoredBehaviorMetrics } =
      await import('../utils/conversionTracker');
    const url = '/comparer/carrefour-vs-leclerc';
    trackPageView(url);
    trackCompareInteraction(url, 'expand');
    trackCompareInteraction(url, 'sort');
    const [m] = getStoredBehaviorMetrics();
    expect(m.compareInteractions).toBe(2);
  });

  it('getStoredBehaviorMetrics returns [] when nothing stored', async () => {
    const { getStoredBehaviorMetrics } = await import('../utils/conversionTracker');
    expect(getStoredBehaviorMetrics()).toEqual([]);
  });

  it('tracks multiple URLs independently', async () => {
    const { trackPageView, getStoredBehaviorMetrics } = await import('../utils/conversionTracker');
    trackPageView('/page-a');
    trackPageView('/page-b');
    trackPageView('/page-a');
    const metrics = getStoredBehaviorMetrics();
    expect(metrics).toHaveLength(2);
    const a = metrics.find((m) => m.url === '/page-a');
    const b = metrics.find((m) => m.url === '/page-b');
    expect(a?.pageViews).toBe(2);
    expect(b?.pageViews).toBe(1);
  });
});

// ── croScore determinism ──────────────────────────────────────────────────────

describe('croScore — determinism and formula', () => {
  it('identical inputs produce identical output', async () => {
    const { computeCroScore } = await import('../utils/croScore');
    const m = {
      url: '/test',
      pageViews: 50,
      avgScrollDepth: 60,
      avgTimeOnPage: 90,
      ctaClicks: 5,
      retailerClicks: 3,
      compareInteractions: 2,
    };
    const r1 = computeCroScore(m);
    const r2 = computeCroScore(m);
    expect(r1).toEqual(r2);
  });

  it('globalScore = weighted sum of sub-scores', async () => {
    const { computeCroScore } = await import('../utils/croScore');
    const m = {
      url: '/weighted',
      pageViews: 20,
      avgScrollDepth: 50,
      avgTimeOnPage: 60,
      ctaClicks: 4,
      retailerClicks: 2,
      compareInteractions: 0,
    };
    const s = computeCroScore(m);
    const expected = Math.round(
      s.seoScore * 0.25 + s.engagementScore * 0.25 + s.conversionScore * 0.3 + s.revenueScore * 0.2
    );
    expect(s.globalScore).toBe(expected);
  });

  it('all scores are in [0, 100]', async () => {
    const { computeCroScore } = await import('../utils/croScore');
    const m = {
      url: '/x',
      pageViews: 0,
      avgScrollDepth: 0,
      avgTimeOnPage: 0,
      ctaClicks: 0,
      retailerClicks: 0,
      compareInteractions: 0,
    };
    const s = computeCroScore(m);
    for (const key of [
      'seoScore',
      'engagementScore',
      'conversionScore',
      'revenueScore',
      'globalScore',
    ] as const) {
      expect(s[key]).toBeGreaterThanOrEqual(0);
      expect(s[key]).toBeLessThanOrEqual(100);
    }
  });

  it('no crash on zero pageViews', async () => {
    const { computeCroScore } = await import('../utils/croScore');
    expect(() =>
      computeCroScore({
        url: '/zero',
        pageViews: 0,
        avgScrollDepth: 0,
        avgTimeOnPage: 0,
        ctaClicks: 0,
        retailerClicks: 0,
        compareInteractions: 0,
      })
    ).not.toThrow();
  });

  it('computeAllCroScores sorts by globalScore descending', async () => {
    const { computeAllCroScores } = await import('../utils/croScore');
    const metrics = [
      {
        url: '/low',
        pageViews: 1,
        avgScrollDepth: 0,
        avgTimeOnPage: 0,
        ctaClicks: 0,
        retailerClicks: 0,
        compareInteractions: 0,
      },
      {
        url: '/high',
        pageViews: 100,
        avgScrollDepth: 80,
        avgTimeOnPage: 120,
        ctaClicks: 20,
        retailerClicks: 10,
        compareInteractions: 5,
      },
    ];
    const scores = computeAllCroScores(metrics);
    expect(scores[0].url).toBe('/high');
    expect(scores[0].globalScore).toBeGreaterThan(scores[1].globalScore);
  });

  it('computeAllCroScores returns [] for empty input', async () => {
    const { computeAllCroScores } = await import('../utils/croScore');
    expect(computeAllCroScores([])).toEqual([]);
  });
});

// ── croAnalyzer recommendations ───────────────────────────────────────────────

describe('croAnalyzer — recommendation generation', () => {
  it('returns [] for empty metrics', async () => {
    const { analyzeCro } = await import('../utils/croAnalyzer');
    expect(analyzeCro([])).toEqual([]);
  });

  it('emits BOOST_CTA when pageViews high and ctaClicks low', async () => {
    const { analyzeCro } = await import('../utils/croAnalyzer');
    const metrics = [
      {
        url: '/produit/test',
        pageViews: 50,
        avgScrollDepth: 60,
        avgTimeOnPage: 90,
        ctaClicks: 0,
        retailerClicks: 2,
        compareInteractions: 0,
      },
    ];
    const recs = analyzeCro(metrics);
    expect(recs.some((r) => r.type === 'BOOST_CTA')).toBe(true);
  });

  it('emits BOOST_PRICE_SIGNAL when retailerClicks very low', async () => {
    const { analyzeCro } = await import('../utils/croAnalyzer');
    const metrics = [
      {
        url: '/produit/test2',
        pageViews: 30,
        avgScrollDepth: 50,
        avgTimeOnPage: 60,
        ctaClicks: 3,
        retailerClicks: 0,
        compareInteractions: 0,
      },
    ];
    const recs = analyzeCro(metrics);
    expect(recs.some((r) => r.type === 'BOOST_PRICE_SIGNAL')).toBe(true);
  });

  it('emits SIMPLIFY_HERO when SEO impressions high but scroll low', async () => {
    const { analyzeCro } = await import('../utils/croAnalyzer');
    const metrics = [
      {
        url: '/produit/hero',
        pageViews: 20,
        avgScrollDepth: 20,
        avgTimeOnPage: 30,
        ctaClicks: 5,
        retailerClicks: 2,
        compareInteractions: 0,
      },
    ];
    const seo = [{ url: '/produit/hero', impressions: 500, clicks: 50, ctr: 0.1 }];
    const recs = analyzeCro(metrics, seo);
    expect(recs.some((r) => r.type === 'SIMPLIFY_HERO')).toBe(true);
  });

  it('emits REORDER_BLOCKS when compare interactions high but retailer clicks low', async () => {
    const { analyzeCro } = await import('../utils/croAnalyzer');
    const metrics = [
      {
        url: '/comparer/test',
        pageViews: 20,
        avgScrollDepth: 60,
        avgTimeOnPage: 90,
        ctaClicks: 2,
        retailerClicks: 0,
        compareInteractions: 10,
      },
    ];
    const recs = analyzeCro(metrics);
    expect(recs.some((r) => r.type === 'REORDER_BLOCKS')).toBe(true);
  });

  it('emits DEPRIORITIZE_PAGE for very weak pages', async () => {
    const { analyzeCro } = await import('../utils/croAnalyzer');
    const metrics = [
      {
        url: '/dead-page',
        pageViews: 1,
        avgScrollDepth: 5,
        avgTimeOnPage: 5,
        ctaClicks: 0,
        retailerClicks: 0,
        compareInteractions: 0,
      },
    ];
    const recs = analyzeCro(metrics);
    expect(recs.some((r) => r.type === 'DEPRIORITIZE_PAGE')).toBe(true);
  });

  it('sorted by priority: high before medium before low', async () => {
    const { analyzeCro } = await import('../utils/croAnalyzer');
    const metrics = [
      {
        url: '/a',
        pageViews: 50,
        avgScrollDepth: 60,
        avgTimeOnPage: 90,
        ctaClicks: 0,
        retailerClicks: 0,
        compareInteractions: 0,
      },
      {
        url: '/b',
        pageViews: 1,
        avgScrollDepth: 5,
        avgTimeOnPage: 5,
        ctaClicks: 0,
        retailerClicks: 0,
        compareInteractions: 0,
      },
    ];
    const recs = analyzeCro(metrics);
    const ORDER = { high: 0, medium: 1, low: 2 };
    for (let i = 1; i < recs.length; i++) {
      expect(ORDER[recs[i].priority]).toBeGreaterThanOrEqual(ORDER[recs[i - 1].priority]);
    }
  });

  it('no crash with null-like optional arguments', async () => {
    const { analyzeCro } = await import('../utils/croAnalyzer');
    const metrics = [
      {
        url: '/safe',
        pageViews: 5,
        avgScrollDepth: 30,
        avgTimeOnPage: 30,
        ctaClicks: 1,
        retailerClicks: 1,
        compareInteractions: 0,
      },
    ];
    expect(() => analyzeCro(metrics, undefined, undefined)).not.toThrow();
  });
});
