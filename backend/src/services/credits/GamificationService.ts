/**
 * Service de gamification
 * A KI PRI SA YÉ - Version 1.0.0
 * 
 * Gère:
 * - Déblocage de badges
 * - Leaderboards (hebdomadaire, mensuel, annuel, all-time)
 * - Progression utilisateur
 * - Calcul de niveaux
 * - Streaks et bonus
 * 
 * Badges disponibles:
 * - Contributions (Water Guardian, Price Hunter, etc.)
 * - Crédits (Credit Millionaire, Generous Donor)
 * - Engagement (Community Leader, Referral Master)
 * - Qualité (Data Scientist, Photo Pro)
 * - Territoires (Local Hero par département)
 */

import { PrismaClient } from '@prisma/client';
import {
  Badge,
  LeaderboardEntry,
  UserProgress,
} from '../../types/credits.js';
import { BADGES } from '../../config/badges.js';
import { CreditsService } from './CreditsService.js';

export class GamificationService {
  private prisma: PrismaClient;
  private creditsService: CreditsService;

  constructor(prisma: PrismaClient, creditsService: CreditsService) {
    this.prisma = prisma;
    this.creditsService = creditsService;
  }

  /**
   * Vérifier et débloquer les badges éligibles pour un utilisateur
   * 
   * @param userId - ID de l'utilisateur
   * @returns Badges nouvellement débloqués
   */
  async checkBadgeUnlock(userId: string): Promise<Badge[]> {
    // Récupérer badges déjà obtenus
    const existingBadges = await this.prisma.userBadge.findMany({
      where: { userId },
    });
    
    const existingBadgeTypes = new Set(existingBadges.map(b => b.badgeType));
    
    const unlockedBadges: Badge[] = [];
    
    // Parcourir tous les badges disponibles
    for (const [badgeType, badge] of Object.entries(BADGES)) {
      // Déjà obtenu ?
      if (existingBadgeTypes.has(badgeType)) {
        continue;
      }
      
      // Vérifier éligibilité
      const eligible = await this.checkBadgeEligibility(userId, badge);
      
      if (eligible) {
        // Attribuer badge
        await this.prisma.userBadge.create({
          data: {
            userId,
            badgeType,
            badgeCode: badgeType,
          },
        });
        
        // Récompense crédits
        if (badge.creditReward > 0) {
          await this.creditsService.earnCredits(
            userId,
            'expert_badge',
            badgeType,
            {
              badgeName: badge.name,
              creditReward: badge.creditReward,
            }
          );
        }
        
        unlockedBadges.push(badge);
        
        // Note: Notification sera gérée par le système de notifications externe
        // await notificationService.send(userId, { type: 'badge_unlocked', ... });
      }
    }
    
    return unlockedBadges;
  }

  /**
   * Vérifier l'éligibilité d'un utilisateur pour un badge
   * (Méthode privée)
   * 
   * @param userId - ID de l'utilisateur
   * @param badge - Badge à vérifier
   * @returns true si éligible
   */
  private async checkBadgeEligibility(userId: string, badge: Badge): Promise<boolean> {
    const { requirements } = badge;
    
    // Vérifier contributions
    if (requirements.contributions) {
      // Note: On suppose qu'il existe une table contributions
      // Pour l'instant, on utilise les transactions de crédits comme proxy
      const earnTransactions = await this.prisma.creditTransaction.count({
        where: {
          userId,
          type: 'EARN',
        },
      });
      
      if (earnTransactions < requirements.contributions) {
        return false;
      }
    }
    
    // Vérifier crédits lifetime
    if (requirements.credits) {
      const balance = await this.creditsService.getBalance(userId);
      if (balance.lifetime < requirements.credits) {
        return false;
      }
    }
    
    // Vérifier parrainages
    if (requirements.referrals) {
      // Note: Le filtrage par type de contribution nécessite un champ dédié
      // Approximation: compter toutes les transactions EARN
      const referralCredits = await this.prisma.creditTransaction.count({
        where: {
          userId,
          type: 'EARN',
        },
      });
      
      if (referralCredits < requirements.referrals) {
        return false;
      }
    }
    
    // Vérifier contributions vérifiées
    if (requirements.verifiedContributions) {
      // Approximation: compter toutes les transactions EARN
      const verifiedCount = await this.prisma.creditTransaction.count({
        where: {
          userId,
          type: 'EARN',
        },
      });
      
      if (verifiedCount < requirements.verifiedContributions) {
        return false;
      }
    }
    
    // Vérifier territoire
    if (requirements.territory) {
      // Note: Le filtrage par territoire nécessite un champ dédié dans les transactions
      const territoryContributions = await this.prisma.creditTransaction.count({
        where: {
          userId,
          type: 'EARN',
        },
      });
      
      if (requirements.contributions && territoryContributions < requirements.contributions) {
        return false;
      }
    }
    
    return true;
  }

