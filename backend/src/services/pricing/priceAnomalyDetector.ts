/**
 * Price Anomaly Detector
 * Detects unusual price changes and patterns
 */

import { PrismaClient, AnomalyType, Severity } from '@prisma/client';

const prisma = new PrismaClient();

export interface AnomalyContext {
  historicalAverage: number;
  recentPrices: number[];
  territoryAverage?: number;
  nationalAverage?: number;
}

export interface DetectedAnomaly {
  type: AnomalyType;
  severity: Severity;
  deviation: number;
  context: AnomalyContext;
  message: string;
}

/**
 * Calculate historical average for a product at a store
 */
async function calculateHistoricalAverage(
  productId: string,
  storeId: string,
  days: number = 90
): Promise<{ average: number; prices: number[] }> {
  const since = new Date();
  since.setDate(since.getDate() - days);
  
  const prices = await prisma.productPrice.findMany({
    where: {
      productId,
      storeId,
      observedAt: { gte: since },
      isActive: true,
      verificationStatus: { not: 'DISPUTED' },
    },
    select: { price: true },
    orderBy: { observedAt: 'desc' },
  });
  
  if (prices.length === 0) {
    return { average: 0, prices: [] };
  }
  
  const priceValues = prices.map((p) => p.price);
  const average = priceValues.reduce((sum: number, p: number) => sum + p, 0) / priceValues.length;
  
  return { average, prices: priceValues };
}

/**
 * Get most recent price before current one
 */
async function getPreviousPrice(
  productId: string,
  storeId: string,
  currentDate: Date
): Promise<number | null> {
  const previous = await prisma.productPrice.findFirst({
    where: {
      productId,
      storeId,
      observedAt: { lt: currentDate },
      isActive: true,
    },
    orderBy: { observedAt: 'desc' },
    select: { price: true, observedAt: true },
  });
  
  return previous?.price || null;
}

/**
 * Check for sudden price increase
 */
function checkSuddenIncrease(
  currentPrice: number,
  previousPrice: number | null,
  historicalAvg: number
): DetectedAnomaly | null {
  if (!previousPrice) return null;
  
  const increase = ((currentPrice - previousPrice) / previousPrice) * 100;
  
  if (increase > 50) {
    return {
      type: 'SUDDEN_INCREASE',
      severity: 'CRITICAL',
      deviation: increase,
      context: { historicalAverage: historicalAvg, recentPrices: [] },
      message: `Hausse brutale de ${increase.toFixed(1)}% détectée`,
    };
  } else if (increase > 30) {
    return {
      type: 'SUDDEN_INCREASE',
      severity: 'HIGH',
      deviation: increase,
      context: { historicalAverage: historicalAvg, recentPrices: [] },
      message: `Hausse importante de ${increase.toFixed(1)}% détectée`,
    };
  } else if (increase > 20) {
    return {
      type: 'SUDDEN_INCREASE',
      severity: 'MEDIUM',
      deviation: increase,
      context: { historicalAverage: historicalAvg, recentPrices: [] },
      message: `Hausse de ${increase.toFixed(1)}% détectée`,
    };
  }
  
  return null;
}

/**
 * Check for sudden price decrease
 */
function checkSuddenDecrease(
  currentPrice: number,
  previousPrice: number | null,
  historicalAvg: number
): DetectedAnomaly | null {
  if (!previousPrice) return null;
  
  const decrease = ((previousPrice - currentPrice) / previousPrice) * 100;
  
  if (decrease > 50) {
    return {
      type: 'SUDDEN_DECREASE',
      severity: 'HIGH',
      deviation: -decrease,
      context: { historicalAverage: historicalAvg, recentPrices: [] },
      message: `Baisse brutale de ${decrease.toFixed(1)}% détectée`,
    };
  } else if (decrease > 30) {
    return {
      type: 'SUDDEN_DECREASE',
      severity: 'MEDIUM',
      deviation: -decrease,
      context: { historicalAverage: historicalAvg, recentPrices: [] },
      message: `Baisse importante de ${decrease.toFixed(1)}% détectée`,
    };
  }
  
  return null;
}

/**
 * Check for outlier prices
 */
function checkOutlier(
  currentPrice: number,
  historicalAvg: number,
  recentPrices: number[]
): DetectedAnomaly | null {
  if (recentPrices.length < 3) return null; // Need enough data
  if (historicalAvg <= 0) return null; // Cannot calculate deviation with zero or negative average
  
  const deviation = ((currentPrice - historicalAvg) / historicalAvg) * 100;
  
  if (Math.abs(deviation) > 100) {
    const type = deviation > 0 ? 'OUTLIER_HIGH' : 'OUTLIER_LOW';
    return {
      type,
      severity: 'CRITICAL',
      deviation,
      context: { historicalAverage: historicalAvg, recentPrices },
      message: `Prix anormal: écart de ${Math.abs(deviation).toFixed(1)}% par rapport à la moyenne`,
    };
  } else if (Math.abs(deviation) > 50) {
    const type = deviation > 0 ? 'OUTLIER_HIGH' : 'OUTLIER_LOW';
    return {
      type,
      severity: 'HIGH',
      deviation,
      context: { historicalAverage: historicalAvg, recentPrices },
      message: `Prix inhabituel: écart de ${Math.abs(deviation).toFixed(1)}% par rapport à la moyenne`,
    };
  }
  
  return null;
}

