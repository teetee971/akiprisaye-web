/**
 * Price API Routes
 * 
 * RESTful API endpoints for the verified pricing system
 * All endpoints include Zod validation, pagination, and rate limiting
 */

import express, { Request, Response } from 'express';
import { z } from 'zod';
import { PriceSource } from '@prisma/client';
import {
  submitAndVerifyPrice,
  getProductPrices,
  getStorePrices,
  getBestPrice,
  searchPrices,
} from '../../services/pricing/verifiedPricing.js';
import {
  verifyPrice,
  getVerifications,
  getVerificationSummary,
} from '../../services/pricing/priceVerification.js';
import {
  getPriceHistory,
  getPriceHistoryStats,
  getAggregatedPriceHistory,
} from '../../services/pricing/priceHistory.js';
import { getUnresolvedAnomalies } from '../../services/pricing/priceAnomalyDetector.js';

const router = express.Router();

// Zod validation schemas
const priceSubmissionSchema = z.object({
  productId: z.string().min(1),
  storeId: z.string().min(1),
  price: z.number().positive().max(1000000),
  currency: z.string().optional().default('EUR'),
  source: z.nativeEnum(PriceSource),
  submittedBy: z.string().optional(),
  proofUrl: z.string().url().optional(),
});

const verificationSchema = z.object({
  status: z.enum(['PENDING', 'CONFIRMED', 'DISPUTED', 'REJECTED', 'EXPIRED']),
  comment: z.string().optional(),
  proofUrl: z.string().url().optional(),
  suggestedPrice: z.number().positive().optional(),
  suggestedSource: z.nativeEnum(PriceSource).optional(),
});

