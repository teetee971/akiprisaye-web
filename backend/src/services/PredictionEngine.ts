// backend/src/services/PredictionEngine.ts
/**
 * PredictionEngine Service
 * 
 * IMPORTANT: Simple statistical prediction ONLY
 * NO opaque AI/ML models
 * Methodology MUST be transparent and explainable
 * 
 * Based on:
 * - Historical price data (INSEE, OPMR)
 * - Seasonal patterns
 * - Linear trend analysis
 */

import { PriceRecord } from '../models/PriceRecord';

interface PricePrediction {
  ean: string;
  productName: string;
  territory: string;
  predictions: Array<{
    date: Date;
    predictedPrice: number;
    confidenceInterval: {
      min: number;
      max: number;
    };
  }>;
  methodology: {
    model: 'moving_average' | 'linear_trend' | 'seasonal';
    parameters: any;
    accuracy: number; // Estimated margin of error in %
  };
  disclaimer: string;
}

interface TrendAnalysis {
  trend: 'rising' | 'falling' | 'stable';
  slope: number; // Price change per month
  seasonalityDetected: boolean;
  inflationImpact: number; // Local inflation rate
  confidence: number; // 0-100
}

export class PredictionEngine {
  private readonly MARGIN_OF_ERROR = 15; // ±15% as stated in requirements
  private readonly MIN_DATA_POINTS = 6; // At least 6 months of data

  /**
   * Generate price predictions using simple moving average
   * This is NOT AI - just basic statistics
   */
  async predictPrices(
    historicalPrices: Array<{ date: Date; price: number }>,
    ean: string,
    productName: string,
    territory: string,
    monthsAhead: number = 3
  ): Promise<PricePrediction | null> {
    if (historicalPrices.length < this.MIN_DATA_POINTS) {
      return null; // Not enough data for reliable prediction
    }

    // Sort by date
    const sorted = [...historicalPrices].sort((a, b) => 
      a.date.getTime() - b.date.getTime()
    );

    // Calculate moving average (last 3 months)
    const windowSize = 3;
    const recentPrices = sorted.slice(-windowSize);
    const movingAvg = recentPrices.reduce((sum, p) => sum + p.price, 0) / windowSize;

    // Calculate linear trend
    const trend = this.calculateLinearTrend(sorted);

    // Generate predictions
    const predictions = [];
    const lastDate = sorted[sorted.length - 1].date;
    let currentPrice = movingAvg;

    for (let i = 1; i <= monthsAhead; i++) {
      const futureDate = new Date(lastDate);
      futureDate.setMonth(futureDate.getMonth() + i);

      // Apply trend
      currentPrice += trend.slope;

      // Apply seasonal adjustment if detected
      if (trend.seasonalityDetected) {
        const seasonalFactor = this.getSeasonalFactor(futureDate.getMonth());
        currentPrice *= seasonalFactor;
      }

      const margin = currentPrice * (this.MARGIN_OF_ERROR / 100);

      predictions.push({
        date: futureDate,
        predictedPrice: parseFloat(currentPrice.toFixed(2)),
        confidenceInterval: {
          min: parseFloat((currentPrice - margin).toFixed(2)),
          max: parseFloat((currentPrice + margin).toFixed(2)),
        },
      });
    }

    return {
      ean,
      productName,
      territory,
      predictions,
      methodology: {
        model: 'moving_average',
        parameters: {
          windowSize,
          trendSlope: trend.slope,
          seasonalAdjustment: trend.seasonalityDetected,
        },
        accuracy: this.MARGIN_OF_ERROR,
      },
      disclaimer: 'Estimation basée sur données publiques (INSEE/OPMR) — pas une certitude. Méthode : Moyenne mobile + tendance. Pas d\'IA opaque. Marge d\'erreur : ±15%.',
    };
  }

