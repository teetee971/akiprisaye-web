export type TrendDirection = 'up' | 'down' | 'flat';

export type PriceHistoryPoint = {
  price: number;
  observedAt: string;
};

export type TrendOutput = {
  trend: TrendDirection;
  deltaPct: number | null;
};

function average(values: number[]): number | null {
  if (!values.length) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function computeTrend(history: PriceHistoryPoint[], windowDays: number): TrendOutput {
  if (!Array.isArray(history) || history.length < 2 || windowDays <= 0) {
    return { trend: 'flat', deltaPct: null };
  }

  const now = Date.now();
  const windowMs = windowDays * 24 * 60 * 60 * 1000;
  const recentStart = now - windowMs;
  const previousStart = now - (windowMs * 2);

  const recent: number[] = [];
  const previous: number[] = [];

  history.forEach((point) => {
    const observedAt = new Date(point.observedAt).getTime();
    if (!Number.isFinite(observedAt) || !Number.isFinite(point.price)) return;

    if (observedAt >= recentStart && observedAt <= now) {
      recent.push(point.price);
    } else if (observedAt >= previousStart && observedAt < recentStart) {
      previous.push(point.price);
    }
  });

  const recentAvg = average(recent);
  const previousAvg = average(previous);

  if (recentAvg === null || previousAvg === null || previousAvg <= 0) {
    return { trend: 'flat', deltaPct: null };
  }

  const deltaPct = ((recentAvg - previousAvg) / previousAvg) * 100;
  if (Math.abs(deltaPct) < 1.5) return { trend: 'flat', deltaPct };
  if (deltaPct > 0) return { trend: 'up', deltaPct };
  return { trend: 'down', deltaPct };
}
