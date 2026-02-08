/**
 * Product Updater Service
 * Manages automatic updates of product information
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface ProductUpdateConfig {
  // Fields that can be auto-updated without review
  autoUpdateFields: string[];
  // Fields that require manual review
  reviewRequiredFields: string[];
  // Source priority (higher = more trustworthy)
  sourcePriority: Record<string, number>;
}

export const DEFAULT_CONFIG: ProductUpdateConfig = {
  autoUpdateFields: ['imageUrl', 'nutriscore', 'ecoscore', 'ingredients'],
  reviewRequiredFields: ['name', 'brand', 'category', 'quantity'],
  sourcePriority: {
    official_api: 100,
    openfoodfacts: 80,
    manual_verified: 70,
    ocr_ticket: 50,
    crowdsourced: 30,
  },
};

export interface ProductUpdateRequest {
  productId: string;
  field: string;
  newValue: string;
  source: string;
  updatedBy?: string;
}

/**
 * Submit a product update
 */
export async function submitProductUpdate(
  request: ProductUpdateRequest,
  config: ProductUpdateConfig = DEFAULT_CONFIG
): Promise<{ success: boolean; message: string; autoApplied: boolean }> {
  const { productId, field, newValue, source } = request;

  // Determine if auto-apply is allowed
  const autoApply = config.autoUpdateFields.includes(field);
  const sourcePriority = config.sourcePriority[source] || 0;

  // For high-priority sources, auto-apply even review-required fields
  const shouldAutoApply = autoApply || sourcePriority >= 80;

  // Get current value (would need actual product model)
  // For now, we'll just create the update record
  const oldValue = null; // Would fetch from product

  // Create update record
  await prisma.productUpdate.create({
    data: {
      productId,
      field,
      oldValue,
      newValue,
      source,
      autoApplied: shouldAutoApply,
      reviewStatus: shouldAutoApply ? 'APPROVED' : 'PENDING',
      reviewedAt: shouldAutoApply ? new Date() : null,
      reviewedBy: shouldAutoApply ? 'system' : null,
    },
  });

  let message: string;
  if (shouldAutoApply) {
    message = 'Mise à jour appliquée automatiquement';
  } else {
    message = 'Mise à jour enregistrée, en attente de révision';
  }

  return {
    success: true,
    message,
    autoApplied: shouldAutoApply,
  };
}

/**
 * Get pending updates for review
 */
export async function getPendingUpdates(limit: number = 50) {
  return await prisma.productUpdate.findMany({
    where: {
      reviewStatus: 'PENDING',
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: limit,
  });
}

/**
 * Approve a product update
 */
export async function approveUpdate(updateId: string, reviewedBy: string) {
  return await prisma.productUpdate.update({
    where: { id: updateId },
    data: {
      reviewStatus: 'APPROVED',
      reviewedBy,
      reviewedAt: new Date(),
    },
  });
}

/**
 * Reject a product update
 */
export async function rejectUpdate(updateId: string, reviewedBy: string) {
  return await prisma.productUpdate.update({
    where: { id: updateId },
    data: {
      reviewStatus: 'REJECTED',
      reviewedBy,
      reviewedAt: new Date(),
    },
  });
}

/**
 * Get update history for a product
 */
export async function getProductUpdateHistory(productId: string, limit: number = 20) {
  return await prisma.productUpdate.findMany({
    where: { productId },
    orderBy: {
      createdAt: 'desc',
    },
    take: limit,
  });
}
