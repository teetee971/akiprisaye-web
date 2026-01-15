/**
 * Types for Multi-Territory Price Comparison (Mission M-B)
 */

import type { Territory } from '../../types/comparatorCommon';

/**
 * Territory price data point
 */
export interface TerritoryPrice {
  territory: Territory;
  price: number;
  storeCount: number;
  available: boolean;
}

/**
 * Product interface for comparison
 */
export interface Product {
  id: string;
  name: string;
  brand?: string;
  category: string;
  basePrice?: number;
}

/**
 * Price statistics
 */
export interface PriceStats {
  min: number;
  max: number;
  average: number;
  median: number;
  range: number;
  variance?: number;
  stdDev?: number;
}

/**
 * Territory price comparison with stats
 */
export interface TerritoryPriceComparison {
  territory: Territory;
  price: number;
  differenceFromMin: number;
  differencePercentage: number;
  differenceFromAverage: number;
  isMinPrice: boolean;
  isSignificantDiff: boolean;
  storeCount: number;
}
