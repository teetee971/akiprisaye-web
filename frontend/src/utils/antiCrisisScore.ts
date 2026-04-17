/**
 * antiCrisisScore.ts — Anti-Crisis Price Score Calculation
 *
 * Purpose: Calculate Anti-Crisis score for basket prices based on historical data
 *
 * Anti-Crisis Methodology:
 * A price is "Anti-Crisis" if it meets at least 2 of 3 criteria:
 * 1. Below territorial median price (better than most prices)
 * 2. Stable or decreasing trend (no recent significant increase)
 * 3. Low volatility (reliable, predictable pricing)
 *
 * Score Calculation:
 * - Each criterion met adds 1 point
 * - Score range: 0-3
 * - Score 2+ = Anti-Crisis protection
 *
 * @module antiCrisisScore
 */

import { getHistoryByTerritory, type BasketPriceSnapshot } from './priceHistory';
import { calculateMedianPrice } from './priceAnalysis';
import {
  ANTI_CRISIS_RULES,
  getAntiCrisisLabel,
  type AntiCrisisScore,
  type AntiCrisisLabel,
} from '../config/antiCrisisRules';

/**
 * Reason why a criterion was met or not met
 */
export interface CriterionReason {
  criterion: string;
  met: boolean;
  value: number | null;
  threshold?: number;
  explanation: string;
}

/**
 * Anti-Crisis score result with detailed breakdown
 */
export interface AntiCrisisResult {
  score: AntiCrisisScore;
  label: AntiCrisisLabel;
  reasons: CriterionReason[];
  medianPrice: number | null;
  currentPrice: number | null;
  trendPercent: number | null;
  volatilityPercent: number | null;
  dataPoints: number;
  hasEnoughData: boolean;
}

/**
 * Calculate volatility from price snapshots
 * Volatility = (max - min) / min * 100
 *
 * @param snapshots - Array of price snapshots
 * @returns Volatility percentage or null if not enough data
 */
function calculateVolatility(snapshots: BasketPriceSnapshot[]): number | null {
  if (snapshots.length < 2) return null;

  const prices = snapshots.map((s) => s.totalPrice);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);

  if (minPrice === 0) return null;

  return ((maxPrice - minPrice) / minPrice) * 100;
}

/**
 * Calculate price trend over a period
 * Positive = increasing, Negative = decreasing, ~0 = stable
 *
 * @param snapshots - Array of price snapshots (should be time-ordered)
 * @returns Percentage change from first to last snapshot, or null
 */
function calculateTrend(snapshots: BasketPriceSnapshot[]): number | null {
  if (snapshots.length < 2) return null;

  const firstPrice = snapshots[0].totalPrice;
  const lastPrice = snapshots[snapshots.length - 1].totalPrice;

  if (firstPrice === 0) return null;

  return ((lastPrice - firstPrice) / firstPrice) * 100;
}

/**
 * Filter snapshots to recent period
 *
 * @param snapshots - All snapshots
 * @param periodDays - Number of days to include
 * @returns Filtered snapshots within period
 */
function filterRecentSnapshots(
  snapshots: BasketPriceSnapshot[],
  periodDays: number
): BasketPriceSnapshot[] {
  const cutoffTime = Date.now() - periodDays * 24 * 60 * 60 * 1000;
  return snapshots.filter((s) => s.timestamp >= cutoffTime);
}

/**
 * Compute Anti-Crisis score for a basket in a territory
 *
 * @param territoryId - Territory identifier (e.g., 'GP', 'MQ', 'GF')
 * @param basketId - Optional specific basket ID to analyze
 * @returns Anti-Crisis result with score, label, and detailed breakdown
 *
 * @example
 * const result = computeAntiCrisisScore('GP', 'basket-familial');
 * console.log(result.label); // "Anti-Crise" or "Anti-Crise Fort"
 * console.log(result.score); // 0, 1, 2, or 3
 * console.log(result.reasons); // Detailed breakdown
 */
