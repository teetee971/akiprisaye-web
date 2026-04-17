/**
 * Transport History Service v2.2.1
 *
 * Implements temporal analysis of transport prices with:
 * - Read-only data access (no data modification)
 * - Time series analysis by route
 * - Detection of significant price variations
 * - Observed seasonality patterns (no forecasting)
 * - No predictions or recommendations
 * - Compatible with transportPriceService
 * - Transparent source tracking
 */

import type {
  TransportPriceHistoryPoint,
  TransportSeasonalityIndicator,
  TransportRouteIdentifier,
  TransportPricePoint,
  SourceReference,
} from '../types/transportComparison';

/**
 * Configuration constants for history analysis
 */
const HISTORY_CONFIG = {
  SIGNIFICANT_VARIATION_THRESHOLD_PERCENT: 15, // 15% variation considered significant
  MIN_DATA_POINTS_FOR_SEASONALITY: 12, // Minimum 12 months of data
  SEASONALITY_CONFIDENCE_THRESHOLD: 0.7, // 70% confidence threshold
  HIGH_SEASON_THRESHOLD_PERCENT: 10, // 10% above average
  LOW_SEASON_THRESHOLD_PERCENT: 10, // 10% below average
} as const;

/**
 * Build time series for a route from price points
 * Groups prices by date and calculates aggregates
 */
