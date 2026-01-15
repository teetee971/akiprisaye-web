/**
 * Configuration des badges de gamification
 * A KI PRI SA YÉ - Version 1.0.0
 */

import { Badge, BadgeType } from '../types/credits.js';

/**
 * Définition de tous les badges disponibles
 */
export const BADGES: Record<BadgeType, Badge> = {
  [BadgeType.WATER_GUARDIAN]: {
    type: BadgeType.WATER_GUARDIAN,
    name: 'Gardien de l\'Eau',
    description: '50 signalements eau effectués',
    icon: '💧',
    rarity: 'common',
    creditReward: 100,
    requirements: {
      contributions: 50,
    },
  },
  
  [BadgeType.PRICE_HUNTER]: {
    type: BadgeType.PRICE_HUNTER,
    name: 'Chasseur de Prix',
    description: '100 contributions prix effectuées',
    icon: '🎯',
    rarity: 'common',
    creditReward: 150,
    requirements: {
      contributions: 100,
    },
  },
  
  [BadgeType.CYCLONE_HERO]: {
    type: BadgeType.CYCLONE_HERO,
    name: 'Héros Cyclonique',
    description: 'Checklist complète + 5 signalements cyclone',
    icon: '🌪️',
    rarity: 'rare',
    creditReward: 250,
    requirements: {
      contributions: 5,
    },
  },
  
  [BadgeType.CREDIT_MILLIONAIRE]: {
    type: BadgeType.CREDIT_MILLIONAIRE,
    name: 'Millionnaire Crédits',
    description: '1000 crédits gagnés au total',
    icon: '💰',
    rarity: 'rare',
    creditReward: 200,
    requirements: {
      credits: 1000,
    },
  },
  
  [BadgeType.GENEROUS_DONOR]: {
    type: BadgeType.GENEROUS_DONOR,
    name: 'Donateur Généreux',
    description: '500 crédits donnés aux ONG',
    icon: '❤️',
    rarity: 'epic',
    creditReward: 300,
    requirements: {
      credits: 500,
    },
  },
  
  [BadgeType.COMMUNITY_LEADER]: {
    type: BadgeType.COMMUNITY_LEADER,
    name: 'Leader Communautaire',
    description: '500 contributions effectuées',
    icon: '👑',
    rarity: 'epic',
    creditReward: 500,
    requirements: {
      contributions: 500,
    },
  },
  
  [BadgeType.EARLY_ADOPTER]: {
    type: BadgeType.EARLY_ADOPTER,
    name: 'Early Adopter',
    description: 'Parmi les 1000 premiers utilisateurs',
    icon: '🌟',
    rarity: 'legendary',
    creditReward: 1000,
    requirements: {},
  },
  
  [BadgeType.REFERRAL_MASTER]: {
    type: BadgeType.REFERRAL_MASTER,
    name: 'Maître du Parrainage',
    description: '10 parrainages réussis',
    icon: '🤝',
    rarity: 'rare',
    creditReward: 350,
    requirements: {
      referrals: 10,
    },
  },
  
  [BadgeType.DATA_SCIENTIST]: {
    type: BadgeType.DATA_SCIENTIST,
    name: 'Data Scientist',
    description: '100 contributions vérifiées par admin',
    icon: '📊',
    rarity: 'epic',
    creditReward: 400,
    requirements: {
      verifiedContributions: 100,
    },
  },
  
  [BadgeType.PHOTO_PRO]: {
    type: BadgeType.PHOTO_PRO,
    name: 'Photographe Pro',
    description: '50 photos proof validées',
    icon: '📸',
    rarity: 'common',
    creditReward: 100,
    requirements: {
      contributions: 50,
    },
  },
  
  [BadgeType.LOCAL_HERO_GP]: {
    type: BadgeType.LOCAL_HERO_GP,
    name: 'Héros Local Guadeloupe',
    description: '100 contributions en Guadeloupe',
    icon: '🇬🇵',
    rarity: 'rare',
    creditReward: 200,
    requirements: {
      contributions: 100,
      territory: '971',
    },
  },
  
  [BadgeType.LOCAL_HERO_MQ]: {
    type: BadgeType.LOCAL_HERO_MQ,
    name: 'Héros Local Martinique',
    description: '100 contributions en Martinique',
    icon: '🇲🇶',
    rarity: 'rare',
    creditReward: 200,
    requirements: {
      contributions: 100,
      territory: '972',
    },
  },
  
  [BadgeType.LOCAL_HERO_GF]: {
    type: BadgeType.LOCAL_HERO_GF,
    name: 'Héros Local Guyane',
    description: '100 contributions en Guyane',
    icon: '🇬🇫',
    rarity: 'rare',
    creditReward: 200,
    requirements: {
      contributions: 100,
      territory: '973',
    },
  },
  
  [BadgeType.LOCAL_HERO_RE]: {
    type: BadgeType.LOCAL_HERO_RE,
    name: 'Héros Local Réunion',
    description: '100 contributions à La Réunion',
    icon: '🇷🇪',
    rarity: 'rare',
    creditReward: 200,
    requirements: {
      contributions: 100,
      territory: '974',
    },
  },
  
  [BadgeType.LOCAL_HERO_YT]: {
    type: BadgeType.LOCAL_HERO_YT,
    name: 'Héros Local Mayotte',
    description: '100 contributions à Mayotte',
    icon: '🇾🇹',
    rarity: 'rare',
    creditReward: 200,
    requirements: {
      contributions: 100,
      territory: '976',
    },
  },
};

/**
 * Helper pour récupérer un badge par type
 */
export function getBadge(type: BadgeType): Badge | undefined {
  return BADGES[type];
}

/**
 * Helper pour récupérer tous les badges
 */
export function getAllBadges(): Badge[] {
  return Object.values(BADGES);
}

/**
 * Helper pour récupérer les badges par rareté
 */
export function getBadgesByRarity(rarity: Badge['rarity']): Badge[] {
  return Object.values(BADGES).filter(badge => badge.rarity === rarity);
}
