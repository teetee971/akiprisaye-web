/**
 * analyticsEngine.test.ts
 *
 * Tests for the unified analytics aggregator.
 * Mocks all localStorage-backed tracker imports to keep tests pure.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getAnalyticsSnapshot, formatCtr, ctrStatus } from '../utils/analyticsEngine';
import * as conversionTracker from '../utils/conversionTracker';

// ── Mock dependencies (localStorage trackers) ─────────────────────────────────

vi.mock('../utils/conversionTracker', () => ({
  getCROStats: vi.fn(() => ({
    totalClicks: 40,
    conversionRate: 0.08,
    topPages: [
      { url: '/landing', clicks: 20 },
      { url: '/comparateur', clicks: 20 },
    ],
    topRetailers: [
      { retailer: 'Carrefour', clicks: 15 },
      { retailer: 'alerte-whatsapp', clicks: 5 },
    ],
    byVariant: { A: 20, B: 12, C: 8 },
  })),
  trackConversionEvent: vi.fn(),
  trackPageView: vi.fn(),
  getVariantForPage: vi.fn(() => 'A'),
}));

vi.mock('../utils/priceClickTracker', () => ({
  getConversionStats: vi.fn(() => ({
    totalViews: 600,
    totalClicks: 42,
    estimatedRevenue: 12.6,
    ctr: 0.07,
    topRetailers: [
      { retailer: 'Carrefour', clicks: 30 },
      { retailer: 'E.Leclerc', clicks: 12 },
    ],
    topProducts: [{ barcode: '5000112637922', name: 'Coca-Cola', views: 200, ctr: 0.1 }],
  })),
  trackRetailerClick: vi.fn(),
}));

vi.mock('../utils/statsTracker', () => ({
  getSEOPageStats: vi.fn(() => [
    {
      slug: 'coca-cola',
      pageType: 'product',
      territory: 'GP',
      views: 300,
      lastViewedAt: Date.now(),
      ctr: 0,
    },
    {
      slug: 'lait',
      pageType: 'product',
      territory: 'MQ',
      views: 150,
      lastViewedAt: Date.now(),
      ctr: 0,
    },
  ]),
}));

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('analyticsEngine — getAnalyticsSnapshot', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns a snapshot with all required keys', () => {
    const snap = getAnalyticsSnapshot();
    expect(snap).toHaveProperty('visits');
    expect(snap).toHaveProperty('clicks');
    expect(snap).toHaveProperty('conversions');
    expect(snap).toHaveProperty('revenue');
    expect(snap).toHaveProperty('ctr');
    expect(snap).toHaveProperty('dailyRevenue');
    expect(snap).toHaveProperty('topPages');
    expect(snap).toHaveProperty('topRetailers');
    expect(snap).toHaveProperty('topProducts');
    expect(snap).toHaveProperty('subscriptionClicks');
    expect(snap).toHaveProperty('variantBreakdown');
    expect(snap).toHaveProperty('generatedAt');
  });

  it('visits equals the highest estimate from any tracker', () => {
    const snap = getAnalyticsSnapshot();
    // priceClickTracker returns 600 views; statsTracker returns 450 total views
    // conversionTracker estimate: 40/0.08 = 500
    expect(snap.visits).toBe(600);
  });

  it('total clicks = CRO clicks + price click conversions', () => {
    const snap = getAnalyticsSnapshot();
    expect(snap.clicks).toBe(40 + 42); // 82
  });

  it('revenue is non-negative', () => {
    const snap = getAnalyticsSnapshot();
    expect(snap.revenue).toBeGreaterThanOrEqual(0);
  });

  it('daily revenue is revenue / 30', () => {
    const snap = getAnalyticsSnapshot();
    expect(snap.dailyRevenue).toBeCloseTo(12.6 / 30, 2);
  });

  it('ctr = clicks / visits', () => {
    const snap = getAnalyticsSnapshot();
    expect(snap.ctr).toBeCloseTo(82 / 600, 4);
  });

  it('subscription clicks only counts alerte-* retailers', () => {
    const snap = getAnalyticsSnapshot();
    expect(snap.subscriptionClicks).toBe(5);
  });

  it('variant breakdown is passed through', () => {
    const snap = getAnalyticsSnapshot();
    expect(snap.variantBreakdown).toEqual({ A: 20, B: 12, C: 8 });
  });

  it('top products are populated', () => {
    const snap = getAnalyticsSnapshot();
    expect(snap.topProducts.length).toBeGreaterThan(0);
    expect(snap.topProducts[0]).toHaveProperty('barcode');
    expect(snap.topProducts[0]).toHaveProperty('ctr');
  });

  it('is deterministic — same mocks produce same result', () => {
    const a = getAnalyticsSnapshot();
    const b = getAnalyticsSnapshot();
    expect(a.visits).toBe(b.visits);
    expect(a.clicks).toBe(b.clicks);
    expect(a.ctr).toBe(b.ctr);
  });

  it('handles tracker errors gracefully (no throw)', () => {
    vi.mocked(conversionTracker.getCROStats).mockImplementationOnce(() => {
      throw new Error('localStorage unavailable');
    });
    expect(() => getAnalyticsSnapshot()).not.toThrow();
  });
});

describe('analyticsEngine — formatCtr', () => {
  it('formats 0.1234 as "12.3%"', () => {
    expect(formatCtr(0.1234)).toBe('12.3%');
  });
  it('formats 0 as "0.0%"', () => {
    expect(formatCtr(0)).toBe('0.0%');
  });
  it('formats 1 as "100.0%"', () => {
    expect(formatCtr(1)).toBe('100.0%');
  });
});

describe('analyticsEngine — ctrStatus', () => {
  it('returns green for CTR >= 10%', () => {
    expect(ctrStatus(0.1)).toBe('green');
    expect(ctrStatus(0.25)).toBe('green');
  });
  it('returns amber for 5% <= CTR < 10%', () => {
    expect(ctrStatus(0.05)).toBe('amber');
    expect(ctrStatus(0.09)).toBe('amber');
  });
  it('returns red for CTR < 5%', () => {
    expect(ctrStatus(0.04)).toBe('red');
    expect(ctrStatus(0)).toBe('red');
  });
});
