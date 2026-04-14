/**
 * Validation Routes
 *
 * API endpoints for product validation queue management.
 * All routes require a valid JWT with the ADMIN permission.
 */

import { Router, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import {
  getValidationQueue,
  getValidationStats,
  getProductForValidation,
  approveProduct,
  rejectProduct,
  mergeProduct,
} from '../../services/products/validationQueue.js';
import {
  unifiedAuthMiddleware,
  requirePermission,
} from '../middlewares/apiAuth.middleware.js';
import { ApiPermission } from '@prisma/client';

type ProductStatus = 'PENDING_REVIEW' | 'VALIDATED' | 'REJECTED' | 'MERGED';

const router = Router();

const validationRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});

// All validation routes are admin-only and rate-limited
router.use(validationRateLimiter, unifiedAuthMiddleware, requirePermission(ApiPermission.ADMIN));

/**
 * GET /api/validation/queue
 * Get products in validation queue
 */
router.get('/queue', async (req: Request, res: Response): Promise<void> => {
  try {
    const statusParam = req.query.status as string | undefined;
    const source = req.query.source as string | undefined;
    const limitParam = req.query.limit as string | undefined;
    const offsetParam = req.query.offset as string | undefined;

    // Validate status parameter
    const validStatuses: ProductStatus[] = ['PENDING_REVIEW', 'VALIDATED', 'REJECTED', 'MERGED'];
    const status: ProductStatus = statusParam && validStatuses.includes(statusParam as ProductStatus)
      ? (statusParam as ProductStatus)
      : 'PENDING_REVIEW';

    // Validate limit parameter
    const limit = limitParam ? parseInt(limitParam, 10) : 50;
    if (isNaN(limit) || limit < 1 || limit > 100) {
      return void res.status(400).json({
        success: false,
        error: 'Invalid limit parameter. Must be between 1 and 100.',
      });
    }

    // Validate offset parameter
    const offset = offsetParam ? parseInt(offsetParam, 10) : 0;
    if (isNaN(offset) || offset < 0) {
      return void res.status(400).json({
        success: false,
        error: 'Invalid offset parameter. Must be >= 0.',
      });
    }

    const queue = await getValidationQueue({
      status,
      source,
      limit,
      offset,
    });

    return void res.json({
      success: true,
      queue,
      pagination: {
        limit,
        offset,
        count: queue.length,
      },
    });
  } catch (error) {
    console.error('Error getting validation queue:', error);
    return void res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/validation/stats
 * Get validation queue statistics
 */
router.get('/stats', async (_req: Request, res: Response) => {
  try {
    const stats = await getValidationStats();

    res.json({
      success: true,
      stats,
    });
  } catch (error) {
    console.error('Error getting validation stats:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/validation/:id
 * Get product details for validation
 */
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const product = await getProductForValidation(id);

    if (!product) {
      return void res.status(404).json({
        success: false,
        error: 'Product not found',
      });
    }

    return void res.json({
      success: true,
      product,
    });
  } catch (error) {
    console.error('Error getting product for validation:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/validation/:id/approve
 * Approve a product
 */
router.post('/:id/approve', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { reviewedBy } = req.body;

    await approveProduct(id, reviewedBy);

    res.json({
      success: true,
      message: 'Product approved',
    });
  } catch (error) {
    console.error('Error approving product:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/validation/:id/reject
 * Reject a product
 */
router.post('/:id/reject', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { reviewedBy } = req.body;

    await rejectProduct(id, reviewedBy);

    res.json({
      success: true,
      message: 'Product rejected',
    });
  } catch (error) {
    console.error('Error rejecting product:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/validation/:id/merge/:targetId
 * Merge a product with another (mark as duplicate)
 */
router.post('/:id/merge/:targetId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id, targetId } = req.params;
    const { reviewedBy } = req.body;

    await mergeProduct(id, targetId, reviewedBy);

    return void res.json({
      success: true,
      message: 'Product merged',
    });
  } catch (error) {
    console.error('Error merging product:', error);
    
    // Return 404 if product not found
    if (error instanceof Error && error.message.includes('not found')) {
      return void res.status(404).json({
        success: false,
        error: error.message,
      });
    }
    
    return void res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
