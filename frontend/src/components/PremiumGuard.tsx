/**
 * Premium Feature Guard Component
 *
 * Wraps premium features and shows upgrade prompt if not subscribed
 *
 * Usage:
 * ```tsx
 * <PremiumGuard feature="advancedHistory">
 *   <AdvancedHistoryComponent />
 * </PremiumGuard>
 * ```
 */

import React, { type ReactNode } from 'react';
import { Lock, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { usePremium } from '../hooks/usePremium';
import type { PremiumFeatures } from '../services/premiumService';

interface PremiumGuardProps {
  feature: keyof PremiumFeatures;
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Premium Feature Guard
 *
 * Shows children if user has access to the feature,
 * otherwise shows an upgrade prompt
 */
export function PremiumGuard({ feature, children, fallback }: PremiumGuardProps) {
  const { hasFeature, loading, isAndroid } = usePremium();
  const navigate = useNavigate();

  // While loading, show nothing
  if (loading) {
    return null;
  }

  // If user has access, show the feature
  if (hasFeature(feature)) {
    return <>{children}</>;
  }

  // If custom fallback provided, use it
  if (fallback) {
    return <>{fallback}</>;
  }

  // Default: show upgrade prompt (only on Android)
  if (!isAndroid) {
    // On web, don't show premium features at all
    return null;
  }

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-2 border-blue-500 dark:border-blue-600 rounded-xl p-6 text-center">
      <div className="flex justify-center mb-4">
        <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center">
          <Lock className="w-8 h-8 text-white" />
        </div>
      </div>
      <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
        Fonctionnalité Premium
      </h3>
      <p className="text-slate-700 dark:text-slate-300 mb-4">
        Cette fonctionnalité est réservée aux abonnés CITOYEN+ ou ANALYSE.
      </p>
      <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
        L'accès citoyen reste gratuit avec toutes les fonctionnalités essentielles.
      </p>
      <button
        type="button"
        className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-xl"
        onClick={() => navigate('/pricing')}
      >
        <Sparkles className="w-5 h-5" />
        Découvrir Premium
      </button>
    </div>
  );
}

/**
 * Simple premium badge component
 */
export function PremiumBadge() {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-semibold rounded-full">
      <Sparkles className="w-3 h-3" />
      Premium
    </span>
  );
}

/**
 * Premium feature lock indicator
 */
export function PremiumLock({ className = '' }: { className?: string }) {
  return (
    <div className={`inline-flex items-center gap-1 ${className}`}>
      <Lock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
      <span className="text-xs font-medium text-blue-600 dark:text-blue-400">Premium</span>
    </div>
  );
}
