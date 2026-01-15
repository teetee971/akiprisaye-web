/**
 * Access Levels System
 * Service civique numérique - Observatoire public indépendant
 * L'accès aux données essentielles est libre
 */

export type AccessLevel =
  | 'PUBLIC'
  | 'CITIZEN'
  | 'PROFESSIONAL'
  | 'INSTITUTIONAL';

export const ACCESS_LEVEL_PRICES = {
  PUBLIC: { 
    monthly: 0, 
    yearly: 0,
    description: 'Accès gratuit — Scan illimité, comparaisons basiques'
  },
  CITIZEN: { 
    monthly: 3.99, 
    yearly: 39,
    description: 'Citoyen — Scan illimité, OCR, historique, alertes'
  },
  PROFESSIONAL: { 
    monthly: 19, 
    yearly: 190,
    description: 'Professionnel — Comparaisons temporelles, exports, agrégations'
  },
  INSTITUTIONAL: { 
    monthly: null, 
    yearly: null,
    description: 'Institution — Licence annuelle, données publiques agrégées'
  },
} as const;

export const FEATURES = {
  // Accès Public (Gratuit pour tous - avec inscription)
  PRICE_COMPARISON: ['PUBLIC', 'CITIZEN', 'PROFESSIONAL', 'INSTITUTIONAL'],
  TERRITORY_VIEW: ['PUBLIC', 'CITIZEN', 'PROFESSIONAL', 'INSTITUTIONAL'],
  PRICE_SOURCES_VISIBLE: ['PUBLIC', 'CITIZEN', 'PROFESSIONAL', 'INSTITUTIONAL'],
  BASIC_HISTORY: ['PUBLIC', 'CITIZEN', 'PROFESSIONAL', 'INSTITUTIONAL'],
  READ_ONLY_ACCESS: ['PUBLIC', 'CITIZEN', 'PROFESSIONAL', 'INSTITUTIONAL'],
  NO_ADS: ['PUBLIC', 'CITIZEN', 'PROFESSIONAL', 'INSTITUTIONAL'],
  SCAN_EAN_UNLIMITED: ['PUBLIC', 'CITIZEN', 'PROFESSIONAL', 'INSTITUTIONAL'],
  
  // Accès Citoyen (3.99€/mois)
  OCR_INGREDIENTS: ['CITIZEN', 'PROFESSIONAL', 'INSTITUTIONAL'],
  ENRICHED_PRODUCT_INFO: ['CITIZEN', 'PROFESSIONAL', 'INSTITUTIONAL'],
  LOCAL_PRICE_ALERTS: ['CITIZEN', 'PROFESSIONAL', 'INSTITUTIONAL'],
  PERSONAL_HISTORY: ['CITIZEN', 'PROFESSIONAL', 'INSTITUTIONAL'],
  CITIZEN_REPORTING: ['CITIZEN', 'PROFESSIONAL', 'INSTITUTIONAL'],
  
  // Accès Professionnel (19€/mois)
  MULTI_BRAND_TEMPORAL: ['PROFESSIONAL', 'INSTITUTIONAL'],
  LONG_HISTORY_12_36_MONTHS: ['PROFESSIONAL', 'INSTITUTIONAL'],
  CSV_JSON_EXPORT: ['PROFESSIONAL', 'INSTITUTIONAL'],
  TERRITORIAL_AGGREGATION: ['PROFESSIONAL', 'INSTITUTIONAL'],
  EAN_SEARCH_HISTORY: ['PROFESSIONAL', 'INSTITUTIONAL'],
  
  // Licence Institutionnelle (Sur devis)
  PUBLIC_AGGREGATED_DATA: ['INSTITUTIONAL'],
  AUDITABILITY: ['INSTITUTIONAL'],
  STRUCTURED_OPEN_DATA: ['INSTITUTIONAL'],
  TERRITORIAL_INTERNATIONAL_COMPARISON: ['INSTITUTIONAL'],
  OFFICIAL_OBSERVATORY: ['INSTITUTIONAL'],
} as const;

export type Feature = keyof typeof FEATURES;

/**
 * Check if an access level has a specific feature
 */
export const canUse = (level: AccessLevel, feature: Feature): boolean => {
  return FEATURES[feature].includes(level);
};

/**
 * Get pricing for an access level
 */
export const getAccessPrice = (
  level: AccessLevel, 
  billingCycle: 'monthly' | 'yearly'
): number | null => {
  return ACCESS_LEVEL_PRICES[level][billingCycle];
};

/**
 * Get feature description
 */
export const getFeatureDescription = (feature: Feature): string => {
  const descriptions: Record<Feature, string> = {
    // Accès Public (Gratuit avec inscription)
    PRICE_COMPARISON: 'Comparateur citoyen DOM · ROM · COM',
    TERRITORY_VIEW: 'Consultation par territoire',
    PRICE_SOURCES_VISIBLE: 'Prix observés, datés et sourcés',
    BASIC_HISTORY: 'Historique simple',
    READ_ONLY_ACCESS: 'Lecture seule',
    NO_ADS: 'Sans publicité',
    SCAN_EAN_UNLIMITED: 'Scan EAN illimité (jamais bloqué)',
    
    // Accès Citoyen (3.99€/mois)
    OCR_INGREDIENTS: 'OCR ingrédients (texte brut)',
    ENRICHED_PRODUCT_INFO: 'Fiche produit enrichie',
    LOCAL_PRICE_ALERTS: 'Alertes prix locales simples',
    PERSONAL_HISTORY: 'Historique personnel local',
    CITIZEN_REPORTING: 'Signalement citoyen',
    
    // Accès Professionnel (19€/mois)
    MULTI_BRAND_TEMPORAL: 'Comparaisons temporelles multi-marques',
    LONG_HISTORY_12_36_MONTHS: 'Historique long (12-36 mois)',
    CSV_JSON_EXPORT: 'Export CSV / JSON',
    TERRITORIAL_AGGREGATION: 'Agrégation territoriale',
    EAN_SEARCH_HISTORY: 'Recherche EAN + historique',
    
    // Licence Institutionnelle (Sur devis)
    PUBLIC_AGGREGATED_DATA: 'Données publiques agrégées',
    AUDITABILITY: 'Auditabilité',
    STRUCTURED_OPEN_DATA: 'Accès open-data structuré',
    TERRITORIAL_INTERNATIONAL_COMPARISON: 'Comparaisons territoriales / internationales',
    OFFICIAL_OBSERVATORY: 'Observatoire officiel',
  };
  
  return descriptions[feature];
};

export default {
  canUse,
  getAccessPrice,
  getFeatureDescription,
  ACCESS_LEVEL_PRICES,
  FEATURES,
};
