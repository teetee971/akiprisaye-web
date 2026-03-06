/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useMemo } from 'react';
import { FeatureId, PLAN_DEFINITIONS, PlanId } from './plans';

export interface EntitlementsContextValue {
  plan: PlanId;
  can: (featureId: FeatureId) => boolean;
  quota: (name: keyof (typeof PLAN_DEFINITIONS)[PlanId]['quotas']) => number;
  explain: (featureId: FeatureId) => string;
}

const EntitlementsContext = createContext<EntitlementsContextValue | null>(null);

function getPlanFromAuthUser(): PlanId | null {
  // TODO(auth): brancher le plan depuis le profil utilisateur authentifié.
  return null;
}

function resolvePlan(): PlanId {
  const override = import.meta.env['VITE_PLAN_OVERRIDE'] as PlanId | undefined;
  if (override && PLAN_DEFINITIONS[override]) return override;
  return getPlanFromAuthUser() ?? 'FREE';
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
  const plan = resolvePlan();

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
