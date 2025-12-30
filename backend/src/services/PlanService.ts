/**
 * Feature Access Control System
 * NO FREEMIUM - All plans are paid
 * Defines which features are available for each plan tier
 */

export type Plan =
  | 'CITIZEN'
  | 'PRO'
  | 'BUSINESS'
  | 'ENTERPRISE'
  | 'INSTITUTION';

export const PLAN_PRICES = {
  CITIZEN: { 
    monthly: 4.99, 
    yearly: 49,
    description: 'Pour les citoyens - Accès complet aux outils de comparaison et d\'optimisation'
  },
  PRO: { 
    monthly: 19, 
    yearly: 190,
    description: 'Pour les enseignes & professionnels - Gestion des points de vente'
  },
  BUSINESS: { 
    monthly: 99, 
    yearly: 990,
    description: 'Pour les professionnels - Analytics avancés et marketplace'
  },
  ENTERPRISE: { 
    monthly: null, 
    yearly: 2500,
    description: 'Sur devis - Secteur privé, données agrégées et API'
  },
  INSTITUTION: { 
    monthly: null, 
    yearly: 500,
    description: 'Sur devis - Secteur public, tableaux de bord institutionnels'
  },
} as const;

export const FEATURES = {
  // Core Features (All paid plans)
  PRICE_COMPARISON: ['CITIZEN', 'PRO', 'BUSINESS', 'ENTERPRISE', 'INSTITUTION'],
  SHOPPING_LIST: ['CITIZEN', 'PRO', 'BUSINESS', 'ENTERPRISE', 'INSTITUTION'],
  MAP_BASIC: ['CITIZEN', 'PRO', 'BUSINESS', 'ENTERPRISE', 'INSTITUTION'],
  GEOLOCATION: ['CITIZEN', 'PRO', 'BUSINESS', 'ENTERPRISE', 'INSTITUTION'],
  SCANNER_BASIC: ['CITIZEN', 'PRO', 'BUSINESS', 'ENTERPRISE', 'INSTITUTION'],
  PRICE_ALERTS: ['CITIZEN', 'PRO', 'BUSINESS', 'ENTERPRISE', 'INSTITUTION'],
  TREND_PREDICTIONS: ['CITIZEN', 'PRO', 'BUSINESS', 'ENTERPRISE', 'INSTITUTION'],
  
  // Citizen Features
  MULTI_TRIP_OPTIMIZATION: ['CITIZEN', 'PRO', 'BUSINESS', 'ENTERPRISE', 'INSTITUTION'],
  TERRITORY_PRICE_COMPARE: ['CITIZEN', 'PRO', 'BUSINESS', 'ENTERPRISE', 'INSTITUTION'],
  EXPORT_PDF: ['CITIZEN', 'PRO', 'BUSINESS', 'ENTERPRISE', 'INSTITUTION'],
  ALERTS_ADVANCED: ['CITIZEN', 'PRO', 'BUSINESS', 'ENTERPRISE', 'INSTITUTION'],
  OFFLINE_MODE: ['CITIZEN', 'PRO', 'BUSINESS', 'ENTERPRISE', 'INSTITUTION'],
  
  // Professional Features
  STORE_MANAGEMENT: ['PRO', 'BUSINESS', 'ENTERPRISE'],
  REALTIME_PRICE_UPDATE: ['PRO', 'BUSINESS', 'ENTERPRISE'],
  GEO_VISIBILITY: ['PRO', 'BUSINESS', 'ENTERPRISE'],
  CONSULTATION_STATS: ['PRO', 'BUSINESS', 'ENTERPRISE'],
  MARKETPLACE_ACCESS: ['BUSINESS', 'ENTERPRISE'],
  EXPORT_CSV: ['PRO', 'BUSINESS', 'ENTERPRISE', 'INSTITUTION'],
  
  // Business & Enterprise Features
  ANALYTICS_ADVANCED: ['BUSINESS', 'ENTERPRISE', 'INSTITUTION'],
  DASHBOARDS: ['BUSINESS', 'ENTERPRISE', 'INSTITUTION'],
  MULTI_STORE_MANAGEMENT: ['BUSINESS', 'ENTERPRISE'],
  
  // Enterprise & Institution Features
  API_READ_ONLY: ['ENTERPRISE', 'INSTITUTION'],
  TERRITORIAL_DATA: ['ENTERPRISE', 'INSTITUTION'],
  LONG_HISTORY: ['ENTERPRISE', 'INSTITUTION'],
  COMPARATIVE_ANALYSIS: ['ENTERPRISE', 'INSTITUTION'],
  
  // Institution Only
  REPORTS_PUBLIC: ['INSTITUTION'],
  INSTITUTIONAL_DASHBOARDS: ['INSTITUTION'],
  REGULATED_EXPORT: ['INSTITUTION'],
  AI_QUOTES: ['ENTERPRISE', 'INSTITUTION'],
} as const;

export type Feature = keyof typeof FEATURES;

/**
 * Check if a plan has access to a specific feature
 */
export const canUse = (plan: Plan, feature: Feature): boolean => {
  return FEATURES[feature].includes(plan);
};

