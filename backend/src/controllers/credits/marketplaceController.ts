/**
 * Contrôleur pour les endpoints du marketplace
 * A KI PRI SA YÉ - Version 1.0.0
 */

import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { MarketplaceService } from '../../services/credits/MarketplaceService.js';
import { CreditsService } from '../../services/credits/CreditsService.js';
import { z } from 'zod';

const prisma = new PrismaClient();
const creditsService = new CreditsService(prisma);
const marketplaceService = new MarketplaceService(prisma, creditsService);

/**
 * Schémas de validation
 */
const purchaseOfferSchema = z.object({
  offerId: z.string().uuid(),
});

/**
 * GET /api/marketplace/offers
 * Obtenir toutes les offres disponibles
 */
export async function getOffers(req: Request, res: Response) {
  try {
    const { type, available } = req.query;
    
    const offers = await marketplaceService.getOffers({
      type: type as any,
      available: available === 'false' ? false : true,
    });
    
    return res.json(offers);
  } catch (error) {
    console.error('Error getting offers:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * POST /api/marketplace/purchase
 * Acheter une offre avec des crédits
 */
export async function purchaseOffer(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const validated = purchaseOfferSchema.parse(req.body);
    
    const purchase = await marketplaceService.purchaseOffer(
      userId,
      validated.offerId
    );
    
    return res.status(201).json(purchase);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    
    if (error instanceof Error) {
      if (error.message.includes('not available')) {
        return res.status(404).json({ error: error.message });
      }
      if (error.message.includes('expired')) {
        return res.status(400).json({ error: error.message });
      }
      if (error.message.includes('stock')) {
        return res.status(400).json({ error: error.message });
      }
      if (error.message.includes('Insufficient credits')) {
        return res.status(400).json({ error: error.message });
      }
    }
    
    console.error('Error purchasing offer:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * GET /api/marketplace/purchases
 * Obtenir l'historique des achats de l'utilisateur
 */
export async function getPurchases(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const { limit } = req.query;
    
    const purchases = await marketplaceService.getPurchaseHistory(
      userId,
      limit ? parseInt(limit as string) : undefined
    );
    
    return res.json(purchases);
  } catch (error) {
    console.error('Error getting purchases:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
