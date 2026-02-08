/**
 * Price Anomaly Detector Service
 * 
 * Detects various types of price anomalies:
 * - sudden_increase (>20% in 7 days)
 * - sudden_decrease (>30%)
 * - outlier_high/low (±50% from average)
 * - stale_data (>30 days)
 * - inconsistent_source
 * - duplicate_entry
 */

import { PrismaClient, AnomalyType, Severity } from '@prisma/client';

const prisma = new PrismaClient();

export interface AnomalyDetectionResult {
  hasAnomaly: boolean;
  anomalies: Array<{
    type: AnomalyType;
    severity: Severity;
    description: string;
    detectedValue?: number;
    expectedValue?: number;
    deviation?: number;
  }>;
}

/**
 * Calculate percentage change
 */
function percentageChange(oldValue: number, newValue: number): number {
  return ((newValue - oldValue) / oldValue) * 100;
}

/**
 * Calculate average of array
 */
function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, val) => sum + val, 0) / values.length;
}

/**
 * Check for sudden price increase
 */
async function checkSuddenIncrease(
  productId: string,
  storeId: string,
  currentPrice: number
): Promise<AnomalyDetectionResult['anomalies']> {
  const anomalies: AnomalyDetectionResult['anomalies'] = [];

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const recentPrices = await prisma.productPrice.findMany({
    where: {
      productId,
      storeId,
      isActive: true,
      createdAt: {
        gte: sevenDaysAgo,
      },
    },
    orderBy: {
      createdAt: 'asc',
    },
  });

  if (recentPrices.length > 0) {
    const oldestPrice = recentPrices[0].price;
    const change = percentageChange(oldestPrice, currentPrice);

    if (change > 20) {
      anomalies.push({
        type: 'SUDDEN_INCREASE',
        severity: change > 50 ? 'HIGH' : change > 35 ? 'MEDIUM' : 'LOW',
        description: `Price increased by ${change.toFixed(1)}% in the last 7 days`,
        detectedValue: currentPrice,
        expectedValue: oldestPrice,
        deviation: change,
      });
    }
  }

  return anomalies;
}

/**
 * Check for sudden price decrease
 */
async function checkSuddenDecrease(
  productId: string,
  storeId: string,
  currentPrice: number
): Promise<AnomalyDetectionResult['anomalies']> {
  const anomalies: AnomalyDetectionResult['anomalies'] = [];

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const recentPrices = await prisma.productPrice.findMany({
    where: {
      productId,
      storeId,
      isActive: true,
      createdAt: {
        gte: sevenDaysAgo,
      },
    },
    orderBy: {
      createdAt: 'asc',
    },
  });

  if (recentPrices.length > 0) {
    const oldestPrice = recentPrices[0].price;
    const change = percentageChange(oldestPrice, currentPrice);

    if (change < -30) {
      anomalies.push({
        type: 'SUDDEN_DECREASE',
        severity: change < -60 ? 'CRITICAL' : change < -45 ? 'HIGH' : 'MEDIUM',
        description: `Price decreased by ${Math.abs(change).toFixed(1)}% in the last 7 days`,
        detectedValue: currentPrice,
        expectedValue: oldestPrice,
        deviation: Math.abs(change),
      });
    }
  }

  return anomalies;
}

/**
 * Check for outlier prices (high or low)
 */
async function checkOutliers(
  productId: string,
  storeId: string,
  currentPrice: number
): Promise<AnomalyDetectionResult['anomalies']> {
  const anomalies: AnomalyDetectionResult['anomalies'] = [];

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const historicalPrices = await prisma.productPrice.findMany({
    where: {
      productId,
      storeId,
      isActive: true,
      createdAt: {
        gte: thirtyDaysAgo,
      },
    },
    select: {
      price: true,
    },
  });

  if (historicalPrices.length >= 3) {
    const prices = historicalPrices.map(p => p.price);
    const avg = average(prices);
    const deviation = percentageChange(avg, currentPrice);

    if (Math.abs(deviation) > 50) {
      anomalies.push({
        type: deviation > 0 ? 'OUTLIER_HIGH' : 'OUTLIER_LOW',
        severity: Math.abs(deviation) > 80 ? 'HIGH' : 'MEDIUM',
        description: `Price is ${Math.abs(deviation).toFixed(1)}% ${deviation > 0 ? 'higher' : 'lower'} than 30-day average`,
        detectedValue: currentPrice,
        expectedValue: avg,
        deviation: Math.abs(deviation),
      });
    }
  }

  return anomalies;
}

/**
 * Check for stale data
 */