export function buildTimeSeries(
  prices: TransportPricePoint[],
  route: TransportRouteIdentifier
): TransportPriceHistoryPoint[] {
  if (prices.length === 0) {
    return [];
  }

  // Filter prices for the specific route
  const routePrices = prices.filter(
    (p) =>
      p.route.origin === route.origin &&
      p.route.destination === route.destination &&
      p.route.mode === route.mode
  );

  // Group by date (day level)
  const dateGroups = new Map<string, TransportPricePoint[]>();
  routePrices.forEach((price) => {
    const dateKey = price.observationDate.split('T')[0]; // Get date part only
    if (!dateGroups.has(dateKey)) {
      dateGroups.set(dateKey, []);
    }
    dateGroups.get(dateKey)!.push(price);
  });

  // Build history points
  const historyPoints: TransportPriceHistoryPoint[] = [];
  dateGroups.forEach((dayPrices, dateKey) => {
    const priceValues = dayPrices.map((p) => p.price);
    const sources: SourceReference[] = dayPrices.map((p) => p.source);

    historyPoints.push({
      date: dateKey,
      route,
      averagePrice:
        Math.round((priceValues.reduce((sum, p) => sum + p, 0) / priceValues.length) * 100) / 100,
      minPrice: Math.round(Math.min(...priceValues) * 100) / 100,
      maxPrice: Math.round(Math.max(...priceValues) * 100) / 100,
      observationCount: dayPrices.reduce((sum, p) => sum + p.volume, 0),
      sources,
    });
  });

  // Sort by date
  return historyPoints.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

/**
 * Build time series for a specific operator
 */
export function buildOperatorTimeSeries(
  prices: TransportPricePoint[],
  route: TransportRouteIdentifier,
  operatorId: string
): TransportPriceHistoryPoint[] {
  const operatorPrices = prices.filter((p) => p.operatorId === operatorId);
  const timeSeries = buildTimeSeries(operatorPrices, route);

  // Add operator ID to each point
  return timeSeries.map((point) => ({
    ...point,
    operatorId,
  }));
}

/**
 * Detect significant price variations in time series
 * Returns periods where price changed more than threshold
 */
export function detectSignificantVariations(timeSeries: TransportPriceHistoryPoint[]): Array<{
  fromDate: string;
  toDate: string;
  fromPrice: number;
  toPrice: number;
  absoluteChange: number;
  percentageChange: number;
  direction: 'increase' | 'decrease';
}> {
  if (timeSeries.length < 2) {
    return [];
  }

  const variations: Array<{
    fromDate: string;
    toDate: string;
    fromPrice: number;
    toPrice: number;
    absoluteChange: number;
    percentageChange: number;
    direction: 'increase' | 'decrease';
  }> = [];

  // Compare consecutive points
  for (let i = 1; i < timeSeries.length; i++) {
    const prev = timeSeries[i - 1];
    const current = timeSeries[i];

    const absoluteChange = current.averagePrice - prev.averagePrice;
    const percentageChange = prev.averagePrice > 0 ? (absoluteChange / prev.averagePrice) * 100 : 0;

    if (Math.abs(percentageChange) >= HISTORY_CONFIG.SIGNIFICANT_VARIATION_THRESHOLD_PERCENT) {
      variations.push({
        fromDate: prev.date,
        toDate: current.date,
        fromPrice: prev.averagePrice,
        toPrice: current.averagePrice,
        absoluteChange: Math.round(absoluteChange * 100) / 100,
        percentageChange: Math.round(percentageChange * 100) / 100,
        direction: absoluteChange >= 0 ? 'increase' : 'decrease',
      });
    }
  }

  return variations;
}

/**
 * Analyze seasonality patterns in transport prices
 * Detects recurring monthly patterns without forecasting
 */
export function analyzeSeasonality(
  timeSeries: TransportPriceHistoryPoint[],
  route: TransportRouteIdentifier,
  period: 'month' | 'quarter' | 'year' = 'month'
): TransportSeasonalityIndicator | null {
  if (timeSeries.length < HISTORY_CONFIG.MIN_DATA_POINTS_FOR_SEASONALITY) {
    return null;
  }

  // Group prices by month
  const monthlyPrices = new Map<number, number[]>();
  timeSeries.forEach((point) => {
    const date = new Date(point.date);
    const month = date.getMonth() + 1; // 1-12
    if (!monthlyPrices.has(month)) {
      monthlyPrices.set(month, []);
    }
    monthlyPrices.get(month)!.push(point.averagePrice);
  });

  // Calculate average price per month
  const monthlyAverages = new Map<number, number>();
  monthlyPrices.forEach((prices, month) => {
    const avg = prices.reduce((sum, p) => sum + p, 0) / prices.length;
    monthlyAverages.set(month, avg);
  });

  // Calculate overall average
  const overallAverage =
    Array.from(monthlyAverages.values()).reduce((sum, p) => sum + p, 0) / monthlyAverages.size;

  // Identify high and low season months
  const highSeasonMonths: number[] = [];
  const lowSeasonMonths: number[] = [];
  const highThreshold = overallAverage * (1 + HISTORY_CONFIG.HIGH_SEASON_THRESHOLD_PERCENT / 100);
  const lowThreshold = overallAverage * (1 - HISTORY_CONFIG.LOW_SEASON_THRESHOLD_PERCENT / 100);

  monthlyAverages.forEach((avg, month) => {
    if (avg >= highThreshold) {
      highSeasonMonths.push(month);
    } else if (avg <= lowThreshold) {
      lowSeasonMonths.push(month);
    }
  });

  // Calculate price variation
  const monthlyValues = Array.from(monthlyAverages.values());
  const maxMonthlyPrice = Math.max(...monthlyValues);
  const minMonthlyPrice = Math.min(...monthlyValues);
  const averagePriceVariation =
    overallAverage > 0 ? ((maxMonthlyPrice - minMonthlyPrice) / overallAverage) * 100 : 0;

  // Determine if seasonality is detected
  const seasonalityDetected = highSeasonMonths.length > 0 || lowSeasonMonths.length > 0;

  // Determine confidence based on data consistency
  let confidence: 'high' | 'medium' | 'low' = 'low';
  if (monthlyAverages.size >= 12) {
    confidence = 'high';
  } else if (monthlyAverages.size >= 6) {
    confidence = 'medium';
  }

  // Get date range
  const dates = timeSeries.map((p) => new Date(p.date).getTime());
  const periodStart = new Date(Math.min(...dates)).toISOString();
  const periodEnd = new Date(Math.max(...dates)).toISOString();

  return {
    route,
    period,
    seasonalityDetected,
    patterns: seasonalityDetected
      ? {
          highSeasonMonths: highSeasonMonths.sort((a, b) => a - b),
          lowSeasonMonths: lowSeasonMonths.sort((a, b) => a - b),
          averagePriceVariation: Math.round(averagePriceVariation * 100) / 100,
        }
      : undefined,
    observations: {
      periodStart,
      periodEnd,
      dataPoints: timeSeries.length,
    },
    confidence,
    methodology: 'v2.2.1',
  };
}

/**
 * Calculate rolling average for smoothing time series
 */
export function calculateRollingAverage(
  timeSeries: TransportPriceHistoryPoint[],
  windowSize: number
): Array<{ date: string; rollingAverage: number }> {
  if (timeSeries.length < windowSize) {
    return [];
  }

  const result: Array<{ date: string; rollingAverage: number }> = [];

  for (let i = windowSize - 1; i < timeSeries.length; i++) {
    const window = timeSeries.slice(i - windowSize + 1, i + 1);
    const avg = window.reduce((sum, p) => sum + p.averagePrice, 0) / windowSize;

    result.push({
      date: timeSeries[i].date,
      rollingAverage: Math.round(avg * 100) / 100,
    });
  }

  return result;
}

/**
 * Compare price trends between two time periods
 */
export function comparePeriods(
  timeSeries: TransportPriceHistoryPoint[],
  period1Start: string,
  period1End: string,
  period2Start: string,
  period2End: string
): {
  period1Average: number;
  period2Average: number;
  absoluteDifference: number;
  percentageDifference: number;
  trend: 'increasing' | 'decreasing' | 'stable';
} | null {
  const period1Prices = timeSeries.filter((p) => p.date >= period1Start && p.date <= period1End);
  const period2Prices = timeSeries.filter((p) => p.date >= period2Start && p.date <= period2End);

  if (period1Prices.length === 0 || period2Prices.length === 0) {
    return null;
  }

  const period1Average =
    period1Prices.reduce((sum, p) => sum + p.averagePrice, 0) / period1Prices.length;
  const period2Average =
    period2Prices.reduce((sum, p) => sum + p.averagePrice, 0) / period2Prices.length;

  const absoluteDifference = period2Average - period1Average;
  const percentageDifference = period1Average > 0 ? (absoluteDifference / period1Average) * 100 : 0;

  let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
  if (Math.abs(percentageDifference) >= 5) {
    trend = percentageDifference > 0 ? 'increasing' : 'decreasing';
  }

  return {
    period1Average: Math.round(period1Average * 100) / 100,
    period2Average: Math.round(period2Average * 100) / 100,
    absoluteDifference: Math.round(absoluteDifference * 100) / 100,
    percentageDifference: Math.round(percentageDifference * 100) / 100,
    trend,
  };
}

/**
 * Get price statistics for a time period
 */
export function getPeriodStatistics(
  timeSeries: TransportPriceHistoryPoint[],
  startDate?: string,
  endDate?: string
): {
  averagePrice: number;
  minPrice: number;
  maxPrice: number;
  priceRange: number;
  standardDeviation: number;
  dataPoints: number;
} | null {
  let filteredSeries = timeSeries;

  if (startDate) {
    filteredSeries = filteredSeries.filter((p) => p.date >= startDate);
  }
  if (endDate) {
    filteredSeries = filteredSeries.filter((p) => p.date <= endDate);
  }

  if (filteredSeries.length === 0) {
    return null;
  }

  const prices = filteredSeries.map((p) => p.averagePrice);
  const averagePrice = prices.reduce((sum, p) => sum + p, 0) / prices.length;
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const priceRange = maxPrice - minPrice;

  // Calculate standard deviation
  const squaredDiffs = prices.map((p) => Math.pow(p - averagePrice, 2));
  const variance = squaredDiffs.reduce((sum, d) => sum + d, 0) / prices.length;
  const standardDeviation = Math.sqrt(variance);

  return {
    averagePrice: Math.round(averagePrice * 100) / 100,
    minPrice: Math.round(minPrice * 100) / 100,
    maxPrice: Math.round(maxPrice * 100) / 100,
    priceRange: Math.round(priceRange * 100) / 100,
    standardDeviation: Math.round(standardDeviation * 100) / 100,
    dataPoints: filteredSeries.length,
  };
}

/**
 * Identify price outliers in time series
 */
export function identifyOutliers(
  timeSeries: TransportPriceHistoryPoint[],
  thresholdStdDev: number = 2
): Array<{
  date: string;
  price: number;
  deviation: number;
  isOutlier: boolean;
}> {
  if (timeSeries.length < 3) {
    return [];
  }

  const prices = timeSeries.map((p) => p.averagePrice);
  const mean = prices.reduce((sum, p) => sum + p, 0) / prices.length;

  // Calculate standard deviation
  const squaredDiffs = prices.map((p) => Math.pow(p - mean, 2));
  const variance = squaredDiffs.reduce((sum, d) => sum + d, 0) / prices.length;
  const stdDev = Math.sqrt(variance);

  return timeSeries.map((point) => {
    const deviation = Math.abs(point.averagePrice - mean) / stdDev;
    return {
      date: point.date,
      price: point.averagePrice,
      deviation: Math.round(deviation * 100) / 100,
      isOutlier: deviation > thresholdStdDev,
    };
  });
}

/**
 * Check if time series has discontinuous data
 */
export function hasDiscontinuousData(
  timeSeries: TransportPriceHistoryPoint[],
  maxGapDays: number = 7
): boolean {
  if (timeSeries.length < 2) {
    return false;
  }

  for (let i = 1; i < timeSeries.length; i++) {
    const prevDate = new Date(timeSeries[i - 1].date);
    const currentDate = new Date(timeSeries[i].date);
    const daysDiff = (currentDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24);

    if (daysDiff > maxGapDays) {
      return true;
    }
  }

  return false;
}

/**
 * Get date range of time series
 */
export function getDateRange(
  timeSeries: TransportPriceHistoryPoint[]
): { startDate: string; endDate: string; durationDays: number } | null {
  if (timeSeries.length === 0) {
    return null;
  }

  const dates = timeSeries.map((p) => new Date(p.date).getTime());
  const startDate = new Date(Math.min(...dates)).toISOString().split('T')[0];
  const endDate = new Date(Math.max(...dates)).toISOString().split('T')[0];
  const durationDays = Math.round(
    (Math.max(...dates) - Math.min(...dates)) / (1000 * 60 * 60 * 24)
  );

  return {
    startDate,
    endDate,
    durationDays,
  };
}
