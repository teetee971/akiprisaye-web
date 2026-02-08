/**
 * Product Validation Queue Service
 * 
 * Manages the queue of products pending validation
 */

import { ProductStatus } from '@prisma/client';
import prisma from '../../database/prisma.js';

export interface ValidationQueueItem {
  id: string;
  product: {
    id: string;
    ean?: string | null;
    name: string;
    normalizedName: string;
    brand?: string | null;
    category?: string | null;
    quantity?: string | null;
    imageUrl?: string | null;
    source: string;
    status: string;
    createdAt: Date;
  };
  source: string;
  priority: 'low' | 'medium' | 'high';
  addedAt: Date;
  reviewedAt?: Date | null;
  reviewedBy?: string | null;
  decision?: 'approved' | 'rejected' | 'merged' | null;
}

export interface ValidationStats {
  pending: number;
  validated: number;
  rejected: number;
  merged: number;
  bySource: Record<string, number>;
}

/**
 * Get validation queue with filters
 */
export async function getValidationQueue(params: {
  status?: ProductStatus;
  source?: string;
  limit?: number;
  offset?: number;
}): Promise<ValidationQueueItem[]> {
  const { status = 'PENDING_REVIEW', source, limit = 50, offset = 0 } = params;

  const products = await prisma.product.findMany({
    where: {
      status,
      ...(source && { source: source as any }),
    },
    orderBy: [
      { createdAt: 'asc' }, // Oldest first within same priority
    ],
    take: limit,
    skip: offset,
  });

  // Map products and sort by priority
  const queueItems = products.map((product) => ({
    id: product.id,
    product: {
      id: product.id,
      ean: product.ean,
      name: product.name,
      normalizedName: product.normalizedName,
      brand: product.brand,
      category: product.category,
      quantity: product.quantity,
      imageUrl: product.imageUrl,
      source: product.source,
      status: product.status,
      createdAt: product.createdAt,
    },
    source: product.source,
    priority: determinePriority(product.source),
    addedAt: product.createdAt,
    reviewedAt: product.validatedAt,
    reviewedBy: product.validatedBy,
    decision: mapStatusToDecision(product.status),
  }));

  // Sort by priority (high -> medium -> low) then by date (oldest first)
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  queueItems.sort((a, b) => {
    const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
    if (priorityDiff !== 0) return priorityDiff;
    return a.addedAt.getTime() - b.addedAt.getTime();
  });

  return queueItems;
}

/**
 * Determine priority based on source
 */
function determinePriority(source: string): 'low' | 'medium' | 'high' {
  switch (source) {
    case 'OCR':
    case 'CITIZEN':
      return 'high'; // User-generated content needs quick review
    case 'OPENPRICES':
      return 'medium';
    case 'OPENFOODFACTS':
      return 'low'; // Most reliable source
    default:
      return 'medium';
  }
}

/**
 * Map product status to decision
 */
function mapStatusToDecision(
  status: ProductStatus
): 'approved' | 'rejected' | 'merged' | null {
  switch (status) {
    case 'VALIDATED':
      return 'approved';
    case 'REJECTED':
      return 'rejected';
    case 'MERGED':
      return 'merged';
    default:
      return null;
  }
}

/**
 * Approve a product in the validation queue
 */
export async function approveProduct(
  productId: string,
  reviewedBy?: string
): Promise<void> {
  await prisma.product.update({
    where: { id: productId },
    data: {
      status: 'VALIDATED',
      validatedAt: new Date(),
      validatedBy: reviewedBy,
    },
  });
}

/**
 * Reject a product in the validation queue
 */
export async function rejectProduct(
  productId: string,
  reviewedBy?: string
): Promise<void> {
  await prisma.product.update({
    where: { id: productId },
    data: {
      status: 'REJECTED',
      validatedAt: new Date(),
      validatedBy: reviewedBy,
    },
  });
}

/**
 * Merge a product with another (mark as duplicate)
 */
export async function mergeProduct(
  sourceId: string,
  targetId: string,
  reviewedBy?: string
): Promise<void> {
  // Verify both products exist before starting transaction
  const [sourceProduct, targetProduct] = await Promise.all([
    prisma.product.findUnique({ where: { id: sourceId } }),
    prisma.product.findUnique({ where: { id: targetId } }),
  ]);

  if (!sourceProduct) {
    throw new Error(`Source product ${sourceId} not found`);
  }

  if (!targetProduct) {
    throw new Error(`Target product ${targetId} not found`);
  }

  await prisma.$transaction(async (tx) => {
    // Update all prices to point to target
    await tx.productPrice.updateMany({
      where: { productId: sourceId },
      data: { productId: targetId },
    });

    // Mark source product as MERGED
    await tx.product.update({
      where: { id: sourceId },
      data: {
        status: 'MERGED',
        validatedAt: new Date(),
        validatedBy: reviewedBy,
      },
    });
  });
}

/**
 * Get validation statistics
 */
export async function getValidationStats(): Promise<ValidationStats> {
  const [pending, validated, rejected, merged, bySource] = await Promise.all([
    prisma.product.count({ where: { status: 'PENDING_REVIEW' } }),
    prisma.product.count({ where: { status: 'VALIDATED' } }),
    prisma.product.count({ where: { status: 'REJECTED' } }),
    prisma.product.count({ where: { status: 'MERGED' } }),
    prisma.product.groupBy({
      by: ['source'],
      _count: true,
      where: { status: 'PENDING_REVIEW' },
    }),
  ]);

  const bySourceMap: Record<string, number> = {};
  bySource.forEach((item) => {
    bySourceMap[item.source] = item._count;
  });

  return {
    pending,
    validated,
    rejected,
    merged,
    bySource: bySourceMap,
  };
}

/**
 * Get product by ID for validation
 */
export async function getProductForValidation(productId: string) {
  return await prisma.product.findUnique({
    where: { id: productId },
    include: {
      prices: {
        orderBy: { date: 'desc' },
        take: 10,
      },
    },
  });
}
