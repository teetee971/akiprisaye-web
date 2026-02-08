/**
 * Price API Routes
 * Endpoints for managing verified product prices
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { PriceSource, VerificationAction } from '@prisma/client';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import {
  submitPrice,
  verifyPrice,
  getVerifiedPricesByProduct,
  getVerifiedPricesByStore,
  getBestVerifiedPrice,
  getPriceHistory,
  getAggregatedPriceHistory,
  getAnomaliesForPrice,
  getPriceVerificationStats,
} from '../../services/pricing/index.js';

const router = Router();

// Validation schemas
const submitPriceSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  storeId: z.string().min(1, 'Store ID is required'),
  price: z.number().positive('Price must be positive'),
  observedAt: z.string().datetime('Invalid date format'),
  source: z.nativeEnum(PriceSource),
  reportedBy: z.string().optional(),
  proof: z
    .object({
      type: z.enum(['receipt_image', 'screenshot', 'none']),
      url: z.string().url().optional(),
    })
    .optional(),
});

const verifyPriceSchema = z.object({
  action: z.nativeEnum(VerificationAction),
  comment: z.string().optional(),
});

/**
 * POST /api/prices
 * Submit a new price observation
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const validatedData = submitPriceSchema.parse(req.body);
    const result = await submitPrice(validatedData);

    res.status(result.status === 'accepted' ? 201 : 202).json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.errors,
      });
    }

    console.error('Error submitting price:', error);
    res.status(500).json({
      error: 'Failed to submit price',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/prices/product/:productId
 * Get all prices for a product
 */