/**
 * Check if data is stale
 */
function checkStaleData(observedAt: Date): DetectedAnomaly | null {
  const daysSinceObservation = Math.floor(
    (Date.now() - observedAt.getTime()) / (1000 * 60 * 60 * 24)
  );
  
  if (daysSinceObservation > 90) {
    return {
      type: 'STALE_DATA',
      severity: 'MEDIUM',
      deviation: daysSinceObservation,
      context: { historicalAverage: 0, recentPrices: [] },
      message: `Données périmées (${daysSinceObservation} jours)`,
    };
  } else if (daysSinceObservation > 60) {
    return {
      type: 'STALE_DATA',
      severity: 'LOW',
      deviation: daysSinceObservation,
      context: { historicalAverage: 0, recentPrices: [] },
      message: `Données anciennes (${daysSinceObservation} jours)`,
    };
  }
  
  return null;
}

/**
 * Detect anomalies for a given price
 */
export async function detectAnomalies(
  priceId: string
): Promise<DetectedAnomaly[]> {
  const price = await prisma.productPrice.findUnique({
    where: { id: priceId },
  });
  
  if (!price) return [];
  
  const anomalies: DetectedAnomaly[] = [];
  
  // Get historical data
  const { average: historicalAvg, prices: recentPrices } = await calculateHistoricalAverage(
    price.productId,
    price.storeId
  );
  
  // Get previous price
  const previousPrice = await getPreviousPrice(
    price.productId,
    price.storeId,
    price.observedAt
  );
  
  // Check for sudden increase
  const increaseAnomaly = checkSuddenIncrease(price.price, previousPrice, historicalAvg);
  if (increaseAnomaly) {
    increaseAnomaly.context.recentPrices = recentPrices;
    anomalies.push(increaseAnomaly);
  }
  
  // Check for sudden decrease
  const decreaseAnomaly = checkSuddenDecrease(price.price, previousPrice, historicalAvg);
  if (decreaseAnomaly) {
    decreaseAnomaly.context.recentPrices = recentPrices;
    anomalies.push(decreaseAnomaly);
  }
  
  // Check for outliers
  if (recentPrices.length > 0) {
    const outlierAnomaly = checkOutlier(price.price, historicalAvg, recentPrices);
    if (outlierAnomaly) {
      anomalies.push(outlierAnomaly);
    }
  }
  
  // Check for stale data
  const staleAnomaly = checkStaleData(price.observedAt);
  if (staleAnomaly) {
    anomalies.push(staleAnomaly);
  }
  
  // Save anomalies to database (with deduplication)
  for (const anomaly of anomalies) {
    // Check if this anomaly type already exists for this price (within last 24 hours)
    const recentThreshold = new Date();
    recentThreshold.setHours(recentThreshold.getHours() - 24);
    
    const existingAnomaly = await prisma.priceAnomaly.findFirst({
      where: {
        priceId: price.id,
        anomalyType: anomaly.type,
        createdAt: {
          gte: recentThreshold,
        },
      },
    });
    
    // Only create if no recent duplicate exists
    if (!existingAnomaly) {
      await prisma.priceAnomaly.create({
        data: {
          priceId: price.id,
          productId: price.productId,
          storeId: price.storeId,
          anomalyType: anomaly.type,
          severity: anomaly.severity,
          reportedPrice: price.price,
          expectedPrice: historicalAvg || price.price,
          deviation: anomaly.deviation,
          context: anomaly.context,
        },
      });
    }
  }
  
  return anomalies;
}

/**
 * Scan all recent prices for anomalies
 */
export async function scanRecentPricesForAnomalies(hoursBack: number = 24): Promise<number> {
  const since = new Date();
  since.setHours(since.getHours() - hoursBack);
  
  const recentPrices = await prisma.productPrice.findMany({
    where: {
      createdAt: { gte: since },
      isActive: true,
    },
    select: { id: true },
  });
  
  let anomalyCount = 0;
  
  for (const price of recentPrices) {
    const anomalies = await detectAnomalies(price.id);
    anomalyCount += anomalies.length;
  }
  
  return anomalyCount;
}

/**
 * Get existing anomalies for a price (read-only, no detection)
 */
export async function getAnomaliesForPrice(priceId: string) {
  return await prisma.priceAnomaly.findMany({
    where: { priceId },
    orderBy: { createdAt: 'desc' },
  });
}
