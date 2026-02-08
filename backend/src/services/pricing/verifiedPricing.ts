/**
 * Verified Pricing Core Service
 * 
 * Main service for managing verified pricing system with:
 * - Freshness status determination
 * - Best price selection
 * - Price queries with confidence filters
 */

import { PrismaClient, PriceSource } from '@prisma/client';
import { submitPrice, PriceSubmissionData } from './priceSubmission.js';
import { checkAndRecordAnomalies } from './priceAnomalyDetector.js';

const prisma = new PrismaClient();

export type FreshnessStatus = 'FRESH' | 'RECENT' | 'STALE' | 'OUTDATED';

/**
 * Determine freshness status based on age
 * @param createdAt - Date when price was created
 * @returns Freshness status
 */
export function getFreshnessStatus(createdAt: Date): FreshnessStatus {
  const now = new Date();
  const ageInDays = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24);

  if (ageInDays < 7) return 'FRESH'; // Less than 7 days
  if (ageInDays < 14) return 'RECENT'; // 7-14 days
  if (ageInDays < 30) return 'STALE'; // 14-30 days
  return 'OUTDATED'; // Over 30 days
}

/**
 * Update freshness status for all prices
 */
export async function updateFreshnessStatus(): Promise<number> {
  const allPrices = await prisma.productPrice.findMany({
    where: {
      isActive: true,
    },
  });

  let updatedCount = 0;

  for (const price of allPrices) {
    const status = getFreshnessStatus(price.createdAt);
    const isFresh = status === 'FRESH';

    if (price.isFresh !== isFresh) {
      await prisma.productPrice.update({
        where: { id: price.id },
        data: { isFresh },
      });
      updatedCount++;
    }
  }

  return updatedCount;
}

/**
 * Get prices for a product with optional filters
 * @param productId - Product ID
 * @param options - Query options
 * @returns Array of prices matching criteria
 */
export async function getProductPrices(
  productId: string,
  options: {
    storeId?: string;
    minConfidence?: number;
    onlyFresh?: boolean;
    limit?: number;
    offset?: number;
  } = {}
) {
  const {
    storeId,
    minConfidence = 0,
    onlyFresh = false,
    limit = 50,
    offset = 0,
  } = options;

  const prices = await prisma.productPrice.findMany({
    where: {
      productId,
      ...(storeId && { storeId }),
      isActive: true,
      ...(onlyFresh && { isFresh: true }),
      confidenceScore: {
        gte: minConfidence,
      },
    },
    orderBy: [
      { confidenceScore: 'desc' },
      { createdAt: 'desc' },
    ],
    take: limit,
    skip: offset,
    include: {
      verifications: {
        select: {
          status: true,
        },
      },
      anomalies: {
        where: {
          isResolved: false,
        },
        select: {
          anomalyType: true,
          severity: true,
        },
      },
    },
  });

  return prices.map(price => ({
    ...price,
    freshnessStatus: getFreshnessStatus(price.createdAt),
    verificationCount: price.verifications.length,
    unresolvedAnomalies: price.anomalies.length,
  }));
}

/**
 * Get all prices for a specific store
 * @param storeId - Store ID
 * @param options - Query options
 * @returns Array of prices at the store
 */
export async function getStorePrices(
  storeId: string,
  options: {
    minConfidence?: number;
    onlyFresh?: boolean;
    limit?: number;
    offset?: number;
  } = {}
) {
  const {
    minConfidence = 0,
    onlyFresh = false,
    limit = 100,
    offset = 0,
  } = options;

  const prices = await prisma.productPrice.findMany({
    where: {
      storeId,
      isActive: true,
      ...(onlyFresh && { isFresh: true }),
      confidenceScore: {
        gte: minConfidence,
      },
    },
    orderBy: [
      { confidenceScore: 'desc' },
      { createdAt: 'desc' },
    ],
    take: limit,
    skip: offset,
  });

  return prices.map(price => ({
    ...price,
    freshnessStatus: getFreshnessStatus(price.createdAt),
  }));
}

/**
 * Get the best (highest confidence) price for a product
 * @param productId - Product ID
 * @param options - Query options
 * @returns Best price or null if none found
 */
