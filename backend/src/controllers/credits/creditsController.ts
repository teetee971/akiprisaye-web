/**
 * Contrôleur pour les endpoints de crédits
 * A KI PRI SA YÉ - Version 1.0.0
 */

import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { CreditsService } from '../../services/credits/CreditsService.js';
import { z } from 'zod';

const prisma = new PrismaClient();
const creditsService = new CreditsService(prisma);

/**
 * Schémas de validation
 */
const earnCreditsSchema = z.object({
  contributionType: z.string(),
  contributionId: z.string(),
  metadata: z.object({
    verified: z.boolean().optional(),
    hasPhoto: z.boolean().optional(),
    isUrgent: z.boolean().optional(),
    isDetailed: z.boolean().optional(),
  }).optional(),
});

const redeemCreditsSchema = z.object({
  amount: z.number().positive(),
  method: z.enum(['bank_transfer', 'paypal', 'donation']),
  details: z.record(z.unknown()),
});

/**
 * GET /api/credits/balance
 * Obtenir la balance de crédits de l'utilisateur connecté
 */
export async function getBalance(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const balance = await creditsService.getBalance(userId);
    
    return res.json(balance);
  } catch (error) {
    console.error('Error getting balance:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * POST /api/credits/earn
 * Gagner des crédits (endpoint interne, appelé par les services de contributions)
 */
export async function earnCredits(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const validated = earnCreditsSchema.parse(req.body);
    
    const transaction = await creditsService.earnCredits(
      userId,
      validated.contributionType,
      validated.contributionId,
      validated.metadata
    );
    
    return res.status(201).json(transaction);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    
    console.error('Error earning credits:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * POST /api/credits/redeem
 * Demander un retrait de crédits
 */
export async function redeemCredits(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const validated = redeemCreditsSchema.parse(req.body);
    
    const redemption = await creditsService.redeemCredits(
      userId,
      validated.amount,
      validated.method,
      validated.details
    );
    
    return res.status(201).json(redemption);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    
    if (error instanceof Error && error.message.includes('Insufficient credits')) {
      return res.status(400).json({ error: error.message });
    }
    
    if (error instanceof Error && error.message.includes('Minimum redemption')) {
      return res.status(400).json({ error: error.message });
    }
    
    console.error('Error redeeming credits:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * GET /api/credits/transactions
 * Obtenir l'historique des transactions
 */
export async function getTransactions(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const { type, startDate, endDate, limit } = req.query;
    
    const transactions = await creditsService.getTransactionHistory(userId, {
      type: type as any,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
    });
    
    return res.json(transactions);
  } catch (error) {
    console.error('Error getting transactions:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * GET /api/credits/stats
 * Obtenir les statistiques de gains
 */
export async function getStats(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const stats = await creditsService.getEarningsStats(userId);
    
    return res.json(stats);
  } catch (error) {
    console.error('Error getting stats:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
