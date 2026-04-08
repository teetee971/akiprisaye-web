/**
 * Affiliate Routes
 *
 * Routes :
 *   POST /api/affiliates/register      — Inscription programme affilié
 *   GET  /api/affiliates/commissions   — Configs de commission
 *   POST /api/affiliates/generate-link — Génère un lien tracké
 *   GET  /api/affiliates/assets        — Assets marketing
 */

import express, { Request, Response } from 'express';
import { AffiliateService } from '../../services/monetization/affiliateService.js';
import { createLimiter } from '../middlewares/rateLimit.middleware.js';
import { isValidEmail } from '../../utils/validation.js';

const router = express.Router();

/**
 * POST /api/affiliates/register
 * Enroll a new affiliate.
 */
router.post('/register', createLimiter, (req: Request, res: Response): void => {
  try {
    const { affiliateId, displayName, email } = req.body;

    if (!affiliateId || !email) {
      res.status(400).json({ success: false, error: 'affiliateId et email requis' });
      return;
    }

    if (!isValidEmail(email)) {
      res.status(400).json({ success: false, error: 'Format email invalide' });
      return;
    }

    const referralCode = AffiliateService.generateReferralCode(affiliateId);
    const trackedUrl = AffiliateService.buildTrackedUrl('/tarifs', referralCode, affiliateId);
    const cookieExpires = AffiliateService.getCookieExpiration();

    res.status(201).json({
      success: true,
      data: {
        affiliateId,
        displayName,
        email,
        referralCode,
        trackedUrl,
        cookieExpires: cookieExpires.toISOString(),
        commissions: AffiliateService.getCommissionConfigs(),
        createdAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Erreur inscription affilié' });
  }
});

/**
 * POST /api/affiliates/generate-link
 * Generate a tracked affiliate URL.
 */
router.post('/generate-link', (req: Request, res: Response): void => {
  try {
    const { affiliateId, referralCode, targetPath = '/tarifs', campaign } = req.body;

    if (!affiliateId || !referralCode) {
      res.status(400).json({ success: false, error: 'affiliateId et referralCode requis' });
      return;
    }

    const trackedUrl = AffiliateService.buildTrackedUrl(targetPath, referralCode, affiliateId, campaign);

    res.json({
      success: true,
      data: { trackedUrl, cookieExpires: AffiliateService.getCookieExpiration().toISOString() },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Erreur génération lien' });
  }
});

/**
 * GET /api/affiliates/commissions
 * Get commission configurations for all plans.
 */
router.get('/commissions', (_req: Request, res: Response): void => {
  res.json({
    success: true,
    data: AffiliateService.getCommissionConfigs(),
  });
});

/**
 * GET /api/affiliates/assets
 * Return marketing assets info.
 */
router.get('/assets', (_req: Request, res: Response): void => {
  res.json({
    success: true,
    data: AffiliateService.getMarketingAssets(),
  });
});

export default router;