export async function getBestPrice(
  productId: string,
  options: {
    storeId?: string;
    minConfidence?: number;
    onlyFresh?: boolean;
  } = {}
) {
  const {
    storeId,
    minConfidence = 50, // Higher default for "best" price
    onlyFresh = true, // Default to fresh prices only
  } = options;

  const price = await prisma.productPrice.findFirst({
    where: {
      productId,
      ...(storeId && { storeId }),
      isActive: true,
      ...(onlyFresh && { isFresh: true }),
      confidenceScore: {
        gte: minConfidence,
      },
    },
    orderBy: [
      { confidenceScore: 'desc' },
      { createdAt: 'desc' },
    ],
    include: {
      verifications: true,
      anomalies: {
        where: {
          isResolved: false,
        },
      },
    },
  });

  if (!price) return null;

  return {
    ...price,
    freshnessStatus: getFreshnessStatus(price.createdAt),
    verificationCount: price.verifications.length,
    unresolvedAnomalies: price.anomalies.length,
  };
}

/**
 * Submit a price and automatically check for anomalies
 * @param data - Price submission data
 * @returns Submission result with anomaly check
 */
export async function submitAndVerifyPrice(data: PriceSubmissionData) {
  // Submit the price
  const result = await submitPrice(data);

  if (!result.success || !result.priceId) {
    return result;
  }

  // Check for anomalies
  const anomalyCheck = await checkAndRecordAnomalies(result.priceId);

  return {
    ...result,
    hasAnomalies: anomalyCheck.hasAnomaly,
    anomalies: anomalyCheck.anomalies,
  };
}

/**
 * Deactivate old/outdated prices
 * @param daysOld - Age threshold in days (default: 90)
 * @returns Number of prices deactivated
 */
export async function deactivateOldPrices(daysOld: number = 90): Promise<number> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);

  const result = await prisma.productPrice.updateMany({
    where: {
      isActive: true,
      createdAt: {
        lt: cutoffDate,
      },
    },
    data: {
      isActive: false,
    },
  });

  return result.count;
}

/**
 * Get price statistics
 * @returns Overall statistics
 */
export async function getPriceStats() {
  const [
    totalPrices,
    activePrices,
    freshPrices,
    highConfidencePrices,
    verifiedPrices,
    anomalyCount,
  ] = await Promise.all([
    prisma.productPrice.count(),
    prisma.productPrice.count({ where: { isActive: true } }),
    prisma.productPrice.count({ where: { isActive: true, isFresh: true } }),
    prisma.productPrice.count({ where: { isActive: true, confidenceScore: { gte: 70 } } }),
    prisma.productPrice.count({ where: { isActive: true, verifiedAt: { not: null } } }),
    prisma.priceAnomaly.count({ where: { isResolved: false } }),
  ]);

  const avgConfidence = await prisma.productPrice.aggregate({
    where: { isActive: true },
    _avg: {
      confidenceScore: true,
    },
  });

  return {
    totalPrices,
    activePrices,
    freshPrices,
    highConfidencePrices,
    verifiedPrices,
    unresolvedAnomalies: anomalyCount,
    averageConfidence: avgConfidence._avg.confidenceScore || 0,
  };
}

/**
 * Search prices by criteria
 * @param criteria - Search criteria
 * @returns Matching prices
 */
export async function searchPrices(criteria: {
  productIds?: string[];
  storeIds?: string[];
  minPrice?: number;
  maxPrice?: number;
  source?: PriceSource;
  minConfidence?: number;
  onlyFresh?: boolean;
  limit?: number;
  offset?: number;
}) {
  const {
    productIds,
    storeIds,
    minPrice,
    maxPrice,
    source,
    minConfidence = 0,
    onlyFresh = false,
    limit = 100,
    offset = 0,
  } = criteria;

  const prices = await prisma.productPrice.findMany({
    where: {
      ...(productIds && { productId: { in: productIds } }),
      ...(storeIds && { storeId: { in: storeIds } }),
      ...(minPrice !== undefined && { price: { gte: minPrice } }),
      ...(maxPrice !== undefined && { price: { lte: maxPrice } }),
      ...(source && { source }),
      isActive: true,
      ...(onlyFresh && { isFresh: true }),
      confidenceScore: {
        gte: minConfidence,
      },
    },
    orderBy: [
      { confidenceScore: 'desc' },
      { createdAt: 'desc' },
    ],
    take: limit,
    skip: offset,
  });

  return prices.map(price => ({
    ...price,
    freshnessStatus: getFreshnessStatus(price.createdAt),
  }));
}
