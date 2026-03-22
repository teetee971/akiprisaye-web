/**
 * Points Service - Manages XP points awards and tracking
 * Aligned with Prisma schema: PointAction enum and pointsTransaction model.
 */

import { PrismaClient, PointAction, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

/** Points awarded per valid PointAction value (schema enum). */
export const POINTS_CONFIG: Record<PointAction, number> = {
  LEVEL_UP: 25,
  PRICE_REPORT: 10,
  PRICE_VERIFY: 5,
  PHOTO_UPLOAD: 8,
  RECEIPT_SCAN: 12,
  DAILY_LOGIN: 2,
  STREAK_BONUS: 50,
  REFERRAL: 100,
  CHALLENGE_COMPLETE: 50,
  BADGE_EARNED: 0,
};

export interface PointsTransaction {
  id: string;
  userId: string;
  action: PointAction;
  points: number;
  totalPoints: number;
  description: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

/**
 * Award points to a user for an action.
 * Points are stored via pointsTransaction (linked by userId) and
 * totalPoints is incremented on userGamification.
 */
export async function awardPoints(
  userId: string,
  action: PointAction,
  metadata?: Record<string, unknown>
): Promise<PointsTransaction> {
  // Get or create user gamification profile
  await prisma.userGamification.upsert({
    where: { userId },
    create: { userId },
    update: {},
  });

  // Calculate points
  let points = POINTS_CONFIG[action] ?? 0;
  let description = `${action}`;

  // STREAK_BONUS: scale with streak length
  if (action === 'STREAK_BONUS') {
    const days = (metadata?.streakDays as number) || 0;
    if (days >= 100) points = 1000;
    else if (days >= 30) points = 200;
    else if (days >= 7) points = 50;
    description = `Streak bonus (${days} days)`;
  }

  // REFERRAL: bonus for active referrals
  if (action === 'REFERRAL') {
    const referralType = metadata?.referralType as string | undefined;
    if (referralType === 'active') points = 150;
    description = `Referral (${referralType || 'signup'})`;
  }

  // BADGE_EARNED: custom points stored in metadata
  if (action === 'BADGE_EARNED') {
    points = (metadata?.badgePoints as number) || 0;
    description = `Badge earned: ${metadata?.badgeName || 'Unknown'}`;
  }

  // Create transaction
  const transaction = await prisma.pointsTransaction.create({
    data: {
      userId,
      action,
      points,
      description,
      metadata: (metadata || {}) as Prisma.InputJsonValue,
    },
  });

  // Update user total points
  await prisma.userGamification.update({
    where: { userId },
    data: { totalPoints: { increment: points } },
  });

  return {
    id: transaction.id,
    userId,
    action,
    points,
    totalPoints: points,
    description,
    metadata,
    createdAt: transaction.createdAt,
  };
}

/**
 * Get user's total points.
 */
export async function getUserTotalPoints(userId: string): Promise<number> {
  const userGamification = await prisma.userGamification.findUnique({
    where: { userId },
  });

  return userGamification?.totalPoints ?? 0;
}

/**
 * Get user's points history.
 */
export async function getPointsHistory(
  userId: string,
  limit: number = 50
): Promise<PointsTransaction[]> {
  const transactions = await prisma.pointsTransaction.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });

  return transactions.map(tx => ({
    id: tx.id,
    userId,
    action: tx.action,
    points: tx.points,
    totalPoints: tx.points,
    description: tx.description ?? '',
    metadata: tx.metadata as Record<string, unknown> | undefined,
    createdAt: tx.createdAt,
  }));
}

/**
 * Get points summary for a user.
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
  });

  if (!userGamification) {
    return { totalXP: 0, todayXP: 0, weekXP: 0, monthXP: 0, recentTransactions: [] };
  }

  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  // Recent transactions for display
  const recent = await prisma.pointsTransaction.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 10,
  });

  // Period-specific aggregates
  const allTransactions = await prisma.pointsTransaction.findMany({
    where: { userId },
  });

  const todayXP = allTransactions
    .filter(tx => tx.createdAt >= startOfDay)
    .reduce((sum, tx) => sum + tx.points, 0);

  const weekXP = allTransactions
    .filter(tx => tx.createdAt >= startOfWeek)
    .reduce((sum, tx) => sum + tx.points, 0);

  const monthXP = allTransactions
    .filter(tx => tx.createdAt >= startOfMonth)
    .reduce((sum, tx) => sum + tx.points, 0);

  return {
    totalXP: userGamification.totalPoints,
    todayXP,
    weekXP,
    monthXP,
    recentTransactions: recent.map(tx => ({
      id: tx.id,
      userId,
      action: tx.action,
      points: tx.points,
      totalPoints: tx.points,
      description: tx.description ?? '',
      metadata: tx.metadata as Record<string, unknown> | undefined,
      createdAt: tx.createdAt,
    })),
  };
}