router.get('/product/:productId', async (req: Request, res: Response) => {
  try {
    const { productId } = req.params;
    const { storeId, minConfidence, limit } = req.query;

    // Validate and parse query parameters
    let parsedMinConfidence: number | undefined;
    let parsedLimit: number | undefined;

    if (minConfidence) {
      parsedMinConfidence = parseInt(minConfidence as string, 10);
      if (isNaN(parsedMinConfidence) || parsedMinConfidence < 0 || parsedMinConfidence > 100) {
        return res.status(400).json({
          error: 'Invalid minConfidence parameter',
          message: 'minConfidence must be a number between 0 and 100',
        });
      }
    }

    if (limit) {
      parsedLimit = parseInt(limit as string, 10);
      if (isNaN(parsedLimit) || parsedLimit < 1 || parsedLimit > 1000) {
        return res.status(400).json({
          error: 'Invalid limit parameter',
          message: 'limit must be a number between 1 and 1000',
        });
      }
    }

    const options = {
      storeId: storeId as string | undefined,
      minConfidence: parsedMinConfidence,
      limit: parsedLimit,
    };

    const prices = await getVerifiedPricesByProduct(productId, options);

    res.json({
      count: prices.length,
      prices,
    });
  } catch (error) {
    console.error('Error fetching prices:', error);
    res.status(500).json({
      error: 'Failed to fetch prices',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/prices/store/:storeId
 * Get all prices for a store
 */
router.get('/store/:storeId', async (req: Request, res: Response) => {
  try {
    const { storeId } = req.params;
    const { minConfidence, limit } = req.query;

    // Validate and parse query parameters
    let parsedMinConfidence: number | undefined;
    let parsedLimit: number | undefined;

    if (minConfidence) {
      parsedMinConfidence = parseInt(minConfidence as string, 10);
      if (isNaN(parsedMinConfidence) || parsedMinConfidence < 0 || parsedMinConfidence > 100) {
        return res.status(400).json({
          error: 'Invalid minConfidence parameter',
          message: 'minConfidence must be a number between 0 and 100',
        });
      }
    }

    if (limit) {
      parsedLimit = parseInt(limit as string, 10);
      if (isNaN(parsedLimit) || parsedLimit < 1 || parsedLimit > 1000) {
        return res.status(400).json({
          error: 'Invalid limit parameter',
          message: 'limit must be a number between 1 and 1000',
        });
      }
    }

    const options = {
      minConfidence: parsedMinConfidence,
      limit: parsedLimit,
    };

    const prices = await getVerifiedPricesByStore(storeId, options);

    res.json({
      count: prices.length,
      prices,
    });
  } catch (error) {
    console.error('Error fetching prices:', error);
    res.status(500).json({
      error: 'Failed to fetch prices',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/prices/best/:productId
 * Get best verified price for a product
 */
router.get('/best/:productId', async (req: Request, res: Response) => {
  try {
    const { productId } = req.params;
    const { storeId } = req.query;

    const price = await getBestVerifiedPrice(productId, storeId as string | undefined);

    if (!price) {
      return res.status(404).json({
        error: 'No verified price found',
      });
    }

    res.json(price);
  } catch (error) {
    console.error('Error fetching best price:', error);
    res.status(500).json({
      error: 'Failed to fetch best price',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/prices/:id/verify
 * Verify or dispute a price
 * 
 * Requires authentication. Uses authenticated user ID from JWT token.
 */
router.post('/:id/verify', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id: priceId } = req.params;
    const validatedData = verifyPriceSchema.parse(req.body);

    // Get authenticated user ID from JWT token
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const result = await verifyPrice({
      priceId,
      userId,
      ...validatedData,
    });

    res.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.errors,
      });
    }

    console.error('Error verifying price:', error);
    res.status(500).json({
      error: 'Failed to verify price',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/prices/:id/verifications
 * Get verification statistics for a price
 */
router.get('/:id/verifications', async (req: Request, res: Response) => {
  try {
    const { id: priceId } = req.params;
    const stats = await getPriceVerificationStats(priceId);

    res.json(stats);
  } catch (error) {
    console.error('Error fetching verification stats:', error);
    res.status(500).json({
      error: 'Failed to fetch verification stats',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/prices/history/:productId
 * Get price history for a product
 */
router.get('/history/:productId', async (req: Request, res: Response) => {
  try {
    const { productId } = req.params;
    const { storeId, limit } = req.query;

    if (!storeId) {
      return res.status(400).json({
        error: 'Store ID is required',
      });
    }

    const limitNum = limit ? parseInt(limit as string, 10) : 50;
    const history = await getPriceHistory(productId, storeId as string, limitNum);

    res.json(history);
  } catch (error) {
    console.error('Error fetching price history:', error);
    res.status(500).json({
      error: 'Failed to fetch price history',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/prices/history/:productId/aggregated
 * Get aggregated price history across stores
 */
router.get('/history/:productId/aggregated', async (req: Request, res: Response) => {
  try {
    const { productId } = req.params;
    const { period } = req.query;

    const validPeriods = ['7d', '30d', '90d', '1y'];
    const selectedPeriod = validPeriods.includes(period as string)
      ? (period as '7d' | '30d' | '90d' | '1y')
      : '30d';

    const history = await getAggregatedPriceHistory(productId, selectedPeriod);

    res.json({
      productId,
      period: selectedPeriod,
      data: history,
    });
  } catch (error) {
    console.error('Error fetching aggregated history:', error);
    res.status(500).json({
      error: 'Failed to fetch aggregated history',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/prices/:id/anomalies
 * Get existing anomalies for a price (read-only)
 * Note: Anomaly detection is performed asynchronously by scheduled jobs.
 * This endpoint only retrieves existing anomaly records.
 */
router.get('/:id/anomalies', async (req: Request, res: Response) => {
  try {
    const { id: priceId } = req.params;
    const anomalies = await getAnomaliesForPrice(priceId);

    res.json({
      priceId,
      anomalyCount: anomalies.length,
      anomalies,
    });
  } catch (error) {
    console.error('Error fetching anomalies:', error);
    res.status(500).json({
      error: 'Failed to fetch anomalies',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
