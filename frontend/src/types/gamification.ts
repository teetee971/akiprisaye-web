/**
 * Gamification System Types
 * TypeScript definitions for the gamification system
 */

export interface Level {
  level: number;
  name: string;
  minXP: number;
  maxXP: number;
  icon: string;
  color: string;
}

export interface UserProfile {
  userId: string;
  username?: string;
  totalXP: number;
  totalPoints?: number;
  level: number;
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: string;
  badges: string[];
  completedChallenges: string[];
  stats: {
    totalScans: number;
    totalComparisons: number;
    totalContributions: number;
    territoriesVisited: string[];
    activeDays: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface PointsHistory {
  id: string;
  userId: string;
  points: number;
  action: string;
  metadata?: Record<string, any>;
  timestamp: string;
}

export interface PointsSummary {
  totalPoints: number;
  todayPoints: number;
  weekPoints: number;
  monthPoints: number;
  topActions: Array<{
    action: string;
    count: number;
    totalPoints: number;
  }>;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'scan' | 'contribution' | 'social' | 'streak' | 'special';
  tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
  requirement: {
    type: string;
    threshold: number;
  };
  xpReward: number;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  unlockedBy?: string[];
}

export interface UserBadge extends Badge {
  unlockedAt?: string;
  progress?: number;
  isUnlocked: boolean;
}

export interface BadgeProgress {
  badgeId: string;
  currentProgress: number;
  targetProgress: number;
  percentage: number;
  isUnlocked: boolean;
  unlockedAt?: string;
}

export interface Challenge {
  id: string;
  name: string;
  description: string;
  type: 'daily' | 'weekly' | 'monthly' | 'special';
  category: string;
  requirement: {
    action: string;
    count: number;
  };
  xpReward: number;
  badgeReward?: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

export interface UserChallenge extends Challenge {
  progress: number;
  isCompleted: boolean;
  completedAt?: string;
  claimedAt?: string;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  totalXP: number;
  level: number;
  territory?: string;
  badges?: number;
  avatar?: string;
}

export interface LeaderboardFilters {
  period?: 'all_time' | 'monthly' | 'weekly';
  territory?: string;
  limit?: number;
}

export interface UserRank {
  userId: string;
  rank: number;
  totalXP: number;
  percentile: number;
}

export interface DashboardData {
  profile: UserProfile;
  recentPoints: PointsHistory[];
  activeChallenges: UserChallenge[];
  recentBadges: UserBadge[];
  leaderboardPosition: UserRank;
}

export type XPGainSource =
  | 'scan'
  | 'comparison'
  | 'contribution'
  | 'badge'
  | 'challenge'
  | 'streak'
  | 'social';

export interface XPGainEvent {
  points: number;
  source: XPGainSource;
  message: string;
  timestamp: number;
  metadata?: Record<string, any>;
}

export interface StreakInfo {
  userId: string;
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: string;
  todayCompleted: boolean;
  streakMultiplier: number;
}

export const LEVELS: Level[] = [
  { level: 1, name: 'Débutant', minXP: 0, maxXP: 99, icon: '🌱', color: '#94a3b8' },
  { level: 2, name: 'Apprenti', minXP: 100, maxXP: 249, icon: '🌿', color: '#84cc16' },
  { level: 3, name: 'Initié', minXP: 250, maxXP: 499, icon: '🌳', color: '#22c55e' },
  { level: 5, name: 'Contributeur', minXP: 500, maxXP: 999, icon: '📝', color: '#14b8a6' },
  { level: 10, name: 'Actif', minXP: 1000, maxXP: 1999, icon: '🔥', color: '#f59e0b' },
  { level: 15, name: 'Confirmé', minXP: 2000, maxXP: 4999, icon: '⚡', color: '#eab308' },
  { level: 20, name: 'Expert', minXP: 5000, maxXP: 9999, icon: '💎', color: '#3b82f6' },
  { level: 25, name: 'Vétéran', minXP: 10000, maxXP: 19999, icon: '🏅', color: '#8b5cf6' },
  { level: 30, name: 'Maître', minXP: 20000, maxXP: 29999, icon: '🏆', color: '#a855f7' },
  { level: 40, name: 'Champion', minXP: 30000, maxXP: 49999, icon: '🌟', color: '#ec4899' },
  { level: 50, name: 'Légende', minXP: 50000, maxXP: Infinity, icon: '👑', color: '#f43f5e' },
];
