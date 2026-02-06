/**
 * Types for Multi-Territory Price Comparison (Mission M-B)
 */

import type { Territory } from '../../types/comparatorCommon';

/**
 * Territory price data point
 */
export interface TerritoryPrice {
  /** Territory code (GP, MQ, etc.) */
  territory: Territory;
  /** Price in euros */
  price: number;
  /** Number of stores with data for this product in the territory */
  storeCount: number;
  /** Whether price data is available for this product in this territory */
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