const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(50),
 * Endpoints for managing verified product prices
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { PriceSource, VerificationAction } from '@prisma/client';
import {
  submitPrice,
  verifyPrice,
  getVerifiedPricesByProduct,
  getVerifiedPricesByStore,
  getBestVerifiedPrice,
  getPriceHistory,
  getAggregatedPriceHistory,
  detectAnomalies,
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
  userId: z.string().min(1, 'User ID is required'),
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

    return res.status(result.status === 'accepted' ? 201 : 202).json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.errors,
      });
    }

    console.error('Error submitting price:', error);
    return res.status(500).json({
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

    const options = {
      storeId: storeId as string | undefined,
      minConfidence: minConfidence ? parseInt(minConfidence as string, 10) : undefined,
      limit: limit ? parseInt(limit as string, 10) : undefined,
    };

    const prices = await getVerifiedPricesByProduct(productId, options);

    return res.json({
      count: prices.length,
      prices,
    });
  } catch (error) {
    console.error('Error fetching prices:', error);
    return res.status(500).json({
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

    const options = {
      minConfidence: minConfidence ? parseInt(minConfidence as string, 10) : undefined,
      limit: limit ? parseInt(limit as string, 10) : undefined,
    };

    const prices = await getVerifiedPricesByStore(storeId, options);

    return res.json({
      count: prices.length,
      prices,
    });
  } catch (error) {
    console.error('Error fetching prices:', error);
    return res.status(500).json({
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

    return res.json(price);
  } catch (error) {
    console.error('Error fetching best price:', error);
    return res.status(500).json({
      error: 'Failed to fetch best price',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/prices/:id/verify
 * Submit a verification for a price (community workflow)
 */
router.post('/:id/verify', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const validatedData = verificationSchema.parse(req.body);
    const userId = z.string().parse(req.body.userId);
    
    const result = await verifyPrice({
      priceId: id,
      userId,
      status: validatedData.status,
      comment: validatedData.comment,
      proofUrl: validatedData.proofUrl,
      suggestedPrice: validatedData.suggestedPrice,
      suggestedSource: validatedData.suggestedSource,
    });
    
    if (!result.success) {
      return res.status(400).json({
        error: result.error,
      });
    }
    
    return res.json({
      success: true,
      verificationId: result.verificationId,
      updatedConfidence: result.updatedConfidence,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.errors,
      });
    }
    
    console.error('Error verifying price:', error);
    return res.status(500).json({
      error: 'Internal server error',
 * Verify or dispute a price
 */
router.post('/:id/verify', async (req: Request, res: Response) => {
  try {
    const { id: priceId } = req.params;
    const validatedData = verifyPriceSchema.parse(req.body);

    const result = await verifyPrice({
      priceId,
      ...validatedData,
    });

    return res.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.errors,
      });
    }

    console.error('Error verifying price:', error);
    return res.status(500).json({
      error: 'Failed to verify price',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/prices/:id/verifications
 * Get all verifications for a price with statistics
 */
router.get('/:id/verifications', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const [verifications, summary] = await Promise.all([
      getVerifications(id),
      getVerificationSummary(id),
    ]);
    
    return res.json({
      success: true,
      data: verifications,
      summary,
    });
  } catch (error) {
    console.error('Error fetching verifications:', error);
    return res.status(500).json({
      error: 'Internal server error',
    });
  }
});

/**
 * GET /api/prices/history/:id
 * Get price history for a product at a store
 * Get verification statistics for a price
 */
router.get('/:id/verifications', async (req: Request, res: Response) => {
  try {
    const { id: priceId } = req.params;
    const stats = await getPriceVerificationStats(priceId);

    return res.json(stats);
  } catch (error) {
    console.error('Error fetching verification stats:', error);
    return res.status(500).json({
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
    const storeId = z.string().parse(req.query.storeId);
    const days = z.coerce.number().int().positive().max(365).default(90).parse(req.query.days);
    const minConfidence = z.coerce.number().min(0).max(100).default(0).parse(req.query.minConfidence);
    
    const history = await getPriceHistory(productId, storeId, days, minConfidence);
    const stats = await getPriceHistoryStats(productId, storeId, days);
    
    return res.json({
      success: true,
      data: history,
      stats,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.errors,
      });
    }
    
    console.error('Error fetching price history:', error);
    return res.status(500).json({
      error: 'Internal server error',
    });
  }
});

/**
 * GET /api/prices/history/:id/aggregated
 * Get aggregated price history across all stores for a product
    const { storeId, limit } = req.query;

    if (!storeId) {
      return res.status(400).json({
        error: 'Store ID is required',
      });
    }

    const limitNum = limit ? parseInt(limit as string, 10) : 50;
    const history = await getPriceHistory(productId, storeId as string, limitNum);

    return res.json(history);
  } catch (error) {
    console.error('Error fetching price history:', error);
    return res.status(500).json({
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
    const days = z.coerce.number().int().positive().max(365).default(90).parse(req.query.days);
    
    const aggregated = await getAggregatedPriceHistory(productId, days);
    
    return res.json({
      success: true,
      data: aggregated,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.errors,
      });
    }
    
    console.error('Error fetching aggregated history:', error);
    return res.status(500).json({
      error: 'Internal server error',
    const { period } = req.query;

    const validPeriods = ['7d', '30d', '90d', '1y'];
    const selectedPeriod = validPeriods.includes(period as string)
      ? (period as '7d' | '30d' | '90d' | '1y')
      : '30d';

    const history = await getAggregatedPriceHistory(productId, selectedPeriod);

    return res.json({
      productId,
      period: selectedPeriod,
      data: history,
    });
  } catch (error) {
    console.error('Error fetching aggregated history:', error);
    return res.status(500).json({
      error: 'Failed to fetch aggregated history',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/prices/:id/anomalies
 * Get unresolved anomalies for a price
 */
router.get('/:id/anomalies', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const anomalies = await getUnresolvedAnomalies(id);
    
    return res.json({
      success: true,
      data: anomalies,
    });
  } catch (error) {
    console.error('Error fetching anomalies:', error);
    return res.status(500).json({
      error: 'Internal server error',
    });
  }
});

/**
 * POST /api/prices/search
 * Search prices with advanced criteria
 */
router.post('/search', async (req: Request, res: Response) => {
  try {
    const searchSchema = z.object({
      productIds: z.array(z.string()).optional(),
      storeIds: z.array(z.string()).optional(),
      minPrice: z.number().positive().optional(),
      maxPrice: z.number().positive().optional(),
      source: z.nativeEnum(PriceSource).optional(),
      minConfidence: z.number().min(0).max(100).default(0),
      onlyFresh: z.boolean().default(false),
      page: z.number().int().positive().default(1),
      limit: z.number().int().positive().max(100).default(100),
    });
    
    const criteria = searchSchema.parse(req.body);
    const { page, limit, ...searchCriteria } = criteria;
    
    const offset = (page - 1) * limit;
    
    const prices = await searchPrices({
      ...searchCriteria,
      limit,
      offset,
    });
    
    return res.json({
      success: true,
      data: prices,
      pagination: {
        page,
        limit,
        hasMore: prices.length === limit,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.errors,
      });
    }
    
    console.error('Error searching prices:', error);
    return res.status(500).json({
      error: 'Internal server error',
    });
  }
});

export default router;
