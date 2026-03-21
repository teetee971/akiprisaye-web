/**
 * Leaderboard Service - Manages rankings and leaderboards.
 * Aligned with Prisma schema: userGamification (no relations, uses userId string).
 *
 * Schema facts:
 * - userGamification.totalPoints (not totalXP)
 * - userGamification.level (not currentLevel)
 * - userGamification.priceReportsCount, verificationsCount, photosCount, receiptsCount
 * - No user, badges, pointsHistory relations on userGamification
 * - pointsTransaction linked by userId (not userGamificationId)
 * - userBadge linked by userId
 */

import { PrismaClient } from '@prisma/client';
import { calculateLevel } from './levelService';

const prisma = new PrismaClient();

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  avatarUrl?: string;
  level: number;
  levelIcon: string;
  totalXP: number;
  monthlyXP?: number;
  weeklyXP?: number;
  currentStreak: number;
  badgeCount: number;
}

export interface LeaderboardFilters {
  territory?: string;
  period: 'all_time' | 'monthly' | 'weekly';
  limit?: number;
}

export interface UserRank {
  rank: number;
  totalUsers: number;
  percentile: number;
}

/**
 * Get leaderboard.
 */
export async function getLeaderboard(filters: LeaderboardFilters): Promise<LeaderboardEntry[]> {
  const limit = filters.limit || 100;

  // Fetch all gamification profiles sorted by totalPoints
  const users = await prisma.userGamification.findMany({
    orderBy: { totalPoints: 'desc' },
    take: limit,
  });

  // Calculate period-specific points if needed
  let periodStart: Date | null = null;

  if (filters.period === 'monthly') {
    const now = new Date();
    periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
  } else if (filters.period === 'weekly') {
    const now = new Date();
    periodStart = new Date(now);
    periodStart.setDate(now.getDate() - now.getDay());
  }

  // Fetch badge counts per user
  const badgeCountsByUser = await prisma.userBadge.groupBy({
    by: ['userId'],
    _count: { userId: true },
  });
  const badgeCountMap = new Map(badgeCountsByUser.map(b => [b.userId, b._count.userId]));

  // Fetch period-specific points if needed
  let periodPointsMap = new Map<string, number>();
  if (periodStart) {
    const txs = await prisma.pointsTransaction.findMany({
      where: { createdAt: { gte: periodStart } },
      select: { userId: true, points: true },
    });
    for (const tx of txs) {
      periodPointsMap.set(tx.userId, (periodPointsMap.get(tx.userId) ?? 0) + tx.points);
    }
  }

  const entries: LeaderboardEntry[] = users.map((user, index) => {
    const levelData = calculateLevel(user.totalPoints);
    const periodXP = periodStart ? (periodPointsMap.get(user.userId) ?? 0) : user.totalPoints;

    return {
      rank: index + 1,
      userId: user.userId,
      username: user.userId,
      level: levelData.currentLevel.level,
      levelIcon: levelData.currentLevel.icon,
      totalXP: user.totalPoints,
      monthlyXP: filters.period === 'monthly' ? periodXP : undefined,
      weeklyXP: filters.period === 'weekly' ? periodXP : undefined,
      currentStreak: user.currentStreak,
      badgeCount: badgeCountMap.get(user.userId) ?? 0,
    };
  });

  // Re-sort by period XP if needed
  if (filters.period !== 'all_time') {
    entries.sort((a, b) => {
      const aXP = filters.period === 'monthly' ? (a.monthlyXP ?? 0) : (a.weeklyXP ?? 0);
      const bXP = filters.period === 'monthly' ? (b.monthlyXP ?? 0) : (b.weeklyXP ?? 0);
      return bXP - aXP;
    });
    entries.forEach((entry, index) => { entry.rank = index + 1; });
  }

  return entries;
}

/**
 * Get user's rank.
 */
