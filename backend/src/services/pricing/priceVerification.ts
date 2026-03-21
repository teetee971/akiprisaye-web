/**
 * Price Verification Service
 * Handles community verification and disputes of prices
 */

import { PrismaClient, Prisma, VerificationAction, VerificationStatus } from '@prisma/client';
import { calculateConfidenceScore } from './confidenceCalculator.js';

const prisma = new PrismaClient();

export interface VerifyPriceRequest {
  priceId: string;
  userId: string;
  action: VerificationAction;
  comment?: string;
}

export interface VerifyPriceResponse {
  success: boolean;
  message: string;
  newConfidenceScore: number;
  verificationStatus: VerificationStatus;
}

/**
 * Get historical prices for recalculation
 */
async function getHistoricalPricesForPrice(priceId: string): Promise<number[]> {
  const price = await prisma.productPrice.findUnique({
    where: { id: priceId },
    select: { productId: true, storeId: true },
  });
  
  if (!price) return [];
  
  const historical = await prisma.productPrice.findMany({
    where: {
      productId: price.productId,
      storeId: price.storeId,
      isActive: true,
      id: { not: priceId },
    },
    orderBy: {
      observedAt: 'desc',
    },
    take: 10,
    select: {
      price: true,
    },
  });
  
  return historical.map((p) => p.price);
}

/**
 * Recalculate confidence score after verification
 */
async function recalculateConfidence(priceId: string): Promise<number> {
  const price = await prisma.productPrice.findUnique({
    where: { id: priceId },
    include: {
      verifications: true,
    },
  });
  
  if (!price) return 0;
  
  const historicalPrices = await getHistoricalPricesForPrice(priceId);
  
  const confidenceData = calculateConfidenceScore({
    observedAt: price.observedAt,
    source: price.source,
    verificationCount: price.verificationCount,
    price: price.price,
    historicalPrices,
  });
  
  // Update the price with new confidence score
  await prisma.productPrice.update({
    where: { id: priceId },
    data: {
      confidenceScore: confidenceData.score,
      confidenceFactors: confidenceData.factors as unknown as Prisma.InputJsonValue,
    },
  });
  
  return confidenceData.score;
}

/**
 * Determine verification status based on verifications
 */
function determineVerificationStatus(
  confirmCount: number,
  disputeCount: number
): VerificationStatus {
  if (disputeCount >= 3) return 'DISPUTED';
  if (confirmCount >= 2) return 'VERIFIED';
  return 'UNVERIFIED';
}

/**
 * Verify or dispute a price
 */
export async function verifyPrice(request: VerifyPriceRequest): Promise<VerifyPriceResponse> {
  // Check if price exists
  const price = await prisma.productPrice.findUnique({
    where: { id: request.priceId },
    include: {
      verifications: true,
    },
  });
  
  if (!price) {
    return {
      success: false,
      message: 'Prix introuvable',
      newConfidenceScore: 0,
      verificationStatus: 'UNVERIFIED',
    };
  }
  
  // Check if user already verified this price
  const existingVerification = price.verifications.find(
    (v) => v.userId === request.userId
  );
  
  if (existingVerification) {
    return {
      success: false,
      message: 'Vous avez déjà vérifié ce prix',
      newConfidenceScore: price.confidenceScore,
      verificationStatus: price.verificationStatus,
    };
  }
  
  // Create verification record
  await prisma.priceVerification.create({
    data: {
      priceId: request.priceId,
      userId: request.userId,
      action: request.action,
      comment: request.comment,
    },
  });
  
  // Count confirmations and disputes
  const allVerifications = await prisma.priceVerification.findMany({
    where: { priceId: request.priceId },
  });
  
  const confirmCount = allVerifications.filter((v) => v.action === 'CONFIRM').length;
  const disputeCount = allVerifications.filter((v) => v.action === 'DISPUTE').length;
  
  // Determine new verification status
  const newStatus = determineVerificationStatus(confirmCount, disputeCount);
  
  // Update price
  await prisma.productPrice.update({
    where: { id: request.priceId },
    data: {
      verificationCount: confirmCount,
      verificationStatus: newStatus,
      lastVerifiedAt: new Date(),
    },
  });
  
  // Recalculate confidence score
  const newConfidenceScore = await recalculateConfidence(request.priceId);
  
  let message: string;
  if (request.action === 'CONFIRM') {
    message = 'Merci pour votre confirmation !';
  } else if (request.action === 'DISPUTE') {
    message = 'Contestation enregistrée, le prix sera vérifié';
  } else {
    message = 'Mise à jour enregistrée';
  }
  
  return {
    success: true,
    message,
    newConfidenceScore,
    verificationStatus: newStatus,
  };
}

/**
 * Get verification statistics for a price
 */
export async function getPriceVerificationStats(priceId: string) {
  const verifications = await prisma.priceVerification.findMany({
    where: { priceId },
    select: {
      action: true,
      createdAt: true,
    },
  });
  
  const confirms = verifications.filter((v) => v.action === 'CONFIRM').length;
  const disputes = verifications.filter((v) => v.action === 'DISPUTE').length;
  const updates = verifications.filter((v) => v.action === 'UPDATE').length;
  
  return {
    total: verifications.length,
    confirms,
    disputes,
    updates,
    verifications: verifications.map((v) => ({
      action: v.action,
      date: v.createdAt,
    })),
  };
}
