export type PriceObservationSource =
  | 'open_food_facts'
  | 'open_prices'
  | 'user_report';

export interface PriceObservation {
  observedAt?: string;
  price: number;
  source: PriceObservationSource;
}

export interface ReliabilityResult {
  score: number;
  freshnessScore: number;
  volumeScore: number;
  stabilityScore: number;
  sourceScore: number;
  level: 'faible' | 'moyenne' | 'élevée';
}

export const SOURCE_RELIABILITY: Record<PriceObservationSource, number> = {
  open_prices: 0.9,
  open_food_facts: 0.6,
  user_report: 0.4,
};

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function computeMedian(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[middle - 1] + sorted[middle]) / 2;
  }
  return sorted[middle];
}

function computeFreshnessScore(observations: PriceObservation[]): number {
  if (observations.length === 0) return 0;

  const latestTimestamp = observations
    .map((observation) =>
      observation.observedAt ? new Date(observation.observedAt).getTime() : Number.NaN
    )
    .filter((timestamp) => Number.isFinite(timestamp))
    .reduce<number | null>((latest, timestamp) => {
      if (latest === null || timestamp > latest) return timestamp;
      return latest;
    }, null);

  if (!latestTimestamp) return 10;

  const diffInDays = (Date.now() - latestTimestamp) / (1000 * 60 * 60 * 24);
  if (diffInDays < 7) return 100;
  if (diffInDays < 30) return 70;
  if (diffInDays < 90) return 40;
  return 10;
}

function computeVolumeScore(observations: PriceObservation[]): number {
  const count = observations.length;
  if (count <= 0) return 0;
  if (count === 1) return 30;
  if (count <= 4) return 60;
  if (count <= 10) return 80;
  return 100;
}

function computeStabilityScore(observations: PriceObservation[]): number {
  if (observations.length <= 1) return observations.length === 1 ? 50 : 0;

  const prices = observations
    .map((observation) => observation.price)
    .filter((price) => Number.isFinite(price) && price > 0);

  if (prices.length <= 1) return prices.length === 1 ? 50 : 0;

  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const median = computeMedian(prices);

  if (median <= 0) return 0;

  const relativeSpread = (max - min) / median;
  const score = 100 - relativeSpread * 100;
  return clampScore(score);
}

function computeSourceScore(observations: PriceObservation[]): number {
  if (observations.length === 0) return 0;
  const weights = observations.map((observation) => SOURCE_RELIABILITY[observation.source]);
  return Math.max(0, Math.min(1, computeMedian(weights)));
}

export function computeReliability(observations: PriceObservation[]): ReliabilityResult {
  const freshnessScore = computeFreshnessScore(observations);
  const volumeScore = computeVolumeScore(observations);
  const stabilityScore = computeStabilityScore(observations);
  const sourceScore = computeSourceScore(observations);

  const baseScore =
    freshnessScore * 0.4 +
    volumeScore * 0.3 +
    stabilityScore * 0.3;

  const score = clampScore(baseScore * sourceScore);

  const level: ReliabilityResult['level'] =
    score < 40 ? 'faible' : score < 75 ? 'moyenne' : 'élevée';

  return {
    score,
    freshnessScore,
    volumeScore,
    stabilityScore,
    sourceScore: clampScore(sourceScore * 100),
    level,
  };
}
