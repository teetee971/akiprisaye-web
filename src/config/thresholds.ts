/**
 * thresholds.ts — Centralized numeric thresholds and limits
 * 
 * Purpose: Single source of truth for all threshold values used in calculations
 * Used by: Price alerts, severity detection, GPS radius, optimization
 * 
 * @module thresholds
 */

/**
 * Price alert thresholds
 */
export const PRICE_ALERT_THRESHOLDS = {
  /** Default percentage increase threshold (5%) */
  DEFAULT_PERCENTAGE: 5,
  
  /** Default absolute increase threshold (€0.50) */
  DEFAULT_ABSOLUTE: 0.50,
  
  /** High severity threshold (10% increase) */
  HIGH_SEVERITY_PERCENTAGE: 10,
  
  /** Medium severity threshold (5% increase) */
  MEDIUM_SEVERITY_PERCENTAGE: 5,
} as const;

/**
 * Alert severity levels
 */
export type AlertSeverity = 'high' | 'medium' | 'low';

/**
 * Alert severity order for sorting
 */
export const ALERT_SEVERITY_ORDER: Record<AlertSeverity, number> = {
  high: 0,
  medium: 1,
  low: 2,
} as const;

/**
 * GPS and location thresholds
 */
export const LOCATION_THRESHOLDS = {
  /** Default search radius in kilometers */
  DEFAULT_SEARCH_RADIUS_KM: 5,
  
  /** Minimum search radius in kilometers */
  MIN_SEARCH_RADIUS_KM: 1,
  
  /** Maximum search radius in kilometers */
  MAX_SEARCH_RADIUS_KM: 50,
} as const;

/**
 * Shopping list optimization weights
 */
export const OPTIMIZATION_WEIGHTS = {
  /** Weight for price factor in balanced mode */
  PRICE_WEIGHT: 0.5,
  
  /** Weight for distance factor in balanced mode */
  DISTANCE_WEIGHT: 0.3,
  
  /** Weight for store count factor in balanced mode */
  STORE_COUNT_WEIGHT: 0.2,
} as const;

/**
 * Determine alert severity based on percentage change
 * 
 * @param percentageChange - Price change percentage
 * @returns Severity level: 'high', 'medium', or 'low'
 */
export function getAlertSeverity(percentageChange: number): AlertSeverity {
  if (percentageChange > PRICE_ALERT_THRESHOLDS.HIGH_SEVERITY_PERCENTAGE) {
    return 'high';
  }
  if (percentageChange > PRICE_ALERT_THRESHOLDS.MEDIUM_SEVERITY_PERCENTAGE) {
    return 'medium';
  }
  return 'low';
}

/**
 * Check if price change exceeds alert thresholds
 * 
 * @param absoluteChange - Absolute price change in euros
 * @param percentageChange - Percentage price change
 * @param customThresholds - Optional custom thresholds
 * @returns true if alert should be triggered
 */
export function exceedsAlertThresholds(
  absoluteChange: number,
  percentageChange: number,
  customThresholds?: { percentage?: number; absolute?: number }
): boolean {
  const percentageThreshold = customThresholds?.percentage ?? PRICE_ALERT_THRESHOLDS.DEFAULT_PERCENTAGE;
  const absoluteThreshold = customThresholds?.absolute ?? PRICE_ALERT_THRESHOLDS.DEFAULT_ABSOLUTE;
  
  return absoluteChange > 0 && (
    percentageChange > percentageThreshold ||
    absoluteChange > absoluteThreshold
  );
}

/**
 * Validate and clamp search radius to allowed range
 * 
 * @param radius - Desired search radius in kilometers
 * @returns Clamped radius within min/max bounds
 */
export function validateSearchRadius(radius: number): number {
  return Math.max(
    LOCATION_THRESHOLDS.MIN_SEARCH_RADIUS_KM,
    Math.min(radius, LOCATION_THRESHOLDS.MAX_SEARCH_RADIUS_KM)
  );
}

/**
 * Sort alerts by severity
 * 
 * @param alerts - Array of alerts with severity property
 * @returns Sorted array (high -> medium -> low)
 */
export function sortAlertsBySeverity<T extends { severity: AlertSeverity }>(alerts: T[]): T[] {
  return [...alerts].sort((a, b) => ALERT_SEVERITY_ORDER[a.severity] - ALERT_SEVERITY_ORDER[b.severity]);
}
