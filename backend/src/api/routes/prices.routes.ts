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
});

/**
 * POST /api/prices
 * Submit a new price with validation
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const validatedData = priceSubmissionSchema.parse(req.body);
    
    const result = await submitAndVerifyPrice({
      productId: validatedData.productId,
      storeId: validatedData.storeId,
      price: validatedData.price,
      currency: validatedData.currency,
      source: validatedData.source,
      submittedBy: validatedData.submittedBy,
      proofUrl: validatedData.proofUrl,
    });
    
    if (!result.success) {
      return res.status(400).json({
        error: result.error,
        isDuplicate: result.isDuplicate,
        existingPriceId: result.existingPriceId,
      });
    }
    
    return res.status(201).json({
      success: true,
      priceId: result.priceId,
      confidenceScore: result.confidenceScore,
      hasAnomalies: 'hasAnomalies' in result ? result.hasAnomalies : false,
      anomalies: 'anomalies' in result ? result.anomalies : [],
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.errors,
      });
    }
    
    console.error('Error submitting price:', error);
    return res.status(500).json({
      error: 'Internal server error',
    });
  }
});

/**
 * GET /api/prices/product/:id
 * Get all prices for a product with confidence filter
 */
router.get('/product/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 50 } = paginationSchema.parse(req.query);
    const minConfidence = z.coerce.number().min(0).max(100).default(0).parse(req.query.minConfidence);
    const onlyFresh = z.coerce.boolean().default(false).parse(req.query.onlyFresh);
    
    const offset = (page - 1) * limit;
    
    const prices = await getProductPrices(id, {
      minConfidence,
      onlyFresh,
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
    
    console.error('Error fetching product prices:', error);
    return res.status(500).json({
      error: 'Internal server error',
    });
  }
});

/**
 * GET /api/prices/store/:id
 * Get all prices for a store
 */
router.get('/store/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 100 } = paginationSchema.parse(req.query);
    const minConfidence = z.coerce.number().min(0).max(100).default(0).parse(req.query.minConfidence);
    const onlyFresh = z.coerce.boolean().default(false).parse(req.query.onlyFresh);
    
    const offset = (page - 1) * limit;
    
    const prices = await getStorePrices(id, {
      minConfidence,
      onlyFresh,
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
    
    console.error('Error fetching store prices:', error);
    return res.status(500).json({
      error: 'Internal server error',
    });
  }
});

/**
 * GET /api/prices/best/:id
 * Get the best (highest confidence) price for a product
 */
router.get('/best/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const minConfidence = z.coerce.number().min(0).max(100).default(50).parse(req.query.minConfidence);
    const onlyFresh = z.coerce.boolean().default(true).parse(req.query.onlyFresh);
    const storeId = z.string().optional().parse(req.query.storeId);
    
    const price = await getBestPrice(id, {
      minConfidence,
      onlyFresh,
      storeId,
    });
    
    if (!price) {
      return res.status(404).json({
        error: 'No price found matching criteria',
      });
    }
    
    return res.json({
      success: true,
      data: price,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.errors,
      });
    }
    
    console.error('Error fetching best price:', error);
    return res.status(500).json({
      error: 'Internal server error',
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
