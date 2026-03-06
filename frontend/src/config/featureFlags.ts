/**
 * Feature Flags Configuration
 * 
 * Version: v1.0.3
 * Purpose: Controlled feature rollout framework
 * 
 * IMPORTANT: All flags are DISABLED by default in production.
 * Features are only enabled after thorough testing and validation.
 * 
 * @module featureFlags
 */

/**
 * Feature flag interface for type safety
 */
export interface FeatureFlags {
  /** Extended analytics and insights (v1.1+) */
  FEATURE_EXTENDED_ANALYTICS: boolean;
  
  /** Advanced filtering options in comparator (v1.1+) */
  FEATURE_ADVANCED_FILTERS: boolean;
  
  /** Data export functionality for users (v1.2+) */
  FEATURE_EXPORT_DATA: boolean;
  
  /** Custom price alerts and notifications (v1.2+) */
  FEATURE_CUSTOM_ALERTS: boolean;
  
  /** Multi-territory comparison tool (v1.2+) */
  FEATURE_MULTI_TERRITORY_COMPARE: boolean;
  
  /** AI-powered insights and predictions (v2.0+) */
  FEATURE_AI_INSIGHTS: boolean;
  
  /** Institutional API access (v2.0+) */
  FEATURE_INSTITUTIONAL_API: boolean;
  
  /** Price comparison v1.4.0 */
  FEATURE_PRICE_COMPARISON: boolean;
  
  /** Product insight analysis v1.5.0 */
  FEATURE_PRODUCT_INSIGHT: boolean;
  
  /** Product dossier v1.6.0 */
  FEATURE_PRODUCT_DOSSIER: boolean;
  
  /** Ingredient evolution tracking v1.7.0 */
  FEATURE_INGREDIENT_EVOLUTION: boolean;
  
  /** Open data export v1.8.0 */
  FEATURE_OPEN_DATA_EXPORT: boolean;
  
  /** Product history v1.9.0-v1.10.0 */
  FEATURE_PRODUCT_HISTORY: boolean;
  
  /** Cost of living / IEVR v2.1.0 */
  FEATURE_COST_OF_LIVING: boolean;
}

/**
 * Default feature flags configuration
 * 
 * ALL FLAGS DISABLED - Features inactive in production
 * Enable only in development for testing
 */
export const featureFlags: FeatureFlags = {
  FEATURE_EXTENDED_ANALYTICS: false,
  FEATURE_ADVANCED_FILTERS: false,
  FEATURE_EXPORT_DATA: false,
  FEATURE_CUSTOM_ALERTS: false,
  FEATURE_MULTI_TERRITORY_COMPARE: false,
  FEATURE_AI_INSIGHTS: false,
  FEATURE_INSTITUTIONAL_API: false,
  FEATURE_PRICE_COMPARISON: false,
  FEATURE_PRODUCT_INSIGHT: false,
  FEATURE_PRODUCT_DOSSIER: false,
  FEATURE_INGREDIENT_EVOLUTION: false,
  FEATURE_OPEN_DATA_EXPORT: false,
  FEATURE_PRODUCT_HISTORY: false,
  FEATURE_COST_OF_LIVING: false,
};

/**
 * Check if a feature is enabled
 * 
 * @param flagName - Name of the feature flag to check
 * @returns boolean - true if feature is enabled
 * 
 * @example
 * if (isFeatureEnabled('FEATURE_EXTENDED_ANALYTICS')) {
 *   // Feature-specific code
 * }
 */
export function isFeatureEnabled(flagName: keyof FeatureFlags): boolean {
  // In development, can be overridden via environment
  if (import.meta.env.DEV && import.meta.env[`VITE_${flagName}`]) {
    return import.meta.env[`VITE_${flagName}`] === 'true';
  }
  
  // Production: use default configuration (all disabled)
  return featureFlags[flagName];
}

/**
 * Get all feature flags status
 * Useful for debugging and admin interfaces
 * 
 * @returns FeatureFlags object with current status
 */
export function getAllFeatureFlags(): FeatureFlags {
  return { ...featureFlags };
}

/**
 * Development-only: Override feature flag for testing
 * NEVER used in production
 * 
 * @param flagName - Feature flag to override
 * @param value - New value for the flag
 */
export function devOverrideFlag(flagName: keyof FeatureFlags, value: boolean): void {
  if (!import.meta.env.DEV) {
    console.warn('devOverrideFlag: Cannot override flags in production');
    return;
  }
  
  featureFlags[flagName] = value;
  console.log(`Feature flag ${flagName} overridden to ${value}`);
}

// ---------------------------------------------------------------------------
// Territory-scoped feature flags
// Allows activating specific features only for certain territories.
// ---------------------------------------------------------------------------

import type { TerritoryCode } from '../constants/territories';

/**
 * Maps each flag to the set of territories where it is enabled.
 * An empty array means the feature is disabled in all territories.
 * '*' as the only entry means the feature is enabled everywhere.
 */
const TERRITORY_FLAGS: Partial<Record<keyof FeatureFlags, TerritoryCode[] | ['*']>> = {
  /** Real-time observatory enabled for the 4 main DOM territories */
  FEATURE_EXTENDED_ANALYTICS: ['gp', 'mq', 're', 'gf'],

  /** Multi-territory comparison everywhere */
  FEATURE_MULTI_TERRITORY_COMPARE: ['*'],

  /** Cost-of-living index enabled for DOM territories */
  FEATURE_COST_OF_LIVING: ['gp', 'mq', 're', 'gf', 'yt'],

  /** Custom alerts: DOM + COM */
  FEATURE_CUSTOM_ALERTS: ['gp', 'mq', 're', 'gf', 'yt', 'pf', 'nc'],

  /** Product history everywhere */
  FEATURE_PRODUCT_HISTORY: ['*'],
};

/**
 * Check whether a feature flag is enabled for a specific territory.
 *
 * If there is no territory override defined for the flag, falls back to
 * the global `isFeatureEnabled()` logic.
 *
 * @example
 * if (isFeatureEnabledForTerritory('FEATURE_COST_OF_LIVING', userTerritory)) {
 *   // show IEVR widget
 * }
 */
export function isFeatureEnabledForTerritory(
  flagName: keyof FeatureFlags,
  territory: TerritoryCode,
): boolean {
  const territories = TERRITORY_FLAGS[flagName];
  if (!territories) {
    // No territory override: fall back to global flag
    return isFeatureEnabled(flagName);
  }
  if (territories[0] === '*') return true;
  return (territories as TerritoryCode[]).includes(territory);
}

/**
 * Return all feature flags evaluated for a given territory.
 * Useful for admin dashboards and debugging.
 */
export function getFeatureFlagsForTerritory(territory: TerritoryCode): Record<keyof FeatureFlags, boolean> {
  const keys = Object.keys(featureFlags) as (keyof FeatureFlags)[];
  return Object.fromEntries(
    keys.map((k) => [k, isFeatureEnabledForTerritory(k, territory)]),
  ) as Record<keyof FeatureFlags, boolean>;
}
