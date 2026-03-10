import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { FeatureId, PLAN_DEFINITIONS, PlanId } from './plans';

export interface EntitlementsContextValue {
  plan: PlanId;
  can: (featureId: FeatureId) => boolean;
  quota: (name: keyof (typeof PLAN_DEFINITIONS)[PlanId]['quotas']) => number;
  explain: (featureId: FeatureId) => string;
}

const EntitlementsContext = createContext<EntitlementsContextValue | null>(null);

/**
 * Maps the Firestore user.plan string and auth role to a billing PlanId.
 * Admin/observateur roles always get the corresponding institutional plan.
 * Registered plan values (from Inscription.tsx) are mapped to PlanId.
 */
function resolvePlanId(firestorePlan: string | undefined, role: string): PlanId {
  if (role === 'creator') return 'CREATOR';
  if (role === 'admin') return 'INSTITUTION';
  if (role === 'observateur') return 'PRO';
  const map: Record<string, PlanId> = {
    citizen_premium: 'CITIZEN_PREMIUM',
    citizen: 'CITIZEN_PREMIUM',
    professional: 'PRO',
    pro: 'PRO',
    business: 'BUSINESS',
    institution: 'INSTITUTION',
  };
  return (firestorePlan && map[firestorePlan.toLowerCase()]) || 'FREE';
}

const FEATURE_MIN_PLAN: Partial<Record<FeatureId, PlanId>> = {
  PRICE_HISTORY_ADVANCED: 'CITIZEN_PREMIUM',
  PRICE_ALERTS: 'CITIZEN_PREMIUM',
  EXPORT_ADVANCED: 'PRO',
  MULTI_TERRITORY: 'PRO',
  SHARED_LISTS: 'BUSINESS',
  DASHBOARD_BUDGET: 'BUSINESS',
  REPORTS_AUTO: 'INSTITUTION',
  API_ACCESS: 'INSTITUTION',
};

export function EntitlementProvider({ children }: { children: React.ReactNode }) {
  const { user, userRole } = useAuth();

  const [plan, setPlan] = useState<PlanId>(() => {
    const override = import.meta.env['VITE_PLAN_OVERRIDE'] as PlanId | undefined;
    if (override && PLAN_DEFINITIONS[override]) return override;
    return 'FREE';
  });

  useEffect(() => {
    const override = import.meta.env['VITE_PLAN_OVERRIDE'] as PlanId | undefined;
    if (override && PLAN_DEFINITIONS[override]) {
      setPlan(override);
      return;
    }

    if (!user || !db) {
      setPlan('FREE');
      return;
    }

    let cancelled = false;
    getDoc(doc(db, 'users', user.uid))
      .then((snap) => {
        if (cancelled) return;
        const firestorePlan: string | undefined = snap.exists() ? snap.data()?.plan : undefined;
        setPlan(resolvePlanId(firestorePlan, userRole));
      })
      .catch(() => {
        if (!cancelled) setPlan(resolvePlanId(undefined, userRole));
      });
    return () => {
      cancelled = true;
    };
  }, [user, userRole]);

  const value = useMemo<EntitlementsContextValue>(() => {
    const definition = PLAN_DEFINITIONS[plan];
    return {
      plan,
      can: (featureId) => Boolean(definition.features[featureId]),
      quota: (name) => definition.quotas[name],
      explain: (featureId) => {
        if (definition.features[featureId]) return 'Disponible dans votre plan actuel';
        const required = FEATURE_MIN_PLAN[featureId] ?? 'PRO';
        return `Disponible à partir du plan ${required}`;
      },
    };
  }, [plan]);

  return <EntitlementsContext.Provider value={value}>{children}</EntitlementsContext.Provider>;
}

function useEntitlementsContext() {
  const context = useContext(EntitlementsContext);
  if (!context) {
    throw new Error('useEntitlements doit être utilisé dans EntitlementProvider');
  }
  return context;
}

export { useEntitlementsContext };
