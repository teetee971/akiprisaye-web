import type { NormalizedPriceObservation } from './price.types';

interface ConfidenceInputs {
  territoryMatch: boolean;
  observations: NormalizedPriceObservation[];
}

function scoreRecency(observedAt?: string): number {
  if (!observedAt) return 5;
  const days = (Date.now() - new Date(observedAt).getTime()) / (1000 * 60 * 60 * 24);
  if (days <= 30) return 25;
  if (days <= 90) return 18;
  if (days <= 180) return 12;
  return 6;
}

export function computePriceConfidence({ territoryMatch, observations }: ConfidenceInputs): number {
  if (observations.length === 0) return 0;
  const sources = new Set(observations.map((obs) => obs.source));
  const sourceScore = Math.min(40, sources.size * 15);
  const recencyScore = Math.min(
    25,
    observations.reduce((sum, obs) => sum + scoreRecency(obs.observedAt), 0) / observations.length
  );
  const territoryScore = territoryMatch ? 20 : 10;
  const consistencyScore = observations.length >= 3 ? 15 : observations.length * 4;

  return Math.min(100, Math.round(sourceScore + recencyScore + territoryScore + consistencyScore));
}
