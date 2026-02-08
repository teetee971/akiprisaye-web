/**
 * Price Color Configuration
 * Color coding system for store price indices
 */

export type PriceCategory = 'cheap' | 'medium' | 'expensive';

export interface PriceColorConfig {
  range: [number, number];
  color: string;
  label: string;
  icon: string;
}

export const PRICE_COLORS: Record<PriceCategory, PriceColorConfig> = {
  cheap: {
    range: [0, 33],
    color: '#22c55e',
    label: 'Pas cher',
    icon: '🟢',
  },
  medium: {
    range: [34, 66],
    color: '#f59e0b',
    label: 'Moyen',
    icon: '🟡',
  },
  expensive: {
    range: [67, 100],
    color: '#ef4444',
    label: 'Cher',
    icon: '🔴',
  },
};

/**
 * Get price category based on price index
 */
export function getPriceCategory(priceIndex: number): PriceCategory {
  if (priceIndex <= 33) return 'cheap';
  if (priceIndex <= 66) return 'medium';
  return 'expensive';
}

/**
 * Get marker color based on price index
 */
export function getMarkerColor(priceIndex: number): string {
  const category = getPriceCategory(priceIndex);
  return PRICE_COLORS[category].color;
}

/**
 * Get all price categories for legend
 */
export function getAllPriceCategories(): Array<{
  category: PriceCategory;
  config: PriceColorConfig;
}> {
  return Object.entries(PRICE_COLORS).map(([category, config]) => ({
    category: category as PriceCategory,
    config,
  }));
}
