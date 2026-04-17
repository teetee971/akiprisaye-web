/**
 * Premium Features Hook
 *
 * React hook to check premium subscription status and feature access
 *
 * Usage:
 * ```tsx
 * const { isPremium, hasFeature, loading } = usePremium();
 *
 * if (hasFeature('advancedHistory')) {
 *   // Show premium feature
 * }
 * ```
 */

import { useState, useEffect } from 'react';
import {
  getSubscriptionStatus,
  hasPremiumAccess,
  hasFeatureAccess,
  type PremiumFeatures,
  type SubscriptionStatus,
} from '../services/premiumService';
import { isAndroid } from '../services/platformService';

interface UsePremiumReturn {
  isPremium: boolean;
  loading: boolean;
  status: SubscriptionStatus | null;
  hasFeature: (feature: keyof PremiumFeatures) => boolean;
  isAndroid: boolean;
  refresh: () => Promise<void>;
}

/**
 * Hook to check premium subscription status
 */
export function usePremium(): UsePremiumReturn {
  const [isPremium, setIsPremium] = useState(false);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<SubscriptionStatus | null>(null);

  const loadStatus = async () => {
    setLoading(true);
    try {
      const subscriptionStatus = await getSubscriptionStatus();
      setStatus(subscriptionStatus);
      const premium = await hasPremiumAccess();
      setIsPremium(premium);
    } catch (error) {
      console.error('Failed to load premium status:', error);
      setIsPremium(false);
      setStatus(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatus();
  }, []);

  const hasFeature = (feature: keyof PremiumFeatures): boolean => {
    if (!status) return false;
    return status.features[feature] === true;
  };

  return {
    isPremium,
    loading,
    status,
    hasFeature,
    isAndroid: isAndroid(),
    refresh: loadStatus,
  };
}

/**
 * Hook to check a specific premium feature
 *
 * Usage:
 * ```tsx
 * const hasAdvancedHistory = useFeature('advancedHistory');
 * ```
 */
export function useFeature(feature: keyof PremiumFeatures): boolean {
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    hasFeatureAccess(feature).then(setHasAccess);
  }, [feature]);

  return hasAccess;
}
