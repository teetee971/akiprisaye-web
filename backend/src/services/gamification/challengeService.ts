/**
 * Challenge Service - Manages challenges (daily, weekly, monthly)
 */

import { PrismaClient, ChallengeType } from '@prisma/client';

const prisma = new PrismaClient();

export interface ChallengeCondition {
  type: string;
  count: number;
}

export interface Challenge {
  id: string;
  name: string;
  description: string;
  icon: string;
  type: ChallengeType;
  condition: ChallengeCondition;
  xpReward: number;
  badgeReward?: string;
  startsAt: Date;
  endsAt: Date;
  isActive: boolean;
}

export interface UserChallenge {
  challenge: Challenge;
  progress: number;
  progressMax: number;
  isCompleted: boolean;
  completedAt?: Date;
}

// Weekly challenge templates
const WEEKLY_CHALLENGE_TEMPLATES = [
  { 
    id: 'scan_10_tickets', 
    name: 'Scanner 10 tickets', 
    description: 'Scannez 10 tickets de caisse cette semaine',
    icon: '📸',
    condition: { type: 'prices_submitted', count: 10 }, 
    xpReward: 100 
  },
  { 
    id: 'visit_3_chains', 
    name: 'Visiter 3 enseignes', 
    description: 'Visitez 3 enseignes différentes cette semaine',
    icon: '🏪',
    condition: { type: 'unique_chains_week', count: 3 }, 
    xpReward: 50 
  },
  { 
    id: 'verify_20_prices', 
    name: 'Vérifier 20 prix', 
    description: 'Vérifiez 20 prix cette semaine',
    icon: '✅',
    condition: { type: 'prices_verified', count: 20 }, 
    xpReward: 75 
  },
  { 
    id: 'add_product', 
    name: 'Ajouter un nouveau produit', 
    description: 'Ajoutez un nouveau produit à la base de données',
    icon: '➕',
    condition: { type: 'products_added', count: 1 }, 
    xpReward: 50 
  },
];

// Daily challenge templates
const DAILY_CHALLENGE_TEMPLATES = [
  { 
    id: 'daily_scan', 
    name: 'Scanner du jour', 
    description: 'Scannez un ticket aujourd\'hui',
    icon: '📱',
    condition: { type: 'prices_submitted', count: 1 }, 
    xpReward: 20 
  },
  { 
    id: 'daily_verify', 
    name: 'Vérification quotidienne', 
    description: 'Vérifiez 3 prix aujourd\'hui',
    icon: '👀',
    condition: { type: 'prices_verified', count: 3 }, 
    xpReward: 15 
  },
];

/**
 * Generate weekly challenges
 */
export async function generateWeeklyChallenges(): Promise<Challenge[]> {
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay() + 1); // Monday
  startOfWeek.setHours(0, 0, 0, 0);

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 7);

  // Deactivate old weekly challenges
  await prisma.challenge.updateMany({
    where: {
      type: 'WEEKLY',
      endsAt: { lt: now }
    },
    data: { isActive: false }
  });

  // Create new challenges
  const challenges: Challenge[] = [];

  for (const template of WEEKLY_CHALLENGE_TEMPLATES) {
    const challenge = await prisma.challenge.create({
      data: {
        name: template.name,
        description: template.description,
        icon: template.icon,
        type: 'WEEKLY',
        conditionType: template.condition.type,
        conditionValue: template.condition.count,
        xpReward: template.xpReward,
        startsAt: startOfWeek,
        endsAt: endOfWeek,
        isActive: true
      }
    });

    challenges.push({
      id: challenge.id,
      name: challenge.name,
      description: challenge.description,
      icon: challenge.icon,
      type: challenge.type,
      condition: { type: challenge.conditionType, count: challenge.conditionValue },
      xpReward: challenge.xpReward,
      badgeReward: challenge.badgeReward || undefined,
      startsAt: challenge.startsAt,
      endsAt: challenge.endsAt,
      isActive: challenge.isActive
    });
  }

  return challenges;
}

/**
 * Generate daily challenges
 */
export async function generateDailyChallenges(): Promise<Challenge[]> {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfDay = new Date(startOfDay);
  endOfDay.setDate(startOfDay.getDate() + 1);

  // Deactivate old daily challenges
  await prisma.challenge.updateMany({
    where: {
      type: 'DAILY',
      endsAt: { lt: now }
    },
    data: { isActive: false }
  });

  // Create new challenges
  const challenges: Challenge[] = [];

  for (const template of DAILY_CHALLENGE_TEMPLATES) {
    const challenge = await prisma.challenge.create({
      data: {
        name: template.name,
        description: template.description,
        icon: template.icon,
        type: 'DAILY',
        conditionType: template.condition.type,
        conditionValue: template.condition.count,
        xpReward: template.xpReward,
        startsAt: startOfDay,
        endsAt: endOfDay,
        isActive: true
      }
    });

    challenges.push({
      id: challenge.id,
      name: challenge.name,
      description: challenge.description,
      icon: challenge.icon,
      type: challenge.type,
      condition: { type: challenge.conditionType, count: challenge.conditionValue },
      xpReward: challenge.xpReward,
      badgeReward: challenge.badgeReward || undefined,
      startsAt: challenge.startsAt,
      endsAt: challenge.endsAt,
      isActive: challenge.isActive
    });
  }

  return challenges;
}

/**
 * Get active challenges for user
 */
