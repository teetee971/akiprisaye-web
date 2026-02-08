/**
 * Product Updater Service
 * 
 * Handles community-submitted product updates with:
 * - Auto-apply for trusted fields
 * - Review queue for sensitive changes
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface ProductUpdateData {
  productId: string;
  submittedBy: string;
  fieldName: string;
  oldValue?: string;
  newValue: string;
  proofUrl?: string;
  confidence?: number;
}

export interface UpdateSubmissionResult {
  success: boolean;
  updateId?: string;
  autoApplied?: boolean;
  requiresReview?: boolean;
  error?: string;
}

/**
 * Define which fields are considered trusted (can be auto-applied)
 * vs sensitive (require review)
 */
const TRUSTED_FIELDS = [
  'description',
  'tags',
  'ingredients',
  'allergens',
  'nutritionalInfo',
];

const SENSITIVE_FIELDS = [
  'name',
  'price',
  'category',
  'brand',
  'ean',
  'weight',
  'volume',
];

/**
 * Check if a field is trusted for auto-application
 * @param fieldName - Field name to check
 * @returns True if field is trusted
 */
function isTrustedField(fieldName: string): boolean {
  return TRUSTED_FIELDS.includes(fieldName);
}

/**
 * Check if a field is sensitive and requires review
 * @param fieldName - Field name to check
 * @returns True if field is sensitive
 */
function isSensitiveField(fieldName: string): boolean {
  return SENSITIVE_FIELDS.includes(fieldName);
}

/**
 * Validate update data
 * @param data - Update data to validate
 * @returns Validation result
 */
function validateUpdate(data: ProductUpdateData): {
  valid: boolean;
  error?: string;
} {
  if (!data.productId || !data.submittedBy) {
    return { valid: false, error: 'Product ID and submitter ID are required' };
  }

  if (!data.fieldName || !data.newValue) {
    return { valid: false, error: 'Field name and new value are required' };
  }

  if (data.newValue.length > 5000) {
    return { valid: false, error: 'New value exceeds maximum length' };
  }

  return { valid: true };
}

/**
 * Submit a product update request
 * @param data - Update data
 * @returns Result of submission
 */
export async function submitProductUpdate(
  data: ProductUpdateData
): Promise<UpdateSubmissionResult> {
  try {
    // Validate input
    const validation = validateUpdate(data);
    if (!validation.valid) {
      return {
        success: false,
        error: validation.error,
      };
    }

    // Determine if field is trusted or requires review
    const isTrusted = isTrustedField(data.fieldName);
    const requiresReview = !isTrusted || isSensitiveField(data.fieldName);

    // Create update record
    const update = await prisma.productUpdate.create({
      data: {
        productId: data.productId,
        submittedBy: data.submittedBy,
        fieldName: data.fieldName,
        oldValue: data.oldValue,
        newValue: data.newValue,
        isTrustedField: isTrusted,
        requiresReview,
        status: isTrusted && !requiresReview ? 'APPROVED' : 'PENDING',
        proofUrl: data.proofUrl,
        confidence: data.confidence || 0,
      },
    });

    // Auto-apply trusted fields
    const autoApplied = isTrusted && !requiresReview;

    return {
      success: true,
      updateId: update.id,
      autoApplied,
      requiresReview,
    };
  } catch (error) {
    console.error('Error submitting product update:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Get pending updates for review
 * @param options - Query options
 * @returns Array of pending updates
 */
export async function getPendingUpdates(options: {
  productId?: string;
  fieldName?: string;
  limit?: number;
  offset?: number;
} = {}) {
  const { productId, fieldName, limit = 50, offset = 0 } = options;

  const updates = await prisma.productUpdate.findMany({
    where: {
      status: 'PENDING',
      requiresReview: true,
      ...(productId && { productId }),
      ...(fieldName && { fieldName }),
    },
    orderBy: [
      { confidence: 'desc' },
      { createdAt: 'desc' },
    ],
    take: limit,
    skip: offset,
  });

  return updates;
}

/**
 * Review and approve/reject an update
 * @param updateId - Update ID
 * @param reviewerId - Reviewer ID
 * @param approved - Whether to approve or reject
 * @param note - Review note
 * @returns Review result
 */
export async function reviewUpdate(
  updateId: string,
  reviewerId: string,
  approved: boolean,
  note?: string
) {
  try {
    const update = await prisma.productUpdate.update({
      where: { id: updateId },
      data: {
        status: approved ? 'APPROVED' : 'REJECTED',
        reviewedBy: reviewerId,
        reviewedAt: new Date(),
        reviewNote: note,
      },
    });

    return {
      success: true,
      update,
    };
  } catch (error) {
    console.error('Error reviewing update:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Get update history for a product
 * @param productId - Product ID
 * @param options - Query options
 * @returns Array of updates
 */
export async function getProductUpdateHistory(
  productId: string,
  options: {
    status?: string;
    limit?: number;
    offset?: number;
  } = {}
) {
  const { status, limit = 50, offset = 0 } = options;

  const updates = await prisma.productUpdate.findMany({
    where: {
      productId,
      ...(status && { status }),
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: limit,
    skip: offset,
  });

  return updates;
}

/**
 * Get update statistics
 * @returns Statistics about updates
 */
export async function getUpdateStats() {
  const [
    totalUpdates,
    pendingUpdates,
    approvedUpdates,
    rejectedUpdates,
    autoAppliedUpdates,
  ] = await Promise.all([
    prisma.productUpdate.count(),
    prisma.productUpdate.count({ where: { status: 'PENDING' } }),
    prisma.productUpdate.count({ where: { status: 'APPROVED' } }),
    prisma.productUpdate.count({ where: { status: 'REJECTED' } }),
    prisma.productUpdate.count({
      where: {
        isTrustedField: true,
        requiresReview: false,
        status: 'APPROVED',
      },
    }),
  ]);

  return {
    totalUpdates,
    pendingUpdates,
    approvedUpdates,
    rejectedUpdates,
    autoAppliedUpdates,
    approvalRate: totalUpdates > 0 ? (approvedUpdates / totalUpdates) * 100 : 0,
  };
}

/**
 * Batch approve updates
 * @param updateIds - Array of update IDs
 * @param reviewerId - Reviewer ID
 * @returns Number of updates approved
 */
export async function batchApproveUpdates(
  updateIds: string[],
  reviewerId: string
): Promise<number> {
  const result = await prisma.productUpdate.updateMany({
    where: {
      id: { in: updateIds },
      status: 'PENDING',
    },
    data: {
      status: 'APPROVED',
      reviewedBy: reviewerId,
      reviewedAt: new Date(),
    },
  });

  return result.count;
}

/**
 * Get updates by submitter
 * @param userId - User ID
 * @param options - Query options
 * @returns Array of updates
 */
export async function getUserUpdates(
  userId: string,
  options: {
    status?: string;
    limit?: number;
    offset?: number;
  } = {}
) {
  const { status, limit = 50, offset = 0 } = options;

  const updates = await prisma.productUpdate.findMany({
    where: {
      submittedBy: userId,
      ...(status && { status }),
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: limit,
    skip: offset,
  });

  return updates;
}
