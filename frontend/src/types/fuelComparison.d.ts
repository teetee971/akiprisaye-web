export type Territory = 'FR' | 'GP' | 'MQ' | 'GF' | 'RE' | 'YT';

export type FuelType =
  | 'gazole'
  | 'sp95'
  | 'sp98'
  | 'e10'
  | 'gplc'
  | 'e85'
  | 'autre';

export interface FuelStation {
  id: string;
  name: string;
  brand?: string;
  city?: string;
  postalCode?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
}

export interface FuelPricePoint {
  station: FuelStation;
  fuelType: FuelType;
  territory: Territory;
  pricePerLiter: number;
  currency?: string;
  observedAt?: string;
  source?: string;
  isPriceCapPlafonne?: boolean;
}

export interface FuelAggregation {
  minPrice: number;
  maxPrice: number;
  averagePrice: number;
  medianPrice: number;
  priceRange: number;
  priceRangePercentage: number;
  standardDeviation: number;
  priceCapOfficiel?: number;
  totalStations: number;
  lastUpdate: string;
}

export interface FuelPriceRanking {
  rank: number;
  station: FuelStation;
  pricePerLiter: number;
  differenceFromCheapest: number;
  percentageFromCheapest: number;
  differenceFromAverage: number;
  percentageFromAverage: number;
  priceCategory: 'cheapest' | 'below_average' | 'average' | 'above_average' | 'most_expensive';
  isPriceCapPlafonne?: boolean;
}

export interface FuelComparisonMetadata {
  sampleSize: number;
  sourceCount: number;
  hasPriceCap: boolean;
  warningFlags: string[];
}

export interface FuelComparisonResult {
  territory: Territory;
  fuelType: FuelType;
  rankedPrices: FuelPriceRanking[];
  aggregation: FuelAggregation;
  comparisonDate: string;
  metadata: FuelComparisonMetadata;
}

export interface FuelComparisonFilter {
  territory?: Territory;
  fuelType?: FuelType;
  radiusKm?: number;
}

export interface FuelHistoricalDataPoint {
  date: string;
  price: number;
}

export interface FuelPriceHistory {
  stationId: string;
  fuelType: FuelType;
  territory: Territory;
  points: FuelHistoricalDataPoint[];
}
