/**
 * Product Validation Queue Service
 * 
 * Manages the queue of products pending validation
 */

import prisma from '../../database/prisma.js';

export interface ValidationQueueItem {
  id: string;
  product: {
    id: string;
    barcode?: string | null;
    name: string;
    normalizedName: string;
    brand?: string | null;
    category?: string | null;
    primaryImageUrl?: string | null;
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
 * Get validation queue — returns products that need image review
 */
export async function getValidationQueue(params: {
  status?: string;
  source?: string;
  limit?: number;
  offset?: number;
}): Promise<ValidationQueueItem[]> {
  const { limit = 50, offset = 0 } = params;

  const products = await prisma.product.findMany({
    where: {
      imageNeedsReview: true,
    },
    orderBy: [
      { createdAt: 'asc' },
    ],
    take: limit,
    skip: offset,
  });

  const queueItems = products.map((product) => ({
    id: product.id,
    product: {
      id: product.id,
      barcode: product.barcode,
      name: product.displayName,
      normalizedName: product.normalizedLabel,
      brand: product.brand,
      category: product.category,
      primaryImageUrl: product.primaryImageUrl,
      status: product.imageNeedsReview ? 'PENDING_REVIEW' : 'VALIDATED',
      createdAt: product.createdAt,
    },
    source: product.imageSource ?? 'unknown',
    priority: determinePriority(product.imageSource ?? ''),
    addedAt: product.createdAt,
    reviewedAt: null,
    reviewedBy: null,
    decision: null as 'approved' | 'rejected' | 'merged' | null,
  }));

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
      return 'high';
    case 'OPENPRICES':
      return 'medium';
    case 'OPENFOODFACTS':
      return 'low';
    default:
      return 'medium';
  }
}

/**
 * Approve a product in the validation queue (mark image as reviewed)
 */
export async function approveProduct(
  productId: string,
  _reviewedBy?: string
): Promise<void> {
  await prisma.product.update({
    where: { id: productId },
    data: {
      imageNeedsReview: false,
    },
  });
}

/**
 * Reject a product in the validation queue (keep flagged for re-review)
 */
export async function rejectProduct(
  productId: string,
  _reviewedBy?: string
): Promise<void> {
  await prisma.product.update({
    where: { id: productId },
    data: {
      imageNeedsReview: true,
    },
  });
}

/**
 * Merge a product with another (reassign observations then remove source)
 */
export async function mergeProduct(
  sourceId: string,
  targetId: string,
  _reviewedBy?: string
): Promise<void> {
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
    // Reassign all price observations to target product
    await tx.priceObservation.updateMany({
      where: { productId: sourceId },
      data: { productId: targetId },
    });

    // Delete the source product (merged into target)
    await tx.product.delete({
      where: { id: sourceId },
    });
  });
}

/**
 * Get validation statistics
 */
export async function getValidationStats(): Promise<ValidationStats> {
  const [pending, validated] = await Promise.all([
    prisma.product.count({ where: { imageNeedsReview: true } }),
    prisma.product.count({ where: { imageNeedsReview: false } }),
  ]);

  return {
    pending,
    validated,
    rejected: 0,
    merged: 0,
    bySource: {},
  };
}

/**
 * Get product by ID for validation
 */
export async function getProductForValidation(productId: string) {
  return await prisma.product.findUnique({
    where: { id: productId },
    include: {
      observations: {
        orderBy: { observedAt: 'desc' },
        take: 10,
      },
      images: {
        orderBy: { createdAt: 'desc' },
        take: 5,
      },
    },
  });
}
