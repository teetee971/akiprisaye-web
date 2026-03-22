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

type GamificationUpdate = Partial<{
  totalPoints: number;
  priceReportsCount: number;
  verificationsCount: number;
  photosCount: number;
  receiptsCount: number;
}>;

function statFieldFor(action: PointAction): keyof GamificationUpdate | null {
  switch (action) {
    case PointAction.PRICE_REPORT:
      return 'priceReportsCount';
    case PointAction.PRICE_VERIFY:
      return 'verificationsCount';
    case PointAction.PHOTO_UPLOAD:
      return 'photosCount';
    case PointAction.RECEIPT_SCAN:
      return 'receiptsCount';
    default:
      return null;
  }
}


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
    where: { userId }
  });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true }
  });

  if (!userGamification) {
    userGamification = await prisma.userGamification.create({
      data: { userId }
    });
  }

  // Get level information
  const level = levelService.calculateLevel(userGamification.totalPoints);

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
      username: user?.name || user?.email?.split('@')[0] || userId
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
      pricesSubmitted: userGamification.priceReportsCount,
      pricesVerified: userGamification.verificationsCount,
      productsAdded: userGamification.photosCount,
      storesVisited: 0,
      anomaliesReported: 0
    }
  };
}

/**
 * Handle user action and award points
 */
export async function handleUserAction(
  userId: string,
  action: PointAction,
  metadata?: Record<string, unknown>
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
    await pointsService.awardPoints(userId, PointAction.LEVEL_UP, {
      levelReached: newLevel
    });

    // Update user's current level
    await prisma.userGamification.update({
      where: { userId },
      data: { level: newLevel }
    });

    levelUpData = levelData;
  }

  // Update user stats based on action
  await updateUserStats(userId, action);

  // Check for new badges
  const newBadges = await badgeService.checkAndAwardBadges(userId);

  // Award XP for newly unlocked badges
  for (const badge of newBadges) {
    await pointsService.awardPoints(userId, PointAction.BADGE_EARNED, {
      badgeId: badge.id,
      badgeName: badge.name,
      points: badge.points
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
  action: PointAction
): Promise<void> {
  const statField = statFieldFor(action);

  if (statField) {
    await prisma.userGamification.updateMany({
      where: { userId },
      data: { [statField]: { increment: 1 } }
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
