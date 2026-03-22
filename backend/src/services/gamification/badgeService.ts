/**
 * Badge Service - Manages badges and badge unlocking.
 * Aligned with Prisma schema: badge and userBadge models.
 *
 * Schema facts:
 * - badge: id, code (unique), name, description, category (BadgeCategory),
 *          rarity (BadgeRarity), iconUrl, points, requirement (Json), isActive
 * - userBadge: id, userId, badgeCode, badgeType, earnedAt
 *   @@unique([userId, badgeCode])
 * - BadgeCategory: CONTRIBUTOR | EXPLORER | EXPERT | SOCIAL | SPECIAL
 * - BadgeRarity: COMMON | RARE | EPIC | LEGENDARY
 * - userGamification: totalPoints, level, currentStreak, priceReportsCount,
 *                     verificationsCount, photosCount, receiptsCount
 *   (no relations — linked only via userId string)
 */

import { PrismaClient, BadgeCategory, BadgeRarity, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

export interface BadgeCondition {
  type: string;
  count?: number;
  territory?: string;
  rank?: number;
  maxNumber?: number;
  level?: number;
}

export interface Badge {
  id: string;
  code: string;
  name: string;
  description: string;
  iconUrl: string;
  category: BadgeCategory;
  rarity: BadgeRarity;
  condition: BadgeCondition;
  points: number;
}

// CONTRIBUTION → CONTRIBUTOR  |  STREAK → SPECIAL  |  TERRITORY → EXPLORER
// UNCOMMON does not exist in BadgeRarity — nearest is COMMON or RARE
export const BADGES: Badge[] = [
  // Contributor badges
  { code: 'newcomer',        id: 'newcomer',        name: 'Nouveau venu',        description: 'Première contribution',        iconUrl: '🌱', category: 'CONTRIBUTOR', rarity: 'COMMON',    points: 10,   condition: { type: 'contributions', count: 1 } },
  { code: 'price_hunter',   id: 'price_hunter',   name: 'Chasseur de prix',    description: '50 prix soumis',               iconUrl: '🔍', category: 'CONTRIBUTOR', rarity: 'COMMON',    points: 100,  condition: { type: 'prices_reported', count: 50 } },
  { code: 'price_master',   id: 'price_master',   name: 'Maître des prix',     description: '500 prix soumis',              iconUrl: '🎯', category: 'CONTRIBUTOR', rarity: 'RARE',      points: 500,  condition: { type: 'prices_reported', count: 500 } },
  { code: 'sentinel',       id: 'sentinel',       name: 'Sentinelle',          description: '100 prix vérifiés',            iconUrl: '👁️', category: 'CONTRIBUTOR', rarity: 'COMMON',    points: 150,  condition: { type: 'prices_verified', count: 100 } },
  { code: 'pioneer',        id: 'pioneer',        name: 'Pionnier',            description: 'Premier prix dans un magasin', iconUrl: '🚀', category: 'CONTRIBUTOR', rarity: 'RARE',      points: 200,  condition: { type: 'first_in_store', count: 1 } },
  { code: 'explorer',       id: 'explorer',       name: 'Explorateur',         description: '10 photos soumises',           iconUrl: '🧭', category: 'EXPLORER',    rarity: 'COMMON',    points: 100,  condition: { type: 'photos_uploaded', count: 10 } },
  { code: 'cartographer',   id: 'cartographer',   name: 'Cartographe',         description: '50 photos soumises',           iconUrl: '🗺️', category: 'EXPLORER',    rarity: 'EPIC',      points: 500,  condition: { type: 'photos_uploaded', count: 50 } },

  // Streak badges (SPECIAL — schema has no STREAK category)
  { code: 'consistent',     id: 'consistent',     name: 'Régulier',            description: 'Série de 7 jours',             iconUrl: '📅', category: 'SPECIAL',     rarity: 'COMMON',    points: 50,   condition: { type: 'streak_days', count: 7 } },
  { code: 'marathoner',     id: 'marathoner',     name: 'Marathonien',         description: 'Série de 30 jours',            iconUrl: '🏃', category: 'SPECIAL',     rarity: 'RARE',      points: 200,  condition: { type: 'streak_days', count: 30 } },
  { code: 'unstoppable',    id: 'unstoppable',    name: 'Inarrêtable',         description: 'Série de 100 jours',           iconUrl: '💪', category: 'SPECIAL',     rarity: 'EPIC',      points: 1000, condition: { type: 'streak_days', count: 100 } },
  { code: 'dedicated',      id: 'dedicated',      name: 'Dévoué',              description: 'Série de 365 jours',           iconUrl: '🔥', category: 'SPECIAL',     rarity: 'LEGENDARY', points: 5000, condition: { type: 'streak_days', count: 365 } },

  // Social badges
  { code: 'ambassador',     id: 'ambassador',     name: 'Ambassadeur',         description: '5 parrainages',               iconUrl: '🤝', category: 'SOCIAL',      rarity: 'RARE',      points: 300,  condition: { type: 'receipts_scanned', count: 5 } },
  { code: 'influencer',     id: 'influencer',     name: 'Influenceur',         description: '25 parrainages',              iconUrl: '📣', category: 'SOCIAL',      rarity: 'EPIC',      points: 1000, condition: { type: 'receipts_scanned', count: 25 } },
  { code: 'helpful',        id: 'helpful',        name: 'Serviable',           description: '50 vérifications utiles',      iconUrl: '🙏', category: 'SOCIAL',      rarity: 'COMMON',    points: 100,  condition: { type: 'prices_verified', count: 50 } },

  // Territory badges (EXPLORER — schema has no TERRITORY category)
  { code: 'local_expert_gp', id: 'local_expert_gp', name: 'Expert Guadeloupe', description: 'Top contributeur en Guadeloupe', iconUrl: '🏝️', category: 'EXPLORER', rarity: 'RARE', points: 250, condition: { type: 'territory_rank', territory: 'GP', rank: 10 } },
  { code: 'local_expert_mq', id: 'local_expert_mq', name: 'Expert Martinique', description: 'Top contributeur en Martinique', iconUrl: '🏝️', category: 'EXPLORER', rarity: 'RARE', points: 250, condition: { type: 'territory_rank', territory: 'MQ', rank: 10 } },
  { code: 'local_expert_gf', id: 'local_expert_gf', name: 'Expert Guyane',     description: 'Top contributeur en Guyane',     iconUrl: '🌴', category: 'EXPLORER', rarity: 'RARE', points: 250, condition: { type: 'territory_rank', territory: 'GF', rank: 10 } },
  { code: 'local_expert_re', id: 'local_expert_re', name: 'Expert Réunion',    description: 'Top contributeur à La Réunion',  iconUrl: '🌋', category: 'EXPLORER', rarity: 'RARE', points: 250, condition: { type: 'territory_rank', territory: 'RE', rank: 10 } },
  { code: 'local_expert_yt', id: 'local_expert_yt', name: 'Expert Mayotte',    description: 'Top contributeur à Mayotte',     iconUrl: '🐢', category: 'EXPLORER', rarity: 'RARE', points: 250, condition: { type: 'territory_rank', territory: 'YT', rank: 10 } },

  // Special badges
  { code: 'detective',      id: 'detective',      name: 'Détective',           description: '10 anomalies signalées',       iconUrl: '🕵️', category: 'SPECIAL',  rarity: 'RARE',      points: 200,  condition: { type: 'anomalies_reported', count: 10 } },
  { code: 'early_adopter',  id: 'early_adopter',  name: 'Early Adopter',       description: 'Inscrit dans les 1000 premiers', iconUrl: '⏰', category: 'SPECIAL', rarity: 'EPIC',      points: 500,  condition: { type: 'user_number', maxNumber: 1000 } },
  { code: 'beta_tester',    id: 'beta_tester',    name: 'Beta Testeur',        description: 'A participé à la beta',        iconUrl: '🧪', category: 'SPECIAL',  rarity: 'RARE',      points: 300,  condition: { type: 'beta_participant' } },
  { code: 'legend',         id: 'legend',         name: 'Légende',             description: 'Niveau 50 atteint',            iconUrl: '👑', category: 'SPECIAL',  rarity: 'LEGENDARY', points: 2000, condition: { type: 'level', level: 50 } },
];

export interface UserBadge {
  badge: Badge;
  earnedAt: Date;
}

export interface BadgeProgress {
  badge: Badge;
  progress: number;
  progressMax: number;
  isUnlocked: boolean;
  progressPercent: number;
}

/**
 * Initialize (upsert) badges in the database from the BADGES catalogue.
 */
export async function initializeBadges(): Promise<void> {
  for (const badge of BADGES) {
    await prisma.badge.upsert({
      where: { code: badge.code },
      update: {
        name: badge.name,
        description: badge.description,
        iconUrl: badge.iconUrl,
        category: badge.category,
        rarity: badge.rarity,
        points: badge.points,
        requirement: badge.condition as unknown as Prisma.InputJsonValue,
      },
      create: {
        code: badge.code,
        name: badge.name,
        description: badge.description,
        iconUrl: badge.iconUrl,
        category: badge.category,
        rarity: badge.rarity,
        points: badge.points,
        requirement: badge.condition as unknown as Prisma.InputJsonValue,
        isActive: true,
      },
    });
  }
}

/**
 * Check if a user meets the condition for a badge.
 */
async function checkBadgeCondition(
  userId: string,
  badge: Badge
): Promise<{ met: boolean; progress: number; max: number }> {
  const ug = await prisma.userGamification.findUnique({ where: { userId } });

  if (!ug) {
    return { met: false, progress: 0, max: badge.condition.count || 1 };
  }

  const { type, count = 1 } = badge.condition;

  switch (type) {
    case 'contributions': {
      const total = ug.priceReportsCount + ug.verificationsCount;
      return { met: total >= count, progress: total, max: count };
    }
    case 'prices_reported':
      return { met: ug.priceReportsCount >= count, progress: ug.priceReportsCount, max: count };
    case 'prices_verified':
      return { met: ug.verificationsCount >= count, progress: ug.verificationsCount, max: count };
    case 'photos_uploaded':
      return { met: ug.photosCount >= count, progress: ug.photosCount, max: count };
    case 'receipts_scanned':
      return { met: ug.receiptsCount >= count, progress: ug.receiptsCount, max: count };
    case 'streak_days':
      return { met: ug.currentStreak >= count, progress: ug.currentStreak, max: count };
    case 'level': {
      const required = badge.condition.level || 1;
      return { met: ug.level >= required, progress: ug.level, max: required };
    }
    case 'first_in_store':
    case 'territory_rank':
    case 'user_number':
    case 'beta_participant':
    case 'anomalies_reported':
      // Requires external event-driven awarding; not derivable from userGamification counters
      return { met: false, progress: 0, max: 1 };
    default:
      return { met: false, progress: 0, max: 1 };
  }
}

/**
 * Check all badges for a user and award newly earned ones.
 */
export async function checkAndAwardBadges(userId: string): Promise<Badge[]> {
  const newlyEarned: Badge[] = [];

  // Fetch already-earned badge codes for this user
  const earned = await prisma.userBadge.findMany({ where: { userId } });
  const earnedCodes = new Set(earned.map(ub => ub.badgeCode));

  for (const badge of BADGES) {
    if (earnedCodes.has(badge.code)) continue;

    const { met } = await checkBadgeCondition(userId, badge);

    if (met) {
      await prisma.userBadge.create({
        data: {
          userId,
          badgeCode: badge.code,
          badgeType: badge.category,
        },
      });
      newlyEarned.push(badge);
    }
  }

  return newlyEarned;
}

/**
 * Get all badges earned by a user.
 */
export async function getUserBadges(userId: string): Promise<UserBadge[]> {
  const userBadges = await prisma.userBadge.findMany({
    where: { userId },
    orderBy: { earnedAt: 'desc' },
  });

  return userBadges
    .map(ub => {
      const badge = BADGES.find(b => b.code === ub.badgeCode);
      if (!badge) return null;
      return { badge, earnedAt: ub.earnedAt };
    })
    .filter((ub): ub is UserBadge => ub !== null);
}

/**
 * Return the full badge catalogue.
 */
export function getAllBadges(): Badge[] {
  return BADGES;
}

/**
 * Get progress towards a specific badge for a user.
 */
export async function getBadgeProgress(userId: string, badgeCode: string): Promise<BadgeProgress | null> {
  const badge = BADGES.find(b => b.code === badgeCode);
  if (!badge) return null;

  const isUnlocked = !!(await prisma.userBadge.findUnique({
    where: { userId_badgeCode: { userId, badgeCode } },
  }));

  if (isUnlocked) {
    return {
      badge,
      progress: badge.condition.count || 1,
      progressMax: badge.condition.count || 1,
      isUnlocked: true,
      progressPercent: 100,
    };
  }

  const { progress, max } = await checkBadgeCondition(userId, badge);
  return {
    badge,
    progress,
    progressMax: max,
    isUnlocked: false,
    progressPercent: Math.min(100, max > 0 ? (progress / max) * 100 : 0),
  };
}

/**
 * Get badges filtered by category.
 */
export function getBadgesByCategory(category: BadgeCategory): Badge[] {
  return BADGES.filter(b => b.category === category);
}

/**
 * Get badges filtered by rarity.
 */
export function getBadgesByRarity(rarity: BadgeRarity): Badge[] {
  return BADGES.filter(b => b.rarity === rarity);
}