export function computeAntiCrisisScore(territoryId: string, basketId?: string): AntiCrisisResult {
  // Get historical data for this territory (and optionally specific basket)
  const allSnapshots = getHistoryByTerritory(territoryId, basketId);

  // Check if we have enough data
  if (allSnapshots.length < ANTI_CRISIS_RULES.minHistoryPoints) {
    return {
      score: 1 as AntiCrisisScore,
      label: 'Données insuffisantes',
      reasons: [
        {
          criterion: 'Historique',
          met: false,
          value: allSnapshots.length,
          threshold: ANTI_CRISIS_RULES.minHistoryPoints,
          explanation: `Seulement ${allSnapshots.length} observations disponibles. Minimum requis: ${ANTI_CRISIS_RULES.minHistoryPoints}.`,
        },
      ],
      medianPrice: null,
      currentPrice: null,
      trendPercent: null,
      volatilityPercent: null,
      dataPoints: allSnapshots.length,
      hasEnoughData: false,
    };
  }

  // Get recent snapshots for trend analysis
  let recentSnapshots = filterRecentSnapshots(allSnapshots, ANTI_CRISIS_RULES.trendPeriodDays);

  // If not enough recent data, try shorter period
  if (recentSnapshots.length < 3) {
    recentSnapshots = filterRecentSnapshots(allSnapshots, ANTI_CRISIS_RULES.shortTrendPeriodDays);
  }

  // Still not enough? Use all available data
  if (recentSnapshots.length < 3) {
    recentSnapshots = allSnapshots;
  }

  // Calculate metrics
  const allPrices = allSnapshots.map((s) => s.totalPrice);
  const medianPrice = calculateMedianPrice(allPrices);
  const currentPrice =
    allSnapshots.length > 0 ? allSnapshots[allSnapshots.length - 1].totalPrice : null;

  const trendPercent = calculateTrend(recentSnapshots);
  const volatilityPercent = calculateVolatility(allSnapshots);

  // Evaluate each criterion
  const reasons: CriterionReason[] = [];
  let score = 0;

  // Criterion 1: Price below median
  const belowMedian = currentPrice !== null && currentPrice < medianPrice;
  if (belowMedian) score++;

  reasons.push({
    criterion: 'Prix vs Médiane',
    met: belowMedian,
    value: currentPrice,
    threshold: medianPrice,
    explanation: belowMedian
      ? `Prix actuel (${currentPrice?.toFixed(2)}€) < médiane territoriale (${medianPrice.toFixed(2)}€)`
      : `Prix actuel (${currentPrice?.toFixed(2)}€) ≥ médiane territoriale (${medianPrice.toFixed(2)}€)`,
  });

  // Criterion 2: Stable or decreasing trend
  const stableTrend =
    trendPercent !== null && trendPercent <= ANTI_CRISIS_RULES.stableThresholdPercent;
  if (stableTrend) score++;

  reasons.push({
    criterion: 'Tendance',
    met: stableTrend,
    value: trendPercent,
    threshold: ANTI_CRISIS_RULES.stableThresholdPercent,
    explanation:
      trendPercent !== null
        ? stableTrend
          ? `Tendance stable ou en baisse (${trendPercent >= 0 ? '+' : ''}${trendPercent.toFixed(1)}%)`
          : `Hausse récente significative (+${trendPercent.toFixed(1)}%)`
        : 'Tendance non calculable',
  });

  // Criterion 3: Low volatility
  const lowVolatility =
    volatilityPercent !== null && volatilityPercent < ANTI_CRISIS_RULES.maxVolatilityPercent;
  if (lowVolatility) score++;

  reasons.push({
    criterion: 'Volatilité',
    met: lowVolatility,
    value: volatilityPercent,
    threshold: ANTI_CRISIS_RULES.maxVolatilityPercent,
    explanation:
      volatilityPercent !== null
        ? lowVolatility
          ? `Faible volatilité (${volatilityPercent.toFixed(1)}% < ${ANTI_CRISIS_RULES.maxVolatilityPercent}%)`
          : `Volatilité élevée (${volatilityPercent.toFixed(1)}% ≥ ${ANTI_CRISIS_RULES.maxVolatilityPercent}%)`
        : 'Volatilité non calculable',
  });

  return {
    score: score as AntiCrisisScore,
    label: getAntiCrisisLabel(score as AntiCrisisScore),
    reasons,
    medianPrice,
    currentPrice,
    trendPercent,
    volatilityPercent,
    dataPoints: allSnapshots.length,
    hasEnoughData: true,
  };
}

/**
 * Get a simple summary text for Anti-Crisis result
 * Useful for tooltips and brief explanations
 *
 * @param result - Anti-Crisis calculation result
 * @returns Human-readable summary
 */
export function getAntiCrisisSummary(result: AntiCrisisResult): string {
  if (!result.hasEnoughData) {
    return 'Historique insuffisant pour évaluation Anti-Crise.';
  }

  const metCriteria = result.reasons.filter((r) => r.met).length;
  const criteriaText = result.reasons
    .filter((r) => r.met)
    .map((r) => r.criterion)
    .join(', ');

  if (result.score >= 2) {
    return `Prix Anti-Crise : ${metCriteria}/3 critères validés (${criteriaText}).`;
  } else if (result.score === 1) {
    return `Prix neutre : 1 seul critère validé (${criteriaText}).`;
  } else {
    return `Prix à risque : aucun critère Anti-Crise validé.`;
  }
}

/**
 * Check if a price qualifies as Anti-Crisis (score >= 2)
 *
 * @param territoryId - Territory identifier
 * @param basketId - Optional basket identifier
 * @returns true if price is Anti-Crisis (score 2 or 3)
 */
export function isAntiCrisis(territoryId: string, basketId?: string): boolean {
  const result = computeAntiCrisisScore(territoryId, basketId);
  return result.hasEnoughData && result.score >= 2;
}

/**
 * Get detailed explanation for each criterion
 * Useful for educational tooltips
 *
 * @param result - Anti-Crisis calculation result
 * @returns Array of formatted explanation strings
 */
export function getDetailedExplanations(result: AntiCrisisResult): string[] {
  return result.reasons.map((r) => {
    const icon = r.met ? '✓' : '✗';
    return `${icon} ${r.criterion}: ${r.explanation}`;
  });
}
