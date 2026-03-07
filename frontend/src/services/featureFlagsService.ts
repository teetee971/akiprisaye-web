 
/**
 * Feature Flags Service
 * 
 * Silent preparation for future paid modes without activating them.
 * PROMPT 9: Préparation silencieuse du futur payant (sans activer)
 * 
 * Modes:
 * - Free: Always active, default mode
 * - Pro: Business features (not yet activated)
 * - Collectivité: Municipality/institutional features (not yet activated)
 */

// Feature flag types
export type FeatureMode = 'free' | 'pro' | 'collectivite';

export interface UserFeatureFlags {
  mode: FeatureMode;
  features: {
    // Free features (always available)
    basicComparison: boolean;
    storeDetail: boolean;
    basket: boolean;
    priceHistory: boolean;
    
    // Pro features (hidden for now)
    advancedAnalytics: boolean;
    bulkExport: boolean;
    apiAccess: boolean;
    customReports: boolean;
    
    // Collectivité features (hidden for now)
    territoryDashboard: boolean;
    policyTools: boolean;
    aggregatedData: boolean;
    institutionalReports: boolean;
  };
}

/**
 * Get default feature flags for free mode
 */
export function getDefaultFeatureFlags(): UserFeatureFlags {
  return {
    mode: 'free',
    features: {
      // Free features - always enabled
      basicComparison: true,
      storeDetail: true,
      basket: true,
      priceHistory: true,
      
      // Pro features - disabled by default
      advancedAnalytics: false,
      bulkExport: false,
      apiAccess: false,
      customReports: false,
      
      // Collectivité features - disabled by default
      territoryDashboard: false,
      policyTools: false,
      aggregatedData: false,
      institutionalReports: false,
    },
  };
}

/**
 * Get feature flags for a specific user
 * 
 * @param userId - User identifier (optional)
 * @returns Feature flags for the user
 * 
 * NOTE: This currently returns default flags for everyone.
 * In the future, this will check user subscription status from database.
 */
export function getUserFeatureFlags(userId?: string): UserFeatureFlags {
  // For now, everyone gets free mode
  // TODO: In the future, check user subscription in database
  return getDefaultFeatureFlags();
}

/**
 * Check if user has access to a specific feature
 * 
 * @param userId - User identifier (optional)
 * @param feature - Feature to check
 * @returns true if user has access, false otherwise
 */
export function hasFeatureAccess(
  userId: string | undefined,
  feature: keyof UserFeatureFlags['features']
): boolean {
  const flags = getUserFeatureFlags(userId);
  return flags.features[feature];
}

/**
 * Get user mode
 * 
 * @param userId - User identifier (optional)
 * @returns Current user mode
 */
export function getUserMode(userId?: string): FeatureMode {
  const flags = getUserFeatureFlags(userId);
  return flags.mode;
}

/**
 * Check if a mode is active
 * 
 * @param userId - User identifier (optional)
 * @param mode - Mode to check
 * @returns true if mode is active, false otherwise
 */
export function isModeActive(userId: string | undefined, mode: FeatureMode): boolean {
  return getUserMode(userId) === mode;
}

/**
 * Activate pro mode for a user (internal function, not exposed to users yet)
 * 
 * @param userId - User identifier
 * @returns Updated feature flags
 * 
 * NOTE: This function is prepared but NOT CALLED anywhere yet.
 * It will be activated when pro mode launches.
 */
export function activateProMode(userId: string): UserFeatureFlags {
  return {
    mode: 'pro',
    features: {
      // Free features
      basicComparison: true,
      storeDetail: true,
      basket: true,
      priceHistory: true,
      
      // Pro features - enabled for pro users
      advancedAnalytics: true,
      bulkExport: true,
      apiAccess: true,
      customReports: true,
      
      // Collectivité features - still disabled
      territoryDashboard: false,
      policyTools: false,
      aggregatedData: false,
      institutionalReports: false,
    },
  };
}

/**
 * Activate collectivité mode for a user (internal function, not exposed to users yet)
 * 
 * @param userId - User identifier
 * @returns Updated feature flags
 * 
 * NOTE: This function is prepared but NOT CALLED anywhere yet.
 * It will be activated when collectivité mode launches.
 */
export function activateCollectiviteMode(userId: string): UserFeatureFlags {
  return {
    mode: 'collectivite',
    features: {
      // Free features
      basicComparison: true,
      storeDetail: true,
      basket: true,
      priceHistory: true,
      
      // Pro features - some enabled for collectivités
      advancedAnalytics: true,
      bulkExport: true,
      apiAccess: true,
      customReports: true,
      
      // Collectivité features - enabled for collectivités
      territoryDashboard: true,
      policyTools: true,
      aggregatedData: true,
      institutionalReports: true,
    },
  };
}
