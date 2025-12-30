/**
 * Configuration partagée pour l'extension A KI PRI SA YÉ
 * Conforme aux principes: NO SCRAPING, NO TRACKING, FULL CONSENT
 */

export const CONFIG = {
  // API endpoints
  API_BASE_URL: 'https://akiprisaye.web.app/api',
  
  // Supported store patterns
  SUPPORTED_STORES: {
    carrefour: {
      pattern: /carrefour\.fr\/p\//,
      name: 'Carrefour',
      productUrlPattern: /\/p\/([^\/]+)/
    },
    leclerc: {
      pattern: /leclerc\.com\/p\//,
      name: 'E.Leclerc',
      productUrlPattern: /\/p\/([^\/]+)/
    },
    auchan: {
      pattern: /auchan\.fr\/.*\/p\//,
      name: 'Auchan',
      productUrlPattern: /\/p\/([^\/]+)/
    },
    intermarche: {
      pattern: /intermarche\.com\/.*produit/,
      name: 'Intermarché',
      productUrlPattern: /produit\/([^\/]+)/
    },
    lidl: {
      pattern: /lidl\.fr\/p\//,
      name: 'Lidl',
      productUrlPattern: /\/p\/([^\/]+)/
    },
    superU: {
      pattern: /super-u\.fr\/.*\/p\//,
      name: 'Super U',
      productUrlPattern: /\/p\/([^\/]+)/
    },
    monoprix: {
      pattern: /monoprix\.fr\/.*\/p\//,
      name: 'Monoprix',
      productUrlPattern: /\/p\/([^\/]+)/
    },
    casino: {
      pattern: /casino\.fr\/.*\/p\//,
      name: 'Casino',
      productUrlPattern: /\/p\/([^\/]+)/
    }
  },
  
  // Territories
  TERRITORIES: {
    GUADELOUPE: { code: 'GP', name: 'Guadeloupe', type: 'DOM' },
    MARTINIQUE: { code: 'MQ', name: 'Martinique', type: 'DOM' },
    GUYANE: { code: 'GF', name: 'Guyane', type: 'DOM' },
    REUNION: { code: 'RE', name: 'La Réunion', type: 'DOM' },
    MAYOTTE: { code: 'YT', name: 'Mayotte', type: 'DOM' },
    METROPOLE: { code: 'FR', name: 'France Métropolitaine', type: 'HEXAGONE' }
  },
  
  // Privacy settings
  PRIVACY: {
    NO_TRACKING: true,
    NO_BACKGROUND_SCAN: true,
    USER_CONSENT_REQUIRED: true,
    NO_BROWSING_HISTORY: true
  },
  
  // UI settings
  UI: {
    OVERLAY_POSITION: 'right',
    THEME: 'dark',
    ANIMATION_DURATION: 200,
    GLASS_EFFECT: true
  },
  
  // Storage keys
  STORAGE_KEYS: {
    USER_TERRITORY: 'user_territory',
    FOLLOWED_PRODUCTS: 'followed_products',
    PRICE_ALERTS: 'price_alerts',
    USER_CONSENT: 'user_consent',
    SHOPPING_LIST: 'shopping_list'
  }
};

export const STORE_PATTERNS = Object.values(CONFIG.SUPPORTED_STORES);
