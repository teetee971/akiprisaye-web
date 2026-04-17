import type { PriceObservation, Recommendation, ShoppingListItem } from '../shoppingList/types';

export interface DecisionSettings {
  dropPercentBuyNow: number;
  highVsMedianWaitPercent: number;
}

const DEFAULT_SETTINGS: DecisionSettings = {
  dropPercentBuyNow: 10,
  highVsMedianWaitPercent: 8,
};

function median(values: number[]) {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) return ((sorted[mid - 1] ?? 0) + (sorted[mid] ?? 0)) / 2;
  return sorted[mid] ?? 0;
}

export function decideForItem(
  item: Pick<ShoppingListItem, 'id'>,
  priceHistory: PriceObservation[],
  settings: Partial<DecisionSettings> = {}
): Recommendation {
  const cfg = { ...DEFAULT_SETTINGS, ...settings };
  const prices = priceHistory.map((p) => p.price).filter((p) => Number.isFinite(p));

  if (prices.length < 3) {
    return {
      itemId: item.id,
      verdict: 'WATCH',
      confidence: 0.4,
      reason: 'Historique insuffisant, continuez la surveillance.',
      nextCheckAt: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
    };
  }

  const last = prices[prices.length - 1] ?? prices[0] ?? 0;
  const prev = prices[prices.length - 2] ?? last;
  const med = median(prices);
  const drop = prev > 0 ? ((prev - last) / prev) * 100 : 0;
  const overMedian = med > 0 ? ((last - med) / med) * 100 : 0;

  if (drop >= cfg.dropPercentBuyNow) {
    return {
      itemId: item.id,
      verdict: 'BUY_NOW',
      confidence: 0.82,
      reason: `Baisse récente significative (${drop.toFixed(1)}%).`,
      nextCheckAt: new Date(Date.now() + 6 * 3600 * 1000).toISOString(),
    };
  }

  if (overMedian >= cfg.highVsMedianWaitPercent) {
    return {
      itemId: item.id,
      verdict: 'WAIT',
      confidence: 0.73,
      reason: `Prix au-dessus de la médiane (${overMedian.toFixed(1)}%).`,
      nextCheckAt: new Date(Date.now() + 12 * 3600 * 1000).toISOString(),
    };
  }

  return {
    itemId: item.id,
    verdict: 'WATCH',
    confidence: 0.66,
    reason: 'Prix stable, surveillez encore avant achat.',
    nextCheckAt: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
  };
}
