/**
 * Feature Access Control System
 * Defines which features are available for each plan tier
 */

export type Plan =
  | 'FREE'
  | 'CITIZEN_PREMIUM'
  | 'PRO'
  | 'BUSINESS'
  | 'ENTERPRISE'
  | 'INSTITUTION';

// Simple pricing structure (for basic reference)
export const PLANS = {
  FREE: { price: 0 },
  CITIZEN: { price: 3.99 },
  PRO: { price: 19 },
  ENTERPRISE: { min: 2500, max: 25000 },
  INSTITUTION: { min: 500, max: 50000 }
}

export const PLAN_PRICES = {
  FREE: { monthly: 0, yearly: 0 },
  CITIZEN_PREMIUM: { monthly: 3.99, yearly: 39 },
  PRO: { monthly: 19, yearly: 190 },
  BUSINESS: { monthly: 99, yearly: 990 },
  ENTERPRISE: { monthly: null, yearly: 2500 }, // Starting price - private sector
  INSTITUTION: { monthly: null, yearly: 500 }, // Starting price - public sector
} as const;

export const FEATURES = {
  SHOPPING_LIST: ['FREE', 'CITIZEN_PREMIUM', 'PRO', 'BUSINESS', 'ENTERPRISE', 'INSTITUTION'],
  MAP_BASIC: ['FREE', 'CITIZEN_PREMIUM', 'PRO', 'BUSINESS', 'ENTERPRISE', 'INSTITUTION'],
  GEOLOCATION: ['FREE', 'CITIZEN_PREMIUM', 'PRO', 'BUSINESS', 'ENTERPRISE', 'INSTITUTION'],
  SCANNER_BASIC: ['FREE', 'CITIZEN_PREMIUM', 'PRO', 'BUSINESS', 'ENTERPRISE', 'INSTITUTION'],
  MULTI_TRIP_OPTIMIZATION: ['CITIZEN_PREMIUM', 'PRO', 'BUSINESS', 'ENTERPRISE', 'INSTITUTION'],
  TERRITORY_COMPARE: ['PRO', 'BUSINESS', 'ENTERPRISE', 'INSTITUTION'],
  EXPORT_PDF: ['CITIZEN_PREMIUM', 'PRO', 'BUSINESS', 'ENTERPRISE', 'INSTITUTION'],
  EXPORT_CSV: ['PRO', 'BUSINESS', 'ENTERPRISE', 'INSTITUTION'],
  DASHBOARDS: ['BUSINESS', 'ENTERPRISE', 'INSTITUTION'],
  API_READ_ONLY: ['BUSINESS', 'ENTERPRISE', 'INSTITUTION'],
  LONG_HISTORY: ['ENTERPRISE', 'INSTITUTION'],
  REPORTS_PUBLIC: ['INSTITUTION'],
  ALERTS_ADVANCED: ['CITIZEN_PREMIUM', 'PRO', 'BUSINESS', 'ENTERPRISE', 'INSTITUTION'],
  OFFLINE_MODE: ['CITIZEN_PREMIUM', 'PRO', 'BUSINESS', 'ENTERPRISE', 'INSTITUTION'],
} as const;

export type Feature = keyof typeof FEATURES;

/**
 * Check if a plan has access to a specific feature
 */
export const canUse = (plan: Plan, feature: Feature): boolean => {
  return FEATURES[feature].includes(plan);
};

/**
 * Get DOM-ROM-COM discounted price
 */
export const getDOMPrice = (plan: Plan, billingCycle: 'monthly' | 'yearly'): number | null => {
  const price = PLAN_PRICES[plan][billingCycle];
  if (price === null || price === 0) return price;
  
  // -30% discount for DOM-ROM-COM
  if (plan === 'PRO' || plan === 'BUSINESS') {
    return Math.round(price * 0.7 * 100) / 100;
  }
  
  return price;
};

/**
 * Get feature description
 */
export const getFeatureDescription = (feature: Feature): string => {
  const descriptions: Record<Feature, string> = {
    SHOPPING_LIST: 'Liste de courses intelligente',
    MAP_BASIC: 'Carte interactive des magasins',
    GEOLOCATION: 'Géolocalisation opt-in',
    SCANNER_BASIC: 'Scanner de tickets de caisse',
    MULTI_TRIP_OPTIMIZATION: 'Optimisation multi-trajets',
    TERRITORY_COMPARE: 'Comparaison inter-territoires',
    EXPORT_PDF: 'Export PDF citoyen',
    EXPORT_CSV: 'Export CSV pour analyses',
    DASHBOARDS: 'Tableaux de bord avancés',
    API_READ_ONLY: 'Accès API (lecture seule)',
    LONG_HISTORY: 'Historique longue durée',
    REPORTS_PUBLIC: 'Rapports publics institutionnels',
    ALERTS_ADVANCED: 'Alertes avancées',
    OFFLINE_MODE: 'Mode hors ligne renforcé',
  };
  
  return descriptions[feature];
};

export default {
  canUse,
  getDOMPrice,
  getFeatureDescription,
  PLAN_PRICES,
  FEATURES,
};
