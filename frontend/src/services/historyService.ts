/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * Price History Service
 * Manages historical price data and calculations
 */

import type { 
  PriceHistoryPoint, 
  PriceTimeSeries, 
  Timeframe, 
  SeasonalPattern,
  PriceStatistics 
} from '../types/priceHistory';

export class HistoryService {
  /**
   * Get price history for a product
   */
  async getPriceHistory(ean: string, timeframe: Timeframe): Promise<PriceTimeSeries> {
    // TODO: Fetch from Firestore or API
    // Mock implementation
    const mockData: PriceHistoryPoint[] = this.generateMockHistory(timeframe, ean);
    
    return {
      productEAN: ean,
      productName: 'Produit Example',
      territory: 'GP',
      dataPoints: mockData,
      statistics: this.calculateStatistics(mockData)
    };
  }

  /**
   * Get price history for multiple stores
   */
  async getMultiStoreHistory(
    ean: string, 
    storeIds: string[]
  ): Promise<Map<string, PriceHistoryPoint[]>> {
    const result = new Map<string, PriceHistoryPoint[]>();
    
    for (const storeId of storeIds) {
      // TODO: Fetch actual data
      const mockData = this.generateMockHistory('30d');
      result.set(storeId, mockData);
    }
    
    return result;
  }

  /**
   * Detect seasonal patterns in price data
   */
  detectSeasonalPatterns(history: PriceTimeSeries): SeasonalPattern[] {
    // TODO: Implement seasonal pattern detection algorithm
    return [];
  }

  /**
   * Calculate price statistics
   */
  calculateStatistics(dataPoints: PriceHistoryPoint[]): PriceStatistics {
    if (dataPoints.length === 0) {
      return {
        min: 0,
        max: 0,
        average: 0,
        median: 0,
        trend: 'stable',
        volatility: 0
      };
    }

    const prices = dataPoints.map(p => p.price);
    const sorted = [...prices].sort((a, b) => a - b);
    
    const min = sorted[0];
    const max = sorted[sorted.length - 1];
    const average = prices.reduce((sum, p) => sum + p, 0) / prices.length;
    const median = sorted[Math.floor(sorted.length / 2)];
    
    // Calculate volatility (standard deviation)
    const variance = prices.reduce((sum, p) => sum + Math.pow(p - average, 2), 0) / prices.length;
    const volatility = Math.sqrt(variance);
    
    // Determine trend
    const firstHalf = prices.slice(0, Math.floor(prices.length / 2));
    const secondHalf = prices.slice(Math.floor(prices.length / 2));
    const avgFirst = firstHalf.reduce((sum, p) => sum + p, 0) / firstHalf.length;
    const avgSecond = secondHalf.reduce((sum, p) => sum + p, 0) / secondHalf.length;
    
    let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
    const changePct = ((avgSecond - avgFirst) / avgFirst) * 100;
    if (changePct > 5) trend = 'increasing';
    else if (changePct < -5) trend = 'decreasing';
    
    return { min, max, average, median, trend, volatility };
  }

  /**
   * Export history data
   */
  async exportHistoryData(
    history: PriceTimeSeries, 
    format: 'csv' | 'json'
  ): Promise<Blob> {
    if (format === 'json') {
      const json = JSON.stringify(history, null, 2);
      return new Blob([json], { type: 'application/json' });
    }
    
    // CSV format
    const header = 'Date,Price,Store,Reliability,Source\n';
    const rows = history.dataPoints.map(p => 
      `${p.date},${p.price},${p.storeName},${p.reliability},${p.source}`
    ).join('\n');
    
    return new Blob([header + rows], { type: 'text/csv' });
  }

  /**
   * Generate mock history data for testing
   * Uses EAN-based seed so each product has consistent (deterministic) prices.
   * Generates data for multiple stores to enable multi-store charts.
   */
  private generateMockHistory(timeframe: Timeframe, ean?: string): PriceHistoryPoint[] {
    const days = timeframe === '7d' ? 7 : timeframe === '30d' ? 30 :
                  timeframe === '90d' ? 90 : 365;

    // Deterministic base price derived from EAN
    const seed = ean
      ? ean.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
      : 0;
    const basePrice = 1.5 + (seed % 300) / 100;

    const stores = [
      { id: 'carrefour-jarry', name: 'Carrefour Jarry', offset: 0.05 },
      { id: 'leader-price-gp', name: 'Leader Price', offset: -0.05 },
    ];

    const data: PriceHistoryPoint[] = [];

    for (const store of stores) {
      // Use a reproducible pseudo-random sequence per store
      let rand = seed ^ store.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
      for (let i = 0; i < days; i++) {
        const date = new Date();
        date.setDate(date.getDate() - (days - i));

        // Lightweight LCG pseudo-random
        rand = (rand * 1664525 + 1013904223) & 0xffffffff;
        const delta = ((rand >>> 0) / 0xffffffff - 0.5) * 0.4;

        data.push({
          date: date.toISOString().split('T')[0],
          price: Math.max(0.5, parseFloat((basePrice + store.offset + delta).toFixed(2))),
          storeId: store.id,
          storeName: store.name,
          reliability: 0.9,
          source: 'user',
        });
      }
    }

    return data;
  }
}

export const historyService = new HistoryService();
