 
/**
 * inflationPressureIndex.ts — Local Inflation Pressure Index (ILPP)
 * 
 * Purpose: Descriptive index of local price pressure based on observed data
 * 
 * LEGAL NOTICE:
 * This is a DESCRIPTIVE tool, not a predictive or advisory tool.
 * It observes and describes what has happened, not what will happen.
 * Does not constitute financial or economic advice.
 * 
 * Methodology:
 * - 40% Average price change
 * - 30% Volatility (price instability)
 * - 20% Frequency of increases
 * - 10% Store dispersion
 * 
 * Result: Score from 0 to 100
 * 
 * @module inflationPressureIndex
 */

import type { BasketPriceSnapshot } from './priceHistory';

/**
 * Input data for ILPP calculation
 */
export interface ILPPInputData {
  /** Average percentage price change over period */
  avgChange: number;
  
  /** Volatility (standard deviation or range) as percentage */
  volatility: number;
  
  /** Frequency of increases (0-100, percentage of observations with increases) */
  increaseFrequency: number;
  
  /** Price dispersion across stores (0-100, coefficient of variation) */
  dispersion: number;
}

/**
 * ILPP result with score and metadata
 */
export interface ILPPResult {
  /** Score from 0 to 100 */
  score: number;
  
  /** Human-readable pressure level */
  level: 'Très faible' | 'Modérée' | 'Notable' | 'Forte' | 'Très élevée';
  
  /** Explanatory text */
  explanation: string;
  
  /** Component breakdown */
  components: {
    avgChange: number;
    volatility: number;
    increaseFrequency: number;
    dispersion: number;
  };
  
  /** Number of observations used */
  dataPoints: number;
  
  /** Whether enough data for reliable index */
  isReliable: boolean;
}

/**
 * Minimum observations required for reliable ILPP
 */
const MIN_OBSERVATIONS = 7;

/**
 * Normalize a value to 0-100 scale
 * @param value - Raw value
 * @param max - Maximum expected value
 * @returns Normalized score 0-100
 */
function normalize(value: number, max: number): number {
  return Math.min(100, Math.max(0, (value / max) * 100));
}

/**
 * Compute Local Inflation Pressure Index (ILPP)
 * 
 * Formula:
 * ILPP = (avgChange × 0.4) + (volatility × 0.3) + (increaseFreq × 0.2) + (dispersion × 0.1)
 * 
 * All components are normalized to 0-100 scale before weighting
 * 
 * @param data - Input data with all components
 * @returns ILPP score (0-100)
 * 
 * @example
 * const score = computeILPP({
 *   avgChange: 15,      // 15% average increase
 *   volatility: 20,     // 20% volatility
 *   increaseFrequency: 70,  // 70% of observations show increases
 *   dispersion: 25      // 25% dispersion across stores
 * });
 * // Returns: 58 (notable pressure)
 */
export function computeILPP(data: ILPPInputData): number {
  // Each component is already expected to be 0-100 or needs normalization
  // avgChange: normalize to 0-100 (max 50% change = 100)
  // Only positive changes contribute to inflation pressure
  const normalizedAvgChange = data.avgChange > 0 
    ? normalize(data.avgChange, 50)
    : 0;
  
  // volatility: already 0-100 percentage
  const normalizedVolatility = Math.min(100, Math.max(0, data.volatility));
  
  // increaseFrequency: already 0-100 percentage
  const normalizedFrequency = Math.min(100, Math.max(0, data.increaseFrequency));
  
  // dispersion: already 0-100 percentage
  const normalizedDispersion = Math.min(100, Math.max(0, data.dispersion));

  // Weighted sum
  const score = 
    normalizedAvgChange * 0.4 +
    normalizedVolatility * 0.3 +
    normalizedFrequency * 0.2 +
    normalizedDispersion * 0.1;

  return Math.round(Math.min(100, Math.max(0, score)));
}

/**
 * Get human-readable pressure level for a score
 * 
 * @param score - ILPP score (0-100)
 * @returns Pressure level label
 */
export function getPressureLevel(
  score: number
): 'Très faible' | 'Modérée' | 'Notable' | 'Forte' | 'Très élevée' {
  if (score <= 20) return 'Très faible';
  if (score <= 40) return 'Modérée';
  if (score <= 60) return 'Notable';
  if (score <= 80) return 'Forte';
  return 'Très élevée';
}

/**
 * Get explanatory text for ILPP score
 * Play Store compliant: descriptive, factual, no predictions
 * 
 * @param score - ILPP score (0-100)
 * @returns Human-readable explanation
 */
export function explainILPP(score: number): string {
  if (score <= 20) {
    return 'Les prix observés sont globalement stables sur la période analysée.';
  }
  if (score <= 40) {
    return 'Une pression modérée est observée, avec des hausses ponctuelles sur certaines catégories.';
  }
  if (score <= 60) {
    return 'Les prix montrent une augmentation régulière sur plusieurs catégories de produits.';
  }
  if (score <= 80) {
    return 'Une forte pression est constatée, avec des hausses fréquentes et significatives.';
  }
  return 'La pression sur les prix est très élevée sur ce territoire durant la période observée.';
}

/**
 * Calculate ILPP components from price snapshots
 * 
 * @param snapshots - Array of price observations (must be time-ordered)
 * @returns Input data for ILPP calculation
 */
