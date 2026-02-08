/**
 * Badge Service - Manages badges and badge unlocking
 */

import { PrismaClient, BadgeCategory, BadgeRarity } from '@prisma/client';

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
  name: string;
  description: string;
  icon: string;
  category: BadgeCategory;
  rarity: BadgeRarity;
  condition: BadgeCondition;
  xpReward: number;
}

export const BADGES: Badge[] = [
  // Contribution badges
  { 
    id: 'newcomer', 
    name: 'Nouveau venu', 
    description: 'Première contribution', 
    icon: '🌱', 
    category: 'CONTRIBUTION', 
    rarity: 'COMMON', 
    xpReward: 10, 
    condition: { type: 'contributions', count: 1 } 
  },
  { 
    id: 'price_hunter', 
    name: 'Chasseur de prix', 
    description: '50 prix soumis', 
    icon: '🔍', 
    category: 'CONTRIBUTION', 
    rarity: 'UNCOMMON', 
    xpReward: 100, 
    condition: { type: 'prices_submitted', count: 50 } 
  },
  { 
    id: 'price_master', 
    name: 'Maître des prix', 
    description: '500 prix soumis', 
    icon: '🎯', 
    category: 'CONTRIBUTION', 
    rarity: 'RARE', 
    xpReward: 500, 
    condition: { type: 'prices_submitted', count: 500 } 
  },
  { 
    id: 'sentinel', 
    name: 'Sentinelle', 
    description: '100 prix vérifiés', 
    icon: '👁️', 
    category: 'CONTRIBUTION', 
    rarity: 'UNCOMMON', 
    xpReward: 150, 
    condition: { type: 'prices_verified', count: 100 } 
  },
  { 
    id: 'pioneer', 
    name: 'Pionnier', 
    description: 'Premier prix dans un magasin', 
    icon: '🚀', 
    category: 'CONTRIBUTION', 
    rarity: 'RARE', 
    xpReward: 200, 
    condition: { type: 'first_in_store', count: 1 } 
  },
  { 
    id: 'explorer', 
    name: 'Explorateur', 
    description: '10 magasins différents', 
    icon: '🧭', 
    category: 'CONTRIBUTION', 
    rarity: 'UNCOMMON', 
    xpReward: 100, 
    condition: { type: 'unique_stores', count: 10 } 
  },
  { 
    id: 'cartographer', 
    name: 'Cartographe', 
    description: '50 magasins différents', 
    icon: '🗺️', 
    category: 'CONTRIBUTION', 
    rarity: 'EPIC', 
    xpReward: 500, 
    condition: { type: 'unique_stores', count: 50 } 
  },
  
  // Streak badges
  { 
    id: 'consistent', 
    name: 'Régulier', 
    description: 'Série de 7 jours', 
    icon: '📅', 
    category: 'STREAK', 
    rarity: 'COMMON', 
    xpReward: 50, 
    condition: { type: 'streak_days', count: 7 } 
  },
  { 
    id: 'marathoner', 
    name: 'Marathonien', 
    description: 'Série de 30 jours', 
    icon: '🏃', 
    category: 'STREAK', 
    rarity: 'RARE', 
    xpReward: 200, 
    condition: { type: 'streak_days', count: 30 } 
  },
  { 
    id: 'unstoppable', 
    name: 'Inarrêtable', 
    description: 'Série de 100 jours', 
    icon: '💪', 
    category: 'STREAK', 
    rarity: 'EPIC', 
    xpReward: 1000, 
    condition: { type: 'streak_days', count: 100 } 
  },
  { 
    id: 'dedicated', 
    name: 'Dévoué', 
    description: 'Série de 365 jours', 
    icon: '🔥', 
    category: 'STREAK', 
    rarity: 'LEGENDARY', 
    xpReward: 5000, 
    condition: { type: 'streak_days', count: 365 } 
  },
  
  // Social badges
  { 
    id: 'ambassador', 
    name: 'Ambassadeur', 
    description: '5 parrainages actifs', 
    icon: '🤝', 
    category: 'SOCIAL', 
    rarity: 'RARE', 
    xpReward: 300, 
    condition: { type: 'referrals_active', count: 5 } 
  },
  { 
    id: 'influencer', 
    name: 'Influenceur', 
    description: '25 parrainages actifs', 
    icon: '📣', 
    category: 'SOCIAL', 
    rarity: 'EPIC', 
    xpReward: 1000, 
    condition: { type: 'referrals_active', count: 25 } 
  },
  { 
    id: 'helpful', 
    name: 'Serviable', 
    description: '50 vérifications utiles', 
    icon: '🙏', 
    category: 'SOCIAL', 
    rarity: 'UNCOMMON', 
    xpReward: 100, 
    condition: { type: 'helpful_verifications', count: 50 } 
  },
  
  // Territory badges
  { 
    id: 'local_expert_gp', 
    name: 'Expert Guadeloupe', 
    description: 'Top 10 en Guadeloupe', 
    icon: '🏝️', 
    category: 'TERRITORY', 
    rarity: 'RARE', 
    xpReward: 250, 
    condition: { type: 'territory_rank', territory: 'GP', rank: 10 } 
  },
  { 
    id: 'local_expert_mq', 
    name: 'Expert Martinique', 
    description: 'Top 10 en Martinique', 
    icon: '🏝️', 
    category: 'TERRITORY', 
    rarity: 'RARE', 
    xpReward: 250, 
    condition: { type: 'territory_rank', territory: 'MQ', rank: 10 } 
  },
  { 
    id: 'local_expert_gf', 
    name: 'Expert Guyane', 
    description: 'Top 10 en Guyane', 
    icon: '🌴', 
    category: 'TERRITORY', 
    rarity: 'RARE', 
    xpReward: 250, 
    condition: { type: 'territory_rank', territory: 'GF', rank: 10 } 
  },
  { 
    id: 'local_expert_re', 
    name: 'Expert Réunion', 
    description: 'Top 10 à La Réunion', 
    icon: '🌋', 
    category: 'TERRITORY', 
    rarity: 'RARE', 
    xpReward: 250, 
    condition: { type: 'territory_rank', territory: 'RE', rank: 10 } 
  },
  { 
    id: 'local_expert_yt', 
    name: 'Expert Mayotte', 
    description: 'Top 10 à Mayotte', 
    icon: '🐢', 
    category: 'TERRITORY', 
    rarity: 'RARE', 
    xpReward: 250, 
    condition: { type: 'territory_rank', territory: 'YT', rank: 10 } 
  },
  
  // Special badges
  { 
    id: 'detective', 
    name: 'Détective', 
    description: '10 anomalies signalées', 
    icon: '🕵️', 
    category: 'SPECIAL', 
    rarity: 'RARE', 
    xpReward: 200, 
    condition: { type: 'anomalies_reported', count: 10 } 
  },
  { 
    id: 'early_adopter', 
    name: 'Early Adopter', 
    description: 'Inscrit dans les 1000 premiers', 
    icon: '⏰', 
    category: 'SPECIAL', 
    rarity: 'EPIC', 
    xpReward: 500, 
    condition: { type: 'user_number', maxNumber: 1000 } 
  },
  { 
    id: 'beta_tester', 
    name: 'Beta Testeur', 
    description: 'A participé à la beta', 
    icon: '🧪', 
    category: 'SPECIAL', 
    rarity: 'RARE', 
    xpReward: 300, 
    condition: { type: 'beta_participant' } 
  },
  { 
    id: 'legend', 
    name: 'Légende', 
    description: 'Niveau 50 atteint', 
    icon: '👑', 
    category: 'SPECIAL', 
    rarity: 'LEGENDARY', 
    xpReward: 2000, 
    condition: { type: 'level', level: 50 } 
  },
];