  /**
   * Calculate linear trend from historical data
   * Returns slope (price change per month) and seasonality detection
   */
  private calculateLinearTrend(
    prices: Array<{ date: Date; price: number }>
  ): TrendAnalysis {
    if (prices.length < 2) {
      return {
        trend: 'stable',
        slope: 0,
        seasonalityDetected: false,
        inflationImpact: 0,
        confidence: 0,
      };
    }

    // Simple linear regression
    const n = prices.length;
    const startDate = prices[0].date.getTime();
    
    // Convert dates to months from start
    const points = prices.map((p, i) => ({
      x: this.monthsDifference(prices[0].date, p.date),
      y: p.price,
    }));

    const sumX = points.reduce((sum, p) => sum + p.x, 0);
    const sumY = points.reduce((sum, p) => sum + p.y, 0);
    const sumXY = points.reduce((sum, p) => sum + p.x * p.y, 0);
    const sumXX = points.reduce((sum, p) => sum + p.x * p.x, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // Determine trend direction
    let trend: 'rising' | 'falling' | 'stable';
    if (Math.abs(slope) < 0.01) {
      trend = 'stable';
    } else if (slope > 0) {
      trend = 'rising';
    } else {
      trend = 'falling';
    }

    // Detect seasonality (very basic - check if prices vary by month)
    const seasonalityDetected = this.detectSeasonality(prices);

    // Calculate confidence based on data quality
    const confidence = Math.min(100, (n / this.MIN_DATA_POINTS) * 70);

    return {
      trend,
      slope: parseFloat(slope.toFixed(4)),
      seasonalityDetected,
      inflationImpact: 0, // TODO: Integrate with INSEE inflation data
      confidence: Math.round(confidence),
    };
  }

  /**
   * Calculate months difference between two dates
   */
  private monthsDifference(date1: Date, date2: Date): number {
    const years = date2.getFullYear() - date1.getFullYear();
    const months = date2.getMonth() - date1.getMonth();
    return years * 12 + months;
  }

  /**
   * Very basic seasonality detection
   * Checks if prices show monthly patterns
   */
  private detectSeasonality(
    prices: Array<{ date: Date; price: number }>
  ): boolean {
    if (prices.length < 12) {
      return false; // Need at least 1 year of data
    }

    // Group by month
    const byMonth: Record<number, number[]> = {};
    prices.forEach(p => {
      const month = p.date.getMonth();
      if (!byMonth[month]) {
        byMonth[month] = [];
      }
      byMonth[month].push(p.price);
    });

    // Calculate variance between months
    const monthlyAvgs = Object.values(byMonth).map(prices => 
      prices.reduce((sum, p) => sum + p, 0) / prices.length
    );

    const overallAvg = monthlyAvgs.reduce((sum, a) => sum + a, 0) / monthlyAvgs.length;
    const variance = monthlyAvgs.reduce((sum, a) => sum + Math.pow(a - overallAvg, 2), 0) / monthlyAvgs.length;
    const stdDev = Math.sqrt(variance);

    // If standard deviation > 5% of average, consider it seasonal
    return (stdDev / overallAvg) > 0.05;
  }

  /**
   * Get seasonal adjustment factor for a given month
   * Very simplified - in reality, this would be product-specific
   */
  private getSeasonalFactor(month: number): number {
    // Example: Fruits/vegetables have seasonal patterns
    // This is a placeholder - real implementation would use historical data
    const factors = [
      1.0,  // Jan
      1.0,  // Feb
      0.95, // Mar (spring)
      0.90, // Apr
      0.90, // May
      0.95, // Jun (summer)
      1.0,  // Jul
      1.0,  // Aug
      1.05, // Sep (fall)
      1.05, // Oct
      1.10, // Nov (winter)
      1.10, // Dec
    ];

    return factors[month];
  }

  /**
   * Analyze inflation impact on prices
   * Would integrate with INSEE inflation data in production
   */
  async getInflationImpact(territory: string): Promise<{
    rate: number; // Annual inflation rate in %
    source: string;
    date: Date;
  }> {
    // Placeholder - in production, fetch from INSEE API
    return {
      rate: 2.3,
      source: 'INSEE',
      date: new Date('2024-11-01'),
    };
  }
}

export const predictionEngine = new PredictionEngine();
export default PredictionEngine;
