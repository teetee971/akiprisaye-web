/**
 * antiCrisisRules.ts — Anti-Crisis Price Detection Configuration
 * 
 * Purpose: Centralized configuration for Anti-Crisis price detection thresholds
 * Used by: Anti-Crisis score calculations, badges, and analysis components
 * 
 * Anti-Crisis Definition:
 * A price that protects purchasing power during inflation by meeting at least 2 of 3 criteria:
 * 1. Price below territorial median (better than most)
 * 2. Stable or decreasing trend (no recent significant increase)
 * 3. Low volatility (reliable, predictable price)
 * 
 * @module antiCrisisRules
 */

/**
 * Anti-Crisis detection rules and thresholds
 * Can be modified without touching business logic
 */
export const ANTI_CRISIS_RULES = {
  /**
   * Number of days to analyze for trend calculation
   * Default: 14 days (2 weeks) for meaningful trend detection
   */
  trendPeriodDays: 14,

  /**
   * Maximum percentage change to consider price "stable"
   * If change is within ±1.5%, price is considered stable
   * Default: 1.5% (allows minor fluctuations)
   */
  stableThresholdPercent: 1.5,

  /**
   * Maximum volatility (price range) to consider price "reliable"
   * Calculated as (max - min) / min * 100
   * Default: 5% (low volatility threshold)
   */
  maxVolatilityPercent: 5,

  /**
   * Minimum number of historical data points required for analysis
   * Below this threshold, "insufficient data" is returned
   * Default: 5 observations
   */
  minHistoryPoints: 5,

  /**
   * Alternative shorter trend period for recent analysis
   * Used when 14-day data is insufficient
   * Default: 7 days (1 week)
   */
  shortTrendPeriodDays: 7,
} as const;

/**
 * Anti-Crisis score levels
 * Score is calculated by counting how many criteria are met (0-3)
 */
export type AntiCrisisScore = 0 | 1 | 2 | 3;

/**
 * Anti-Crisis status labels
 */
export type AntiCrisisLabel = 
  | 'Anti-Crise Fort'      // Score 3: All criteria met
  | 'Anti-Crise'           // Score 2: Two criteria met
  | 'Neutre'               // Score 1: One criterion met
  | 'À risque'             // Score 0: No criteria met
  | 'Données insuffisantes'; // Not enough history

/**
 * Get human-readable label for Anti-Crisis score
 * 
 * @param score - Anti-Crisis score (0-3)
 * @returns Localized label
 */
export function getAntiCrisisLabel(score: AntiCrisisScore): AntiCrisisLabel {
  switch (score) {
    case 3:
      return 'Anti-Crise Fort';
    case 2:
      return 'Anti-Crise';
    case 1:
      return 'Neutre';
    case 0:
      return 'À risque';
    default:
      return 'Neutre';
  }
}

/**
 * Get emoji indicator for Anti-Crisis score
 * 
 * @param score - Anti-Crisis score (0-3)
 * @returns Emoji string
 */
export function getAntiCrisisEmoji(score: AntiCrisisScore): string {
  switch (score) {
    case 3:
      return '🟢'; // Strong protection
    case 2:
      return '🟡'; // Good protection
    case 1:
      return '⚪'; // Neutral
    case 0:
      return '🔴'; // At risk
    default:
      return '⚪';
  }
}

/**
 * Get CSS color class for Anti-Crisis badge
 * 
 * @param score - Anti-Crisis score (0-3)
 * @returns Tailwind CSS class names
 */
export function getAntiCrisisBadgeClasses(score: AntiCrisisScore): string {
  const baseClasses = 'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium';
  
  switch (score) {
    case 3:
      return `${baseClasses} bg-green-100 text-green-800 border border-green-300`;
    case 2:
      return `${baseClasses} bg-yellow-100 text-yellow-800 border border-yellow-300`;
    case 1:
      return `${baseClasses} bg-gray-100 text-gray-600 border border-gray-300`;
    case 0:
      return `${baseClasses} bg-red-100 text-red-800 border border-red-300`;
    default:
      return `${baseClasses} bg-gray-100 text-gray-600`;
  }
}

/**
 * Validation: Check if thresholds are reasonable
 * Used in development/testing to catch configuration errors
 */
export function validateAntiCrisisRules(): boolean {
  const rules = ANTI_CRISIS_RULES;
  
  return (
    rules.trendPeriodDays > 0 &&
    rules.stableThresholdPercent > 0 &&
    rules.maxVolatilityPercent > 0 &&
    rules.minHistoryPoints >= 3 &&
    rules.shortTrendPeriodDays > 0 &&
    rules.shortTrendPeriodDays <= rules.trendPeriodDays
  );
}
