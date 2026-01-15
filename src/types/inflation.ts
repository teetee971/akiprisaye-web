/**
 * Inflation Tracking Type Definitions
 * For local inflation dashboard and analysis
 */

export interface CategoryInflation {
  category: string;
  currentAverage: number;
  previousAverage: number;
  inflationRate: number; // Percentage
  priceChange: number; // Absolute
  products: {
    ean: string;
    name: string;
    change: number;
  }[];
}

export interface TerritoryInflation {
  territory: string;
  territoryName: string;
  overallInflationRate: number;
  categories: CategoryInflation[];
  comparedToMetropole?: number; // Price gap percentage
  lastUpdated: string;
}

export interface InflationMetrics {
  territories: TerritoryInflation[];
  timeframe: '1m' | '3m' | '6m' | '1y';
  referenceDate: string;
  comparisonDate: string;
}

export interface PurchasingPowerIndex {
  territory: string;
  index: number; // 100 = baseline
  change: number; // vs previous period
  categories: {
    category: string;
    affordability: number; // Products affordable with median income
  }[];
}