export async function getActiveChallenges(userId: string): Promise<UserChallenge[]> {
  const now = new Date();

  // Get active challenges
  const challenges = await prisma.challenge.findMany({
    where: {
      isActive: true,
      startsAt: { lte: now },
      endsAt: { gte: now }
    }
  });

  // Get or create user gamification profile
  let userGamification = await prisma.userGamification.findUnique({
    where: { userId },
    include: {
      challenges: true
    }
  });

  if (!userGamification) {
    userGamification = await prisma.userGamification.create({
      data: { userId },
      include: { challenges: true }
    });
  }

  // Calculate progress for each challenge
  const userChallenges: UserChallenge[] = [];

  for (const challenge of challenges) {
    // Get user's challenge record
    let userChallenge = userGamification.challenges.find(uc => uc.challengeId === challenge.id);

    // Create if doesn't exist
    if (!userChallenge) {
      userChallenge = await prisma.userChallenge.create({
        data: {
          userGamificationId: userGamification.id,
          challengeId: challenge.id,
          progress: 0
        }
      });
    }

    // Calculate current progress based on user stats
    const currentProgress = await calculateChallengeProgress(
      userId,
      challenge.conditionType,
      challenge.startsAt
    );

    // Update progress if changed
    if (currentProgress !== userChallenge.progress && !userChallenge.isCompleted) {
      userChallenge = await prisma.userChallenge.update({
        where: { id: userChallenge.id },
        data: { 
          progress: currentProgress,
          isCompleted: currentProgress >= challenge.conditionValue,
          completedAt: currentProgress >= challenge.conditionValue ? new Date() : undefined
        }
      });
    }

    userChallenges.push({
      challenge: {
        id: challenge.id,
        name: challenge.name,
        description: challenge.description,
        icon: challenge.icon,
        type: challenge.type,
        condition: { type: challenge.conditionType, count: challenge.conditionValue },
        xpReward: challenge.xpReward,
        badgeReward: challenge.badgeReward || undefined,
        startsAt: challenge.startsAt,
        endsAt: challenge.endsAt,
        isActive: challenge.isActive
      },
      progress: userChallenge.progress,
      progressMax: challenge.conditionValue,
      isCompleted: userChallenge.isCompleted,
      completedAt: userChallenge.completedAt || undefined
    });
  }

  return userChallenges;
}

/**
 * Calculate challenge progress based on user stats
 */
async function calculateChallengeProgress(
  userId: string,
  conditionType: string,
  startDate: Date
): Promise<number> {
  const userGamification = await prisma.userGamification.findUnique({
    where: { userId },
    include: {
      pointsHistory: {
        where: {
          createdAt: { gte: startDate }
        }
      }
    }
  });

  if (!userGamification) {
    return 0;
  }

  switch (conditionType) {
    case 'prices_submitted':
      return userGamification.pointsHistory.filter(
        tx => tx.action === 'SUBMIT_PRICE'
      ).length;

    case 'prices_verified':
      return userGamification.pointsHistory.filter(
        tx => tx.action === 'VERIFY_PRICE'
      ).length;

    case 'products_added':
      return userGamification.pointsHistory.filter(
        tx => tx.action === 'ADD_PRODUCT'
      ).length;

    case 'unique_chains_week':
      // This would require tracking unique chains
      // For now, return estimated value
      return 0;

    default:
      return 0;
  }
}

/**
 * Update challenge progress
 */
export async function updateChallengeProgress(
  userId: string,
  action: string
): Promise<void> {
  // Get user's active challenges
  const activeChallenges = await getActiveChallenges(userId);

  // Update progress for relevant challenges
  for (const userChallenge of activeChallenges) {
    if (userChallenge.isCompleted) {
      continue;
    }

    // Check if action matches challenge type
    let shouldIncrement = false;

    if (action === 'SUBMIT_PRICE' && userChallenge.challenge.condition.type === 'prices_submitted') {
      shouldIncrement = true;
    } else if (action === 'VERIFY_PRICE' && userChallenge.challenge.condition.type === 'prices_verified') {
      shouldIncrement = true;
    } else if (action === 'ADD_PRODUCT' && userChallenge.challenge.condition.type === 'products_added') {
      shouldIncrement = true;
    }

    if (shouldIncrement) {
      const newProgress = userChallenge.progress + 1;
      const isCompleted = newProgress >= userChallenge.progressMax;

      const userGamification = await prisma.userGamification.findUnique({
        where: { userId }
      });

      if (userGamification) {
        await prisma.userChallenge.updateMany({
          where: {
            userGamificationId: userGamification.id,
            challengeId: userChallenge.challenge.id
          },
          data: {
            progress: newProgress,
            isCompleted,
            completedAt: isCompleted ? new Date() : undefined
          }
        });
      }
    }
  }
}

/**
 * Get completed challenges for user
 */
export async function getCompletedChallenges(userId: string): Promise<UserChallenge[]> {
  const userGamification = await prisma.userGamification.findUnique({
    where: { userId },
    include: {
      challenges: {
        where: { isCompleted: true },
        include: { challenge: true },
        orderBy: { completedAt: 'desc' }
      }
    }
  });

  if (!userGamification) {
    return [];
  }

  return userGamification.challenges.map(uc => ({
    challenge: {
      id: uc.challenge.id,
      name: uc.challenge.name,
      description: uc.challenge.description,
      icon: uc.challenge.icon,
      type: uc.challenge.type,
      condition: { type: uc.challenge.conditionType, count: uc.challenge.conditionValue },
      xpReward: uc.challenge.xpReward,
      badgeReward: uc.challenge.badgeReward || undefined,
      startsAt: uc.challenge.startsAt,
      endsAt: uc.challenge.endsAt,
      isActive: uc.challenge.isActive
    },
    progress: uc.progress,
    progressMax: uc.challenge.conditionValue,
    isCompleted: uc.isCompleted,
    completedAt: uc.completedAt || undefined
  }));
}
