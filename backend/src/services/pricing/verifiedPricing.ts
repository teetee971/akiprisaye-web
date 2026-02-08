/**
 * Verified Pricing Service
 * Main service for managing verified product prices
 */

import { PrismaClient, PriceSource, VerificationStatus } from '@prisma/client';

const prisma = new PrismaClient();

export interface VerifiedPrice {
  id: string;
  productId: string;
  storeId: string;
  price: number;
  currency: string;
  
  // Traçabilité
  source: PriceSource;
  observedAt: string;
  reportedBy?: string;
  
  // Vérification
  verificationStatus: VerificationStatus;
  verificationCount: number;
  lastVerifiedAt?: string;
  
  // Confiance
  confidenceScore: number;
  confidenceLabel: string;
  confidenceFactors?: {
    recency: number;
    sourceReliability: number;
    verificationCount: number;
    consistency: number;
  };
  
  // Métadonnées
  createdAt: string;
  isActive: boolean;
}

/**
 * Get verified prices for a product
 */
export async function getVerifiedPricesByProduct(
  productId: string,
  options?: {
    storeId?: string;
    minConfidence?: number;
    limit?: number;
  }
): Promise<VerifiedPrice[]> {
  const where: any = {
    productId,
    isActive: true,
  };
  
  if (options?.storeId) {
    where.storeId = options.storeId;
  }
  
  if (options?.minConfidence) {
    where.confidenceScore = { gte: options.minConfidence };
  }
  
  const prices = await prisma.productPrice.findMany({
    where,
    orderBy: [
      { confidenceScore: 'desc' },
      { observedAt: 'desc' },
    ],
    take: options?.limit || 50,
  });
  
  return prices.map((p) => ({
    id: p.id,
    productId: p.productId,
    storeId: p.storeId,
    price: p.price,
    currency: p.currency,
    source: p.source,
    observedAt: p.observedAt.toISOString(),
    reportedBy: p.reportedBy || undefined,
    verificationStatus: p.verificationStatus,
    verificationCount: p.verificationCount,
    lastVerifiedAt: p.lastVerifiedAt?.toISOString(),
    confidenceScore: p.confidenceScore,
    confidenceLabel: getConfidenceLabel(p.confidenceScore),
    confidenceFactors: p.confidenceFactors as any,
    createdAt: p.createdAt.toISOString(),
    isActive: p.isActive,
  }));
}

/**
 * Get verified prices for a store
 */
export async function getVerifiedPricesByStore(
  storeId: string,
  options?: {
    minConfidence?: number;
    limit?: number;
  }
): Promise<VerifiedPrice[]> {
  const where: any = {
    storeId,
    isActive: true,
  };
  
  if (options?.minConfidence) {
    where.confidenceScore = { gte: options.minConfidence };
  }
  
  const prices = await prisma.productPrice.findMany({
    where,
    orderBy: [
      { confidenceScore: 'desc' },
      { observedAt: 'desc' },
    ],
    take: options?.limit || 100,
  });
  
  return prices.map((p) => ({
    id: p.id,
    productId: p.productId,
    storeId: p.storeId,
    price: p.price,
    currency: p.currency,
    source: p.source,
    observedAt: p.observedAt.toISOString(),
    reportedBy: p.reportedBy || undefined,
    verificationStatus: p.verificationStatus,
    verificationCount: p.verificationCount,
    lastVerifiedAt: p.lastVerifiedAt?.toISOString(),
    confidenceScore: p.confidenceScore,
    confidenceLabel: getConfidenceLabel(p.confidenceScore),
    confidenceFactors: p.confidenceFactors as any,
    createdAt: p.createdAt.toISOString(),
    isActive: p.isActive,
  }));
}

/**
 * Get best verified price for a product
 */
export async function getBestVerifiedPrice(
  productId: string,
  storeId?: string
): Promise<VerifiedPrice | null> {
  const where: any = {
    productId,
    isActive: true,
    verificationStatus: { not: 'DISPUTED' },
  };
  
  if (storeId) {
    where.storeId = storeId;
  }
  
  const price = await prisma.productPrice.findFirst({
    where,
    orderBy: [
      { confidenceScore: 'desc' },
      { observedAt: 'desc' },
    ],
  });
  
  if (!price) return null;
  
  return {
    id: price.id,
    productId: price.productId,
    storeId: price.storeId,
    price: price.price,
    currency: price.currency,
    source: price.source,
    observedAt: price.observedAt.toISOString(),
    reportedBy: price.reportedBy || undefined,
    verificationStatus: price.verificationStatus,
    verificationCount: price.verificationCount,
    lastVerifiedAt: price.lastVerifiedAt?.toISOString(),
    confidenceScore: price.confidenceScore,
    confidenceLabel: getConfidenceLabel(price.confidenceScore),
    confidenceFactors: price.confidenceFactors as any,
    createdAt: price.createdAt.toISOString(),
    isActive: price.isActive,
  };
}

/**
 * Mark a price as inactive
 */
export async function deactivatePrice(priceId: string): Promise<void> {
  await prisma.productPrice.update({
    where: { id: priceId },
    data: { isActive: false },
  });
}

/**
 * Get confidence label
 */
function getConfidenceLabel(score: number): string {
  if (score >= 80) return 'Très fiable';
  if (score >= 60) return 'Fiable';
  if (score >= 40) return 'Modéré';
  if (score >= 20) return 'À vérifier';
  return 'Non vérifié';
}

/**
 * Get freshness status
 */
export function getFreshnessStatus(observedAt: Date): 'fresh' | 'recent' | 'stale' | 'outdated' {
  const daysSince = Math.floor((Date.now() - observedAt.getTime()) / (1000 * 60 * 60 * 24));
  
  if (daysSince <= 7) return 'fresh';
  if (daysSince <= 30) return 'recent';
  if (daysSince <= 60) return 'stale';
  return 'outdated';
}
