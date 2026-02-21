import type { PriceObservation as ShoppingPriceObservation } from '../store/useShoppingListStore';

export type PriceTrend = 'up' | 'down' | 'stable' | 'unknown';
export type Recommendation = 'buy_now' | 'wait' | 'monitor';

export interface PriceDecisionResult {
  trend: PriceTrend;
  recommendation: Recommendation;
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function percentile(values: number[], p: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.floor((sorted.length - 1) * p)));
  return sorted[idx] ?? sorted[0] ?? 0;
}

function computeTrend(history: ShoppingPriceObservation[]): PriceTrend {
  if (history.length < 3) return 'unknown';

  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;

  const withTime = history
    .map((entry) => ({ ...entry, ts: new Date(entry.observedAt).getTime() }))
    .filter((entry) => Number.isFinite(entry.ts));

  if (withTime.length < 3) return 'unknown';

  const last7 = withTime.filter((entry) => now - entry.ts <= day * 7).map((entry) => entry.price);
  const last30 = withTime.filter((entry) => now - entry.ts <= day * 30).map((entry) => entry.price);

  if (last7.length < 2 || last30.length < 3) {
    const recent = withTime.slice(-2).map((entry) => entry.price);
    if (recent.length < 2) return 'unknown';
    const diff = (recent[1] ?? 0) - (recent[0] ?? 0);
    if (Math.abs(diff) < 0.01) return 'stable';
    return diff > 0 ? 'up' : 'down';
  }

  const avg7 = average(last7);
  const avg30 = average(last30);
  if (avg30 <= 0) return 'unknown';

  const changePct = ((avg7 - avg30) / avg30) * 100;
  if (Math.abs(changePct) <= 2) return 'stable';
  return changePct > 0 ? 'up' : 'down';
}

export function decidePriceAction(params: {
  history: ShoppingPriceObservation[];
  lastPrice?: number;
}): PriceDecisionResult {
  const { history, lastPrice } = params;

  if (!lastPrice || history.length < 3) {
    return { trend: computeTrend(history), recommendation: 'monitor' };
  }

  const prices = history.map((entry) => entry.price).filter((price) => Number.isFinite(price) && price > 0);
  if (prices.length < 3) {
    return { trend: computeTrend(history), recommendation: 'monitor' };
  }

  const trend = computeTrend(history);
  const p25 = percentile(prices, 0.25);
  const p50 = percentile(prices, 0.5);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const volatility = p50 > 0 ? ((max - min) / p50) * 100 : 0;

  if (lastPrice <= p25) {
    return { trend, recommendation: 'buy_now' };
  }

  if (trend === 'up') {
    return { trend, recommendation: 'buy_now' };
  }

  if (trend === 'down' && lastPrice > p50) {
    return { trend, recommendation: 'wait' };
  }

  if (volatility < 3) {
    return { trend: 'stable', recommendation: 'monitor' };
  }

  return { trend, recommendation: 'monitor' };
}
