/**
 * Inflation Dashboard Configuration
 * Reference basket definition and calculation parameters for DOM-TOM territories
 */

/**
 * Supported DOM-TOM territories
 */
export const SUPPORTED_TERRITORIES = ['GP', 'MQ', 'GF', 'RE', 'YT'] as const;
export type Territory = (typeof SUPPORTED_TERRITORIES)[number];

/**
 * Product categories in the reference basket
 */
export const PRODUCT_CATEGORIES = [
  'dairy',
  'bread',
  'meat',
  'grocery',
  'fruits_vegetables',
  'beverages',
  'hygiene',
] as const;
export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];

/**
 * Reference basket product codes (26 products)
 */
export const REFERENCE_BASKET_PRODUCTS = {
  // Dairy (4 products)
  dairy: ['lait_1l', 'beurre_250g', 'yaourt_x4', 'fromage_emmental'],
  
  // Bread/Bakery (2 products)
  bread: ['pain_baguette', 'pain_mie_500g'],
  
  // Meat/Protein (3 products)
  meat: ['poulet_kg', 'boeuf_steak', 'jambon_4tr'],
  
  // Grocery/Staples (5 products)
  grocery: ['riz_1kg', 'pates_500g', 'huile_1l', 'sucre_1kg', 'cafe_250g'],
  
  // Fruits & Vegetables (4 products)
  fruits_vegetables: ['tomates_kg', 'bananes_kg', 'pommes_kg', 'carottes_kg'],
  
  // Beverages (3 products)
  beverages: ['eau_1.5l', 'jus_orange_1l', 'soda_1.5l'],
  
  // Hygiene/Personal Care (4 products)
  hygiene: ['savon', 'shampoing', 'dentifrice', 'lessive'],
} as const;

/**
 * Category weights in the reference basket (must sum to 100)
 */
export const CATEGORY_WEIGHTS: Record<ProductCategory, number> = {
  dairy: 15,                // 15%
  meat: 18,                 // 18%
  bread: 12,                // 12%
  grocery: 20,              // 20%
  fruits_vegetables: 15,    // 15%
  beverages: 10,            // 10%
  hygiene: 10,              // 10%
};

/**
 * Reference basket configuration with products and weights
 */
export const REFERENCE_BASKET = [
  { 
    category: 'dairy' as ProductCategory, 
    weight: 15, 
    products: ['lait_1l', 'beurre_250g', 'yaourt_x4', 'fromage_emmental'] 
  },
  { 
    category: 'bread' as ProductCategory, 
    weight: 12, 
    products: ['pain_baguette', 'pain_mie_500g'] 
  },
  { 
    category: 'meat' as ProductCategory, 
    weight: 18, 
    products: ['poulet_kg', 'boeuf_steak', 'jambon_4tr'] 
  },
  { 
    category: 'grocery' as ProductCategory, 
    weight: 20, 
    products: ['riz_1kg', 'pates_500g', 'huile_1l', 'sucre_1kg', 'cafe_250g'] 
  },
  { 
    category: 'fruits_vegetables' as ProductCategory, 
    weight: 15, 
    products: ['tomates_kg', 'bananes_kg', 'pommes_kg', 'carottes_kg'] 
  },
  { 
    category: 'beverages' as ProductCategory, 
    weight: 10, 
    products: ['eau_1.5l', 'jus_orange_1l', 'soda_1.5l'] 
  },
  { 
    category: 'hygiene' as ProductCategory, 
    weight: 10, 
    products: ['savon', 'shampoing', 'dentifrice', 'lessive'] 
  },
];

/**
 * Base index reference
 * Base 100 = January 2024
 */
export const BASE_INDEX = {
  value: 100,
  month: 1,
  year: 2024,
};

/**
 * Inflation thresholds for color coding (percentage points)
 */
export const INFLATION_THRESHOLDS = {
  low: 2,       // < 2% = green
  medium: 4,    // 2-4% = yellow
  high: 6,      // 4-6% = orange
  // > 6% = red
};

/**
 * Color mapping for inflation badges
 */
export const INFLATION_COLORS = {
  green: { min: -Infinity, max: 2 },
  yellow: { min: 2, max: 4 },
  orange: { min: 4, max: 6 },
  red: { min: 6, max: Infinity },
};

/**
 * Get color based on inflation rate
 */
export function getInflationColor(inflationRate: number): string {
  if (inflationRate < INFLATION_THRESHOLDS.low) return 'green';
  if (inflationRate < INFLATION_THRESHOLDS.medium) return 'yellow';
  if (inflationRate < INFLATION_THRESHOLDS.high) return 'orange';
  return 'red';
}

/**
 * Rate limiting configuration for public API
 */
export const PUBLIC_API_RATE_LIMIT = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
};

/**
 * Cron schedules for automated jobs
 */
export const CRON_SCHEDULES = {
  calculateMonthlyIndices: '0 2 1 * *',  // 1st of month at 2:00 AM
  generatePressKit: '0 6 1 * *',         // 1st of month at 6:00 AM
};

/**
 * Timezone for cron jobs (Guadeloupe/Martinique time)
 */
export const CRON_TIMEZONE = 'America/Guadeloupe';

/**
 * Export format options
 */
export const EXPORT_FORMATS = ['csv', 'json', 'xlsx'] as const;
export type ExportFormat = (typeof EXPORT_FORMATS)[number];

/**
 * Data retention policy (months)
 */
export const DATA_RETENTION_MONTHS = 36; // 3 years

/**
 * Minimum data points required for trend analysis
 */
export const MIN_DATA_POINTS_FOR_TRENDS = 3;

/**
 * Forecast configuration
 */
export const FORECAST_CONFIG = {
  method: 'linear_regression' as const,
  periods: 3, // Forecast next 3 months
};
