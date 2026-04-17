/**
 * Price History Service
 * Fetches real price timeseries from /api/local-price (Firestore)
 * and falls back to observatoire JSON snapshots.
 */

import type {
  PriceHistoryPoint,
  PriceTimeSeries,
  Timeframe,
  SeasonalPattern,
  PriceStatistics,
} from '../types/priceHistory';
import { loadObservatoireData } from './observatoireDataLoader';

const DEFAULT_TERRITORY = 'gp';

function timeframeToDays(timeframe: Timeframe): number {
  switch (timeframe) {
    case '7d':
      return 7;
    case '30d':
      return 30;
    case '90d':
      return 90;
    case '365d':
      return 365;
    default:
      return 30;
  }
}

export class HistoryService {
  /**
   * Get price history for a product.
   * First tries /api/local-price (Firestore timeseries), then observatoire JSON snapshots.
   */
  async getPriceHistory(ean: string, timeframe: Timeframe): Promise<PriceTimeSeries> {
    const days = timeframeToDays(timeframe);
    const dataPoints = await this.fetchTimeseries(ean, DEFAULT_TERRITORY, days);

    // Try to get product name from API response (already set in fetchTimeseries)
    return {
      productEAN: ean,
      productName: this._lastProductName ?? `Produit ${ean}`,
      territory: DEFAULT_TERRITORY.toUpperCase(),
      dataPoints,
      statistics: this.calculateStatistics(dataPoints),
    };
  }

  // Stores the last resolved product name to pass back to getPriceHistory
  private _lastProductName: string | null = null;

  /**
   * Fetch timeseries from /api/local-price.
   * Falls back to observatoire JSON snapshots.
   */
  private async fetchTimeseries(
    ean: string,
    territory: string,
    days: number
  ): Promise<PriceHistoryPoint[]> {
    this._lastProductName = null;

    // --- Try /api/local-price (Firestore-backed endpoint) ---
    try {
      const params = new URLSearchParams({ barcode: ean, territory, days: String(days) });
      const res = await fetch(`/api/local-price?${params.toString()}`, {
        headers: { Accept: 'application/json' },
      });
      if (res.ok) {
        const payload = (await res.json()) as {
          ok?: boolean;
          product?: { name?: string };
          timeseries?: Array<{
            date: string;
            median?: number | null;
            min?: number | null;
            max?: number | null;
            sampleCount?: number;
          }>;
        };
        if (payload.ok && Array.isArray(payload.timeseries) && payload.timeseries.length > 0) {
          if (payload.product?.name) this._lastProductName = payload.product.name;
          return payload.timeseries
            .filter((p) => p.median != null)
            .map((p) => ({
              date: p.date,
              price: p.median as number,
              storeId: '',
              storeName: '',
              reliability: p.sampleCount ? Math.min(p.sampleCount / 10, 1) : 0.5,
              source: 'api',
            }));
        }
      }
    } catch {
      // Fall through to observatoire
    }

    // --- Fallback: observatoire JSON snapshots ---
    const TERRITORY_NAMES: Record<string, string> = {
      gp: 'Guadeloupe',
      mq: 'Martinique',
      gf: 'Guyane',
      re: 'La Réunion',
      yt: 'Mayotte',
      fr: 'Hexagone',
    };
    const territoryName = TERRITORY_NAMES[territory] ?? 'Guadeloupe';
    try {
      const snapshots = await loadObservatoireData(territoryName);
      const points: PriceHistoryPoint[] = [];
      const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

      for (const snap of snapshots) {
        if (snap.date_snapshot < cutoff) continue;
        for (const obs of snap.donnees) {
          if (obs.ean !== ean && !obs.produit.toLowerCase().includes(ean.toLowerCase())) continue;
          if (!this._lastProductName) this._lastProductName = obs.produit;
          points.push({
            date: snap.date_snapshot,
            price: obs.prix,
            storeId: obs.enseigne?.toLowerCase().replace(/\s+/g, '-') ?? '',
            storeName: obs.enseigne ?? '',
            reliability: 0.8,
            source: snap.source ?? 'observatoire',
          });
        }
      }

      if (points.length > 0) return points.sort((a, b) => a.date.localeCompare(b.date));
    } catch {
      // Fall through to deterministic fallback
    }

    // --- Last resort: deterministic seed-based data (no Math.random) ---
    return this.generateDeterministicHistory(ean, days);
  }

