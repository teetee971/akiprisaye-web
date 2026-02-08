/**
 * Price Submission Service
 * 
 * Handles submission of new prices with:
 * - Duplicate detection
 * - Validation
 * - Initial confidence scoring
 */

import { PrismaClient, PriceSource } from '@prisma/client';
import { getFullConfidenceScore } from './confidenceCalculator.js';

const prisma = new PrismaClient();

export interface PriceSubmissionData {
  productId: string;
  storeId: string;
  price: number;
  currency?: string;
  source: PriceSource;
  submittedBy?: string;
  proofUrl?: string;
}

export interface SubmissionResult {
  success: boolean;
  priceId?: string;
  isDuplicate?: boolean;
  existingPriceId?: string;
  confidenceScore?: number;
  error?: string;
}

/**
 * Check for duplicate price submissions
 * @param productId - Product ID
 * @param storeId - Store ID
 * @param price - Price value
 * @param timeWindowHours - Time window to check for duplicates (default: 24 hours)
 * @returns Existing price if duplicate found, null otherwise
 */
async function checkDuplicate(
  productId: string,
  storeId: string,
  price: number,
  timeWindowHours: number = 24
) {
  const cutoffDate = new Date();
  cutoffDate.setHours(cutoffDate.getHours() - timeWindowHours);

  // Find recent prices for same product/store with similar price (within 1%)
  const priceTolerance = price * 0.01;
  
  const existingPrice = await prisma.productPrice.findFirst({
    where: {
      productId,
      storeId,
      price: {
        gte: price - priceTolerance,
        lte: price + priceTolerance,
      },
      createdAt: {
        gte: cutoffDate,
      },
      isActive: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return existingPrice;
}

/**
 * Get historical prices for consistency check
 * @param productId - Product ID
 * @param storeId - Store ID
 * @param limit - Number of recent prices to fetch
 * @returns Array of recent prices
 */
async function getHistoricalPrices(
  productId: string,
  storeId: string,
  limit: number = 10
): Promise<number[]> {
  const recentPrices = await prisma.productPrice.findMany({
    where: {
      productId,
      storeId,
      isActive: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: limit,
    select: {
      price: true,
    },
  });

  return recentPrices.map(p => p.price);
}

/**
 * Validate price submission data
 * @param data - Submission data to validate
 * @returns Validation result with error message if invalid
 */
function validateSubmission(data: PriceSubmissionData): {
  valid: boolean;
  error?: string;
} {
  if (!data.productId || !data.storeId) {
    return { valid: false, error: 'Product ID and Store ID are required' };
  }

  if (typeof data.price !== 'number' || data.price <= 0) {
    return { valid: false, error: 'Price must be a positive number' };
  }

  if (data.price > 1000000) {
    return { valid: false, error: 'Price exceeds maximum allowed value' };
  }

  if (data.proofUrl && !isValidUrl(data.proofUrl)) {
    return { valid: false, error: 'Invalid proof URL format' };
  }

  return { valid: true };
}

/**
 * Basic URL validation
 */
function isValidUrl(url: string): boolean {
  try {
    // URL is globally available in Node.js
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Submit a new price
 * @param data - Price submission data
 * @returns Result of submission with price ID if successful
 */
export async function submitPrice(
  data: PriceSubmissionData
): Promise<SubmissionResult> {
  try {
    // Validate input
    const validation = validateSubmission(data);
    if (!validation.valid) {
      return {
        success: false,
        error: validation.error,
      };
    }

    // Check for duplicates
    const duplicate = await checkDuplicate(data.productId, data.storeId, data.price);
    if (duplicate) {
      return {
        success: false,
        isDuplicate: true,
        existingPriceId: duplicate.id,
        error: 'Similar price already exists for this product and store',
      };
    }

    // Get historical prices for consistency check
    const historicalPrices = await getHistoricalPrices(data.productId, data.storeId);

    // Calculate initial confidence score
    const confidence = getFullConfidenceScore({
      createdAt: new Date(),
      source: data.source,
      confirmationCount: 0,
      disputeCount: 0,
      currentPrice: data.price,
      historicalPrices,
    });

    // Determine freshness (less than 7 days)
    const isFresh = true;

    // Create price record
    const newPrice = await prisma.productPrice.create({
      data: {
        productId: data.productId,
        storeId: data.storeId,
        price: data.price,
        currency: data.currency || 'EUR',
        source: data.source,
        submittedBy: data.submittedBy,
        proofUrl: data.proofUrl,
        confidenceScore: confidence.total,
        recencyScore: confidence.recency,
        sourceScore: confidence.sourceReliability,
        verificationScore: confidence.verificationCount,
        consistencyScore: confidence.consistency,
        isActive: true,
        isFresh,
      },
    });

    return {
      success: true,
      priceId: newPrice.id,
      confidenceScore: confidence.total,
    };
  } catch (error) {
    console.error('Error submitting price:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Bulk submit prices
 * @param submissions - Array of price submissions
 * @returns Array of results for each submission
 */
export async function bulkSubmitPrices(
  submissions: PriceSubmissionData[]
): Promise<SubmissionResult[]> {
  const results: SubmissionResult[] = [];

  for (const submission of submissions) {
    const result = await submitPrice(submission);
    results.push(result);
  }

  return results;
}