/**
 * Get DOM-ROM-COM territory-based pricing
 * Pricing varies by territory to reflect local economics
 */
export const getTerritoryPrice = (
  plan: Plan, 
  billingCycle: 'monthly' | 'yearly',
  territory?: string
): number | null => {
  const basePrice = PLAN_PRICES[plan][billingCycle];
  if (basePrice === null || basePrice === 0) return basePrice;
  
  // Territory-specific pricing adjustments
  // DOM-ROM territories may have adjusted pricing
  const territoryMultipliers: Record<string, number> = {
    'GP': 0.85, // Guadeloupe
    'MQ': 0.85, // Martinique
    'GF': 0.80, // Guyane
    'RE': 0.90, // Réunion
    'YT': 0.75, // Mayotte
    'PM': 1.0,  // Saint-Pierre-et-Miquelon
    'BL': 1.0,  // Saint-Barthélemy
    'MF': 1.0,  // Saint-Martin
    'WF': 0.80, // Wallis-et-Futuna
    'PF': 0.90, // Polynésie française
    'NC': 0.90, // Nouvelle-Calédonie
    'TF': 1.0,  // Terres australes
  };
  
  const multiplier = territory ? (territoryMultipliers[territory] || 1.0) : 1.0;
  return Math.round(basePrice * multiplier * 100) / 100;
};

/**
 * Get feature description
 */
export const getFeatureDescription = (feature: Feature): string => {
  const descriptions: Record<Feature, string> = {
    // Core
    PRICE_COMPARISON: 'Comparaison de prix multi-enseignes',
    SHOPPING_LIST: 'Liste de courses intelligente',
    MAP_BASIC: 'Carte interactive des magasins',
    GEOLOCATION: 'Géolocalisation opt-in',
    SCANNER_BASIC: 'Scanner de tickets de caisse',
    PRICE_ALERTS: 'Alertes de variation de prix',
    TREND_PREDICTIONS: 'Prévisions de tendances (non spéculatives)',
    
    // Citizen
    MULTI_TRIP_OPTIMIZATION: 'Optimisation par distance/coût/territoire',
    TERRITORY_PRICE_COMPARE: 'Comparaison inter-territoires',
    EXPORT_PDF: 'Export PDF citoyen',
    ALERTS_ADVANCED: 'Alertes avancées personnalisées',
    OFFLINE_MODE: 'Mode hors ligne renforcé',
    
    // Professional
    STORE_MANAGEMENT: 'Gestion des points de vente',
    REALTIME_PRICE_UPDATE: 'Mise à jour des prix en temps réel',
    GEO_VISIBILITY: 'Visibilité géolocalisée',
    CONSULTATION_STATS: 'Statistiques de consultation',
    MARKETPLACE_ACCESS: 'Intégration marketplace',
    EXPORT_CSV: 'Export CSV pour analyses',
    
    // Business
    ANALYTICS_ADVANCED: 'Analytics avancés',
    DASHBOARDS: 'Tableaux de bord personnalisés',
    MULTI_STORE_MANAGEMENT: 'Gestion multi-points de vente',
    
    // Enterprise/Institution
    API_READ_ONLY: 'Accès API sécurisé (lecture)',
    TERRITORIAL_DATA: 'Données agrégées territoriales',
    LONG_HISTORY: 'Historique longue durée',
    COMPARATIVE_ANALYSIS: 'Analyses comparatives inter-zones',
    REPORTS_PUBLIC: 'Rapports publics institutionnels',
    INSTITUTIONAL_DASHBOARDS: 'Tableaux de bord institutionnels',
    REGULATED_EXPORT: 'Export de données réglementé',
    AI_QUOTES: 'Devis générés par IA',
  };
  
  return descriptions[feature];
};

/**
 * Check if a plan is valid
 */
export const isValidPlan = (plan: string): plan is Plan => {
  return ['CITIZEN', 'PRO', 'BUSINESS', 'ENTERPRISE', 'INSTITUTION'].includes(plan);
};

/**
 * Get all features for a plan
 */
export const getFeatures = (plan: Plan): Feature[] => {
  const features: Feature[] = [];
  
  for (const [feature, plans] of Object.entries(FEATURES)) {
    if (plans.includes(plan)) {
      features.push(feature as Feature);
    }
  }
  
  return features;
};

/**
 * Get access denied message
 */
export const getAccessDeniedMessage = (feature: Feature, currentPlan: Plan): string => {
  const requiredPlans = FEATURES[feature];
  
  if (!requiredPlans || requiredPlans.length === 0) {
    return 'Cette fonctionnalité n\'est pas disponible';
  }
  
  const lowestPlan = requiredPlans[0];
  
  return `Cette fonctionnalité nécessite au minimum le plan ${lowestPlan}. Vous êtes actuellement sur le plan ${currentPlan}.`;
};

export default {
  canUse,
  getTerritoryPrice,
  getFeatureDescription,
  isValidPlan,
  getFeatures,
  getAccessDeniedMessage,
  PLAN_PRICES,
  FEATURES,
};