export interface UserBadge {
  badge: Badge;
  unlockedAt: Date;
  progress?: number;
  progressMax?: number;
}

export interface BadgeProgress {
  badge: Badge;
  progress: number;
  progressMax: number;
  isUnlocked: boolean;
  progressPercent: number;
}

/**
 * Initialize badges in database
 */
export async function initializeBadges(): Promise<void> {
  for (const badge of BADGES) {
    await prisma.badge.upsert({
      where: { id: badge.id },
      update: {
        name: badge.name,
        description: badge.description,
        icon: badge.icon,
        category: badge.category,
        rarity: badge.rarity,
        xpReward: badge.xpReward,
        conditionType: badge.condition.type,
        conditionValue: badge.condition as any
      },
      create: {
        id: badge.id,
        name: badge.name,
        description: badge.description,
        icon: badge.icon,
        category: badge.category,
        rarity: badge.rarity,
        xpReward: badge.xpReward,
        conditionType: badge.condition.type,
        conditionValue: badge.condition as any
      }
    });
  }
}

/**
 * Check if user meets badge condition
 */
async function checkBadgeCondition(userId: string, badge: Badge): Promise<{ met: boolean; progress: number; max: number }> {
  const userGamification = await prisma.userGamification.findUnique({
    where: { userId }
  });

  if (!userGamification) {
    return { met: false, progress: 0, max: badge.condition.count || 1 };
  }

  const { type, count = 1 } = badge.condition;

  switch (type) {
    case 'contributions':
      const totalContributions = userGamification.pricesSubmitted + 
                                userGamification.pricesVerified + 
                                userGamification.productsAdded;
      return { met: totalContributions >= count, progress: totalContributions, max: count };

    case 'prices_submitted':
      return { 
        met: userGamification.pricesSubmitted >= count, 
        progress: userGamification.pricesSubmitted, 
        max: count 
      };

    case 'prices_verified':
      return { 
        met: userGamification.pricesVerified >= count, 
        progress: userGamification.pricesVerified, 
        max: count 
      };

    case 'unique_stores':
      return { 
        met: userGamification.storesVisited >= count, 
        progress: userGamification.storesVisited, 
        max: count 
      };

    case 'streak_days':
      return { 
        met: userGamification.currentStreak >= count, 
        progress: userGamification.currentStreak, 
        max: count 
      };

    case 'referrals_active':
      return { 
        met: userGamification.referralsCount >= count, 
        progress: userGamification.referralsCount, 
        max: count 
      };

    case 'helpful_verifications':
      return { 
        met: userGamification.pricesVerified >= count, 
        progress: userGamification.pricesVerified, 
        max: count 
      };

    case 'anomalies_reported':
      return { 
        met: userGamification.anomaliesReported >= count, 
        progress: userGamification.anomaliesReported, 
        max: count 
      };

    case 'level':
      const levelRequired = badge.condition.level || 1;
      return { 
        met: userGamification.currentLevel >= levelRequired, 
        progress: userGamification.currentLevel, 
        max: levelRequired 
      };

    case 'first_in_store':
    case 'territory_rank':
    case 'user_number':
    case 'beta_participant':
      // These require special logic, implemented elsewhere
      return { met: false, progress: 0, max: 1 };

    default:
      return { met: false, progress: 0, max: 1 };
  }
}