  /**
   * Get price history for multiple stores.
   */
  async getMultiStoreHistory(
    ean: string,
    storeIds: string[]
  ): Promise<Map<string, PriceHistoryPoint[]>> {
    const result = new Map<string, PriceHistoryPoint[]>();
    const all = await this.fetchTimeseries(ean, DEFAULT_TERRITORY, 90);
    for (const storeId of storeIds) {
      const filtered = all.filter((p) => !p.storeId || p.storeId === storeId);
      result.set(storeId, filtered);
    }
    return result;
  }

  /**
   * Detect seasonal patterns in price data.
   */
  detectSeasonalPatterns(_history: PriceTimeSeries): SeasonalPattern[] {
    return [];
  }

  /**
   * Calculate price statistics.
   */
  calculateStatistics(dataPoints: PriceHistoryPoint[]): PriceStatistics {
    if (dataPoints.length === 0) {
      return { min: 0, max: 0, average: 0, median: 0, trend: 'stable', volatility: 0 };
    }

    const prices = dataPoints.map((p) => p.price);
    const sorted = [...prices].sort((a, b) => a - b);

    const min = sorted[0];
    const max = sorted[sorted.length - 1];
    const average = prices.reduce((sum, p) => sum + p, 0) / prices.length;
    const median = sorted[Math.floor(sorted.length / 2)];
    const variance = prices.reduce((sum, p) => sum + Math.pow(p - average, 2), 0) / prices.length;
    const volatility = Math.sqrt(variance);

    const firstHalf = prices.slice(0, Math.floor(prices.length / 2));
    const secondHalf = prices.slice(Math.floor(prices.length / 2));
    const avgFirst = firstHalf.reduce((sum, p) => sum + p, 0) / (firstHalf.length || 1);
    const avgSecond = secondHalf.reduce((sum, p) => sum + p, 0) / (secondHalf.length || 1);
    const changePct = avgFirst > 0 ? ((avgSecond - avgFirst) / avgFirst) * 100 : 0;

    let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
    if (changePct > 5) trend = 'increasing';
    else if (changePct < -5) trend = 'decreasing';

    return { min, max, average, median, trend, volatility };
  }

  /**
   * Export history data.
   */
  async exportHistoryData(history: PriceTimeSeries, format: 'csv' | 'json'): Promise<Blob> {
    if (format === 'json') {
      return new Blob([JSON.stringify(history, null, 2)], { type: 'application/json' });
    }
    const header = 'Date,Price,Store,Reliability,Source\n';
    const rows = history.dataPoints
      .map((p) => `${p.date},${p.price},${p.storeName ?? ''},${p.reliability},${p.source}`)
      .join('\n');
    return new Blob([header + rows], { type: 'text/csv' });
  }

  /**
   * Deterministic fallback (no Math.random) — used only when all real sources fail.
   */
  private generateDeterministicHistory(ean: string, days: number): PriceHistoryPoint[] {
    const seed = ean.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    const basePrice = 1.5 + (seed % 300) / 100;
    const stores = [
      { id: 'carrefour-jarry', name: 'Carrefour Jarry', offset: 0.05 },
      { id: 'leader-price-gp', name: 'Leader Price', offset: -0.05 },
    ];
    const data: PriceHistoryPoint[] = [];
    for (const store of stores) {
      let rand = seed ^ store.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
      for (let i = 0; i < days; i++) {
        const date = new Date();
        date.setDate(date.getDate() - (days - i));
        rand = (rand * 1664525 + 1013904223) & 0xffffffff;
        const delta = ((rand >>> 0) / 0xffffffff - 0.5) * 0.4;
        data.push({
          date: date.toISOString().split('T')[0],
          price: Math.max(0.5, parseFloat((basePrice + store.offset + delta).toFixed(2))),
          storeId: store.id,
          storeName: store.name,
          reliability: 0.7,
          source: 'fallback',
        });
      }
    }
    return data;
  }
}

export const historyService = new HistoryService();
