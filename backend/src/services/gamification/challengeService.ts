/**
 * Challenge Service - Manages challenges (daily, weekly, monthly).
 * Aligned with Prisma schema: challenge and userChallenge models.
 *
 * Schema facts:
 * - challenge: id, code (unique), name, description, type (ChallengeType),
 *              startDate, endDate, target (Int), reward (Int), isActive
 * - userChallenge: id, userId, challengeCode, progress, completed, completedAt
 *   @@unique([userId, challengeCode])
 * - No icon, conditionType, conditionValue, xpReward, startsAt, endsAt, badgeReward fields
 * - No relation from userGamification to userChallenge (linked via userId/challengeCode)
 * - PointAction values that map to challenge progress tracking:
 *   PRICE_REPORT, PRICE_VERIFY, PHOTO_UPLOAD, RECEIPT_SCAN
 */

import { PrismaClient, ChallengeType } from '@prisma/client';

const prisma = new PrismaClient();

export interface ChallengeCondition {
  type: string;
  count: number;
}

export interface Challenge {
  id: string;
  code: string;
  name: string;
  description: string;
  type: ChallengeType;
  condition: ChallengeCondition;
  reward: number;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
}

export interface UserChallenge {
  challenge: Challenge;
  progress: number;
  progressMax: number;
  completed: boolean;
  completedAt?: Date;
}

// Weekly challenge templates (code must be stable for upsert)
const WEEKLY_CHALLENGE_TEMPLATES = [
  { code: 'weekly_scan_10',     name: 'Scanner 10 tickets',     description: 'Scannez 10 tickets de caisse cette semaine',         conditionType: 'receipts_scanned',  target: 10, reward: 100 },
  { code: 'weekly_verify_20',   name: 'Vérifier 20 prix',        description: 'Vérifiez 20 prix cette semaine',                     conditionType: 'prices_verified',   target: 20, reward: 75  },
  { code: 'weekly_photos_5',    name: 'Uploader 5 photos',       description: 'Partagez 5 photos de rayons cette semaine',          conditionType: 'photos_uploaded',   target: 5,  reward: 50  },
  { code: 'weekly_report_3',    name: 'Signaler 3 prix',         description: 'Signalez 3 nouvelles observations de prix',          conditionType: 'prices_reported',   target: 3,  reward: 50  },
];

// Daily challenge templates
const DAILY_CHALLENGE_TEMPLATES = [
  { code: 'daily_scan',    name: 'Scanner du jour',          description: "Scannez un ticket aujourd'hui",    conditionType: 'receipts_scanned', target: 1, reward: 20 },
  { code: 'daily_verify',  name: 'Vérification quotidienne', description: 'Vérifiez 3 prix aujourd\'hui',     conditionType: 'prices_verified',  target: 3, reward: 15 },
];

/**
 * Upsert weekly challenges for the current week.
 */
export async function generateWeeklyChallenges(): Promise<Challenge[]> {
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay() + 1); // Monday
  startOfWeek.setHours(0, 0, 0, 0);

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 7);

  const challenges: Challenge[] = [];

  for (const template of WEEKLY_CHALLENGE_TEMPLATES) {
    const challenge = await prisma.challenge.upsert({
      where: { code: template.code },
      update: {
        startDate: startOfWeek,
        endDate: endOfWeek,
        isActive: true,
      },
      create: {
        code: template.code,
        name: template.name,
        description: template.description,
        type: 'WEEKLY',
        startDate: startOfWeek,
        endDate: endOfWeek,
        target: template.target,
        reward: template.reward,
        isActive: true,
      },
    });

    challenges.push({
      id: challenge.id,
      code: challenge.code,
      name: challenge.name,
      description: challenge.description,
      type: challenge.type,
      condition: { type: template.conditionType, count: challenge.target },
      reward: challenge.reward,
      startDate: challenge.startDate,
      endDate: challenge.endDate,
      isActive: challenge.isActive,
    });
  }

  return challenges;
}

/**
 * Upsert daily challenges for today.
 */
export async function generateDailyChallenges(): Promise<Challenge[]> {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfDay = new Date(startOfDay);
  endOfDay.setDate(startOfDay.getDate() + 1);

  const challenges: Challenge[] = [];

  for (const template of DAILY_CHALLENGE_TEMPLATES) {
    const challenge = await prisma.challenge.upsert({
      where: { code: template.code },
      update: {
        startDate: startOfDay,
        endDate: endOfDay,
        isActive: true,
      },
      create: {
        code: template.code,
        name: template.name,
        description: template.description,
        type: 'DAILY',
        startDate: startOfDay,
        endDate: endOfDay,
        target: template.target,
        reward: template.reward,
        isActive: true,
      },
    });

    challenges.push({
      id: challenge.id,
      code: challenge.code,
      name: challenge.name,
      description: challenge.description,
      type: challenge.type,
      condition: { type: template.conditionType, count: challenge.target },
      reward: challenge.reward,
      startDate: challenge.startDate,
      endDate: challenge.endDate,
      isActive: challenge.isActive,
    });
  }

  return challenges;
}