function checkStaleData(createdAt: Date): AnomalyDetectionResult['anomalies'] {
  const anomalies: AnomalyDetectionResult['anomalies'] = [];
  const now = new Date();
  const ageInDays = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24);

  if (ageInDays > 30) {
    anomalies.push({
      type: 'STALE_DATA',
      severity: ageInDays > 90 ? 'HIGH' : ageInDays > 60 ? 'MEDIUM' : 'LOW',
      description: `Price data is ${Math.floor(ageInDays)} days old`,
      detectedValue: ageInDays,
    });
  }

  return anomalies;
}

/**
 * Check for duplicate entries
 */
async function checkDuplicates(
  productId: string,
  storeId: string,
  currentPrice: number,
  currentId: string
): Promise<AnomalyDetectionResult['anomalies']> {
  const anomalies: AnomalyDetectionResult['anomalies'] = [];

  const oneDayAgo = new Date();
  oneDayAgo.setDate(oneDayAgo.getDate() - 1);

  const priceTolerance = currentPrice * 0.005; // 0.5% tolerance

  const duplicates = await prisma.productPrice.findMany({
    where: {
      productId,
      storeId,
      price: {
        gte: currentPrice - priceTolerance,
        lte: currentPrice + priceTolerance,
      },
      isActive: true,
      createdAt: {
        gte: oneDayAgo,
      },
      id: {
        not: currentId,
      },
    },
  });

  if (duplicates.length > 0) {
    anomalies.push({
      type: 'DUPLICATE_ENTRY',
      severity: 'LOW',
      description: `Found ${duplicates.length} similar price(s) submitted in the last 24 hours`,
      detectedValue: duplicates.length,
    });
  }

  return anomalies;
}

/**
 * Detect all anomalies for a price
 * @param priceId - Price ID to check
 * @returns Detection result with all found anomalies
 */
export async function detectAnomalies(priceId: string): Promise<AnomalyDetectionResult> {
  const price = await prisma.productPrice.findUnique({
    where: { id: priceId },
  });

  if (!price) {
    return {
      hasAnomaly: false,
      anomalies: [],
    };
  }

  // Run all anomaly checks
  const [
    suddenIncreases,
    suddenDecreases,
    outliers,
    staleData,
    duplicates,
  ] = await Promise.all([
    checkSuddenIncrease(price.productId, price.storeId, price.price),
    checkSuddenDecrease(price.productId, price.storeId, price.price),
    checkOutliers(price.productId, price.storeId, price.price),
    Promise.resolve(checkStaleData(price.createdAt)),
    checkDuplicates(price.productId, price.storeId, price.price, price.id),
  ]);

  const allAnomalies = [
    ...suddenIncreases,
    ...suddenDecreases,
    ...outliers,
    ...staleData,
    ...duplicates,
  ];

  return {
    hasAnomaly: allAnomalies.length > 0,
    anomalies: allAnomalies,
  };
}

/**
 * Create anomaly records in database
 * @param priceId - Price ID
 * @param anomalies - Detected anomalies
 */
export async function recordAnomalies(
  priceId: string,
  anomalies: AnomalyDetectionResult['anomalies']
): Promise<void> {
  for (const anomaly of anomalies) {
    await prisma.priceAnomaly.create({
      data: {
        priceId,
        anomalyType: anomaly.type,
        severity: anomaly.severity,
        description: anomaly.description,
        detectedValue: anomaly.detectedValue,
        expectedValue: anomaly.expectedValue,
        deviation: anomaly.deviation,
      },
    });
  }
}

/**
 * Check and record anomalies for a price
 * @param priceId - Price ID to check
 * @returns Detection result
 */
export async function checkAndRecordAnomalies(
  priceId: string
): Promise<AnomalyDetectionResult> {
  const result = await detectAnomalies(priceId);

  if (result.hasAnomaly) {
    await recordAnomalies(priceId, result.anomalies);
  }

  return result;
}

/**
 * Get all unresolved anomalies for a price
 * @param priceId - Price ID
 */
export async function getUnresolvedAnomalies(priceId: string) {
  return await prisma.priceAnomaly.findMany({
    where: {
      priceId,
      isResolved: false,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
}

/**
 * Resolve an anomaly
 * @param anomalyId - Anomaly ID
 * @param resolvedBy - User/Admin ID who resolved it
 * @param note - Resolution note
 */
export async function resolveAnomaly(
  anomalyId: string,
  resolvedBy: string,
  note?: string
) {
  return await prisma.priceAnomaly.update({
    where: { id: anomalyId },
    data: {
      isResolved: true,
      resolvedBy,
      resolvedAt: new Date(),
      resolutionNote: note,
    },
  });
}
