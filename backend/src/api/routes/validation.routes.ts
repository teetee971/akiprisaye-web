/**
 * Validation Routes
 * 
 * API endpoints for product validation queue management
 */

import { Router, Request, Response } from 'express';
import {
  getValidationQueue,
  getValidationStats,
  getProductForValidation,
  approveProduct,
  rejectProduct,
  mergeProduct,
} from '../../services/products/validationQueue.js';
import { ProductStatus } from '@prisma/client';

const router = Router();

/**
 * GET /api/validation/queue
 * Get products in validation queue
 */
router.get('/queue', async (req: Request, res: Response) => {
  try {
    const status = (req.query.status as ProductStatus) || 'PENDING_REVIEW';
    const source = req.query.source as string | undefined;
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
    const offset = parseInt(req.query.offset as string) || 0;

    const queue = await getValidationQueue({
      status,
      source,
      limit,
      offset,
    });

    res.json({
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
    res.status(500).json({
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
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const product = await getProductForValidation(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found',
      });
    }

    return res.json({
      success: true,
      product,
    });
  } catch (error) {
    console.error('Error getting product for validation:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/validation/:id/approve
 * Approve a product
 */
router.post('/:id/approve', async (req: Request, res: Response) => {
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
router.post('/:id/reject', async (req: Request, res: Response) => {
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
router.post('/:id/merge/:targetId', async (req: Request, res: Response) => {
  try {
    const { id, targetId } = req.params;
    const { reviewedBy } = req.body;

    await mergeProduct(id, targetId, reviewedBy);

    res.json({
      success: true,
      message: 'Product merged',
    });
  } catch (error) {
    console.error('Error merging product:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
