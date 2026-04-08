/**
 * Affiliate API Routes
 * Endpoints for affiliate link generation and tracking
 */

import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import affiliateService from '../../services/subscription/affiliateService.js';

const router = Router();

/**
 * POST /api/affiliates/generate-link (authenticated)
 * Generate (or retrieve) an affiliate referral link for the authenticated user
 */
router.post('/generate-link', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return void res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const { platform } = req.body as { platform?: string };
    const resolvedPlatform = platform || 'direct';

    const result = await affiliateService.generateAffiliateLink(userId, resolvedPlatform);
    res.json({ success: true, ...result });
  } catch (error) {
    console.error('Error generating affiliate link:', error);
    res.status(500).json({ success: false, error: 'Failed to generate affiliate link' });
  }
});

/**
 * GET /api/affiliates/stats (authenticated)
 * Get affiliate stats for the authenticated user
 */
router.get('/stats', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return void res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const stats = await affiliateService.getAffiliateStats(userId);
    res.json({ success: true, ...stats });
  } catch (error) {
    console.error('Error fetching affiliate stats:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch affiliate stats' });
  }
});

/**
 * GET /api/affiliates/top (public)
 * Get the top affiliates leaderboard
 */
router.get('/top', async (req: Request, res: Response): Promise<void> => {
  try {
    const limit = Math.min(parseInt(req.query['limit'] as string, 10) || 10, 50);
    const affiliates = await affiliateService.listTopAffiliates(limit);

    // Return only public stats (no userId)
    const publicAffiliates = affiliates.map((a) => ({
      referralCode: a.referralCode,
      platform: a.platform,
      conversions: a.conversions,
      revenue: a.revenue,
    }));

    res.json({ success: true, affiliates: publicAffiliates });
  } catch (error) {
    console.error('Error fetching top affiliates:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch affiliates' });
  }
});

/**
 * POST /api/affiliates/track (public)
 * Track an affiliate conversion (called by backend after successful subscription)
 */
router.post('/track', async (req: Request, res: Response): Promise<void> => {
  try {
    const { referralCode, planKey, revenue } = req.body as {
      referralCode?: string;
      planKey?: string;
      revenue?: number;
    };

    if (!referralCode || !planKey) {
      return void res.status(400).json({ success: false, error: 'referralCode and planKey are required' });
    }

    await affiliateService.trackAffiliateConversion(referralCode, planKey, revenue ?? 0);
    res.json({ success: true });
  } catch (error) {
    console.error('Error tracking affiliate conversion:', error);
    res.status(500).json({ success: false, error: 'Failed to track conversion' });
  }
});

export default router;
