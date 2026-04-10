/**
 * Promo Code API Routes
 * Endpoints for promo code validation and management
 */

import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import promoService from '../../services/subscription/promoService.js';

const router = Router();

/**
 * POST /api/promos/validate
 * Validate a promo code for a given plan (public)
 */
router.post('/validate', async (req: Request, res: Response): Promise<void> => {
  try {
    const { code, planKey } = req.body as { code?: string; planKey?: string };

    if (!code) {
      return void res.status(400).json({ success: false, error: 'code is required' });
    }

    const plan = planKey || 'CITIZEN_PREMIUM';
    const result = await promoService.validatePromoCode(code, plan);

    res.json({ success: true, ...result });
  } catch (error) {
    console.error('Error validating promo code:', error);
    res.status(500).json({ success: false, error: 'Failed to validate promo code' });
  }
});

/**
 * GET /api/promos/active
 * List all currently active promo codes (public — only shows discount %, not internal IDs)
 */
router.get('/active', async (_req: Request, res: Response): Promise<void> => {
  try {
    const promos = await promoService.listActivePromosSimple();
    // Return only safe fields
    const publicPromos = promos.map((p) => ({
      code: p.code,
      discount: p.discount,
      validUntil: p.validUntil,
      applicablePlans: p.applicablePlans,
      usesRemaining: p.maxUses - p.currentUses,
    }));
    res.json({ success: true, promos: publicPromos });
  } catch (error) {
    console.error('Error fetching active promos:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch promos' });
  }
});

/**
 * POST /api/promos/apply (authenticated)
 * Apply a promo code to the authenticated user for a given plan
 */
router.post('/apply', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return void res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const { code, planKey } = req.body as { code?: string; planKey?: string };
    if (!code || !planKey) {
      return void res.status(400).json({ success: false, error: 'code and planKey are required' });
    }

    const result = await promoService.applyPromoCode(userId, code, planKey);
    res.json({ success: true, ...result });
  } catch (error) {
    console.error('Error applying promo code:', error);
    res.status(500).json({ success: false, error: 'Failed to apply promo code' });
  }
});

export default router;
