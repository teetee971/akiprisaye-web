/**
 * Marketplace API Routes
 *
 * Endpoints pour le marketplace API : génération de clés, tracking d'usage,
 * rate limiting et informations sur les tiers.
 *
 * Routes :
 *   POST /api/marketplace/keys          — Génère une nouvelle clé API
 *   GET  /api/marketplace/keys/:keyId   — Infos sur une clé
 *   POST /api/marketplace/track-usage   — Enregistre un événement d'usage
 *   GET  /api/marketplace/tiers         — Liste des tiers disponibles
 *   GET  /api/marketplace/usage/:keyId  — Usage du mois en cours
 */

import express, { Request, Response } from 'express';
import {
  ApiMarketplaceService,
  type ApiTier,
} from '../../services/monetization/apiMarketplaceService.js';

const router = express.Router();

/**
 * POST /api/marketplace/keys
 * Generate a new marketplace API key.
 */
router.post('/keys', (req: Request, res: Response): void => {
  try {
    const { tier = 'starter', organizationName, email } = req.body;

    if (!email) {
      res.status(400).json({ success: false, error: 'Email requis' });
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
    const { apiKeyId, endpoint, method = 'GET', statusCode = 200, responseTime = 0 } = req.body;

    if (!apiKeyId || !endpoint) {
      res.status(400).json({ success: false, error: 'apiKeyId et endpoint requis' });
      return;
    }

    // In production: persist to DB (usageEvent model)
    const cost = ApiMarketplaceService.computeRequestCost('starter', endpoint);

    res.status(201).json({
      success: true,
      data: {
        apiKeyId,
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
