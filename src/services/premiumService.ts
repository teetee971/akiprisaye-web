/**
 * Premium Status Service
 * 
 * Manages premium subscription status for Android app
 * 
 * CONTEXT (NON-NEGOTIABLE):
 * - CITOYEN mode is 100% FREE forever (web and Android)
 * - Premium features only available via Google Play Billing (Android only)
 * - No payment on web version
 * - Premium status is checked via Google Play Billing API
 * 
 * PREMIUM FEATURES:
 * - Advanced price history (3+ years)
 * - Multi-store comparison
 * - Export features (CSV/PDF)
 * - Price alerts & notifications
 * - Territorial analytics
 */

import { isAndroid } from './platformService';

/**
 * Premium subscription tiers
 */
export enum SubscriptionTier {
  CITOYEN = 'citoyen', // Free tier - always available
  CITOYEN_PLUS = 'citoyen_plus', // Premium tier 1
  ANALYSE = 'analyse', // Premium tier 2
}

/**
 * Premium feature flags
 */
export interface PremiumFeatures {
  advancedHistory: boolean; // 3+ years price history
  multiStoreCompare: boolean; // Compare prices across multiple stores
  advancedExport: boolean; // CSV/PDF exports
  priceAlerts: boolean; // Price change notifications
  territorialAnalytics: boolean; // Advanced territorial data
}

/**
 * Premium subscription status
 */
export interface SubscriptionStatus {
  isActive: boolean;
  tier: SubscriptionTier;
  features: PremiumFeatures;
  expiryDate: Date | null;
}

/**
 * Local storage key for premium status (temporary, until Google Play Billing is integrated)
 */
const PREMIUM_STATUS_KEY = 'akiprisaye_premium_status';

/**
 * Get current subscription status
 * 
 * For now, returns CITOYEN (free) tier by default
 * TODO: Integrate with Google Play Billing API
 */
export async function getSubscriptionStatus(): Promise<SubscriptionStatus> {
  // Default to free tier
  const defaultStatus: SubscriptionStatus = {
    isActive: false,
    tier: SubscriptionTier.CITOYEN,
    features: {
      advancedHistory: false,
      multiStoreCompare: false,
      advancedExport: false,
      priceAlerts: false,
      territorialAnalytics: false,
    },
    expiryDate: null,
  };

  // On web, always return free tier
  if (!isAndroid()) {
    return defaultStatus;
  }

  // On Android, check local storage (temporary until Google Play Billing integration)
  try {
    const stored = localStorage.getItem(PREMIUM_STATUS_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        ...parsed,
        expiryDate: parsed.expiryDate ? new Date(parsed.expiryDate) : null,
      };
    }
  } catch (error) {
    console.warn('Failed to get premium status from storage:', error);
  }

  return defaultStatus;
}

/**
 * Check if user has an active premium subscription
 */
export async function hasPremiumAccess(): Promise<boolean> {
  const status = await getSubscriptionStatus();
  return status.isActive && status.tier !== SubscriptionTier.CITOYEN;
}

/**
 * Check if a specific premium feature is available
 */
export async function hasFeatureAccess(feature: keyof PremiumFeatures): Promise<boolean> {
  const status = await getSubscriptionStatus();
  return status.features[feature] === true;
}

/**
 * Get feature flags based on subscription status
 */
export async function getFeatureFlags(): Promise<PremiumFeatures> {
  const status = await getSubscriptionStatus();
  return status.features;
}

/**
 * Set subscription status (for testing - will be replaced by Google Play Billing)
 * @internal
 */
export function setSubscriptionStatus(status: SubscriptionStatus): void {
  try {
    localStorage.setItem(PREMIUM_STATUS_KEY, JSON.stringify(status));
  } catch (error) {
    console.warn('Failed to save premium status:', error);
  }
}

/**
 * Clear subscription status (for testing)
 * @internal
 */
export function clearSubscriptionStatus(): void {
  try {
    localStorage.removeItem(PREMIUM_STATUS_KEY);
  } catch (error) {
    console.warn('Failed to clear premium status:', error);
  }
}

/**
 * Get premium feature configuration based on tier
 */
export function getPremiumFeatures(tier: SubscriptionTier): PremiumFeatures {
  switch (tier) {
    case SubscriptionTier.CITOYEN:
      // Free tier - no premium features
      return {
        advancedHistory: false,
        multiStoreCompare: false,
        advancedExport: false,
        priceAlerts: false,
        territorialAnalytics: false,
      };

    case SubscriptionTier.CITOYEN_PLUS:
      // Premium tier 1 - comfort features
      return {
        advancedHistory: true, // 3 years history
        multiStoreCompare: true,
        advancedExport: true, // PDF export
        priceAlerts: false,
        territorialAnalytics: false,
      };

    case SubscriptionTier.ANALYSE:
      // Premium tier 2 - all features
      return {
        advancedHistory: true, // Extended history
        multiStoreCompare: true,
        advancedExport: true, // CSV + PDF
        priceAlerts: true,
        territorialAnalytics: true,
      };

    default:
      return getPremiumFeatures(SubscriptionTier.CITOYEN);
  }
}

/**
 * GUARANTEE: CITOYEN mode is always available
 * This function always returns true to ensure free access is never blocked
 */
export function hasCitoyenAccess(): boolean {
  return true; // CITOYEN mode is ALWAYS available - NON-NEGOTIABLE
}
