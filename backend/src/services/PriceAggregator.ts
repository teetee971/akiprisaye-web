// backend/src/services/PriceAggregator.ts
/**
 * PriceAggregator Service
 * 
 * Aggregates and processes price data from official sources
 * STRICT RULE: Only official public sources (INSEE, OPMR, DGCCRF, data.gouv.fr)
 */

import { PriceRecord, PriceComparison, priceRecordStore } from '../models/PriceRecord';

export class PriceAggregator {
  /**
   * Aggregate prices for comparison
   * Groups prices by store and calculates statistics
   */
  async comparePrices(
    ean: string,
    territory: string,
    userLocation?: { lat: number; lng: number }
  ): Promise<PriceComparison | null> {
    const prices = await priceRecordStore.findByQuery({ ean, territory });

    if (prices.length === 0) {
      return null;
    }

    const product = {
      ean,
      name: prices[0].productName,
    };

    // Group by store
    const pricesByStore = prices.reduce((acc, record) => {
      const key = `${record.storeChain}_${record.storeName}`;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(record);
      return acc;
    }, {} as Record<string, PriceRecord[]>);

    // Get latest price per store
    const storePrices = Object.entries(pricesByStore).map(([key, records]) => {
      const latest = records.sort((a, b) => 
        b.collectedAt.getTime() - a.collectedAt.getTime()
      )[0];

      return {
        store: latest.storeName || 'Unknown',
        chain: latest.storeChain || 'Independent',
        price: latest.price,
        unit: latest.unit,
        lastUpdate: latest.collectedAt,
        source: latest.source,
        distance: undefined, // TODO: Calculate with DistanceCalculator
      };
    });

    // Calculate statistics
    const priceValues = storePrices.map(p => p.price);
    const min = Math.min(...priceValues);
    const max = Math.max(...priceValues);
    const avg = priceValues.reduce((a, b) => a + b, 0) / priceValues.length;
    const sorted = [...priceValues].sort((a, b) => a - b);
    const median = sorted.length % 2 === 0
      ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
      : sorted[Math.floor(sorted.length / 2)];

    // Find best deal
    const bestStorePrice = storePrices.find(p => p.price === min)!;
    const savings = avg - min;
    const savingsPercent = (savings / avg) * 100;

    return {
      product,
      territory,
      prices: storePrices,
      statistics: {
        min,
        max,
        avg: parseFloat(avg.toFixed(2)),
        median: parseFloat(median.toFixed(2)),
      },
      bestDeal: {
        store: bestStorePrice.store,
        price: bestStorePrice.price,
        savings: parseFloat(savings.toFixed(2)),
        savingsPercent: parseFloat(savingsPercent.toFixed(1)),
      },
    };
  }

  /**
   * Get price history for trend analysis
   */
  async getPriceHistory(
    ean: string,
    territory: string,
    months: number = 12
  ): Promise<Array<{ date: Date; price: number; source: string }>> {
    const prices = await priceRecordStore.findByQuery({ ean, territory });

    const cutoffDate = new Date();
    cutoffDate.setMonth(cutoffDate.getMonth() - months);

    return prices
      .filter(p => p.collectedAt >= cutoffDate)
      .map(p => ({
        date: p.collectedAt,
        price: p.price,
        source: p.source,
      }))
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  /**
   * Detect price changes and trends
   */
  async detectTrends(
    ean: string,
    territory: string
  ): Promise<{
    trend: 'rising' | 'falling' | 'stable';
    changePercent: number;
    lastMonth: number;
    currentMonth: number;
  } | null> {
    const history = await this.getPriceHistory(ean, territory, 2);

    if (history.length < 2) {
      return null;
    }

    const now = new Date();
    const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const currentMonthDate = new Date(now.getFullYear(), now.getMonth(), 1);

    const lastMonthPrices = history.filter(h => 
      h.date >= lastMonthDate && h.date < currentMonthDate
    );
    const currentMonthPrices = history.filter(h => 
      h.date >= currentMonthDate
    );

    if (lastMonthPrices.length === 0 || currentMonthPrices.length === 0) {
      return null;
    }

    const lastMonthAvg = lastMonthPrices.reduce((sum, p) => sum + p.price, 0) / lastMonthPrices.length;
    const currentMonthAvg = currentMonthPrices.reduce((sum, p) => sum + p.price, 0) / currentMonthPrices.length;
    const changePercent = ((currentMonthAvg - lastMonthAvg) / lastMonthAvg) * 100;

    let trend: 'rising' | 'falling' | 'stable';
    if (Math.abs(changePercent) < 2) {
      trend = 'stable';
    } else if (changePercent > 0) {
      trend = 'rising';
    } else {
      trend = 'falling';
    }

    return {
      trend,
      changePercent: parseFloat(changePercent.toFixed(2)),
      lastMonth: parseFloat(lastMonthAvg.toFixed(2)),
      currentMonth: parseFloat(currentMonthAvg.toFixed(2)),
    };
  }

  /**
   * Calculate multi-store shopping optimization
   * Finds the best combination of stores to minimize total cost
   */
  async optimizeMultiStore(
    shoppingList: Array<{ ean: string; quantity: number }>,
    territory: string
  ): Promise<{
    totalCost: number;
    stores: Array<{
      store: string;
      items: Array<{ ean: string; name: string; price: number; quantity: number }>;
      subtotal: number;
    }>;
    savings: number;
    savingsPercent: number;
  } | null> {
    // Simple greedy algorithm: For each product, find cheapest store
    const storeItems: Record<string, Array<any>> = {};
    let totalCost = 0;
    let totalIfAverage = 0;

    for (const item of shoppingList) {
      const comparison = await this.comparePrices(item.ean, territory);
      if (!comparison) continue;

      const cheapest = comparison.prices.find(p => p.price === comparison.statistics.min)!;
      const storeName = cheapest.store;

      if (!storeItems[storeName]) {
        storeItems[storeName] = [];
      }

      storeItems[storeName].push({
        ean: item.ean,
        name: comparison.product.name,
        price: cheapest.price,
        quantity: item.quantity,
      });

      totalCost += cheapest.price * item.quantity;
      totalIfAverage += comparison.statistics.avg * item.quantity;
    }

    const stores = Object.entries(storeItems).map(([store, items]) => ({
      store,
      items,
      subtotal: items.reduce((sum, i) => sum + i.price * i.quantity, 0),
    }));

    const savings = totalIfAverage - totalCost;
    const savingsPercent = (savings / totalIfAverage) * 100;

    return {
      totalCost: parseFloat(totalCost.toFixed(2)),
      stores,
      savings: parseFloat(savings.toFixed(2)),
      savingsPercent: parseFloat(savingsPercent.toFixed(1)),
    };
  }
}

export const priceAggregator = new PriceAggregator();
export default PriceAggregator;
