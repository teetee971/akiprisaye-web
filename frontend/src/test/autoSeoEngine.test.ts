import { describe, it, expect } from 'vitest';
import {
  SAMPLE_SIGNALS,
  computePageScore,
  generateRecommendations,
  getSummaryStats,
  type AutoSeoSignal,
  type AutoSeoRecommendation,
} from '../utils/autoSeoEngine';

describe('autoSeoEngine', () => {
  describe('computePageScore', () => {
    it('computes non-negative scores for a valid signal', () => {
      const signal: AutoSeoSignal = SAMPLE_SIGNALS[0];
      const score = computePageScore(signal);
      expect(score.seoScore).toBeGreaterThanOrEqual(0);
      expect(score.uxScore).toBeGreaterThanOrEqual(0);
      expect(score.revenueScore).toBeGreaterThanOrEqual(0);
      expect(score.authorityScore).toBeGreaterThanOrEqual(0);
      expect(score.globalScore).toBeGreaterThanOrEqual(0);
    });

    it('caps scores at 100', () => {
      const signal: AutoSeoSignal = {
        url: '/gp/test',
        pageType: 'pillar',
        impressions: 10000,
        clicks: 500,
        ctr: 0.9,
        pageViews: 5000,
        affiliateClicks: 1000,
        estimatedRevenue: 500,
        backlinks: 100,
        authorityScore: 100,
        performanceScore: 100,
      };
      const score = computePageScore(signal);
      expect(score.seoScore).toBeLessThanOrEqual(100);
      expect(score.uxScore).toBeLessThanOrEqual(100);
      expect(score.revenueScore).toBeLessThanOrEqual(100);
      expect(score.globalScore).toBeLessThanOrEqual(100);
    });

    it('returns zero-ish globalScore for zero-signal page', () => {
      const signal: AutoSeoSignal = {
        url: '/yt/test/zero',
        pageType: 'product',
        impressions: 0,
        clicks: 0,
        ctr: 0,
        pageViews: 0,
        affiliateClicks: 0,
        estimatedRevenue: 0,
        backlinks: 0,
        authorityScore: 0,
        performanceScore: 0,
      };
      const score = computePageScore(signal);
      expect(score.globalScore).toBe(0);
    });

    it('is deterministic — same signal produces same score', () => {
      const signal = SAMPLE_SIGNALS[2];
      const a = computePageScore(signal);
      const b = computePageScore(signal);
      expect(a).toEqual(b);
    });

    it('returns the signal url in the score', () => {
      const signal = SAMPLE_SIGNALS[1];
      const score = computePageScore(signal);
      expect(score.url).toBe(signal.url);
    });

    it('globalScore = seoScore*0.3 + uxScore*0.2 + revenueScore*0.3 + authorityScore*0.2', () => {
      const signal = SAMPLE_SIGNALS[0];
      const score = computePageScore(signal);
      const expected =
        score.seoScore * 0.3 +
        score.uxScore * 0.2 +
        score.revenueScore * 0.3 +
        score.authorityScore * 0.2;
      expect(score.globalScore).toBeCloseTo(expected, 5);
    });
  });

  describe('generateRecommendations', () => {
    it('returns an array for SAMPLE_SIGNALS', () => {
      const recs = generateRecommendations(SAMPLE_SIGNALS);
      expect(Array.isArray(recs)).toBe(true);
      expect(recs.length).toBeGreaterThan(0);
    });

    it('every recommendation has a non-empty reason', () => {
      const recs = generateRecommendations(SAMPLE_SIGNALS);
      for (const rec of recs) {
        expect(rec.reason).toBeTruthy();
        expect(rec.reason.trim().length).toBeGreaterThan(0);
      }
    });

    it('every recommendation has valid priority', () => {
      const recs = generateRecommendations(SAMPLE_SIGNALS);
      const valid = new Set(['high', 'medium', 'low']);
      for (const rec of recs) {
        expect(valid.has(rec.priority)).toBe(true);
      }
    });

    it('every recommendation has a url', () => {
      const recs = generateRecommendations(SAMPLE_SIGNALS);
      for (const rec of recs) {
        expect(rec.url).toBeTruthy();
      }
    });

    it('high-priority actions never exceed MAX_HIGH_PRIORITY (20)', () => {
      const bigSignalSet: AutoSeoSignal[] = Array.from({ length: 50 }, (_, i) => ({
        url: `/gp/produit/item-${i}`,
        pageType: 'product' as const,
        impressions: 200,
        clicks: 1,
        ctr: 0.005,
        pageViews: 50,
        affiliateClicks: 0,
        estimatedRevenue: 0,
        backlinks: 1,
        authorityScore: 20,
        performanceScore: 60,
      }));
      const recs = generateRecommendations(bigSignalSet);
      const highCount = recs.filter((r) => r.priority === 'high').length;
      expect(highCount).toBeLessThanOrEqual(20);
    });

    it('returns empty array for empty signals', () => {
      expect(generateRecommendations([])).toEqual([]);
    });

    it('is deterministic', () => {
      const a = generateRecommendations(SAMPLE_SIGNALS);
      const b = generateRecommendations(SAMPLE_SIGNALS);
      expect(a).toEqual(b);
    });

    it('IMPROVE_TITLE is triggered for high impressions + low CTR', () => {
      const signals: AutoSeoSignal[] = [
        {
          url: '/gp/produit/low-ctr',
          pageType: 'product',
          impressions: 100,
          clicks: 1,
          ctr: 0.01,
          pageViews: 5,
          affiliateClicks: 0,
          estimatedRevenue: 0,
          backlinks: 1,
          authorityScore: 20,
          performanceScore: 60,
        },
      ];
      const recs = generateRecommendations(signals);
      expect(recs.some((r) => r.type === 'IMPROVE_TITLE')).toBe(true);
    });

    it('DEPRIORITIZE triggered for zero-signal page', () => {
      const signals: AutoSeoSignal[] = [
        {
          url: '/yt/produit/dead-page',
          pageType: 'product',
          impressions: 1,
          clicks: 0,
          ctr: 0,
          pageViews: 0,
          affiliateClicks: 0,
          estimatedRevenue: 0,
          backlinks: 0,
          authorityScore: 0,
          performanceScore: 0,
        },
      ];
      const recs = generateRecommendations(signals);
      expect(recs.some((r) => r.type === 'DEPRIORITIZE')).toBe(true);
    });
  });

  describe('getSummaryStats', () => {
    it('returns correct counts', () => {
      const recs: AutoSeoRecommendation[] = [
        { type: 'IMPROVE_TITLE', priority: 'high', url: '/a', reason: 'r' },
        { type: 'DUPLICATE_PAGE', priority: 'high', url: '/b', reason: 'r' },
        { type: 'BOOST_CTA', priority: 'high', url: '/c', reason: 'r' },
        { type: 'DEPRIORITIZE', priority: 'low', url: '/d', reason: 'r' },
        { type: 'BOOST_LINKING', priority: 'medium', url: '/e', reason: 'r' },
      ];
      const stats = getSummaryStats(recs);
      expect(stats.total).toBe(5);
      expect(stats.highPriority).toBe(3);
      expect(stats.toDuplicate).toBe(1);
      expect(stats.toBoostCta).toBe(1);
      expect(stats.toDeprioritize).toBe(1);
    });

    it('returns all zeros for empty array', () => {
      const stats = getSummaryStats([]);
      expect(stats).toEqual({
        total: 0,
        highPriority: 0,
        toDuplicate: 0,
        toBoostCta: 0,
        toDeprioritize: 0,
      });
    });

    it('SAMPLE_SIGNALS produces non-zero summary', () => {
      const recs = generateRecommendations(SAMPLE_SIGNALS);
      const stats = getSummaryStats(recs);
      expect(stats.total).toBeGreaterThan(0);
    });
  });
});
