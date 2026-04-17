import type { PriceHistoryPoint } from './trend';

export type SavingsSimulatorItem = {
  quantity?: number;
  lastPrice?: number;
  trend30?: 'up' | 'down' | 'flat';
  priceHistory?: PriceHistoryPoint[];
};

export type SavingsSimulationResult = {
  potentialSavings: number;
  currency: 'EUR';
  trackedItems: number;
};

function minPriceLast30Days(history: PriceHistoryPoint[]): number | null {
  const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const prices = history
    .filter((point) => {
      const ts = new Date(point.observedAt).getTime();
      return Number.isFinite(ts) && ts >= cutoff && Number.isFinite(point.price) && point.price > 0;
    })
    .map((point) => point.price);

  if (!prices.length) return null;
  return Math.min(...prices);
}

export function simulateMonthlySavings(items: SavingsSimulatorItem[]): SavingsSimulationResult {
  const potentialSavings = items.reduce((sum, item) => {
    if (item.trend30 !== 'down') return sum;
    if (!item.lastPrice || item.lastPrice <= 0) return sum;

    const min30 = minPriceLast30Days(item.priceHistory ?? []);
    if (!min30 || min30 >= item.lastPrice) return sum;

    const quantity = item.quantity && item.quantity > 0 ? item.quantity : 1;
    return sum + (item.lastPrice - min30) * quantity;
  }, 0);

  return {
    potentialSavings: Number(potentialSavings.toFixed(2)),
    currency: 'EUR',
    trackedItems: items.length,
  };
}
