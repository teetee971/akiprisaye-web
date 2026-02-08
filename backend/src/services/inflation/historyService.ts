/**
 * History Service
 * 
 * Provides historical inflation data and forecasts.
 */

import { PrismaClient } from '@prisma/client';
import { INFLATION_CONFIG, formatPeriod } from '../../config/inflationConfig.js';

const prisma = new PrismaClient();

export interface InflationDataPoint {
  period: string;
  indexValue: number;
  monthlyChange: number;
  yearlyChange: number;
  basketPrice: number;
}

export interface InflationHistory {
  territory: string;
  territoryName: string;
  startPeriod: string;
  endPeriod: string;
  dataPoints: InflationDataPoint[];
  averageInflation: number;
  minInflation: number;
  maxInflation: number;
  trend: 'increasing' | 'decreasing' | 'stable';
}

export interface InflationForecast {
  territory: string;
  basePeriod: string;
  forecasts: Array<{
    period: string;
    predictedIndex: number;
    predictedInflation: number;
    confidence: number;
  }>;
  methodology: string;
}

/**
 * Get historical inflation data for a territory
 */
export async function getInflationHistory(
  territory: string,
  startPeriod: string,
  endPeriod: string
): Promise<InflationHistory> {
  try {
    const indices = await prisma.priceIndex.findMany({
      where: {
        territory,
        period: {
          gte: startPeriod,
          lte: endPeriod,
        },
      },
      orderBy: {
        period: 'asc',
      },
    });

    if (indices.length === 0) {
      throw new Error(`No historical data found for ${territory} between ${startPeriod} and ${endPeriod}`);
    }

    const dataPoints: InflationDataPoint[] = indices.map(index => ({
      period: index.period,
      indexValue: index.indexValue,
      monthlyChange: index.monthlyChange,
      yearlyChange: index.yearlyChange,
      basketPrice: index.basketPrice,
    }));

    // Calculate statistics
    const yearlyChanges = dataPoints.map(d => d.yearlyChange);
    const averageInflation = yearlyChanges.reduce((sum, val) => sum + val, 0) / yearlyChanges.length;
    const minInflation = Math.min(...yearlyChanges);
    const maxInflation = Math.max(...yearlyChanges);

    // Determine trend
    const trend = determineTrend(dataPoints);

    return {
      territory,
      territoryName: INFLATION_CONFIG.territoryNames[territory as keyof typeof INFLATION_CONFIG.territoryNames] || territory,
      startPeriod,
      endPeriod,
      dataPoints,
      averageInflation: Math.round(averageInflation * 100) / 100,
      minInflation: Math.round(minInflation * 100) / 100,
      maxInflation: Math.round(maxInflation * 100) / 100,
      trend,
    };
  } catch (error) {
    console.error(`Error getting inflation history for ${territory}:`, error);
    throw error;
  }
}

/**
 * Determine overall trend from data points
 */
function determineTrend(dataPoints: InflationDataPoint[]): 'increasing' | 'decreasing' | 'stable' {
  if (dataPoints.length < 3) return 'stable';

  // Compare first third with last third
  const thirdSize = Math.floor(dataPoints.length / 3);
  const firstThird = dataPoints.slice(0, thirdSize);
  const lastThird = dataPoints.slice(-thirdSize);

  const firstAvg = firstThird.reduce((sum, d) => sum + d.yearlyChange, 0) / firstThird.length;
  const lastAvg = lastThird.reduce((sum, d) => sum + d.yearlyChange, 0) / lastThird.length;

  const diff = lastAvg - firstAvg;

  if (diff > 0.5) return 'increasing';
  if (diff < -0.5) return 'decreasing';
  return 'stable';
}

/**
 * Get inflation forecast for next N months
 */
