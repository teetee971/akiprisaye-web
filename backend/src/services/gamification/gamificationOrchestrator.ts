/**
 * Gamification Orchestrator - Main service that coordinates all gamification features
 */

import { PrismaClient, PointAction } from '@prisma/client';
import * as pointsService from './pointsService';
import * as levelService from './levelService';
import * as badgeService from './badgeService';
import * as streakService from './streakService';
import * as challengeService from './challengeService';
import * as leaderboardService from './leaderboardService';

const prisma = new PrismaClient();

export interface GamificationProfile {
  user: {
    id: string;
    username: string;
  };
  level: levelService.UserLevel;
  points: {
    total: number;
    today: number;
    week: number;
    month: number;
  };
  streak: streakService.UserStreak;
  badges: {
    unlocked: badgeService.UserBadge[];
    total: number;
    byRarity: Record<string, number>;
  };
  rank: leaderboardService.UserRank;
  stats: {
    pricesSubmitted: number;
    pricesVerified: number;
    productsAdded: number;
    storesVisited: number;
    anomaliesReported: number;
  };
}

/**
 * Get user's complete gamification profile
 */
export async function getUserGamificationProfile(userId: string): Promise<GamificationProfile> {
  // Get or create user gamification data
  let userGamification = await prisma.userGamification.findUnique({
    where: { userId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true
        }
      },
      badges: {
        include: {
          badge: true
        }
      }
    }
  });

  if (!userGamification) {
    userGamification = await prisma.userGamification.create({
      data: { userId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        badges: {
          include: {
            badge: true
          }
        }
      }
    });
  }

  // Get level information
  const level = levelService.calculateLevel(userGamification.totalXP);

  // Get points summary
  const pointsSummary = await pointsService.getPointsSummary(userId);

  // Get streak information
  const streak = await streakService.getStreak(userId);

  // Get badges
  const unlockedBadges = await badgeService.getUserBadges(userId);
  const allBadges = badgeService.getAllBadges();

  // Count badges by rarity
  const byRarity: Record<string, number> = {
    COMMON: 0,
    UNCOMMON: 0,
    RARE: 0,
    EPIC: 0,
    LEGENDARY: 0
  };

  unlockedBadges.forEach(ub => {
    byRarity[ub.badge.rarity]++;
  });

  // Get user rank
  const rank = await leaderboardService.getUserRank(userId, { period: 'all_time' });

  return {
    user: {
      id: userGamification.userId,
      username: userGamification.user.name || userGamification.user.email.split('@')[0]
    },
    level,
    points: {
      total: pointsSummary.totalXP,
      today: pointsSummary.todayXP,
      week: pointsSummary.weekXP,
      month: pointsSummary.monthXP
    },
    streak,
    badges: {
      unlocked: unlockedBadges,
      total: allBadges.length,
      byRarity
    },
    rank,
    stats: {
      pricesSubmitted: userGamification.pricesSubmitted,
      pricesVerified: userGamification.pricesVerified,
      productsAdded: userGamification.productsAdded,
      storesVisited: userGamification.storesVisited,
      anomaliesReported: userGamification.anomaliesReported
    }
  };
}

/**
 * Handle user action and award points
 */
export async function handleUserAction(
  userId: string,
  action: PointAction,
  metadata?: Record<string, any>
): Promise<{
  pointsAwarded: pointsService.PointsTransaction;
  levelUp?: levelService.Level;
  newBadges?: badgeService.Badge[];
  streakUpdated?: streakService.UserStreak;
}> {
  // Record activity for streak
  const streakUpdated = await streakService.recordActivity(userId);

  // Get current XP before awarding points
  const currentXP = await pointsService.getUserTotalPoints(userId);

  // Award points
  const pointsAwarded = await pointsService.awardPoints(userId, action, metadata);

  // Check for level up
  const { leveledUp, newLevel, levelData } = levelService.checkLevelUp(currentXP, currentXP + pointsAwarded.totalPoints);

  let levelUpData: levelService.Level | undefined;

  if (leveledUp && levelData) {
    // Award bonus points for level up
    await pointsService.awardPoints(userId, 'LEVEL_UP', {
      levelReached: newLevel
    });

    // Update user's current level
    await prisma.userGamification.update({
      where: { userId },
      data: { currentLevel: newLevel }
    });

    levelUpData = levelData;
  }

  // Update user stats based on action
  await updateUserStats(userId, action, metadata);

  // Check for new badges
  const newBadges = await badgeService.checkAndAwardBadges(userId);

  // Award XP for newly unlocked badges
  for (const badge of newBadges) {
    await pointsService.awardPoints(userId, 'BADGE_UNLOCKED', {
      badgeId: badge.id,
      badgeName: badge.name,
      xpReward: badge.xpReward
    });
  }

  // Update challenge progress
  await challengeService.updateChallengeProgress(userId, action);

  return {
    pointsAwarded,
    levelUp: levelUpData,
    newBadges: newBadges.length > 0 ? newBadges : undefined,
    streakUpdated
  };
}

/**
 * Update user stats based on action
 */
async function updateUserStats(
  userId: string,
  action: PointAction,
  metadata?: Record<string, any>
): Promise<void> {
  const updates: any = {};

  switch (action) {
    case 'SUBMIT_PRICE':
      updates.pricesSubmitted = { increment: 1 };
      if (metadata?.storeId) {
        // Would need to track unique stores
        updates.storesVisited = { increment: 1 };
      }
      break;

    case 'VERIFY_PRICE':
      updates.pricesVerified = { increment: 1 };
      break;

    case 'ADD_PRODUCT':
      updates.productsAdded = { increment: 1 };
      break;

    case 'REPORT_STORE':
      updates.anomaliesReported = { increment: 1 };
      break;

    case 'REFERRAL':
      updates.referralsCount = { increment: 1 };
      break;
  }

  if (Object.keys(updates).length > 0) {
    await prisma.userGamification.updateMany({
      where: { userId },
      data: updates
    });
  }
}

/**
 * Initialize gamification for a new user
 */
export async function initializeUserGamification(userId: string): Promise<void> {
  await prisma.userGamification.upsert({
    where: { userId },
    update: {},
    create: { userId }
  });
}

/**
 * Get user's dashboard summary
 */
export async function getDashboardSummary(userId: string): Promise<{
  profile: GamificationProfile;
  activeChallenges: challengeService.UserChallenge[];
  recentTransactions: pointsService.PointsTransaction[];
  leaderboardPosition: leaderboardService.LeaderboardEntry[];
}> {
  const profile = await getUserGamificationProfile(userId);
  const activeChallenges = await challengeService.getActiveChallenges(userId);
  const recentTransactions = await pointsService.getPointsHistory(userId, 5);
  const leaderboardPosition = await leaderboardService.getLeaderboardNeighbors(userId, 2);

  return {
    profile,
    activeChallenges,
    recentTransactions,
    leaderboardPosition
  };
}

// Export all services
export {
  pointsService,
  levelService,
  badgeService,
  streakService,
  challengeService,
  leaderboardService
};
