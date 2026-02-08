/**
 * Leaderboard Service - Manages rankings and leaderboards
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
 * Get leaderboard
 */
export async function getLeaderboard(filters: LeaderboardFilters): Promise<LeaderboardEntry[]> {
  const limit = filters.limit || 100;

  // Base query
  let orderBy: any = { totalXP: 'desc' };

  // Get all users with gamification data
  const users = await prisma.userGamification.findMany({
    orderBy,
    take: limit,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true
        }
      },
      badges: true,
      pointsHistory: true
    }
  });

  // Calculate period-specific XP if needed
  let periodStart: Date | null = null;

  if (filters.period === 'monthly') {
    const now = new Date();
    periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
  } else if (filters.period === 'weekly') {
    const now = new Date();
    periodStart = new Date(now);
    periodStart.setDate(now.getDate() - now.getDay());
  }

  // Build leaderboard entries
  const entries: LeaderboardEntry[] = users.map((user, index) => {
    const levelData = calculateLevel(user.totalXP);

    let periodXP = user.totalXP;
    if (periodStart) {
      periodXP = user.pointsHistory
        .filter(tx => tx.createdAt >= periodStart!)
        .reduce((sum, tx) => sum + tx.points + tx.bonusPoints, 0);
    }

    return {
      rank: index + 1,
      userId: user.userId,
      username: user.user.name || user.user.email.split('@')[0],
      level: levelData.currentLevel.level,
      levelIcon: levelData.currentLevel.icon,
      totalXP: user.totalXP,
      monthlyXP: filters.period === 'monthly' ? periodXP : undefined,
      weeklyXP: filters.period === 'weekly' ? periodXP : undefined,
      currentStreak: user.currentStreak,
      badgeCount: user.badges.length
    };
  });

  // Sort by period XP if needed
  if (filters.period !== 'all_time') {
    entries.sort((a, b) => {
      const aXP = filters.period === 'monthly' ? (a.monthlyXP || 0) : (a.weeklyXP || 0);
      const bXP = filters.period === 'monthly' ? (b.monthlyXP || 0) : (b.weeklyXP || 0);
      return bXP - aXP;
    });

    // Update ranks
    entries.forEach((entry, index) => {
      entry.rank = index + 1;
    });
  }

  return entries;
}

/**
 * Get user's rank
 */
export async function getUserRank(
  userId: string,
  filters: LeaderboardFilters
): Promise<UserRank> {
  // Get all users ordered by XP
  const allUsers = await prisma.userGamification.findMany({
    orderBy: { totalXP: 'desc' },
    select: {
      userId: true,
      totalXP: true,
      pointsHistory: true
    }
  });

  const totalUsers = allUsers.length;

  // Calculate period-specific XP if needed
  let periodStart: Date | null = null;

  if (filters.period === 'monthly') {
    const now = new Date();
    periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
  } else if (filters.period === 'weekly') {
    const now = new Date();
    periodStart = new Date(now);
    periodStart.setDate(now.getDate() - now.getDay());
  }

  // Calculate rankings
  const rankings = allUsers.map(user => {
    let xp = user.totalXP;
    
    if (periodStart) {
      xp = user.pointsHistory
        .filter(tx => tx.createdAt >= periodStart!)
        .reduce((sum, tx) => sum + tx.points + tx.bonusPoints, 0);
    }

    return { userId: user.userId, xp };
  });

  // Sort by XP
  rankings.sort((a, b) => b.xp - a.xp);

  // Find user's rank
  const rank = rankings.findIndex(r => r.userId === userId) + 1;

  if (rank === 0) {
    // User not found
    return {
      rank: totalUsers + 1,
      totalUsers,
      percentile: 0
    };
  }

  const percentile = totalUsers > 0 
    ? Math.round(((totalUsers - rank + 1) / totalUsers) * 100)
    : 0;

  return {
    rank,
    totalUsers,
    percentile
  };
}

/**
 * Get territory leaderboard
 */
export async function getTerritoryLeaderboard(
  territory: string,
  limit: number = 10
): Promise<LeaderboardEntry[]> {
  // This would require territory tracking in user profile
  // For now, return general leaderboard
  return getLeaderboard({ period: 'all_time', territory, limit });
}

/**
 * Get top contributors
 */
export async function getTopContributors(
  metric: 'prices' | 'verifications' | 'products',
  limit: number = 10
): Promise<Array<{
  userId: string;
  username: string;
  count: number;
  level: number;
  levelIcon: string;
}>> {
  let orderBy: any = {};

  switch (metric) {
    case 'prices':
      orderBy = { pricesSubmitted: 'desc' };
      break;
    case 'verifications':
      orderBy = { pricesVerified: 'desc' };
      break;
    case 'products':
      orderBy = { productsAdded: 'desc' };
      break;
  }

  const users = await prisma.userGamification.findMany({
    orderBy,
    take: limit,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
    }
  });

  return users.map(user => {
    const levelData = calculateLevel(user.totalXP);
    let count = 0;

    switch (metric) {
      case 'prices':
        count = user.pricesSubmitted;
        break;
      case 'verifications':
        count = user.pricesVerified;
        break;
      case 'products':
        count = user.productsAdded;
        break;
    }

    return {
      userId: user.userId,
      username: user.user.name || user.user.email.split('@')[0],
      count,
      level: levelData.currentLevel.level,
      levelIcon: levelData.currentLevel.icon
    };
  });
}

/**
 * Get leaderboard statistics
 */
export async function getLeaderboardStats(): Promise<{
  totalUsers: number;
  totalXP: number;
  averageXP: number;
  topLevel: number;
  totalBadges: number;
}> {
  const users = await prisma.userGamification.findMany({
    include: {
      badges: true
    }
  });

  const totalUsers = users.length;
  const totalXP = users.reduce((sum, u) => sum + u.totalXP, 0);
  const averageXP = totalUsers > 0 ? Math.round(totalXP / totalUsers) : 0;
  
  const topLevel = totalUsers > 0
    ? Math.max(...users.map(u => calculateLevel(u.totalXP).currentLevel.level))
    : 0;

  const totalBadges = users.reduce((sum, u) => sum + u.badges.length, 0);

  return {
    totalUsers,
    totalXP,
    averageXP,
    topLevel,
    totalBadges
  };
}

/**
 * Get user's neighbors on leaderboard (users above and below)
 */
export async function getLeaderboardNeighbors(
  userId: string,
  range: number = 3
): Promise<LeaderboardEntry[]> {
  // Get user's rank first
  const userRank = await getUserRank(userId, { period: 'all_time' });

  if (userRank.rank === 0) {
    return [];
  }

  // Get users in range
  const startRank = Math.max(1, userRank.rank - range);
  const endRank = userRank.rank + range;

  const users = await prisma.userGamification.findMany({
    orderBy: { totalXP: 'desc' },
    skip: startRank - 1,
    take: endRank - startRank + 1,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true
        }
      },
      badges: true
    }
  });

  return users.map((user, index) => {
    const levelData = calculateLevel(user.totalXP);

    return {
      rank: startRank + index,
      userId: user.userId,
      username: user.user.name || user.user.email.split('@')[0],
      level: levelData.currentLevel.level,
      levelIcon: levelData.currentLevel.icon,
      totalXP: user.totalXP,
      currentStreak: user.currentStreak,
      badgeCount: user.badges.length
    };
  });
}
