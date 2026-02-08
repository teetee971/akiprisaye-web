/**
 * Price Submission Service
 * Handles submission and validation of new prices
 */

import { PrismaClient, PriceSource } from '@prisma/client';
import { calculateConfidenceScore } from './confidenceCalculator.js';

const prisma = new PrismaClient();

export interface SubmitPriceRequest {
  productId: string;
  storeId: string;
  price: number;
  observedAt: string;
  source: PriceSource;
  reportedBy?: string;
  proof?: {
    type: 'receipt_image' | 'screenshot' | 'none';
    url?: string;
  };
}

export interface SubmitPriceResponse {
  id: string;
  status: 'accepted' | 'pending_review' | 'rejected';
  confidenceScore: number;
  message: string;
  duplicateOf?: string;
}

/**
 * Check for duplicate or very similar recent prices
 */
async function findDuplicatePrice(
  productId: string,
  storeId: string,
  price: number,
  observedAt: Date
): Promise<string | null> {
  const recentThreshold = new Date(observedAt.getTime() - 24 * 60 * 60 * 1000); // 24 hours
  const priceMargin = price * 0.01; // 1% margin
  
  const duplicate = await prisma.productPrice.findFirst({
    where: {
      productId,
      storeId,
      observedAt: {
        gte: recentThreshold,
      },
      price: {
        gte: price - priceMargin,
        lte: price + priceMargin,
      },
      isActive: true,
    },
    orderBy: {
      observedAt: 'desc',
    },
  });
  
  return duplicate?.id || null;
}

/**
 * Validate price data
 */
function validatePrice(price: number): { valid: boolean; message?: string } {
  if (price <= 0) {
    return { valid: false, message: 'Le prix doit être positif' };
  }
  if (price > 100000) {
    return { valid: false, message: 'Le prix semble anormalement élevé' };
  }
  return { valid: true };
}

/**
 * Get historical prices for consistency check
 */
async function getHistoricalPrices(
  productId: string,
  storeId: string,
  limit: number = 10
): Promise<number[]> {
  const historical = await prisma.productPrice.findMany({
    where: {
      productId,
      storeId,
      isActive: true,
    },
    orderBy: {
      observedAt: 'desc',
    },
    take: limit,
    select: {
      price: true,
    },
  });
  
  return historical.map((p) => p.price);
}

/**
 * Submit a new price observation
 */
export async function submitPrice(request: SubmitPriceRequest): Promise<SubmitPriceResponse> {
  // Validate price
  const validation = validatePrice(request.price);
  if (!validation.valid) {
    return {
      id: '',
      status: 'rejected',
      confidenceScore: 0,
      message: validation.message || 'Prix invalide',
    };
  }
  
  const observedAt = new Date(request.observedAt);
  
  // Validate observedAt: must be a valid date and not in the future
  if (isNaN(observedAt.getTime())) {
    return {
      id: '',
      status: 'rejected',
      confidenceScore: 0,
      message: 'Date d\'observation invalide',
    };
  }
  
  const now = new Date();
  if (observedAt.getTime() > now.getTime()) {
    return {
      id: '',
      status: 'rejected',
      confidenceScore: 0,
      message: 'La date d\'observation ne peut pas être dans le futur',
    };
  }
  
  // Check for duplicates
  const duplicateId = await findDuplicatePrice(
    request.productId,
    request.storeId,
    request.price,
    observedAt
  );
  
  if (duplicateId) {
    // Retrieve the existing price to return its real confidence score
    const existingPrice = await prisma.productPrice.findUnique({
      where: { id: duplicateId },
      select: { confidenceScore: true },
    });
    
    return {
      id: duplicateId,
      status: 'accepted',
      confidenceScore: existingPrice?.confidenceScore ?? 0,
      message: 'Ce prix a déjà été signalé récemment',
      duplicateOf: duplicateId,
    };
  }
  
  // Get historical prices for consistency check
  const historicalPrices = await getHistoricalPrices(request.productId, request.storeId);
  
  // Calculate confidence score
  const confidenceData = calculateConfidenceScore({
    observedAt,
    source: request.source,
    verificationCount: 0,
    price: request.price,
    historicalPrices,
  });
  
  // Create price record
  const newPrice = await prisma.productPrice.create({
    data: {
      productId: request.productId,
      storeId: request.storeId,
      price: request.price,
      currency: 'EUR',
      source: request.source,
      observedAt,
      reportedBy: request.reportedBy,
      proofUrl: request.proof?.url,
      confidenceScore: confidenceData.score,
      confidenceFactors: confidenceData.factors,
      verificationCount: 0,
      isActive: true,
    },
  });
  
  // Determine status based on confidence score
  let status: 'accepted' | 'pending_review' | 'rejected';
  let message: string;
  
  if (confidenceData.score >= 60) {
    status = 'accepted';
    message = 'Prix accepté et publié';
  } else if (confidenceData.score >= 30) {
    status = 'pending_review';
    message = 'Prix enregistré, en attente de vérification';
  } else {
    status = 'pending_review';
    message = 'Prix enregistré mais nécessite des vérifications supplémentaires';
  }
  
  return {
    id: newPrice.id,
    status,
    confidenceScore: confidenceData.score,
    message,
  };
}

/**
 * Batch submit multiple prices
 */
export async function submitBulkPrices(
  requests: SubmitPriceRequest[]
): Promise<SubmitPriceResponse[]> {
  const responses: SubmitPriceResponse[] = [];
  
  for (const request of requests) {
    try {
      const response = await submitPrice(request);
      responses.push(response);
    } catch (error) {
      responses.push({
        id: '',
        status: 'rejected',
        confidenceScore: 0,
        message: `Erreur: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    }
  }
  
  return responses;
}
