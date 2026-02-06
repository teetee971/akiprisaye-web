/**
 * Price Observatory Types - v1.3.0
 * 
 * Types for intelligent price monitoring and analysis
 * 
 * @module observatoryTypes
 */

import type { TerritoryCode, ProductCategory } from './product';

/**
 * Inflation detection result
 */
export interface InflationAnalysis {
  period: '7d' | '30d' | '90d' | '1y';
  startDate: string;
  endDate: string;
  inflationRate: number; // Percentage
  affectedProducts: number;
  totalProducts: number;
  categoriesImpacted: {
    category: ProductCategory;
    rate: number;
  }[];
  severity: 'low' | 'moderate' | 'high' | 'critical';
}

/**
 * Shrinkflation detection
 */
export interface ShrinkflationDetection {
  productId: string;
  productName: string;
  oldContenance: number;
  newContenance: number;
  reductionPercentage: number;
  oldPrice: number;
  newPrice: number;
  realPriceIncrease: number; // Percentage after accounting for size reduction
  detectedDate: string;
  territory: TerritoryCode;
  enseigne: string;
}

/**
 * Price history point
 */
export interface PriceHistoryPoint {
  date: string; // ISO 8601
  price: number;
  pricePerUnit: number;
  source: 'api' | 'user' | 'historical';
  enseigne: string;
}

/**
 * Price alert configuration
 */
export interface PriceAlert {
  id: string;
  userId?: string;
  productId: string;
  productName: string;
  threshold: number; // Percentage increase
  enabled: boolean;
  lastTriggered?: string;
  createdAt: string;
}

/**
 * Collectivity dashboard data
 */
export interface CollectivityDashboard {
  territory: TerritoryCode;
  period: string;
  overallInflation: number;
  totalProductsMonitored: number;
  priceIncreases: number;
  priceDecreases: number;
  shrinkflationCases: number;
  averagePriceLevel: number;
  comparisonToMetropole: number; // Percentage difference
  topImpactedCategories: {
    category: ProductCategory;
    impact: number;
  }[];
  alerts: {
    type: 'inflation' | 'shrinkflation' | 'shortage';
    severity: 'low' | 'moderate' | 'high' | 'critical';
    message: string;
    date: string;
  }[];
}

/**
 * Historical chart data point
 */
export interface ChartDataPoint {
  date: string;
  value: number;
  label: string;
}

/**
 * Observatory statistics
 */
export interface ObservatoryStats {
  totalPricesTracked: number;
  lastUpdate: string;
  activeTerritories: number;
  userContributions: number;
  inflationTrend: 'up' | 'down' | 'stable';
  reliability: number; // 0-100
}
