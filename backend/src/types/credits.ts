/**
 * Types pour le système de crédits, analytics et gamification
 * A KI PRI SA YÉ - Version 1.0.0
 */

export interface CreditTransaction {
  id: string;
  userId: string;
  type: 'earn' | 'spend' | 'redeem' | 'bonus' | 'refund';
  amount: number; // Peut être négatif pour spend
  
  source: {
    type: 'contribution' | 'purchase' | 'bonus' | 'referral' | 'marketplace' | 'redistribution';
    contributionType?: string; // water_report, price_contribution, etc.
    contributionId?: string;
    verified: boolean; // Contribution vérifiée = bonus crédits
  };
  
  description: string;
  metadata?: Record<string, unknown>;
  
  balance: number; // Balance après transaction
  createdAt: Date;
}

export interface CreditBalance {
  userId: string;
  total: number;
  pending: number; // Contributions non vérifiées
  lifetime: number; // Total gagné depuis début
  redeemed: number; // Total échangé
  updatedAt: Date;
}

export interface MarketplaceOffer {
  id: string;
  type: 'premium_subscription' | 'donation' | 'partner_product' | 'cash' | 'other';
  name: string;
  description: string;
  imageUrl?: string;
  
  creditCost: number;
  monetaryValue: number; // Valeur en centimes
  
  available: boolean;
  stock?: number; // Si limité
  
  partnerId?: string;
  donationTarget?: string; // ONG bénéficiaire
  
  createdAt: Date;
  expiresAt?: Date;
}

export interface MarketplacePurchase {
  id: string;
  userId: string;
  offerId: string;
  creditCost: number;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  fulfillmentData?: Record<string, unknown>;
  createdAt: Date;
  completedAt?: Date;
}

export interface Redemption {
  id: string;
  userId: string;
  credits: number;
  monetaryValue: number;
  method: 'bank_transfer' | 'paypal' | 'donation';
  details: Record<string, unknown>;
  status: 'pending' | 'processing' | 'completed' | 'rejected';
  createdAt: Date;
  processedAt?: Date;
  paidAt?: Date;
  processingNotes?: string;
}

export interface EarningsStats {
  currentBalance: number;
  lifetimeEarned: number;
  lifetimeRedeemed: number;
  byContributionType: Record<string, number>;
  averagePerContribution: number;
}

// ==========================================
// GAMIFICATION
// ==========================================

export enum BadgeType {
  // Contributions
  WATER_GUARDIAN = 'water_guardian', // 50 signalements eau
  PRICE_HUNTER = 'price_hunter', // 100 contributions prix
  CYCLONE_HERO = 'cyclone_hero', // Checklist complète + 5 signalements
  
  // Crédits
  CREDIT_MILLIONAIRE = 'credit_millionaire', // 1000 crédits gagnés
  GENEROUS_DONOR = 'generous_donor', // 500 crédits donnés
  
  // Engagement
  COMMUNITY_LEADER = 'community_leader', // 500 contributions
  EARLY_ADOPTER = 'early_adopter', // Inscrit premiers 1000 users
  REFERRAL_MASTER = 'referral_master', // 10 parrainages
  
  // Qualité
  DATA_SCIENTIST = 'data_scientist', // 100 contributions vérifiées
  PHOTO_PRO = 'photo_pro', // 50 photos proof
  
  // Territoires
  LOCAL_HERO_GP = 'local_hero_gp', // 100 contributions Guadeloupe
  LOCAL_HERO_MQ = 'local_hero_mq', // 100 contributions Martinique
  LOCAL_HERO_GF = 'local_hero_gf', // 100 contributions Guyane
  LOCAL_HERO_RE = 'local_hero_re', // 100 contributions Réunion
  LOCAL_HERO_YT = 'local_hero_yt', // 100 contributions Mayotte
}

export interface Badge {
  type: BadgeType;
  name: string;
  description: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  creditReward: number;
  requirements: {
    contributions?: number;
    credits?: number;
    referrals?: number;
    verifiedContributions?: number;
    territory?: string;
  };
}

export interface UserBadge {
  id: string;
  userId: string;
  badgeType: string;
  earnedAt: Date;
  metadata?: Record<string, unknown>;
}

export interface LeaderboardEntry {
  userId: string;
  username: string;
  avatar?: string;
  territory?: string;
  credits: number;
  contributions: number;
  badges: number;
  rank: number;
}

export interface UserProgress {
  level: number;
  currentCredits: number;
  lifetimeCredits: number;
  totalContributions: number;
  badgesUnlocked: number;
  nextBadges: Array<{
    badge: Badge;
    progress: number; // 0-100%
  }>;
  rank?: number;
}

// ==========================================
// ANALYTICS (PRO/INSTITUTIONAL)
// ==========================================

export interface MarketOverview {
  territory: string;
  sector: string;
  period: DateRange;
  
  priceIndex: number;
  priceChange: number;
  
  volatility: number;
  
  topExpensiveProducts: ProductSummary[];
  topAffordableProducts: ProductSummary[];
  
  contributionsCount: number;
  activeContributors: number;
  
  insights: string[];
}

export interface ProductSummary {
  id: string;
  name: string;
  category: string;
  averagePrice: number;
  priceChange?: number;
}

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

export interface MarketShareData {
  sector: string;
  territory: string;
  shares: Array<{
    brand: string;
    mentions: number;
    estimatedShare: number;
    trend: 'up' | 'down' | 'stable';
  }>;
  dataQuality: 'low' | 'medium' | 'high';
}

export interface TimeSeriesData {
  category: string;
  territory: string;
  period: number; // months
  data: Array<{
    date: string;
    average: number;
    min: number;
    max: number;
    count: number;
  }>;
  trend: 'up' | 'down' | 'stable';
  seasonality?: string;
}

export interface SentimentAnalysis {
  brand: string;
  territory: string;
  period: string;
  averageRating: number;
  distribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
  totalReviews: number;
  sentimentScore: number; // -1 à +1
  topKeywords: string[];
  trend: 'improving' | 'declining' | 'stable';
}

export interface Report {
  id: string;
  userId: string;
  title: string;
  createdAt: Date;
  sections: unknown[];
  pdfUrl?: string;
}

export interface ReportConfig {
  title: string;
  sections: Array<{
    type: string;
    params: unknown[];
  }>;
}

// ==========================================
// ERRORS
// ==========================================

export class InsufficientCreditsError extends Error {
  constructor(message: string = 'Insufficient credits') {
    super(message);
    this.name = 'InsufficientCreditsError';
  }
}
