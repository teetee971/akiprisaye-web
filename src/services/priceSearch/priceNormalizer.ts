import type { NormalizedPriceObservation, PriceObservation } from './price.types';

const UNIT_LABELS: Record<NonNullable<PriceObservation['unit']>, string> = {
  unit: 'pièce',
  kg: 'kg',
  l: 'L',
};

export function normalizePriceValue(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Number(value.toFixed(2)));
}

export function formatPriceLabel(price: number, unit?: PriceObservation['unit']): string {
  const normalized = normalizePriceValue(price);
  if (unit && UNIT_LABELS[unit]) {
    return `${normalized.toFixed(2)}€ / ${UNIT_LABELS[unit]}`;
  }
  return `${normalized.toFixed(2)}€`;
}

export function computeMedian(prices: number[]): number | null {
  if (prices.length === 0) return null;
  const sorted = [...prices].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return normalizePriceValue((sorted[mid - 1] + sorted[mid]) / 2);
  }
  return normalizePriceValue(sorted[mid]);
}

export function normalizeObservation(observation: PriceObservation): NormalizedPriceObservation {
  const normalizedPrice = normalizePriceValue(observation.price);
  const pricePerUnit =
    observation.unit && observation.unit !== 'unit' ? normalizedPrice : undefined;

  return {
    ...observation,
    price: normalizedPrice,
    pricePerUnit,
    normalizedLabel: formatPriceLabel(normalizedPrice, observation.unit),
  };
}
