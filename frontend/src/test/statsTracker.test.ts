/**
 * Tests — statsTracker utility
 *
 * Validates trackSEOPageView, getSEOPageStats, getSEOTopPages, clearSEOStats.
 * Uses the same localStorage mock pattern as priceClickTracker.test.ts.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  trackSEOPageView,
  getSEOPageStats,
  getSEOTopPages,
  clearSEOStats,
} from '../utils/statsTracker';

// ── localStorage mock ─────────────────────────────────────────────────────────
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock, writable: true });

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('trackSEOPageView', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  it('stores a new page view entry', () => {
    trackSEOPageView('prix', 'coca-cola-1-5l-guadeloupe', 'GP');
    const stats = getSEOPageStats();
    expect(stats).toHaveLength(1);
    expect(stats[0].slug).toBe('coca-cola-1-5l-guadeloupe');
    expect(stats[0].pageType).toBe('prix');
    expect(stats[0].territory).toBe('GP');
    expect(stats[0].views).toBe(1);
  });

  it('increments views on repeated calls for same slug+pageType+territory', () => {
    trackSEOPageView('prix', 'riz-basmati-1kg-martinique', 'MQ');
    trackSEOPageView('prix', 'riz-basmati-1kg-martinique', 'MQ');
    const stats = getSEOPageStats();
    expect(stats).toHaveLength(1);
    expect(stats[0].views).toBe(2);
  });

  it('keeps separate entries for different territories', () => {
    trackSEOPageView('prix', 'nutella-400g-guadeloupe', 'GP');
    trackSEOPageView('prix', 'nutella-400g-martinique', 'MQ');
    const stats = getSEOPageStats();
    expect(stats).toHaveLength(2);
  });

  it('keeps separate entries for different page types', () => {
    trackSEOPageView('prix', 'coca-cola-1-5l-guadeloupe', 'GP');
    trackSEOPageView('guide-prix', 'coca-cola-1-5l-guadeloupe', 'GP');
    const stats = getSEOPageStats();
    expect(stats).toHaveLength(2);
  });
});

describe('getSEOPageStats', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  it('returns entries sorted by views descending', () => {
    trackSEOPageView('prix', 'page-a', 'GP');
    trackSEOPageView('prix', 'page-b', 'GP');
    trackSEOPageView('prix', 'page-b', 'GP');
    trackSEOPageView('prix', 'page-b', 'GP');
    const stats = getSEOPageStats();
    expect(stats[0].slug).toBe('page-b');
    expect(stats[0].views).toBe(3);
    expect(stats[1].slug).toBe('page-a');
  });

  it('includes a ctr field', () => {
    trackSEOPageView('prix', 'test-slug', 'GP');
    const stats = getSEOPageStats();
    expect(typeof stats[0].ctr).toBe('number');
    expect(stats[0].ctr).toBeGreaterThanOrEqual(0);
    expect(stats[0].ctr).toBeLessThanOrEqual(1);
  });

  it('returns empty array when no data', () => {
    expect(getSEOPageStats()).toEqual([]);
  });
});

describe('getSEOTopPages', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  it('respects the limit parameter', () => {
    for (let i = 0; i < 15; i++) {
      trackSEOPageView('prix', `page-${i}`, 'GP');
    }
    expect(getSEOTopPages(5)).toHaveLength(5);
    expect(getSEOTopPages(10)).toHaveLength(10);
  });

  it('defaults to 10 entries', () => {
    for (let i = 0; i < 20; i++) {
      trackSEOPageView('prix', `page-${i}`, 'GP');
    }
    expect(getSEOTopPages()).toHaveLength(10);
  });
});

describe('clearSEOStats', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  it('removes all SEO stats data', () => {
    trackSEOPageView('prix', 'coca-cola-1-5l-guadeloupe', 'GP');
    trackSEOPageView('guide', 'nutella-guadeloupe', 'GP');
    clearSEOStats();
    expect(getSEOPageStats()).toEqual([]);
    expect(getSEOTopPages()).toEqual([]);
  });
});
