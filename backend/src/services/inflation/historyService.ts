/**
 * History Service
 * Manages historical inflation data and forecasting
 */

import { Territory } from '../../config/inflationConfig.js';
import { prisma } from '../../app.js';

/**
 * Historical data point
 */
export interface HistoricalDataPoint {
  year: number;
  month: number;
  indexValue: number;
  inflationRate: number;
  monthlyChange: number;
}

/**
 * Forecast result
 */
export interface ForecastResult {
  year: number;
  month: number;
  predictedIndex: number;
  confidence: number; // 0-100
}

/**
 * Time series data
 */
export interface TimeSeriesData {
  territory: Territory;
  historical: HistoricalDataPoint[];
  forecast: ForecastResult[];
}

/**
 * Get historical inflation data
 */
export async function getInflationHistory(
  territory: Territory,
  months: number = 24
): Promise<HistoricalDataPoint[]> {
  try {
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth() - months, 1);

    const priceIndices = await prisma.priceIndex.findMany({
      where: {
        territory,
        OR: [
          { year: { gt: startDate.getFullYear() } },
          {
            AND: [
              { year: startDate.getFullYear() },
              { month: { gte: startDate.getMonth() + 1 } },
            ],
          },
        ],
      },
      orderBy: [{ year: 'asc' }, { month: 'asc' }],
    });

    return priceIndices.map(index => ({
      year: index.year,
      month: index.month,
      indexValue: index.indexValue,
      inflationRate: index.inflationRate,
      monthlyChange: index.monthlyChange,
    }));
  } catch (error) {
    console.error('[History] Error fetching inflation history:', error);
    throw error;
  }
}

/**
 * Generate forecast using linear regression
 */
export async function generateForecast(
  territory: Territory,
  periods: number = 3
): Promise<ForecastResult[]> {
  try {
    // Get historical data for regression
    const historical = await getInflationHistory(territory, 12);

    if (historical.length < 3) {
      console.warn('[History] Insufficient data for forecast');
      return [];
    }

    // Simple linear regression
    const n = historical.length;
    let sumX = 0;
    let sumY = 0;
    let sumXY = 0;
    let sumX2 = 0;

    historical.forEach((point, index) => {
      const x = index;
      const y = point.indexValue;
      sumX += x;
      sumY += y;
      sumXY += x * y;
      sumX2 += x * x;
    });

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // Calculate R-squared for confidence
    const yMean = sumY / n;
    let ssTotal = 0;
    let ssResidual = 0;

    historical.forEach((point, index) => {
      const predicted = slope * index + intercept;
      ssTotal += Math.pow(point.indexValue - yMean, 2);
      ssResidual += Math.pow(point.indexValue - predicted, 2);
    });

    const rSquared = 1 - ssResidual / ssTotal;
    const confidence = Math.max(0, Math.min(100, rSquared * 100));

    // Generate forecast
    const lastDate = historical[historical.length - 1];
    const forecasts: ForecastResult[] = [];

    for (let i = 1; i <= periods; i++) {
      const nextDate = new Date(lastDate.year, lastDate.month - 1 + i, 1);
      const predictedIndex = slope * (n + i - 1) + intercept;

      forecasts.push({
        year: nextDate.getFullYear(),
        month: nextDate.getMonth() + 1,
        predictedIndex: Math.max(0, predictedIndex),
        confidence,
      });
    }

    return forecasts;
  } catch (error) {
    console.error('[History] Error generating forecast:', error);
    throw error;
  }
}

/**
 * Get complete time series with forecast
 */
export async function getTimeSeriesData(
  territory: Territory,
  historicalMonths: number = 24,
  forecastPeriods: number = 3
): Promise<TimeSeriesData> {
  try {
    const historical = await getInflationHistory(territory, historicalMonths);
    const forecast = await generateForecast(territory, forecastPeriods);

    return {
      territory,
      historical,
      forecast,
    };
  } catch (error) {
    console.error('[History] Error getting time series data:', error);
    throw error;
  }
}

/**
 * Calculate year-over-year comparison
 */
export async function getYearOverYearComparison(
  territory: Territory,
  year: number,
  month: number
): Promise<{ current: number; yearAgo: number; change: number; changePercent: number } | null> {
  try {
    const current = await prisma.priceIndex.findUnique({
      where: {
        territory_year_month: {
          territory,
          year,
          month,
        },
      },
    });

    const yearAgo = await prisma.priceIndex.findUnique({
      where: {
        territory_year_month: {
          territory,
          year: year - 1,
          month,
        },
      },
    });

    if (!current || !yearAgo) {
      return null;
    }

    const change = current.indexValue - yearAgo.indexValue;
    const changePercent = (change / yearAgo.indexValue) * 100;

    return {
      current: current.indexValue,
      yearAgo: yearAgo.indexValue,
      change,
      changePercent,
    };
  } catch (error) {
    console.error('[History] Error calculating year-over-year:', error);
    throw error;
  }
}