  /**
   * Générer le leaderboard
   * 
   * @param options - Options de filtrage
   * @returns Classement des utilisateurs
   */
  async getLeaderboard(options?: {
    territory?: string;
    period?: 'WEEK' | 'MONTH' | 'YEAR' | 'ALL_TIME';
    limit?: number;
  }): Promise<LeaderboardEntry[]> {
    const { territory, period = 'MONTH', limit = 100 } = options || {};
    
    // Calculer date de début selon période
    let startDate: Date | undefined;
    const now = new Date();
    
    if (period === 'WEEK') {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (period === 'MONTH') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (period === 'YEAR') {
      startDate = new Date(now.getFullYear(), 0, 1);
    }
    
    // Agréger crédits par utilisateur pour la période
    const transactions = await this.prisma.creditTransaction.groupBy({
      by: ['userId'],
      where: {
        type: 'EARN',
        createdAt: startDate ? { gte: startDate } : undefined,
      },
      _sum: {
        amount: true,
      },
      orderBy: {
        _sum: {
          amount: 'desc',
        },
      },
      take: limit,
    });
    
    // Enrichir avec infos utilisateur et badges
    const leaderboard: LeaderboardEntry[] = [];
    
    for (const [index, entry] of transactions.entries()) {
      // Note: Il faudrait récupérer les infos utilisateur depuis une table User
      // Pour l'instant, on utilise juste l'userId
      
      const badges = await this.prisma.userBadge.count({
        where: { userId: entry.userId },
      });
      
      const contributions = await this.prisma.creditTransaction.count({
        where: {
          userId: entry.userId,
          type: 'EARN',
          createdAt: startDate ? { gte: startDate } : undefined,
        },
      });
      
      leaderboard.push({
        userId: entry.userId,
        username: `User-${entry.userId.substring(0, 8)}`, // Placeholder
        credits: entry._sum.amount || 0,
        contributions,
        badges,
        rank: index + 1,
        territory,
      });
    }
    
    return leaderboard;
  }

  /**
   * Obtenir la progression d'un utilisateur
   * 
   * @param userId - ID de l'utilisateur
   * @returns Progression complète
   */
  async getUserProgress(userId: string): Promise<UserProgress> {
    const balance = await this.creditsService.getBalance(userId);
    
    const badges = await this.prisma.userBadge.findMany({
      where: { userId },
    });
    
    const contributions = await this.prisma.creditTransaction.count({
      where: { userId, type: 'EARN' },
    });
    
    // Calculer niveau basé sur les crédits actuels
    const level = this.calculateUserLevel(balance.total);
    
    // Récupérer prochains badges non obtenus
    const obtainedBadgeTypes = new Set(badges.map(b => b.badgeType));
    const candidateBadges = Object.values(BADGES)
      .filter(badge => !obtainedBadgeTypes.has(badge.type))
      .slice(0, 5);
    
    // Calculer rang
    const rank = await this.getUserRank(userId);
    
    return {
      level,
      currentCredits: balance.total,
      lifetimeCredits: balance.total,
      totalContributions: contributions,
      badgesUnlocked: badges.length,
      nextBadges: await Promise.all(candidateBadges.map(async badge => ({
        badge,
        progress: await this.calculateBadgeProgress(userId, badge),
      }))),
      rank,
    };
  }

  /**
   * Calculer le niveau d'un utilisateur basé sur ses crédits
   * 
   * @param lifetimeCredits - Crédits totaux gagnés
   * @returns Niveau
   */
  private calculateUserLevel(lifetimeCredits: number): number {
    // Formule: level = floor(sqrt(lifetimeCredits / 10))
    // Niveau 1 = 10 crédits, Niveau 2 = 40 crédits, Niveau 3 = 90 crédits, etc.
    return Math.floor(Math.sqrt(lifetimeCredits / 10)) + 1;
  }

  /**
   * Calculer la progression vers un badge (0-100%)
   * 
   * @param userId - ID de l'utilisateur
   * @param badge - Badge cible
   * @returns Pourcentage de progression
   */
  private async calculateBadgeProgress(userId: string, badge: Badge): Promise<number> {
    const { requirements } = badge;
    
    let progress = 0;
    
    if (requirements.contributions) {
      const count = await this.prisma.creditTransaction.count({
        where: { userId, type: 'EARN' },
      });
      progress = Math.min(100, (count / requirements.contributions) * 100);
    } else if (requirements.credits) {
      const balance = await this.creditsService.getBalance(userId);
      progress = Math.min(100, (balance.total / requirements.credits) * 100);
    } else if (requirements.verifiedContributions) {
      const count = await this.prisma.creditTransaction.count({
        where: {
          userId,
          type: 'EARN',
        },
      });
      progress = Math.min(100, (count / requirements.verifiedContributions) * 100);
    }
    
    return Math.floor(progress);
  }

  /**
   * Obtenir le rang d'un utilisateur dans le leaderboard global
   * 
   * @param userId - ID de l'utilisateur
   * @returns Rang (position)
   */
  private async getUserRank(userId: string): Promise<number> {
    const userBalance = await this.creditsService.getBalance(userId);
    
    // Compter combien d'utilisateurs ont plus de crédits
    const higherCount = await this.prisma.creditBalance.count({
      where: {
        balance: {
          gt: userBalance.total,
        },
      },
    });
    
    return higherCount + 1;
  }
}