export async function getUserRank(userId: string, filters: LeaderboardFilters): Promise<UserRank> {
  const allUsers = await prisma.userGamification.findMany({
    orderBy: { totalPoints: 'desc' },
    select: { userId: true, totalPoints: true },
  });

  const totalUsers = allUsers.length;

  let periodStart: Date | null = null;
  if (filters.period === 'monthly') {
    const now = new Date();
    periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
  } else if (filters.period === 'weekly') {
    const now = new Date();
    periodStart = new Date(now);
    periodStart.setDate(now.getDate() - now.getDay());
  }

  let rankings: Array<{ userId: string; xp: number }>;

  if (periodStart) {
    const txs = await prisma.pointsTransaction.findMany({
      where: { createdAt: { gte: periodStart } },
      select: { userId: true, points: true },
    });
    const map = new Map<string, number>();
    for (const tx of txs) {
      map.set(tx.userId, (map.get(tx.userId) ?? 0) + tx.points);
    }
    rankings = allUsers.map(u => ({ userId: u.userId, xp: map.get(u.userId) ?? 0 }));
    rankings.sort((a, b) => b.xp - a.xp);
  } else {
    rankings = allUsers.map(u => ({ userId: u.userId, xp: u.totalPoints }));
  }

  const rank = rankings.findIndex(r => r.userId === userId) + 1;

  if (rank === 0) {
    return { rank: totalUsers + 1, totalUsers, percentile: 0 };
  }

  const percentile = totalUsers > 0
    ? Math.round(((totalUsers - rank + 1) / totalUsers) * 100)
    : 0;

  return { rank, totalUsers, percentile };
}

/**
 * Get territory leaderboard (delegates to global leaderboard — territory tracking TBD).
 */
export async function getTerritoryLeaderboard(
  territory: string,
  limit: number = 10
): Promise<LeaderboardEntry[]> {
  return getLeaderboard({ period: 'all_time', territory, limit });
}

/**
 * Get top contributors by metric.
 */
export async function getTopContributors(
  metric: 'prices' | 'verifications' | 'photos',
  limit: number = 10
): Promise<Array<{
  userId: string;
  username: string;
  count: number;
  level: number;
  levelIcon: string;
}>> {
  const orderBy =
    metric === 'prices'        ? { priceReportsCount: 'desc' as const } :
    metric === 'verifications' ? { verificationsCount: 'desc' as const } :
                                 { photosCount: 'desc' as const };

  const users = await prisma.userGamification.findMany({
    orderBy,
    take: limit,
  });

  return users.map(user => {
    const levelData = calculateLevel(user.totalPoints);
    const count =
      metric === 'prices'        ? user.priceReportsCount :
      metric === 'verifications' ? user.verificationsCount :
                                   user.photosCount;

    return {
      userId: user.userId,
      username: user.userId,
      count,
      level: levelData.currentLevel.level,
      levelIcon: levelData.currentLevel.icon,
    };
  });
}

/**
 * Get leaderboard statistics.
 */
export async function getLeaderboardStats(): Promise<{
  totalUsers: number;
  totalXP: number;
  averageXP: number;
  topLevel: number;
  totalBadges: number;
}> {
  const users = await prisma.userGamification.findMany({
    select: { totalPoints: true, level: true },
  });

  const totalUsers = users.length;
  const totalXP = users.reduce((sum, u) => sum + u.totalPoints, 0);
  const averageXP = totalUsers > 0 ? Math.round(totalXP / totalUsers) : 0;
  const topLevel = totalUsers > 0 ? Math.max(...users.map(u => u.level)) : 0;
  const totalBadges = await prisma.userBadge.count();

  return { totalUsers, totalXP, averageXP, topLevel, totalBadges };
}

/**
 * Get neighboring entries on the leaderboard for a user.
 */
export async function getLeaderboardNeighbors(
  userId: string,
  range: number = 3
): Promise<LeaderboardEntry[]> {
  const userRank = await getUserRank(userId, { period: 'all_time' });

  if (userRank.rank === 0) return [];

  const startRank = Math.max(1, userRank.rank - range);
  const endRank = userRank.rank + range;

  const users = await prisma.userGamification.findMany({
    orderBy: { totalPoints: 'desc' },
    skip: startRank - 1,
    take: endRank - startRank + 1,
  });

  const badgeCountsByUser = await prisma.userBadge.groupBy({
    by: ['userId'],
    where: { userId: { in: users.map(u => u.userId) } },
    _count: { userId: true },
  });
  const badgeCountMap = new Map(badgeCountsByUser.map(b => [b.userId, b._count.userId]));

  return users.map((user, index) => {
    const levelData = calculateLevel(user.totalPoints);
    return {
      rank: startRank + index,
      userId: user.userId,
      username: user.userId,
      level: levelData.currentLevel.level,
      levelIcon: levelData.currentLevel.icon,
      totalXP: user.totalPoints,
      currentStreak: user.currentStreak,
      badgeCount: badgeCountMap.get(user.userId) ?? 0,
    };
  });
}

