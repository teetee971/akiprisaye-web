import type { PriceHistoryPoint } from './trend';

export type ConfidenceInput = {
  source?: string;
  lastObservedAt?: string;
  priceHistory?: PriceHistoryPoint[];
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function stdDeviation(values: number[]): number {
  if (values.length < 2) return 0;
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  const variance = values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

export function computeConfidenceScore(item: ConfidenceInput): number {
  let score = 50;

  const source = (item.source ?? '').toLowerCase();
  if (source === 'open_prices' || source === 'data_gouv') {
    score += 20;
  }

  const lastObservedAt = item.lastObservedAt ? new Date(item.lastObservedAt).getTime() : Number.NaN;
  if (Number.isFinite(lastObservedAt)) {
    const daysAgo = (Date.now() - lastObservedAt) / (24 * 60 * 60 * 1000);
    if (daysAgo <= 7) score += 10;
  }

  const prices = (item.priceHistory ?? [])
    .map((point) => point.price)
    .filter((value) => Number.isFinite(value));
  if (prices.length >= 5) {
    score += 10;
  }

  if (prices.length >= 3) {
    const mean = prices.reduce((sum, value) => sum + value, 0) / prices.length;
    const dispersionRatio = mean > 0 ? stdDeviation(prices) / mean : 0;
    if (dispersionRatio > 0.25) {
      score -= 10;
    }
  }

  return clamp(Math.round(score), 0, 100);
}
