import { computeAlerts } from './alerts';
import { computeConfidenceScore } from './scoring';
import { computeTrend, type PriceHistoryPoint } from './trend';

export type RecommendationInput = {
  price?: number;
  source?: string;
  lastObservedAt?: string;
  priceHistory?: PriceHistoryPoint[];
};

export type PremiumRecommendation = {
  verdict: string;
  reason: string;
};

export function computePremiumRecommendation(item: RecommendationInput): PremiumRecommendation {
  const trend7 = computeTrend(item.priceHistory ?? [], 7);
  const score = computeConfidenceScore(item);
  const alerts = computeAlerts(item);

  if (trend7.trend === 'down' && alerts.length > 0) {
    return { verdict: 'Attendre', reason: alerts[0] };
  }

  if (trend7.trend === 'up' && score >= 70) {
    return { verdict: 'Acheter maintenant', reason: 'Tendance haussière avec confiance élevée' };
  }

  return { verdict: 'Surveiller', reason: 'Données insuffisantes ou signal neutre' };
}
