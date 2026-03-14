/**
 * IEVR (Indice d'Écart de Vie Réelle) Calculation Utilities
 *
 * This module provides functions to calculate the IEVR score for territories.
 * The IEVR measures the real cost-of-living gap between overseas territories
 * and mainland France (Hexagone).
 *
 * Score interpretation:
 * - 100: Reference territory (Hexagone)
 * - < 100: More difficult to live (higher costs relative to income)
 * - > 100: Easier to live (lower costs relative to income)
 */

import { logWarn } from './logger';

export type TrendLabel = 'amélioration' | 'dégradation' | 'stable';

export interface ComparisonResult {
  difference: number;
  percentDiff: number;
  interpretation: 'similaire' | 'plus difficile' | 'plus facile';
}

export interface EvolutionResult {
  change: number;
  percentChange: number;
  trend: TrendLabel;
}

export interface TerritoryStatus {
  level: 'critical' | 'warning' | 'moderate' | 'good' | 'excellent';
  label: string;
  color: string;
}

export interface IEVRData {
  metadata?: {
    version?: string;
    reference?: string;
    [key: string]: unknown;
  };
  categories?: Record<string, { weight: number; [key: string]: unknown }>;
  territories?: Record<string, { name?: string; [key: string]: unknown }>;
  [key: string]: unknown;
}

/**
 * Calculate IEVR score from category scores and weights.
 *
 * Formula: IEVR = Σ(category_score × category_weight)
 *
 * @param categories - Category scores { alimentation: 65, hygiene: 68, … }
 * @param weights    - Category weights { alimentation: 0.40, hygiene: 0.15, … }
 * @returns Calculated IEVR score (0–100), rounded to nearest integer
 */
export function calculateIEVRScore(
  categories: Record<string, number> | null,
  weights: Record<string, number> | null,
): number {
  if (!categories || !weights) {
    throw new Error('Categories and weights are required');
  }

  let totalScore = 0;
  let totalWeight = 0;

  for (const [category, score] of Object.entries(categories)) {
    const weight = weights[category] ?? 0;
    totalScore += score * weight;
    totalWeight += weight;
  }

  if (Math.abs(totalWeight - 1) > 0.001) {
    logWarn(`Total weight is ${totalWeight}, expected 1.0`);
  }

  return Math.round(totalScore);
}

/**
 * Compare a territory score to a reference score (default: 100).
 */
export function compareToReference(
  territoryScore: number,
  referenceScore = 100,
): ComparisonResult {
  const difference = territoryScore - referenceScore;
  const percentDiff = ((territoryScore - referenceScore) / referenceScore) * 100;

  let interpretation: ComparisonResult['interpretation'];
  if (Math.abs(percentDiff) < 5) {
    interpretation = 'similaire';
  } else if (difference < 0) {
    interpretation = 'plus difficile';
  } else {
    interpretation = 'plus facile';
  }

  return { difference, percentDiff, interpretation };
}

/**
 * Calculate the evolution between two IEVR scores.
 * If `previousScore` is null/undefined, returns a stable result with no change.
 */
export function calculateEvolution(
  currentScore: number,
  previousScore: number | null | undefined,
): EvolutionResult {
  if (previousScore === null || previousScore === undefined) {
    return { change: 0, percentChange: 0, trend: 'stable' };
  }

  const change = currentScore - previousScore;
  const percentChange = previousScore !== 0 ? (change / previousScore) * 100 : 0;

  let trend: TrendLabel;
  if (Math.abs(change) < 0.5) {
    trend = 'stable';
  } else if (change > 0) {
    trend = 'amélioration';
  } else {
    trend = 'dégradation';
  }

  return { change, percentChange, trend };
}

/**
 * Generate a human-readable explanation for a territory's IEVR score.
 */
export function generateExplanation(
  territory: string,
  score: number,
  referenceScore = 100,
): string {
  const { difference, interpretation } = compareToReference(score, referenceScore);
  const absDiff = Math.abs(Math.round(difference));

  if (interpretation === 'similaire') {
    return `${territory} présente un niveau de vie similaire à la référence (Hexagone).`;
  }
  if (interpretation === 'plus difficile') {
    return `${territory} présente un niveau de vie plus difficile que la référence, avec un écart de ${absDiff}%.`;
  }
  return `${territory} présente un niveau de vie plus facile que la référence, avec un écart de ${absDiff}%.`;
}

/**
 * Get a hex colour for a score (used in charts and indicators).
 */
export function getScoreColor(score: number): string {
  if (score >= 90) return '#10b981'; // green-500
  if (score >= 75) return '#3b82f6'; // blue-500
  if (score >= 60) return '#f59e0b'; // amber-500
  return '#ef4444'; // red-500
}

/**
 * Get an emoji trend icon for a trend label.
 */
export function getTrendIcon(trend: TrendLabel | string): string {
  switch (trend) {
    case 'amélioration':
      return '📈';
    case 'dégradation':
      return '📉';
    default:
      return '➡️';
  }
}

/**
 * Get a status descriptor for a territory's IEVR score.
 */
export function getTerritoryStatus(score: number): TerritoryStatus {
  if (score >= 90) {
    return { level: 'excellent', label: 'Excellent', color: '#10b981' };
  }
  if (score >= 75) {
    return { level: 'good', label: 'Bon', color: '#3b82f6' };
  }
  if (score >= 60) {
    return { level: 'moderate', label: 'Modéré', color: '#f59e0b' };
  }
  if (score >= 45) {
    return { level: 'warning', label: 'Difficile', color: '#f97316' };
  }
  return { level: 'critical', label: 'Critique', color: '#ef4444' };
}

/**
 * Validate the structure of an IEVR data object.
 * Throws a descriptive error for any structural issue.
 */
export function validateIEVRData(data: Partial<IEVRData>): true {
  if (!data.metadata) throw new Error('Missing metadata');
  if (!data.categories) throw new Error('Missing categories');
  if (!data.territories) throw new Error('Missing territories');

  const totalWeight = Object.values(data.categories).reduce(
    (sum, cat) => sum + (cat.weight ?? 0),
    0,
  );

  if (Math.abs(totalWeight - 1) > 0.001) {
    throw new Error(`Category weights sum to ${totalWeight.toFixed(3)}, expected 1.0`);
  }

  return true;
}
