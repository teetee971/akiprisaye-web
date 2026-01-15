/**
 * Contrôleur pour les endpoints de gamification
 * A KI PRI SA YÉ - Version 1.0.0
 */

import { Request, Response } from 'express';
import { PrismaClient, Territory } from '@prisma/client';
import { GamificationService } from '../../services/credits/GamificationService.js';
import { CreditsService } from '../../services/credits/CreditsService.js';
import { getAllBadges } from '../../config/badges.js';

const prisma = new PrismaClient();
const creditsService = new CreditsService(prisma);
const gamificationService = new GamificationService(prisma, creditsService);

/**
 * GET /api/gamification/badges
 * Obtenir tous les badges disponibles
 */
export async function getAllBadgesEndpoint(req: Request, res: Response) {
  try {
    const badges = getAllBadges();
    return res.json(badges);
  } catch (error) {
    console.error('Error getting badges:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * GET /api/gamification/leaderboard
 * Obtenir le leaderboard
 */
export async function getLeaderboard(req: Request, res: Response) {
  try {
    const { territory, period, limit } = req.query;
    
    const leaderboard = await gamificationService.getLeaderboard({
      territory: territory as Territory | undefined,
      period: (period as 'WEEK' | 'MONTH' | 'YEAR' | 'ALL_TIME') || 'MONTH',
      limit: limit ? parseInt(limit as string) : undefined,
    });
    
    return res.json(leaderboard);
  } catch (error) {
    console.error('Error getting leaderboard:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * GET /api/gamification/progress
 * Obtenir la progression de l'utilisateur connecté
 */
export async function getProgress(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const progress = await gamificationService.getUserProgress(userId);
    
    return res.json(progress);
  } catch (error) {
    console.error('Error getting progress:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * POST /api/gamification/check-badges
 * Vérifier et débloquer de nouveaux badges pour l'utilisateur
 */
export async function checkBadges(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const unlockedBadges = await gamificationService.checkBadgeUnlock(userId);
    
    return res.json({
      message: `${unlockedBadges.length} badge(s) débloqué(s)`,
      badges: unlockedBadges,
    });
  } catch (error) {
    console.error('Error checking badges:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * GET /api/gamification/my-badges
 * Obtenir les badges débloqués par l'utilisateur
 */
export async function getMyBadges(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const userBadges = await prisma.userBadge.findMany({
      where: { userId },
      orderBy: { earnedAt: 'desc' },
    });
    
    // Enrichir avec les infos des badges
    const badges = getAllBadges();
    const enrichedBadges = userBadges.map(ub => {
      const badge = badges.find(b => b.type === ub.badgeType);
      return {
        ...ub,
        badge,
      };
    });
    
    return res.json(enrichedBadges);
  } catch (error) {
    console.error('Error getting user badges:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
