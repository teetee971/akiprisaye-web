/**
 * Price Verification Service
 * 
 * Handles community verification workflow:
 * - CONFIRM: User confirms the price is correct
 * - DISPUTE: User disputes the price and suggests correction
 * - UPDATE: Admin updates verification status
 */

import { PrismaClient, VerificationStatus, PriceSource } from '@prisma/client';
import { getFullConfidenceScore } from './confidenceCalculator.js';

const prisma = new PrismaClient();

export interface VerificationData {
  priceId: string;
  userId: string;
  status: VerificationStatus;
  comment?: string;
  proofUrl?: string;
  suggestedPrice?: number;
  suggestedSource?: PriceSource;
}

export interface VerificationResult {
  success: boolean;
  verificationId?: string;
  updatedConfidence?: number;
  error?: string;
}

/**
 * Check if user already verified this price
 * @param priceId - Price ID
 * @param userId - User ID
 * @returns Existing verification if found
 */
async function checkExistingVerification(priceId: string, userId: string) {
  return await prisma.priceVerification.findFirst({
    where: {
      priceId,
      userId,
    },
  });
}

/**
 * Get verification statistics for a price
 * @param priceId - Price ID
 * @returns Counts of confirmations and disputes
 */
async function getVerificationStats(priceId: string) {
  const verifications = await prisma.priceVerification.findMany({
    where: {
      priceId,
    },
    select: {
      status: true,
    },
  });

  const confirmations = verifications.filter(v => v.status === 'CONFIRMED').length;
  const disputes = verifications.filter(v => v.status === 'DISPUTED').length;

  return { confirmations, disputes };
}

/**
 * Recalculate confidence score after verification
 * @param priceId - Price ID
 */
async function recalculateConfidence(priceId: string) {
  const price = await prisma.productPrice.findUnique({
    where: { id: priceId },
    include: {
      verifications: true,
    },
  });

  if (!price) return;

  // Get historical prices
  const historicalPrices = await prisma.productPrice.findMany({
    where: {
      productId: price.productId,
      storeId: price.storeId,
      isActive: true,
      id: { not: priceId },
    },
    orderBy: { createdAt: 'desc' },
    take: 10,
    select: { price: true },
  });

  const stats = await getVerificationStats(priceId);

  const confidence = getFullConfidenceScore({
    createdAt: price.createdAt,
    source: price.source,
    confirmationCount: stats.confirmations,
    disputeCount: stats.disputes,
    currentPrice: price.price,
    historicalPrices: historicalPrices.map(p => p.price),
  });

  // Update price with new confidence scores
  await prisma.productPrice.update({
    where: { id: priceId },
    data: {
      confidenceScore: confidence.total,
      recencyScore: confidence.recency,
      sourceScore: confidence.sourceReliability,
      verificationScore: confidence.verificationCount,
      consistencyScore: confidence.consistency,
      verifiedAt: stats.confirmations > 0 ? new Date() : null,
    },
  });

  return confidence.total;
}

/**
 * Submit a verification for a price
 * @param data - Verification data
 * @returns Result of verification
 */
export async function verifyPrice(
  data: VerificationData
): Promise<VerificationResult> {
  try {
    // Validate price exists
    const price = await prisma.productPrice.findUnique({
      where: { id: data.priceId },
    });

    if (!price) {
      return {
        success: false,
        error: 'Price not found',
      };
    }

    if (!price.isActive) {
      return {
        success: false,
        error: 'Price is no longer active',
      };
    }

    // Check for existing verification
    const existing = await checkExistingVerification(data.priceId, data.userId);
    if (existing) {
      return {
        success: false,
        error: 'You have already verified this price',
      };
    }

    // Validate suggested price if disputing
    if (data.status === 'DISPUTED' && data.suggestedPrice) {
      if (data.suggestedPrice <= 0) {
        return {
          success: false,
          error: 'Suggested price must be positive',
        };
      }
    }

    // Create verification
    const verification = await prisma.priceVerification.create({
      data: {
        priceId: data.priceId,
        userId: data.userId,
        status: data.status,
        comment: data.comment,
        proofUrl: data.proofUrl,
        suggestedPrice: data.suggestedPrice,
        suggestedSource: data.suggestedSource,
      },
    });

    // Recalculate confidence score
    const updatedConfidence = await recalculateConfidence(data.priceId);

    return {
      success: true,
      verificationId: verification.id,
      updatedConfidence,
    };
  } catch (error) {
    console.error('Error verifying price:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Get all verifications for a price
 * @param priceId - Price ID
 * @returns Array of verifications with user info
 */
export async function getVerifications(priceId: string) {
  const verifications = await prisma.priceVerification.findMany({
    where: {
      priceId,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return verifications;
}

/**
 * Get verification statistics
 * @param priceId - Price ID
 * @returns Statistics about verifications
 */
export async function getVerificationSummary(priceId: string) {
  const stats = await getVerificationStats(priceId);
  
  const total = stats.confirmations + stats.disputes;
  const confirmationRate = total > 0 ? (stats.confirmations / total) * 100 : 0;

  return {
    totalVerifications: total,
    confirmations: stats.confirmations,
    disputes: stats.disputes,
    confirmationRate,
  };
}

/**
 * Update verification status (admin only)
 * @param verificationId - Verification ID
 * @param newStatus - New status
 * @returns Update result
 */
export async function updateVerificationStatus(
  verificationId: string,
  newStatus: VerificationStatus
): Promise<VerificationResult> {
  try {
    const verification = await prisma.priceVerification.update({
      where: { id: verificationId },
      data: { status: newStatus },
    });

    // Recalculate confidence after status change
    const updatedConfidence = await recalculateConfidence(verification.priceId);

    return {
      success: true,
      verificationId: verification.id,
      updatedConfidence,
    };
  } catch (error) {
    console.error('Error updating verification:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}
