/**
 * Top Movers Service
 * Tracks products with significant price changes
 */

import { Territory, ProductCategory } from '../../config/inflationConfig.js';
import prisma from '../../database/prisma.js';

/**
 * Price mover data
 */
export interface PriceMover {
  productCode: string;
  productName: string;
  category: ProductCategory;
  currentPrice: number;
  previousPrice: number;
  change: number;
  changePercent: number;
  territory: Territory;
}

/**
 * Top movers result
 */
export interface TopMoversResult {
  territory: Territory;
  year: number;
  month: number;
  topIncreases: PriceMover[];
  topDecreases: PriceMover[];
}

/**
 * Get products with biggest price changes between two consecutive months
 */
export async function getTopMovers(
  territory: Territory,
  year: number,
  month: number,
  limit: number = 10
): Promise<TopMoversResult> {
  // Determine the previous period
  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear = month === 1 ? year - 1 : year;

  // Fetch current-month and previous-month history for this territory
  const [current, previous] = await Promise.all([
    prisma.priceHistoryMonthly.findMany({
      where: { territory: territory.toLowerCase(), year, month },
      include: { product: { select: { displayName: true, category: true, productKey: true } } },
    }),
    prisma.priceHistoryMonthly.findMany({
      where: { territory: territory.toLowerCase(), year: prevYear, month: prevMonth },
      select: { productId: true, avgPrice: true },
    }),
  ]);

  const prevMap = new Map(previous.map((p) => [p.productId, p.avgPrice]));

  const movers: PriceMover[] = [];

  for (const entry of current) {
    const prevPrice = prevMap.get(entry.productId);
    if (prevPrice == null || prevPrice === 0) continue;

    const change = entry.avgPrice - prevPrice;
    const changePercent = (change / prevPrice) * 100;

    movers.push({
      productCode: entry.product.productKey,
      productName: entry.product.displayName,
      category: (entry.product.category as ProductCategory) ?? ('other' as ProductCategory),
      currentPrice: entry.avgPrice,
      previousPrice: prevPrice,
      change,
      changePercent,
      territory,
    });
  }

  movers.sort((a, b) => b.changePercent - a.changePercent);

  return {
    territory,
    year,
    month,
    topIncreases: movers.filter((m) => m.changePercent > 0).slice(0, limit),
    topDecreases: movers
      .filter((m) => m.changePercent < 0)
      .sort((a, b) => a.changePercent - b.changePercent)
      .slice(0, limit),
  };
}

/**
 * Track price movements over time for a product
 */
export async function trackPriceMovements(
  territory: Territory,
  productCode: string,
  months: number = 12
): Promise<Array<{ year: number; month: number; price: number; change: number }>> {
  // Find the product by productKey
  const product = await prisma.product.findFirst({
    where: { productKey: productCode },
    select: { id: true },
  });

  if (!product) {
    return [];
  }

  const records = await prisma.priceHistoryMonthly.findMany({
    where: { productId: product.id, territory: territory.toLowerCase() },
    orderBy: [{ year: 'desc' }, { month: 'desc' }],
    take: months,
    select: { year: true, month: true, avgPrice: true },
  });

  records.reverse(); // chronological order

  return records.map((r, idx) => {
    const prev = records[idx - 1];
    const change = prev ? r.avgPrice - prev.avgPrice : 0;
    return { year: r.year, month: r.month, price: r.avgPrice, change };
  });
}

/**
 * Identify products at risk of sharp increases
 */
export async function identifyAtRiskProducts(
  territory: Territory,
  threshold: number = 5
): Promise<PriceMover[]> {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const result = await getTopMovers(territory, year, month, 50);
  return result.topIncreases.filter((p) => p.changePercent >= threshold);
}

/**
 * Get products with sustained trends over consecutive months
 */
export async function getProductsWithSustainedTrends(
  territory: Territory,
  direction: 'up' | 'down',
  consecutiveMonths: number = 3
): Promise<PriceMover[]> {
  const now = new Date();
  let year = now.getFullYear();
  let month = now.getMonth() + 1;

  // Collect movers for consecutive periods
  const periods: Map<string, number[]> = new Map();

  for (let i = 0; i < consecutiveMonths + 1; i++) {
    const result = await getTopMovers(territory, year, month, 100);
    const movers = direction === 'up' ? result.topIncreases : result.topDecreases;

    for (const m of movers) {
      if (!periods.has(m.productCode)) {
        periods.set(m.productCode, []);
      }
      periods.get(m.productCode)!.push(m.changePercent);
    }

    // Go back one month
    month--;
    if (month === 0) {
      month = 12;
      year--;
    }
  }

  // Find products that appear in all requested consecutive periods
  const sustained: PriceMover[] = [];
  const latest = await getTopMovers(territory, now.getFullYear(), now.getMonth() + 1, 100);
  const latestMap = new Map(
    [...latest.topIncreases, ...latest.topDecreases].map((m) => [m.productCode, m])
  );

  for (const [code, changes] of periods) {
    if (changes.length >= consecutiveMonths) {
      const allInDirection = direction === 'up'
        ? changes.every((c) => c > 0)
        : changes.every((c) => c < 0);

      if (allInDirection) {
        const mover = latestMap.get(code);
        if (mover) sustained.push(mover);
      }
    }
  }

  return sustained;
}
