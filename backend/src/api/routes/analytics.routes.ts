/**
 * Analytics API Routes
 * Endpoints for conversion funnel tracking and analytics
 */

import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import conversionTrackingService, { type ConversionStep, type ConversionSource } from '../../services/analytics/conversionTrackingService.js';

const router = Router();

const VALID_STEPS: ConversionStep[] = ['landing', 'pricing', 'form_start', 'form_submit', 'success'];
const VALID_SOURCES: ConversionSource[] = ['organic', 'affiliate', 'direct', 'promo'];

/**
 * POST /api/analytics/track-step (public — anonymous tracking allowed)
 * Track a conversion funnel step
 */
router.post('/track-step', async (req: Request, res: Response): Promise<void> => {
  try {
    const { step, planKey, source, sessionId, promoCodeUsed, affiliateCode, duration } = req.body as {
      step?: string;
      planKey?: string;
      source?: string;
      sessionId?: string;
      promoCodeUsed?: string;
      affiliateCode?: string;
      duration?: number;
    };

    if (!step || !VALID_STEPS.includes(step as ConversionStep)) {
      return void res.status(400).json({
        success: false,
        error: `step must be one of: ${VALID_STEPS.join(', ')}`,
      });
    }

    const resolvedSource: ConversionSource = VALID_SOURCES.includes(source as ConversionSource)
      ? (source as ConversionSource)
      : 'organic';

    await conversionTrackingService.trackStep(
      step as ConversionStep,
      planKey || 'CITIZEN_PREMIUM',
      resolvedSource,
      {
        userId: req.user?.userId,
        sessionId,
        promoCodeUsed,
        affiliateCode,
        duration,
      }
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Error tracking conversion step:', error);
    res.status(500).json({ success: false, error: 'Failed to track step' });
  }
});

/**
 * GET /api/analytics/conversion-funnel (admin)
 * Get the full conversion funnel with drop-off rates
 */
router.get('/conversion-funnel', authMiddleware, async (_req: Request, res: Response): Promise<void> => {
  try {
    const funnel = await conversionTrackingService.getConversionFunnel();
    res.json({ success: true, funnel });
  } catch (error) {
    console.error('Error fetching conversion funnel:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch funnel' });
  }
});

/**
 * GET /api/analytics/daily-conversion (admin)
 * Get daily conversion rates for the last N days
 */
router.get('/daily-conversion', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
  const days = Math.min(parseInt(req.query['days'] as string, 10) || 30, 365);
    const data = await conversionTrackingService.getDailyConversionRate(days);
    res.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching daily conversion rate:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch daily conversion rate' });
  }
});

export default router;
