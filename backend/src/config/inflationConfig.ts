/**
 * Inflation Dashboard Configuration
 * 
 * Configuration for price index calculation, reference baskets,
 * and inflation monitoring for DOM-TOM territories.
 */

export interface BasketCategory {
  category: string;
  weight: number;
  products: string[];
}

export interface InflationThresholds {
  low: number;
  medium: number;
  high: number;
}

export interface CategoryMetadata {
  id: string;
  name: string;
  icon: string;
}

export const INFLATION_CONFIG = {
  // Base de l'indice
  baseYear: 2024,
  baseMonth: 1,
  baseValue: 100,
  
  // Seuils de couleur pour l'affichage
  thresholds: {
    low: 2,        // < 2% = vert
    medium: 4,     // 2-4% = jaune
    high: 6,       // 4-6% = orange
    // > 6% = rouge
  } as InflationThresholds,
  
  // Pondération du panier de référence
  basketWeights: {
    dairy: 0.15,
    meat: 0.18,
    bread: 0.12,
    grocery: 0.20,
    fruits_vegetables: 0.15,
    beverages: 0.10,
    hygiene: 0.10,
  },
  
  // Territoires suivis
  territories: ['GP', 'MQ', 'GF', 'RE', 'YT'] as const,
  
  // Noms complets des territoires
  territoryNames: {
    GP: 'Guadeloupe',
    MQ: 'Martinique',
    GF: 'Guyane',
    RE: 'La Réunion',
    YT: 'Mayotte',
    METRO: 'France métropolitaine',
  },
  
  // Configuration des jobs
  jobs: {
    calculateIndex: '0 2 1 * *',    // 1er du mois à 2h
    generatePressKit: '0 6 1 * *',  // 1er du mois à 6h
  },
  
  // Rate limiting API publique
  publicApi: {
    rateLimit: 100,     // requêtes
    ratePeriod: 3600,   // par heure (en secondes)
  },
  
  // Score de confiance minimum pour les calculs
  minConfidenceScore: 50,
};

/**
 * Panier type de référence (pondéré par importance)
 * Ces produits sont utilisés pour calculer l'indice des prix
 */
export const REFERENCE_BASKET: BasketCategory[] = [
  { 
    category: 'dairy', 
    weight: 15, 
    products: ['lait_1l', 'beurre_250g', 'yaourt_x4', 'fromage_emmental'] 
  },
  { 
    category: 'bread', 
    weight: 12, 
    products: ['pain_baguette', 'pain_mie_500g'] 
  },
  { 
    category: 'meat', 
    weight: 18, 
    products: ['poulet_kg', 'boeuf_steak', 'jambon_4tr'] 
  },
  { 
    category: 'grocery', 
    weight: 20, 
    products: ['riz_1kg', 'pates_500g', 'huile_1l', 'sucre_1kg', 'cafe_250g'] 
  },
  { 
    category: 'fruits_vegetables', 
    weight: 15, 
    products: ['tomates_kg', 'bananes_kg', 'pommes_kg', 'carottes_kg'] 
  },
  { 
    category: 'beverages', 
    weight: 10, 
    products: ['eau_1.5l', 'jus_orange_1l', 'soda_1.5l'] 
  },
  { 
    category: 'hygiene', 
    weight: 10, 
    products: ['savon', 'shampoing', 'dentifrice', 'lessive'] 
  },
];

/**
 * Métadonnées des catégories de produits
 */
export const CATEGORIES: CategoryMetadata[] = [
  { id: 'dairy', name: 'Produits laitiers', icon: '🥛' },
  { id: 'meat', name: 'Viandes', icon: '🥩' },
  { id: 'bread', name: 'Boulangerie', icon: '🍞' },
  { id: 'grocery', name: 'Épicerie', icon: '🥫' },
  { id: 'fruits_vegetables', name: 'Fruits & Légumes', icon: '🥬' },
  { id: 'beverages', name: 'Boissons', icon: '🥤' },
  { id: 'hygiene', name: 'Hygiène', icon: '🧴' },
  { id: 'frozen', name: 'Surgelés', icon: '🧊' },
];

/**
 * Mapping des produits du panier aux produits réels
 * Format: identifiant_basket -> pattern de recherche dans les produits seed
 */
export const BASKET_PRODUCT_MAPPING: Record<string, string> = {
  // Dairy
  'lait_1l': 'lait',
  'beurre_250g': 'beurre',
  'yaourt_x4': 'yaourt',
  'fromage_emmental': 'emmental',
  
  // Bread
  'pain_baguette': 'baguette',
  'pain_mie_500g': 'pain de mie',
  
  // Meat
  'poulet_kg': 'poulet',
  'boeuf_steak': 'boeuf',
  'jambon_4tr': 'jambon',
  
  // Grocery
  'riz_1kg': 'riz',
  'pates_500g': 'pâtes',
  'huile_1l': 'huile',
  'sucre_1kg': 'sucre',
  'cafe_250g': 'café',
  
  // Fruits & Vegetables
  'tomates_kg': 'tomate',
  'bananes_kg': 'banane',
  'pommes_kg': 'pomme',
  'carottes_kg': 'carotte',
  
  // Beverages
  'eau_1.5l': 'eau',
  'jus_orange_1l': 'jus',
  'soda_1.5l': 'coca',
  
  // Hygiene
  'savon': 'savon',
  'shampoing': 'shampoing',
  'dentifrice': 'dentifrice',
  'lessive': 'lessive',
};

/**
 * Get category metadata by ID
 */
export function getCategoryMetadata(categoryId: string): CategoryMetadata | undefined {
  return CATEGORIES.find(c => c.id === categoryId);
}

/**
 * Get inflation color based on value
 */
export function getInflationColor(inflation: number): string {
  const { thresholds } = INFLATION_CONFIG;
  
  if (inflation < thresholds.low) return 'green';
  if (inflation < thresholds.medium) return 'yellow';
  if (inflation < thresholds.high) return 'orange';
  return 'red';
}

/**
 * Format period string (YYYY-MM)
 */
export function formatPeriod(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * Parse period string to Date
 */
export function parsePeriod(period: string): Date {
  const [year, month] = period.split('-').map(Number);
  return new Date(year, month - 1, 1);
}