export function calculateILPPComponents(
  snapshots: BasketPriceSnapshot[]
): ILPPInputData | null {
  if (snapshots.length < 2) {
    return null;
  }

  const prices = snapshots.map(s => s.totalPrice);
  
  // 1. Average price change
  const firstPrice = prices[0];
  const lastPrice = prices[prices.length - 1];
  const avgChange = firstPrice > 0 ? ((lastPrice - firstPrice) / firstPrice) * 100 : 0;

  // 2. Volatility (coefficient of variation)
  const mean = prices.reduce((sum, p) => sum + p, 0) / prices.length;
  const variance = prices.reduce((sum, p) => sum + Math.pow(p - mean, 2), 0) / prices.length;
  const stdDev = Math.sqrt(variance);
  const volatility = mean > 0 ? (stdDev / mean) * 100 : 0;

  // 3. Frequency of increases
  let increaseCount = 0;
  for (let i = 1; i < prices.length; i++) {
    if (prices[i] > prices[i - 1]) {
      increaseCount++;
    }
  }
  const increaseFrequency = (increaseCount / (prices.length - 1)) * 100;

  // 4. Dispersion (use volatility as proxy for now)
  // NOTE: In a full implementation, this would be calculated across multiple stores
  // For now, using volatility as a reasonable proxy since both measure price variability
  // TODO: Calculate actual cross-store dispersion when multi-store data is available
  const dispersion = volatility;

  return {
    avgChange,
    volatility,
    increaseFrequency,
    dispersion,
  };
}

/**
 * Compute full ILPP result from price snapshots
 * 
 * @param snapshots - Price observations
 * @param territoryId - Territory identifier (for context)
 * @returns Complete ILPP result with score and explanation
 * 
 * @example
 * const history = getHistoryByTerritory('GP');
 * const ilpp = computeILPPFromSnapshots(history, 'GP');
 * console.log(`Pression: ${ilpp.level} (${ilpp.score}/100)`);
 * console.log(ilpp.explanation);
 */
export function computeILPPFromSnapshots(
  snapshots: BasketPriceSnapshot[],
  territoryId: string
): ILPPResult {
  // Check if enough data
  if (snapshots.length < MIN_OBSERVATIONS) {
    return {
      score: 0,
      level: 'Très faible',
      explanation: `Données insuffisantes pour calculer l'indice (minimum ${MIN_OBSERVATIONS} observations requises).`,
      components: {
        avgChange: 0,
        volatility: 0,
        increaseFrequency: 0,
        dispersion: 0,
      },
      dataPoints: snapshots.length,
      isReliable: false,
    };
  }

  // Calculate components
  const components = calculateILPPComponents(snapshots);
  
  if (!components) {
    return {
      score: 0,
      level: 'Très faible',
      explanation: 'Impossible de calculer l\'indice avec les données disponibles.',
      components: {
        avgChange: 0,
        volatility: 0,
        increaseFrequency: 0,
        dispersion: 0,
      },
      dataPoints: snapshots.length,
      isReliable: false,
    };
  }

  // Compute score
  const score = computeILPP(components);
  const level = getPressureLevel(score);
  const explanation = explainILPP(score);

  return {
    score,
    level,
    explanation,
    components,
    dataPoints: snapshots.length,
    isReliable: true,
  };
}

/**
 * Get color class for ILPP score visualization
 * 
 * @param score - ILPP score (0-100)
 * @returns Tailwind CSS color class
 */
export function getILPPColorClass(score: number): string {
  if (score <= 20) return 'bg-green-500';
  if (score <= 40) return 'bg-blue-500';
  if (score <= 60) return 'bg-yellow-500';
  if (score <= 80) return 'bg-orange-500';
  return 'bg-red-500';
}

/**
 * Get text color class for ILPP score
 * 
 * @param score - ILPP score (0-100)
 * @returns Tailwind CSS text color class
 */
export function getILPPTextColorClass(score: number): string {
  if (score <= 20) return 'text-green-700';
  if (score <= 40) return 'text-blue-700';
  if (score <= 60) return 'text-yellow-700';
  if (score <= 80) return 'text-orange-700';
  return 'text-red-700';
}

/**
 * Legal disclaimer text (must be displayed with ILPP)
 */
export const ILPP_LEGAL_DISCLAIMER = 
  'Indice descriptif basé sur les prix observés. Ne constitue ni une prévision, ni un conseil économique ou financier.';

/**
 * Compare ILPP between two territories
 * 
 * @param ilpp1 - First territory ILPP
 * @param ilpp2 - Second territory ILPP
 * @returns Comparison text
 */
export function compareILPP(ilpp1: ILPPResult, ilpp2: ILPPResult): string {
  const diff = Math.abs(ilpp1.score - ilpp2.score);
  
  if (diff < 5) {
    return 'Les deux territoires présentent une pression similaire.';
  }
  
  const higher = ilpp1.score > ilpp2.score ? 'premier' : 'second';
  const percentage = ((diff / Math.min(ilpp1.score, ilpp2.score)) * 100).toFixed(0);
  
  return `Le ${higher} territoire montre une pression plus élevée de ${diff} points (${percentage}% de différence).`;
}
