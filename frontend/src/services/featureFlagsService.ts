/**
 * Feature Flags Service
 *
 * Contrôle l'accès aux fonctionnalités selon le mode de l'utilisateur.
 * PROMPT 9: Préparation silencieuse du futur payant (sans activer)
 *
 * Modes:
 * - Free: Always active, default mode
 * - Pro: Business features
 * - Collectivité: Municipality/institutional features
 *
 * V2 : getUserFeatureFlagsAsync() vérifie l'abonnement depuis Firestore.
 *      getUserFeatureFlags() reste synchrone et retourne le mode free
 *      (utilisé comme fallback avant le chargement async).
 */

import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

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

    // Pro features
    advancedAnalytics: boolean;
    bulkExport: boolean;
    apiAccess: boolean;
    customReports: boolean;

    // Collectivité features
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
 * Get feature flags for a specific user (async, checks Firestore subscription).
 *
 * Reads the document `subscriptions/{userId}` from Firestore.
 * Expected document shape: { mode: 'free' | 'pro' | 'collectivite', validUntil?: string }
 *
 * Falls back to free mode on any error or missing document.
 */
export async function getUserFeatureFlagsAsync(userId?: string): Promise<UserFeatureFlags> {
  if (!userId || !db) return getDefaultFeatureFlags();

  try {
    const ref = doc(db, 'subscriptions', userId);
    const snap = await getDoc(ref);

    if (!snap.exists()) return getDefaultFeatureFlags();

    const data = snap.data() as { mode?: string; validUntil?: string };

    // Check subscription validity
    if (data.validUntil) {
      const expiry = new Date(data.validUntil);
      if (expiry < new Date()) return getDefaultFeatureFlags();
    }

    const mode = data.mode as FeatureMode | undefined;
    if (mode === 'pro') return activateProMode(userId);
    if (mode === 'collectivite') return activateCollectiviteMode(userId);
  } catch {
    // Firestore unavailable (offline, quota, etc.) — degrade gracefully
  }

  return getDefaultFeatureFlags();
}

/**
 * Get feature flags synchronously (always returns free mode).
 * Use getUserFeatureFlagsAsync() for the full Firestore-backed check.
 *
 * @param userId - User identifier (optional)
 * @returns Feature flags for the user (free mode)
 */
export function getUserFeatureFlags(userId?: string): UserFeatureFlags {
  void userId; // parameter reserved for future cache lookup
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
 * Activate pro mode for a user.
 * Called internally by getUserFeatureFlagsAsync() after Firestore confirmation.
 *
 * @param _userId - User identifier (reserved for future per-user customisation)
 * @returns Pro feature flags
 */
export function activateProMode(_userId: string): UserFeatureFlags {
  return {
    mode: 'pro',
    features: {
      basicComparison: true,
      storeDetail: true,
      basket: true,
      priceHistory: true,
      advancedAnalytics: true,
      bulkExport: true,
      apiAccess: true,
      customReports: true,
      territoryDashboard: false,
      policyTools: false,
      aggregatedData: false,
      institutionalReports: false,
    },
  };
}

/**
 * Activate collectivité mode for a user.
 * Called internally by getUserFeatureFlagsAsync() after Firestore confirmation.
 *
 * @param _userId - User identifier (reserved for future per-user customisation)
 * @returns Collectivité feature flags
 */
export function activateCollectiviteMode(_userId: string): UserFeatureFlags {
  return {
    mode: 'collectivite',
    features: {
      basicComparison: true,
      storeDetail: true,
      basket: true,
      priceHistory: true,
      advancedAnalytics: true,
      bulkExport: true,
      apiAccess: true,
      customReports: true,
      territoryDashboard: true,
      policyTools: true,
      aggregatedData: true,
      institutionalReports: true,
    },
  };
}
