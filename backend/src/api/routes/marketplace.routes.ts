/**
 * Marketplace API Routes
 *
 * Endpoints pour le marketplace API : génération de clés, tracking d'usage,
 * rate limiting, informations sur les tiers et instructions SDK.
 *
 * Routes :
 *   POST /api/marketplace/keys         — Génère une nouvelle clé API
 *   POST /api/marketplace/track-usage  — Enregistre un événement d'usage
 *   GET  /api/marketplace/tiers        — Liste des tiers disponibles
 *   GET  /api/marketplace/sdk          — Instructions d'installation du SDK
 */

import express, { Request, Response } from 'express';
import {
  ApiMarketplaceService,
  type ApiTier,
} from '../../services/monetization/apiMarketplaceService.js';
import { createLimiter } from '../middlewares/rateLimit.middleware.js';
import { isValidEmail } from '../../utils/validation.js';

const router = express.Router();

/**
 * POST /api/marketplace/keys
 * Generate a new marketplace API key.
 */
router.post('/keys', createLimiter, (req: Request, res: Response): void => {
  try {
    const { tier = 'starter', organizationName, email } = req.body;

    if (!email || !isValidEmail(email)) {
      res.status(400).json({ success: false, error: 'Email valide requis' });
      return;
    }

    if (!['starter', 'professional', 'enterprise'].includes(tier)) {
      res.status(400).json({ success: false, error: 'Tier invalide' });
      return;
    }

    const { clientId, secret } = ApiMarketplaceService.generateApiKey(tier as ApiTier);
    const config = ApiMarketplaceService.getTierConfigs().find((c) => c.tier === tier);

    res.status(201).json({
      success: true,
      data: {
        clientId,
        secret,
        tier,
        rateLimit: config?.rateLimitPerDay ?? 1000,
        monthlyPrice: config?.monthlyPrice ?? 50,
        organizationName,
        email,
        createdAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Erreur lors de la génération de clé' });
  }
});

/**
 * GET /api/marketplace/tiers
 * List all available API tiers and their pricing.
 */
router.get('/tiers', (_req: Request, res: Response): void => {
  res.json({
    success: true,
    data: ApiMarketplaceService.getTierConfigs(),
  });
});

/**
 * POST /api/marketplace/track-usage
 * Record a metered API usage event.
 */
router.post('/track-usage', (req: Request, res: Response): void => {
  try {
    const {
      clientId,
      tier,
      endpoint,
      method = 'GET',
      statusCode = 200,
      responseTime = 0,
    } = req.body;

    if (!clientId || !endpoint || !tier) {
      res.status(400).json({ success: false, error: 'clientId, tier et endpoint requis' });
      return;
    }

    if (!['starter', 'professional', 'enterprise'].includes(tier)) {
      res.status(400).json({ success: false, error: 'Tier invalide' });
      return;
    }

    // In production: resolve tier from clientId via DB before computing cost
    const cost = ApiMarketplaceService.computeRequestCost(tier as ApiTier, endpoint);

    res.status(201).json({
      success: true,
      data: {
        clientId,
        tier,
        endpoint,
        method,
        statusCode,
        responseTime,
        cost,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Erreur enregistrement usage' });
  }
});

/**
 * GET /api/marketplace/sdk
 * Return SDK installation instructions.
 */
router.get('/sdk', (_req: Request, res: Response): void => {
  res.json({
    success: true,
    data: ApiMarketplaceService.getSdkInstructions(),
  });
});

export default router;