/** Resolve which conditionType a challenge uses (from its template). */
function resolveConditionType(challengeCode: string): string {
  const allTemplates = [...WEEKLY_CHALLENGE_TEMPLATES, ...DAILY_CHALLENGE_TEMPLATES];
  return allTemplates.find(t => t.code === challengeCode)?.conditionType ?? 'unknown';
}

/**
 * Get active challenges for a user and return their progress.
 */
export async function getActiveChallenges(userId: string): Promise<UserChallenge[]> {
  const now = new Date();

  const activeChallenges = await prisma.challenge.findMany({
    where: {
      isActive: true,
      startDate: { lte: now },
      endDate: { gte: now },
    },
  });

  const userChallenges: UserChallenge[] = [];

  for (const challenge of activeChallenges) {
    // Get or create userChallenge record
    let uc = await prisma.userChallenge.findUnique({
      where: { userId_challengeCode: { userId, challengeCode: challenge.code } },
    });

    if (!uc) {
      uc = await prisma.userChallenge.create({
        data: { userId, challengeCode: challenge.code, progress: 0 },
      });
    }

    // Recalculate current progress from pointsTransaction log
    const conditionType = resolveConditionType(challenge.code);
    const currentProgress = await calculateChallengeProgress(userId, conditionType, challenge.startDate);

    // Update progress if it changed and challenge is not yet completed
    if (currentProgress !== uc.progress && !uc.completed) {
      const nowCompleted = currentProgress >= challenge.target;
      uc = await prisma.userChallenge.update({
        where: { id: uc.id },
        data: {
          progress: currentProgress,
          completed: nowCompleted,
          completedAt: nowCompleted ? new Date() : undefined,
        },
      });
    }

    userChallenges.push({
      challenge: {
        id: challenge.id,
        code: challenge.code,
        name: challenge.name,
        description: challenge.description,
        type: challenge.type,
        condition: { type: conditionType, count: challenge.target },
        reward: challenge.reward,
        startDate: challenge.startDate,
        endDate: challenge.endDate,
        isActive: challenge.isActive,
      },
      progress: uc.progress,
      progressMax: challenge.target,
      completed: uc.completed,
      completedAt: uc.completedAt ?? undefined,
    });
  }

  return userChallenges;
}

/**
 * Calculate how many times a user has performed an action since startDate
 * by counting relevant pointsTransaction records.
 */
async function calculateChallengeProgress(
  userId: string,
  conditionType: string,
  startDate: Date
): Promise<number> {
  // Map conditionType → PointAction(s)
  const actionMap: Record<string, string[]> = {
    receipts_scanned: ['RECEIPT_SCAN'],
    prices_verified:  ['PRICE_VERIFY'],
    photos_uploaded:  ['PHOTO_UPLOAD'],
    prices_reported:  ['PRICE_REPORT'],
  };

  const actions = actionMap[conditionType];
  if (!actions) return 0;

  return prisma.pointsTransaction.count({
    where: {
      userId,
      action: { in: actions as never[] },
      createdAt: { gte: startDate },
    },
  });
}

/**
 * Increment challenge progress for a user based on an action string.
 * This is called after a user performs an action.
 */
export async function updateChallengeProgress(userId: string, action: string): Promise<void> {
  const activeChallenges = await getActiveChallenges(userId);

  // Map action strings to conditionTypes
  const actionToCondition: Record<string, string> = {
    PRICE_REPORT: 'prices_reported',
    PRICE_VERIFY: 'prices_verified',
    PHOTO_UPLOAD: 'photos_uploaded',
    RECEIPT_SCAN: 'receipts_scanned',
  };

  const conditionType = actionToCondition[action];
  if (!conditionType) return;

  for (const uc of activeChallenges) {
    if (uc.completed) continue;
    if (uc.challenge.condition.type !== conditionType) continue;

    const newProgress = uc.progress + 1;
    const isCompleted = newProgress >= uc.progressMax;

    await prisma.userChallenge.update({
      where: { userId_challengeCode: { userId, challengeCode: uc.challenge.code } },
      data: {
        progress: newProgress,
        completed: isCompleted,
        completedAt: isCompleted ? new Date() : undefined,
      },
    });
  }
}

/**
 * Get completed challenges for a user.
 */
export async function getCompletedChallenges(userId: string): Promise<UserChallenge[]> {
  const completedUC = await prisma.userChallenge.findMany({
    where: { userId, completed: true },
    orderBy: { completedAt: 'desc' },
  });

  const userChallenges: UserChallenge[] = [];

  for (const uc of completedUC) {
    const challenge = await prisma.challenge.findUnique({
      where: { code: uc.challengeCode },
    });
    if (!challenge) continue;

    const conditionType = resolveConditionType(challenge.code);

    userChallenges.push({
      challenge: {
        id: challenge.id,
        code: challenge.code,
        name: challenge.name,
        description: challenge.description,
        type: challenge.type,
        condition: { type: conditionType, count: challenge.target },
        reward: challenge.reward,
        startDate: challenge.startDate,
        endDate: challenge.endDate,
        isActive: challenge.isActive,
      },
      progress: uc.progress,
      progressMax: challenge.target,
      completed: uc.completed,
      completedAt: uc.completedAt ?? undefined,
    });
  }

  return userChallenges;
}

