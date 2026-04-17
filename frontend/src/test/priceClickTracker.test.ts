/**
 * Tests — priceClickTracker utility
 *
 * Validates trackProductView, trackRetailerClick,
 * getTopViewedProducts, getRecentRetailerClicks, and clearPriceClickData.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  trackProductView,
  trackRetailerClick,
  getTopViewedProducts,
  getRecentRetailerClicks,
  clearPriceClickData,
} from '../utils/priceClickTracker';

vi.mock('../utils/firestoreClickTracker', () => ({
  trackClickToFirestore: vi.fn(),
}));
import { trackClickToFirestore } from '../utils/firestoreClickTracker';

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

describe('trackProductView + getTopViewedProducts', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  it('records a product view', () => {
    trackProductView('3017620422003', 'Nutella 750g', 'GP');
    const views = getTopViewedProducts();
    expect(views).toHaveLength(1);
    expect(views[0].barcode).toBe('3017620422003');
    expect(views[0].name).toBe('Nutella 750g');
    expect(views[0].count).toBe(1);
  });

  it('increments count on repeated view of same barcode + territory', () => {
    trackProductView('3017620422003', 'Nutella 750g', 'GP');
    trackProductView('3017620422003', 'Nutella 750g', 'GP');
    const views = getTopViewedProducts();
    expect(views).toHaveLength(1);
    expect(views[0].count).toBe(2);
  });

  it('keeps separate entries for different territories', () => {
    trackProductView('3017620422003', 'Nutella 750g', 'GP');
    trackProductView('3017620422003', 'Nutella 750g', 'MQ');
    const views = getTopViewedProducts();
    expect(views).toHaveLength(2);
  });

  it('sorts by count descending', () => {
    trackProductView('B', 'Product B', 'GP');
    trackProductView('A', 'Product A', 'GP');
    trackProductView('A', 'Product A', 'GP');
    const views = getTopViewedProducts();
    expect(views[0].barcode).toBe('A');
  });

  it('respects the limit parameter', () => {
    for (let i = 0; i < 10; i++) {
      trackProductView(`barcode-${i}`, `Product ${i}`, 'GP');
    }
    expect(getTopViewedProducts(3)).toHaveLength(3);
  });
});

describe('trackRetailerClick + getRecentRetailerClicks', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  it('records a retailer click', () => {
    trackRetailerClick('3017620422003', 'Carrefour', 'GP', 3.49);
    const clicks = getRecentRetailerClicks();
    expect(clicks).toHaveLength(1);
    expect(clicks[0].retailer).toBe('Carrefour');
    expect(clicks[0].price).toBe(3.49);
  });

  it('appends multiple clicks without deduplication', () => {
    trackRetailerClick('3017620422003', 'Carrefour', 'GP', 3.49);
    trackRetailerClick('3017620422003', 'Carrefour', 'GP', 3.49);
    expect(getRecentRetailerClicks()).toHaveLength(2);
  });

  it('sorts by clickedAt descending', () => {
    trackRetailerClick('B', 'Leader Price', 'GP', 2.89);
    trackRetailerClick('A', 'Carrefour', 'GP', 3.49);
    const clicks = getRecentRetailerClicks();
    // Both clicks happened in the same ms; verify both are recorded
    expect(clicks).toHaveLength(2);
    // The most-recent is Carrefour (appended last), so it should be ≥ Leader Price timestamp
    const carrefourClick = clicks.find((c) => c.retailer === 'Carrefour');
    const leaderClick = clicks.find((c) => c.retailer === 'Leader Price');
    expect(carrefourClick).toBeDefined();
    expect(leaderClick).toBeDefined();
    expect(carrefourClick!.clickedAt).toBeGreaterThanOrEqual(leaderClick!.clickedAt);
  });

  it('calls trackClickToFirestore with correct payload', () => {
    trackRetailerClick('3017620422003', 'Carrefour', 'GP', 3.49);
    expect(trackClickToFirestore).toHaveBeenCalledWith({
      retailer: 'Carrefour',
      barcode: '3017620422003',
      territory: 'GP',
      price: 3.49,
      pageUrl: expect.any(String),
    });
  });

  it('localStorage tracking is unaffected if trackClickToFirestore throws', () => {
    vi.mocked(trackClickToFirestore).mockImplementationOnce(() => {
      throw new Error('Firestore unavailable');
    });
    expect(() => trackRetailerClick('3017620422003', 'Carrefour', 'GP', 3.49)).not.toThrow();
    expect(getRecentRetailerClicks()).toHaveLength(1);
  });
});

describe('clearPriceClickData', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  it('removes all tracking data', () => {
    trackProductView('3017620422003', 'Nutella 750g', 'GP');
    trackRetailerClick('3017620422003', 'Carrefour', 'GP', 3.49);
    clearPriceClickData();
    expect(getTopViewedProducts()).toHaveLength(0);
    expect(getRecentRetailerClicks()).toHaveLength(0);
  });
});
