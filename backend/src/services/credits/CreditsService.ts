/**
 * Service de gestion des crédits
 * A KI PRI SA YÉ - Version 1.0.0
 * 
 * Gère:
 * - Gain de crédits (contributions, bonus, parrainages)
 * - Dépense de crédits (marketplace, donations)
 * - Redemption (échange crédits → argent)
 * - Balance utilisateur
 * - Historique transactions
 * 
 * Conformité:
 * - Traçabilité complète de toutes les transactions
 * - Calcul transparent avec multiplicateurs
 * - Audit trail pour redistribution B2B
 */

import { PrismaClient } from '@prisma/client';
import {
  CreditTransaction,
  CreditBalance,
  Redemption,
  EarningsStats,
  InsufficientCreditsError,
} from '../../types/credits.js';
import {
  CREDIT_EARNING_RULES,
  CREDIT_MULTIPLIERS,
  CREDIT_TO_EUR,
  MIN_REDEMPTION_CREDITS,
} from '../../config/creditRules.js';

export class CreditsService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Gagner des crédits suite à une contribution
   * 
   * @param userId - ID de l'utilisateur
   * @param contributionType - Type de contribution
   * @param contributionId - ID de la contribution
   * @param metadata - Métadonnées (verified, hasPhoto, etc.)
   * @returns Transaction crédit créée
   */
  async earnCredits(
    userId: string,
    contributionType: string,
    contributionId: string,
    metadata?: {
      verified?: boolean;
      hasPhoto?: boolean;
      isUrgent?: boolean;
      isDetailed?: boolean;
      [key: string]: unknown;
    }
  ): Promise<CreditTransaction> {
    // Calculer montant base
    let amount = CREDIT_EARNING_RULES[contributionType] || 0;
    
    if (amount === 0) {
      throw new Error(`Unknown contribution type: ${contributionType}`);
    }
    
    // Appliquer multiplicateurs
    if (metadata?.verified) {
      amount *= CREDIT_MULTIPLIERS.verified_by_admin;
    }
    
    if (metadata?.isUrgent) {
      amount *= CREDIT_MULTIPLIERS.urgency;
    }
    
    if (metadata?.hasPhoto && metadata?.isDetailed) {
      amount *= CREDIT_MULTIPLIERS.quality;
    }
    
    // Vérifier première contrib du jour
    const firstToday = await this.isFirstContributionToday(userId);
    if (firstToday) {
      amount *= CREDIT_MULTIPLIERS.first_contribution_day;
    }
    
    amount = Math.floor(amount);
    
    // Créer transaction dans une transaction DB
    const result = await this.prisma.$transaction(async (tx) => {
      // Créer transaction crédit
      const transaction = await tx.creditTransaction.create({
        data: {
          userId,
          type: 'EARN',
          amount,
          source: JSON.stringify({
            type: 'contribution',
            contributionType,
            contributionId,
            verified: metadata?.verified || false,
          }),
          description: `Contribution: ${contributionType}`,
          metadata: metadata ? JSON.stringify(metadata) : null,
          balance: 0, // Sera mis à jour après
        },
      });
      
      // Mettre à jour balance
      const balance = await this.updateBalance(userId, tx);
      
      // Mettre à jour balance dans transaction
      await tx.creditTransaction.update({
        where: { id: transaction.id },
        data: { balance: balance.total },
      });
      
      return {
        ...transaction,
        source: JSON.parse(transaction.source),
        metadata: transaction.metadata ? JSON.parse(transaction.metadata) : undefined,
        balance: balance.total,
      };
    });
    
    // Note: Notification sera gérée par le système de notifications externe
    // await notificationService.send(userId, { type: 'credits_earned', ... });
    
    // Note: Vérification badges sera gérée par GamificationService
    // await gamificationService.checkBadgeUnlock(userId);
    
    return result as CreditTransaction;
  }

  /**
   * Dépenser des crédits
   * 
   * @param userId - ID de l'utilisateur
   * @param amount - Montant à dépenser
   * @param purpose - Description de la dépense
   * @param metadata - Métadonnées additionnelles
   * @returns Transaction crédit créée
   */
  async spendCredits(
    userId: string,
    amount: number,
    purpose: string,
    metadata?: Record<string, unknown>
  ): Promise<CreditTransaction> {
    if (amount <= 0) {
      throw new Error('Amount must be positive');
    }

    const balance = await this.getBalance(userId);
    
    if (balance.total < amount) {
      throw new InsufficientCreditsError(
        `Insufficient credits. Available: ${balance.total}, Required: ${amount}`
      );
    }
    
    const result = await this.prisma.$transaction(async (tx) => {
      const transaction = await tx.creditTransaction.create({
        data: {
          userId,
          type: 'SPEND',
          amount: -amount,
          source: JSON.stringify({ type: 'marketplace' }),
          description: purpose,
          metadata: metadata ? JSON.stringify(metadata) : null,
          balance: 0,
        },
      });
      
      const newBalance = await this.updateBalance(userId, tx);
      
      await tx.creditTransaction.update({
        where: { id: transaction.id },
        data: { balance: newBalance.total },
      });
      
      return {
        ...transaction,
        source: JSON.parse(transaction.source),
        metadata: transaction.metadata ? JSON.parse(transaction.metadata) : undefined,
        balance: newBalance.total,
      };
    });
    
    return result as CreditTransaction;
  }

  /**
   * Échanger crédits contre argent (redemption)
   * 
   * @param userId - ID de l'utilisateur
   * @param amount - Montant de crédits à échanger
   * @param method - Méthode de paiement
   * @param details - Détails de paiement (RIB, PayPal, etc.)
   * @returns Redemption créée
   */
  async redeemCredits(
    userId: string,
    amount: number,
    method: 'bank_transfer' | 'paypal' | 'donation',
    details: Record<string, unknown>
  ): Promise<Redemption> {
    const balance = await this.getBalance(userId);
    
    if (balance.total < amount) {
      throw new InsufficientCreditsError(
        `Insufficient credits. Available: ${balance.total}, Required: ${amount}`
      );
    }
    
    // Minimum 100 crédits (10€)
    if (amount < MIN_REDEMPTION_CREDITS) {
      throw new Error(
        `Minimum redemption: ${MIN_REDEMPTION_CREDITS} credits (${MIN_REDEMPTION_CREDITS * CREDIT_TO_EUR}€)`
      );
    }
    
    // Calculer valeur monétaire (en centimes)
    const monetaryValue = Math.floor(amount * CREDIT_TO_EUR * 100);
    
    const result = await this.prisma.$transaction(async (tx) => {
      // Créer demande de retrait
      const redemption = await tx.redemption.create({
        data: {
          userId,
          credits: amount,
          monetaryValue,
          method: method.toUpperCase() as 'BANK_TRANSFER' | 'PAYPAL' | 'DONATION',
          details: JSON.stringify(details),
          status: 'PENDING',
        },
      });
      
      // Bloquer crédits (créer transaction directement sans appeler spendCredits)
      const transaction = await tx.creditTransaction.create({
        data: {
          userId,
          type: 'SPEND',
          amount: -amount,
          source: JSON.stringify({ type: 'marketplace' }),
          description: `Redemption: ${method}`,
          metadata: JSON.stringify({ redemptionId: redemption.id }),
          balance: 0,
        },
      });
      
      // Mettre à jour balance
      await this.updateBalance(userId, tx);
      
      return {
        ...redemption,
        method: method as 'bank_transfer' | 'paypal' | 'donation',
        details: JSON.parse(redemption.details),
      };
    });
    
    // Note: Notification équipe pour traitement sera gérée séparément
    // await this.notifyRedemptionRequest(redemption);
    
    return result as Redemption;
  }

  /**
   * Obtenir la balance d'un utilisateur
   * 
   * @param userId - ID de l'utilisateur
   * @returns Balance de crédits
   */
  async getBalance(userId: string): Promise<CreditBalance> {
    let balance = await this.prisma.creditBalance.findUnique({
      where: { userId },
    });
    
    if (!balance) {
      balance = await this.prisma.creditBalance.create({
        data: {
          userId,
          total: 0,
          pending: 0,
          lifetime: 0,
          redeemed: 0,
        },
      });
    }
    
    return {
      userId: balance.userId,
      total: balance.total,
      pending: balance.pending,
      lifetime: balance.lifetime,
      redeemed: balance.redeemed,
      updatedAt: balance.updatedAt,
    };
  }

  /**
   * Obtenir l'historique des transactions
   * 
   * @param userId - ID de l'utilisateur
   * @param filters - Filtres optionnels
   * @returns Liste des transactions
   */
  async getTransactionHistory(
    userId: string,
    filters?: {
      type?: 'EARN' | 'SPEND' | 'REDEEM' | 'BONUS' | 'REFUND';
      startDate?: Date;
      endDate?: Date;
      limit?: number;
    }
  ): Promise<CreditTransaction[]> {
    const transactions = await this.prisma.creditTransaction.findMany({
      where: {
        userId,
        type: filters?.type,
        createdAt: {
          gte: filters?.startDate,
          lte: filters?.endDate,
        },
      },
      orderBy: { createdAt: 'desc' },
      take: filters?.limit || 50,
    });
    
    return transactions.map(t => ({
      id: t.id,
      userId: t.userId,
      type: t.type.toLowerCase() as 'earn' | 'spend' | 'redeem' | 'bonus' | 'refund',
      amount: t.amount,
      source: JSON.parse(t.source),
      description: t.description,
      metadata: t.metadata ? JSON.parse(t.metadata) : undefined,
      balance: t.balance,
      createdAt: t.createdAt,
    }));
  }

  /**
   * Obtenir les statistiques de gains
   * 
   * @param userId - ID de l'utilisateur
   * @returns Statistiques de gains
   */
  async getEarningsStats(userId: string): Promise<EarningsStats> {
    const transactions = await this.getTransactionHistory(userId);
    const balance = await this.getBalance(userId);
    
    const earnTransactions = transactions.filter(t => t.type === 'earn');
    
    const byType = earnTransactions.reduce((acc, t) => {
      const type = t.source.contributionType || 'other';
      acc[type] = (acc[type] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);
    
    return {
      currentBalance: balance.total,
      lifetimeEarned: balance.lifetime,
      lifetimeRedeemed: balance.redeemed,
      byContributionType: byType,
      averagePerContribution: earnTransactions.length > 0
        ? balance.lifetime / earnTransactions.length
        : 0,
    };
  }

  /**
   * Mettre à jour la balance d'un utilisateur
   * (Méthode privée, utilisée dans transactions)
   * 
   * @param userId - ID de l'utilisateur
   * @param tx - Transaction Prisma
   * @returns Balance mise à jour
   */
  private async updateBalance(
    userId: string,
    tx?: Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>
  ) {
    const prisma = tx || this.prisma;
    
    // Calculer totaux depuis transactions
    const aggregates = await prisma.creditTransaction.aggregate({
      where: { userId },
      _sum: {
        amount: true,
      },
    });
    
    const total = aggregates._sum.amount || 0;
    
    // Calculer lifetime (seulement EARN)
    const earnAggregates = await prisma.creditTransaction.aggregate({
      where: { userId, type: 'EARN' },
      _sum: {
        amount: true,
      },
    });
    
    const lifetime = earnAggregates._sum.amount || 0;
    
    // Calculer redeemed (REDEEM)
    const redeemAggregates = await prisma.creditTransaction.aggregate({
      where: { userId, type: 'REDEEM' },
      _sum: {
        amount: true,
      },
    });
    
    const redeemed = Math.abs(redeemAggregates._sum.amount || 0);
    
    // Mettre à jour balance
    const balance = await prisma.creditBalance.upsert({
      where: { userId },
      update: {
        total,
        lifetime,
        redeemed,
      },
      create: {
        userId,
        total,
        pending: 0,
        lifetime,
        redeemed,
      },
    });
    
    return balance;
  }

  /**
   * Vérifier si c'est la première contribution du jour
   * 
   * @param userId - ID de l'utilisateur
   * @returns true si première contribution du jour
   */
  private async isFirstContributionToday(userId: string): Promise<boolean> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayTransactions = await this.prisma.creditTransaction.findFirst({
      where: {
        userId,
        type: 'EARN',
        createdAt: {
          gte: today,
        },
      },
    });
    
    return !todayTransactions;
  }
}