/**
 * Check and award badges to user
 */
export async function checkAndAwardBadges(userId: string): Promise<Badge[]> {
  const newlyUnlockedBadges: Badge[] = [];

  // Get user's already unlocked badges
  const userGamification = await prisma.userGamification.findUnique({
    where: { userId },
    include: { badges: true }
  });

  if (!userGamification) {
    return [];
  }

  const unlockedBadgeIds = userGamification.badges.map(ub => ub.badgeId);

  // Check each badge
  for (const badge of BADGES) {
    // Skip if already unlocked
    if (unlockedBadgeIds.includes(badge.id)) {
      continue;
    }

    // Check condition
    const { met } = await checkBadgeCondition(userId, badge);

    if (met) {
      // Award badge
      await prisma.userBadge.create({
        data: {
          userGamificationId: userGamification.id,
          badgeId: badge.id
        }
      });

      newlyUnlockedBadges.push(badge);
    }
  }

  return newlyUnlockedBadges;
}

/**
 * Get user's badges
 */
export async function getUserBadges(userId: string): Promise<UserBadge[]> {
  const userGamification = await prisma.userGamification.findUnique({
    where: { userId },
    include: {
      badges: {
        include: {
          badge: true
        },
        orderBy: {
          unlockedAt: 'desc'
        }
      }
    }
  });

  if (!userGamification) {
    return [];
  }

  return userGamification.badges.map(ub => ({
    badge: {
      id: ub.badge.id,
      name: ub.badge.name,
      description: ub.badge.description,
      icon: ub.badge.icon,
      category: ub.badge.category,
      rarity: ub.badge.rarity,
      xpReward: ub.badge.xpReward,
      condition: ub.badge.conditionValue as BadgeCondition
    },
    unlockedAt: ub.unlockedAt
  }));
}

/**
 * Get all badges
 */
export function getAllBadges(): Badge[] {
  return BADGES;
}

/**
 * Get badge progress for user
 */
export async function getBadgeProgress(userId: string, badgeId: string): Promise<BadgeProgress | null> {
  const badge = BADGES.find(b => b.id === badgeId);
  if (!badge) {
    return null;
  }

  // Check if already unlocked
  const userGamification = await prisma.userGamification.findUnique({
    where: { userId },
    include: {
      badges: {
        where: { badgeId }
      }
    }
  });

  const isUnlocked = (userGamification?.badges.length || 0) > 0;

  if (isUnlocked) {
    return {
      badge,
      progress: badge.condition.count || 1,
      progressMax: badge.condition.count || 1,
      isUnlocked: true,
      progressPercent: 100
    };
  }

  // Get progress
  const { progress, max } = await checkBadgeCondition(userId, badge);

  return {
    badge,
    progress,
    progressMax: max,
    isUnlocked: false,
    progressPercent: Math.min(100, (progress / max) * 100)
  };
}

/**
 * Get badges by category
 */
export function getBadgesByCategory(category: BadgeCategory): Badge[] {
  return BADGES.filter(b => b.category === category);
}

/**
 * Get badges by rarity
 */
export function getBadgesByRarity(rarity: BadgeRarity): Badge[] {
  return BADGES.filter(b => b.rarity === rarity);
}
