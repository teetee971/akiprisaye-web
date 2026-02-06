/**
 * Price History Type Definitions
 * For detailed price evolution tracking and visualization
 */

export interface PriceHistoryPoint {
  date: string; // ISO 8601 date
  price: number;
  storeId: string;
  storeName: string;
  reliability: number; // 0-1 confidence score
  source: string; // 'user', 'official', 'api', etc.
}

export interface PriceTimeSeries {
  productEAN: string;
  productName: string;
  territory: string;
  dataPoints: PriceHistoryPoint[];
  statistics: PriceStatistics;
}

export interface PriceStatistics {
  min: number;
  max: number;
  average: number;
  median: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  volatility: number; // Standard deviation
}

export type Timeframe = '7d' | '30d' | '90d' | '365d' | 'all';

export interface ChartConfig {
  timeframe: Timeframe;
  showAllStores: boolean;
  selectedStoreIds: string[];
  showTrendLine: boolean;
  showAverageLine: boolean;
}

export interface SeasonalPattern {
  period: string; // e.g., 'summer', 'winter', 'holiday'
  startMonth: number;
  endMonth: number;
  averagePriceChange: number; // percentage
  description: string;
}
