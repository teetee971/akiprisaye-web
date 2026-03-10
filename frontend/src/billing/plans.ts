export type PlanId = 'FREE' | 'FREEMIUM' | 'CITIZEN_PREMIUM' | 'PRO' | 'BUSINESS' | 'INSTITUTION' | 'CREATOR';

export type FeatureId =
  | 'WATCHLIST_BASE'
  | 'PRICE_REFRESH'
  | 'PRICE_HISTORY_BASIC'
  | 'PRICE_HISTORY_ADVANCED'
  | 'PRICE_ALERTS'
  | 'EXPORT_CSV_BASIC'
  | 'EXPORT_ADVANCED'
  | 'MULTI_TERRITORY'
  | 'SHARED_LISTS'
  | 'DASHBOARD_BUDGET'
  | 'REPORTS_AUTO'
  | 'API_ACCESS';

export interface PlanDefinition {
  id: PlanId;
  label: string;
  features: Record<FeatureId, boolean>;
  quotas: {
    maxItems: number;
    refreshPerDay: number;
    maxTerritories: number;
  };
}

const allFeatures = {
  WATCHLIST_BASE: false,
  PRICE_REFRESH: false,
  PRICE_HISTORY_BASIC: false,
  PRICE_HISTORY_ADVANCED: false,
  PRICE_ALERTS: false,
  EXPORT_CSV_BASIC: false,
  EXPORT_ADVANCED: false,
  MULTI_TERRITORY: false,
  SHARED_LISTS: false,
  DASHBOARD_BUDGET: false,
  REPORTS_AUTO: false,
  API_ACCESS: false,
};

export const PLAN_DEFINITIONS: Record<PlanId, PlanDefinition> = {
  FREE: {
    id: 'FREE',
    label: 'Free',
    features: {
      ...allFeatures,
      WATCHLIST_BASE: true,
      PRICE_REFRESH: true,
      PRICE_HISTORY_BASIC: true,
      EXPORT_CSV_BASIC: true,
    },
    quotas: { maxItems: 30, refreshPerDay: 10, maxTerritories: 1 },
  },
  FREEMIUM: {
    id: 'FREEMIUM',
    label: 'Freemium',
    features: {
      ...allFeatures,
      WATCHLIST_BASE: true,
      PRICE_REFRESH: true,
      PRICE_HISTORY_BASIC: true,
      EXPORT_CSV_BASIC: true,
    },
    quotas: { maxItems: 50, refreshPerDay: 20, maxTerritories: 1 },
  },
  CITIZEN_PREMIUM: {
    id: 'CITIZEN_PREMIUM',
    label: 'Citoyen Premium',
    features: {
      ...allFeatures,
      WATCHLIST_BASE: true,
      PRICE_REFRESH: true,
      PRICE_HISTORY_BASIC: true,
      PRICE_HISTORY_ADVANCED: true,
      PRICE_ALERTS: true,
      EXPORT_CSV_BASIC: true,
    },
    quotas: { maxItems: 100, refreshPerDay: 50, maxTerritories: 2 },
  },
  PRO: {
    id: 'PRO',
    label: 'Pro',
    features: {
      ...allFeatures,
      WATCHLIST_BASE: true,
      PRICE_REFRESH: true,
      PRICE_HISTORY_BASIC: true,
      PRICE_HISTORY_ADVANCED: true,
      PRICE_ALERTS: true,
      EXPORT_CSV_BASIC: true,
      EXPORT_ADVANCED: true,
      MULTI_TERRITORY: true,
    },
    quotas: { maxItems: 300, refreshPerDay: 500, maxTerritories: 5 },
  },
  BUSINESS: {
    id: 'BUSINESS',
    label: 'Business',
    features: {
      ...allFeatures,
      WATCHLIST_BASE: true,
      PRICE_REFRESH: true,
      PRICE_HISTORY_BASIC: true,
      PRICE_HISTORY_ADVANCED: true,
      PRICE_ALERTS: true,
      EXPORT_CSV_BASIC: true,
      EXPORT_ADVANCED: true,
      MULTI_TERRITORY: true,
      SHARED_LISTS: true,
      DASHBOARD_BUDGET: true,
    },
    quotas: { maxItems: 2000, refreshPerDay: 5000, maxTerritories: 10 },
  },
  INSTITUTION: {
    id: 'INSTITUTION',
    label: 'Institution',
    features: {
      ...allFeatures,
      WATCHLIST_BASE: true,
      PRICE_REFRESH: true,
      PRICE_HISTORY_BASIC: true,
      PRICE_HISTORY_ADVANCED: true,
      PRICE_ALERTS: true,
      EXPORT_CSV_BASIC: true,
      EXPORT_ADVANCED: true,
      MULTI_TERRITORY: true,
      SHARED_LISTS: true,
      DASHBOARD_BUDGET: true,
      REPORTS_AUTO: true,
      API_ACCESS: true,
    },
    quotas: { maxItems: 20000, refreshPerDay: 100000, maxTerritories: 20 },
  },
  CREATOR: {
    id: 'CREATOR',
    label: 'Créateur',
    features: {
      WATCHLIST_BASE: true,
      PRICE_REFRESH: true,
      PRICE_HISTORY_BASIC: true,
      PRICE_HISTORY_ADVANCED: true,
      PRICE_ALERTS: true,
      EXPORT_CSV_BASIC: true,
      EXPORT_ADVANCED: true,
      MULTI_TERRITORY: true,
      SHARED_LISTS: true,
      DASHBOARD_BUDGET: true,
      REPORTS_AUTO: true,
      API_ACCESS: true,
    },
    quotas: { maxItems: 999999999, refreshPerDay: 999999999, maxTerritories: 999999999 },
  },
};
