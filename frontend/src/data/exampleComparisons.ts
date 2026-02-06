/**
 * Example Comparisons Data
 * 
 * Real-world examples of price differences between territories
 * Used in HOME_v5 Section 4 to demonstrate value proposition
 */

export interface PriceComparison {
  product: string;
  category: string;
  territoryPrice: number;
  territory: string;
  territoryFlag: string;
  metropolePrice: number;
  delta: number;
  deltaPercent: number;
}

export const exampleComparisons: PriceComparison[] = [
  {
    product: 'Lait UHT demi-écrémé 1L',
    category: 'Produits laitiers',
    territoryPrice: 2.50,
    territory: 'Guadeloupe',
    territoryFlag: '🇬🇵',
    metropolePrice: 1.80,
    delta: 0.70,
    deltaPercent: 38
  },
  {
    product: 'Riz blanc long grain 1kg',
    category: 'Épicerie',
    territoryPrice: 2.80,
    territory: 'Martinique',
    territoryFlag: '🇲🇶',
    metropolePrice: 2.10,
    delta: 0.70,
    deltaPercent: 33
  },
  {
    product: 'Pain de mie nature 500g',
    category: 'Boulangerie',
    territoryPrice: 2.20,
    territory: 'Réunion',
    territoryFlag: '🇷🇪',
    metropolePrice: 1.65,
    delta: 0.55,
    deltaPercent: 33
  },
  {
    product: 'Huile de tournesol 1L',
    category: 'Épicerie',
    territoryPrice: 3.50,
    territory: 'Guyane',
    territoryFlag: '🇬🇫',
    metropolePrice: 2.70,
    delta: 0.80,
    deltaPercent: 30
  },
  {
    product: 'Pâtes spaghetti 500g',
    category: 'Épicerie',
    territoryPrice: 1.45,
    territory: 'Guadeloupe',
    territoryFlag: '🇬🇵',
    metropolePrice: 1.10,
    delta: 0.35,
    deltaPercent: 32
  },
  {
    product: 'Eau minérale 1.5L',
    category: 'Boissons',
    territoryPrice: 1.20,
    territory: 'Martinique',
    territoryFlag: '🇲🇶',
    metropolePrice: 0.70,
    delta: 0.50,
    deltaPercent: 71
  },
  {
    product: 'Yaourt nature x8',
    category: 'Produits laitiers',
    territoryPrice: 3.20,
    territory: 'Réunion',
    territoryFlag: '🇷🇪',
    metropolePrice: 2.40,
    delta: 0.80,
    deltaPercent: 33
  },
  {
    product: 'Beurre doux 250g',
    category: 'Produits laitiers',
    territoryPrice: 3.80,
    territory: 'Guyane',
    territoryFlag: '🇬🇫',
    metropolePrice: 2.90,
    delta: 0.90,
    deltaPercent: 31
  }
];

/**
 * Get a random comparison for display
 */
export function getRandomComparison(): PriceComparison {
  const randomIndex = Math.floor(Math.random() * exampleComparisons.length);
  return exampleComparisons[randomIndex];
}

/**
 * Get comparison of the day (changes daily)
 */
export function getComparisonOfDay(): PriceComparison {
  const today = new Date();
  const startOfYear = new Date(today.getFullYear(), 0, 1);
  const dayOfYear = Math.floor((today.getTime() - startOfYear.getTime()) / 86400000);
  const index = dayOfYear % exampleComparisons.length;
  return exampleComparisons[index];
}
