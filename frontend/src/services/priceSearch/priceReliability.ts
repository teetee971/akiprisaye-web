import type { NormalizedPriceObservation, PriceInterval } from './price.types';

export const minObservationsThreshold = 3;

export type ConfidenceLevel = 'low' | 'medium' | 'high';

export type PriceReliability = {
  count: number;
  min: number | null;
  max: number | null;
  volumeScore: number;
  stabilityScore: number;
  freshnessScore: number;
  lowData: boolean;
  confidenceLevel: ConfidenceLevel;
};

const clampScore = (value: number): number => Math.max(0, Math.min(100, Math.round(value)));

const computeVolumeScore = (count: number): number => {
  return clampScore((Math.min(count, 10) / 10) * 100);
};

const computeStabilityScore = (interval: PriceInterval | null): number => {
  if (!interval || interval.min == null || interval.max == null || interval.min <= 0) {
    return 0;
  }

  const spread = interval.max - interval.min;
  const spreadRatio = spread / interval.min;

  // 0 variation = 100 score, then degrades linearly until ratio 1.0 (100% spread)
  return clampScore((1 - Math.min(spreadRatio, 1)) * 100);
};

const computeFreshnessScore = (observations: NormalizedPriceObservation[]): number => {
  if (observations.length === 0) return 0;

  const newestTimestamp = observations.reduce<number>((latest, obs) => {
    const timestamp = new Date(obs.observedAt).getTime();
    return Number.isFinite(timestamp) ? Math.max(latest, timestamp) : latest;
  }, Number.NEGATIVE_INFINITY);

  if (!Number.isFinite(newestTimestamp)) return 0;

  const ageInDays = (Date.now() - newestTimestamp) / (1000 * 60 * 60 * 24);
  return clampScore(100 - Math.max(ageInDays, 0) * 2);
};

const computeConfidenceLevel = (
  lowData: boolean,
  volumeScore: number,
  stabilityScore: number,
  freshnessScore: number
): ConfidenceLevel => {
  if (lowData) return 'low';

  const weightedScore = volumeScore * 0.4 + stabilityScore * 0.35 + freshnessScore * 0.25;

  if (weightedScore >= 75 && stabilityScore >= 60 && freshnessScore >= 60) {
    return 'high';
  }

  if (weightedScore >= 45) {
    return 'medium';
  }

  return 'low';
};

export function computePriceReliability(
  observations: NormalizedPriceObservation[],
  interval: PriceInterval | null
): PriceReliability {
  const count = observations.length;
  const lowData = count < minObservationsThreshold;

  const volumeScore = computeVolumeScore(count);
  const stabilityScore = computeStabilityScore(interval);
  const freshnessScore = computeFreshnessScore(observations);

  return {
    count,
    min: interval?.min ?? null,
    max: interval?.max ?? null,
    volumeScore,
    stabilityScore,
    freshnessScore,
    lowData,
    confidenceLevel: computeConfidenceLevel(lowData, volumeScore, stabilityScore, freshnessScore),
  };
}
