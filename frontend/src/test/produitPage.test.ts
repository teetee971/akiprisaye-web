/**
 * Tests — ProduitPage (/produit/:ean)
 * Valide : rendu, GPS tri, favoris, signalement, historique
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { historyService } from '../services/historyService';

/* ------------------------------------------------------------------ */
/* historyService — agrégation multi-enseignes                         */
/* ------------------------------------------------------------------ */

describe('historyService', () => {
  const EAN = '3017620422003';

  it('returns data points for multiple stores', async () => {
    const series = await historyService.getPriceHistory(EAN, '7d');
    const storeIds = new Set(series.dataPoints.map((p) => p.storeId));
    expect(storeIds.size).toBeGreaterThan(1);
  });

  it('returns 7 days × nb_stores points for 7d timeframe', async () => {
    const series = await historyService.getPriceHistory(EAN, '7d');
    const storeCount = new Set(series.dataPoints.map((p) => p.storeId)).size;
    expect(series.dataPoints.length).toBe(7 * storeCount);
  });

  it('returns 30 days × nb_stores points for 30d timeframe', async () => {
    const series = await historyService.getPriceHistory(EAN, '30d');
    const storeCount = new Set(series.dataPoints.map((p) => p.storeId)).size;
    expect(series.dataPoints.length).toBe(30 * storeCount);
  });

  it('generates deterministic prices for same EAN', async () => {
    const s1 = await historyService.getPriceHistory(EAN, '7d');
    const s2 = await historyService.getPriceHistory(EAN, '7d');
    const prices1 = s1.dataPoints.map((p) => p.price);
    const prices2 = s2.dataPoints.map((p) => p.price);
    expect(prices1).toEqual(prices2);
  });

  it('generates different prices for different EANs', async () => {
    const s1 = await historyService.getPriceHistory('3017620422003', '7d');
    const s2 = await historyService.getPriceHistory('5449000000996', '7d');
    const firstPrices1 = s1.dataPoints[0].price;
    const firstPrices2 = s2.dataPoints[0].price;
    expect(firstPrices1).not.toBe(firstPrices2);
  });

  it('calculates statistics correctly', async () => {
    const series = await historyService.getPriceHistory(EAN, '30d');
    const { statistics } = series;
    expect(statistics.min).toBeGreaterThan(0);
    expect(statistics.max).toBeGreaterThanOrEqual(statistics.min);
    expect(statistics.average).toBeGreaterThan(0);
    expect(['increasing', 'decreasing', 'stable']).toContain(statistics.trend);
  });

  it('returns valid ISO date strings for data points', async () => {
    const series = await historyService.getPriceHistory(EAN, '7d');
    for (const point of series.dataPoints) {
      expect(point.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it('exports history as CSV blob', async () => {
    const series = await historyService.getPriceHistory(EAN, '7d');
    const blob = await historyService.exportHistoryData(series, 'csv');
    expect(blob.type).toBe('text/csv');
    expect(blob.size).toBeGreaterThan(0);
  });

  it('exports history as JSON blob', async () => {
    const series = await historyService.getPriceHistory(EAN, '7d');
    const blob = await historyService.exportHistoryData(series, 'json');
    expect(blob.type).toBe('application/json');
  });
});

/* ------------------------------------------------------------------ */
/* GPS — calculateDistancesBatch (via geoLocation util)               */
/* ------------------------------------------------------------------ */

import {
  calculateDistancesBatch,
  formatDistance,
  type GeoPosition,
  type StoreLocation,
} from '../utils/geoLocation';

describe('GPS — store sorting for ProduitPage', () => {
  const userPos: GeoPosition = { lat: 16.2415, lon: -61.5331 };

  const stores: (StoreLocation & { price: number })[] = [
    { id: 'store-far', lat: 16.271, lon: -61.588, price: 3.5 }, // ~6 km
    { id: 'store-near', lat: 16.2425, lon: -61.534, price: 4.0 }, // ~0.2 km
    { id: 'store-mid', lat: 16.255, lon: -61.56, price: 3.2 }, // ~3 km
  ];

  it('attaches a numeric distance to each store', () => {
    const results = calculateDistancesBatch(userPos, stores);
    for (const r of results) {
      expect(typeof r.distance).toBe('number');
      expect(r.distance).toBeGreaterThanOrEqual(0);
    }
  });

  it('nearest store has smallest distance', () => {
    const results = calculateDistancesBatch(userPos, stores);
    const sorted = [...results].sort((a, b) => a.distance - b.distance);
    expect(sorted[0].id).toBe('store-near');
  });

  it('formatDistance shows meters for < 1 km', () => {
    const text = formatDistance(0.2);
    expect(text).toContain('m');
    expect(text).not.toContain('km');
  });

  it('formatDistance shows km for >= 1 km', () => {
    const text = formatDistance(3.5);
    expect(text).toContain('km');
  });
});

/* ------------------------------------------------------------------ */
/* useFavorites — toggle product favorite                              */
/* ------------------------------------------------------------------ */

import { renderHook, act } from '@testing-library/react';
import { useFavorites } from '../hooks/useFavorites';

// Mock localStorage for favorites
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

describe('useFavorites — ProduitPage integration', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  it('starts with product not in favorites', () => {
    const { result } = renderHook(() => useFavorites());
    expect(result.current.isFavorite('product-3017620422003')).toBe(false);
  });

  it('adds product to favorites', () => {
    const { result } = renderHook(() => useFavorites());
    act(() => {
      result.current.toggleFavorite({
        id: 'product-3017620422003',
        label: 'Produit Test',
        type: 'product',
        barcode: '3017620422003',
        route: '/produit/3017620422003',
      });
    });
    expect(result.current.isFavorite('product-3017620422003')).toBe(true);
  });

  it('removes product from favorites on second toggle', () => {
    const { result } = renderHook(() => useFavorites());
    act(() => {
      result.current.toggleFavorite({
        id: 'product-3017620422003',
        label: 'Produit Test',
        type: 'product',
        barcode: '3017620422003',
        route: '/produit/3017620422003',
      });
    });
    act(() => {
      result.current.toggleFavorite({
        id: 'product-3017620422003',
        label: 'Produit Test',
        type: 'product',
        barcode: '3017620422003',
        route: '/produit/3017620422003',
      });
    });
    expect(result.current.isFavorite('product-3017620422003')).toBe(false);
  });
});