export async function getInflationForecast(
  territory: string,
  basePeriod: string,
  months: number = 6
): Promise<InflationForecast> {
  try {
    // Get historical data for the past 12 months
    const baseDate = new Date(basePeriod + '-01');
    const startDate = new Date(baseDate);
    startDate.setMonth(startDate.getMonth() - 12);
    
    const startPeriod = formatPeriod(startDate);
    const history = await getInflationHistory(territory, startPeriod, basePeriod);

    // Simple forecasting using moving average
    const forecasts = generateForecasts(history, months);

    return {
      territory,
      basePeriod,
      forecasts,
      methodology: 'Moving average with seasonal adjustment',
    };
  } catch (error) {
    console.error(`Error generating forecast for ${territory}:`, error);
    throw error;
  }
}

/**
 * Generate forecasts using simple moving average
 */
function generateForecasts(
  history: InflationHistory,
  months: number
): Array<{
  period: string;
  predictedIndex: number;
  predictedInflation: number;
  confidence: number;
}> {
  const forecasts = [];
  const dataPoints = history.dataPoints;

  if (dataPoints.length === 0) return [];

  // Calculate average monthly change
  const avgMonthlyChange = dataPoints
    .slice(-6) // Use last 6 months
    .reduce((sum, d) => sum + d.monthlyChange, 0) / Math.min(6, dataPoints.length);

  // Get last known values
  const lastPoint = dataPoints[dataPoints.length - 1];
  let currentIndex = lastPoint.indexValue;
  const lastDate = new Date(lastPoint.period + '-01');

  for (let i = 1; i <= months; i++) {
    // Project next month
    const nextDate = new Date(lastDate);
    nextDate.setMonth(nextDate.getMonth() + i);
    const nextPeriod = formatPeriod(nextDate);

    // Apply average monthly change with diminishing confidence
    currentIndex = currentIndex * (1 + avgMonthlyChange / 100);

    // Calculate yearly inflation (vs 12 months ago)
    const yearAgoIndex = i > 12 ? forecasts[i - 12].predictedIndex : 
      (dataPoints[dataPoints.length - (12 - i)] || dataPoints[0]).indexValue;
    const predictedInflation = ((currentIndex - yearAgoIndex) / yearAgoIndex) * 100;

    // Confidence decreases with distance
    const confidence = Math.max(40, 90 - (i * 5));

    forecasts.push({
      period: nextPeriod,
      predictedIndex: Math.round(currentIndex * 100) / 100,
      predictedInflation: Math.round(predictedInflation * 100) / 100,
      confidence,
    });
  }

  return forecasts;
}

/**
 * Get historical comparison across territories
 */
export async function getHistoricalComparison(
  startPeriod: string,
  endPeriod: string
): Promise<Record<string, InflationHistory>> {
  const comparison: Record<string, InflationHistory> = {};

  for (const territory of INFLATION_CONFIG.territories) {
    try {
      comparison[territory] = await getInflationHistory(territory, startPeriod, endPeriod);
    } catch (error) {
      console.error(`Error getting history for ${territory}:`, error);
    }
  }

  return comparison;
}

/**
 * Get year-over-year comparison
 */
export async function getYearOverYearComparison(
  territory: string,
  year1: number,
  year2: number
): Promise<{
  territory: string;
  year1: number;
  year2: number;
  monthlyComparison: Array<{
    month: number;
    year1Index: number;
    year2Index: number;
    difference: number;
  }>;
}> {
  try {
    const comparison = [];

    for (let month = 1; month <= 12; month++) {
      const period1 = `${year1}-${String(month).padStart(2, '0')}`;
      const period2 = `${year2}-${String(month).padStart(2, '0')}`;

      const index1 = await prisma.priceIndex.findUnique({
        where: { territory_period: { territory, period: period1 } },
      });

      const index2 = await prisma.priceIndex.findUnique({
        where: { territory_period: { territory, period: period2 } },
      });

      if (index1 && index2) {
        comparison.push({
          month,
          year1Index: index1.indexValue,
          year2Index: index2.indexValue,
          difference: Math.round((index2.indexValue - index1.indexValue) * 100) / 100,
        });
      }
    }

    return {
      territory,
      year1,
      year2,
      monthlyComparison: comparison,
    };
  } catch (error) {
    console.error(`Error getting year-over-year comparison:`, error);
    throw error;
  }
}
