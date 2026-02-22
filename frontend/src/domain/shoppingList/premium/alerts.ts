import type { PriceHistoryPoint } from './trend';

export type AlertInput = {
  price?: number;
  priceHistory?: PriceHistoryPoint[];
};

function median(values: number[]): number | null {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[middle - 1] + sorted[middle]) / 2;
  }
  return sorted[middle];
}

export function computeAlerts(item: AlertInput): string[] {
  const alerts: string[] = [];
  if (!Number.isFinite(item.price)) return alerts;

  const now = Date.now();
  const cutoff = now - (30 * 24 * 60 * 60 * 1000);
  const values30d = (item.priceHistory ?? [])
    .filter((point) => {
      const ts = new Date(point.observedAt).getTime();
      return Number.isFinite(ts) && ts >= cutoff && Number.isFinite(point.price);
    })
    .map((point) => point.price);

  const median30 = median(values30d);
  if (!median30 || median30 <= 0) return alerts;

  const lastPrice = item.price as number;
  if (lastPrice < median30 * (1 - 0.05)) {
    const deltaPct = ((median30 - lastPrice) / median30) * 100;
    alerts.push(`Baisse -${deltaPct.toFixed(1)}% vs médiane 30j`);
  }

  return alerts;
}
