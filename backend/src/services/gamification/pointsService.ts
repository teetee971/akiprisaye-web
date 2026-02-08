/**
 * Points Service - Manages XP points awards and tracking
 */

import { PrismaClient, PointAction } from '@prisma/client';

const prisma = new PrismaClient();

export interface PointsConfig {
  actions: {
    SUBMIT_PRICE: { base: number; bonusFirstInStore: number };
    PRICE_VALIDATED: { base: number; bonusHighValidation: number };
    ADD_PRODUCT: { base: number; bonusValidated: number };
    REPORT_STORE: { base: number };
    VERIFY_PRICE: { base: number };
    STREAK_BONUS: { base: number };
    REFERRAL: { base: number };
    CHALLENGE_COMPLETED: { base: number };
    BADGE_UNLOCKED: { base: number };
    LEVEL_UP: { base: number };
  };
}

export const POINTS_CONFIG: PointsConfig = {
  actions: {
    SUBMIT_PRICE: { base: 10, bonusFirstInStore: 5 },
    PRICE_VALIDATED: { base: 5, bonusHighValidation: 10 },
    ADD_PRODUCT: { base: 15, bonusValidated: 10 },
    REPORT_STORE: { base: 25 },
    VERIFY_PRICE: { base: 3 },
    STREAK_BONUS: { base: 50 },
    REFERRAL: { base: 100 },
    CHALLENGE_COMPLETED: { base: 50 },
    BADGE_UNLOCKED: { base: 0 },
    LEVEL_UP: { base: 0 }
  }
};

export interface PointsTransaction {
  id: string;
  userId: string;
  action: PointAction;
  points: number;
  bonusPoints: number;
  totalPoints: number;
  reason: string;
  metadata?: {
    priceId?: string;
    productId?: string;
    storeId?: string;
    streakDays?: number;
    referredUserId?: string;
    challengeId?: string;
    badgeId?: string;
    levelReached?: number;
  };
  createdAt: Date;
}

/**
 * Award points to a user for an action
 */
export async function awardPoints(
  userId: string,
  action: PointAction,
  metadata?: Record<string, any>
): Promise<PointsTransaction> {
  // Get or create user gamification profile
  let userGamification = await prisma.userGamification.findUnique({
    where: { userId }
  });

  if (!userGamification) {
    userGamification = await prisma.userGamification.create({
      data: { userId }
    });
  }

  // Calculate points
  const basePoints = POINTS_CONFIG.actions[action]?.base || 0;
  let bonusPoints = 0;
  let reason = `${action}`;

  // Calculate bonuses based on metadata
  if (action === 'SUBMIT_PRICE' && metadata?.isFirstInStore) {
    bonusPoints += POINTS_CONFIG.actions.SUBMIT_PRICE.bonusFirstInStore;
    reason += ' (First in store bonus)';
  }

  if (action === 'PRICE_VALIDATED' && metadata?.highValidation) {
    bonusPoints += POINTS_CONFIG.actions.PRICE_VALIDATED.bonusHighValidation;
    reason += ' (High validation bonus)';
  }

  if (action === 'ADD_PRODUCT' && metadata?.validated) {
    bonusPoints += POINTS_CONFIG.actions.ADD_PRODUCT.bonusValidated;
    reason += ' (Validated product bonus)';
  }

  if (action === 'STREAK_BONUS') {
    const days = metadata?.streakDays || 0;
    if (days === 7) bonusPoints = 50;
    else if (days === 30) bonusPoints = 200;
    else if (days === 100) bonusPoints = 1000;
    reason = `Streak bonus (${days} days)`;
  }

  if (action === 'REFERRAL') {
    const referralType = metadata?.referralType;
    if (referralType === 'signup') {
      bonusPoints = 100;
      reason = 'Referral signup bonus';
    } else if (referralType === 'active') {
      bonusPoints = 50;
      reason = 'Active referral bonus';
    }
  }

  if (action === 'BADGE_UNLOCKED') {
    bonusPoints = metadata?.xpReward || 0;
    reason = `Badge unlocked: ${metadata?.badgeName || 'Unknown'}`;
  }

  const totalPoints = basePoints + bonusPoints;

  // Create transaction
  const transaction = await prisma.pointsTransaction.create({
    data: {
      userGamificationId: userGamification.id,
      action,
      points: basePoints,
      bonusPoints,
      reason,
      metadata: metadata || {}
    }
  });

  // Update user total XP
  await prisma.userGamification.update({
    where: { id: userGamification.id },
    data: {
      totalXP: {
        increment: totalPoints
      }
    }
  });

  return {
    id: transaction.id,
    userId,
    action,
    points: basePoints,
    bonusPoints,
    totalPoints,
    reason,
    metadata,
    createdAt: transaction.createdAt
  };
}

/**
 * Get user's total points
 */
export async function getUserTotalPoints(userId: string): Promise<number> {
  const userGamification = await prisma.userGamification.findUnique({
    where: { userId }
  });

  return userGamification?.totalXP || 0;
}

/**
 * Get user's points history
 */
export async function getPointsHistory(
  userId: string, 
  limit: number = 50
): Promise<PointsTransaction[]> {
  const userGamification = await prisma.userGamification.findUnique({
    where: { userId },
    include: {
      pointsHistory: {
        orderBy: { createdAt: 'desc' },
        take: limit
      }
    }
  });

  if (!userGamification) {
    return [];
  }

  return userGamification.pointsHistory.map(tx => ({
    id: tx.id,
    userId,
    action: tx.action,
    points: tx.points,
    bonusPoints: tx.bonusPoints,
    totalPoints: tx.points + tx.bonusPoints,
    reason: tx.reason,
    metadata: tx.metadata as any,
    createdAt: tx.createdAt
  }));
}

/**
 * Get points summary for a user
 */
export async function getPointsSummary(userId: string): Promise<{
  totalXP: number;
  todayXP: number;
  weekXP: number;
  monthXP: number;
  recentTransactions: PointsTransaction[];
}> {
  const userGamification = await prisma.userGamification.findUnique({
    where: { userId },
    include: {
      pointsHistory: {
        orderBy: { createdAt: 'desc' },
        take: 10
      }
    }
  });

  if (!userGamification) {
    return {
      totalXP: 0,
      todayXP: 0,
      weekXP: 0,
      monthXP: 0,
      recentTransactions: []
    };
  }

  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  // Calculate XP for different periods
  const allTransactions = await prisma.pointsTransaction.findMany({
    where: { userGamificationId: userGamification.id }
  });

  const todayXP = allTransactions
    .filter(tx => tx.createdAt >= startOfDay)
    .reduce((sum, tx) => sum + tx.points + tx.bonusPoints, 0);

  const weekXP = allTransactions
    .filter(tx => tx.createdAt >= startOfWeek)
    .reduce((sum, tx) => sum + tx.points + tx.bonusPoints, 0);

  const monthXP = allTransactions
    .filter(tx => tx.createdAt >= startOfMonth)
    .reduce((sum, tx) => sum + tx.points + tx.bonusPoints, 0);

  return {
    totalXP: userGamification.totalXP,
    todayXP,
    weekXP,
    monthXP,
    recentTransactions: userGamification.pointsHistory.map(tx => ({
      id: tx.id,
      userId,
      action: tx.action,
      points: tx.points,
      bonusPoints: tx.bonusPoints,
      totalPoints: tx.points + tx.bonusPoints,
      reason: tx.reason,
      metadata: tx.metadata as any,
      createdAt: tx.createdAt
    }))
  };
}
