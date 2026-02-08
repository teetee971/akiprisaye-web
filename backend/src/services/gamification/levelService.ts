/**
 * Level Service - Manages user level calculation and progression
 */

export interface Level {
  level: number;
  name: string;
  minXP: number;
  maxXP: number;
  icon: string;
  color: string;
  perks: string[];
}

export interface UserLevel {
  currentLevel: Level;
  currentXP: number;
  xpToNextLevel: number;
  progressPercent: number;
  nextLevel: Level | null;
}

export const LEVELS: Level[] = [
  { 
    level: 1, 
    name: 'Débutant', 
    minXP: 0, 
    maxXP: 99, 
    icon: '🌱', 
    color: '#94a3b8', 
    perks: [] 
  },
  { 
    level: 2, 
    name: 'Apprenti', 
    minXP: 100, 
    maxXP: 249, 
    icon: '🌿', 
    color: '#84cc16', 
    perks: [] 
  },
  { 
    level: 3, 
    name: 'Initié', 
    minXP: 250, 
    maxXP: 499, 
    icon: '🌳', 
    color: '#22c55e', 
    perks: [] 
  },
  { 
    level: 5, 
    name: 'Contributeur', 
    minXP: 500, 
    maxXP: 999, 
    icon: '📝', 
    color: '#14b8a6', 
    perks: ['custom_avatar_border'] 
  },
  { 
    level: 10, 
    name: 'Actif', 
    minXP: 1000, 
    maxXP: 1999, 
    icon: '🔥', 
    color: '#f59e0b', 
    perks: ['priority_support'] 
  },
  { 
    level: 15, 
    name: 'Confirmé', 
    minXP: 2000, 
    maxXP: 4999, 
    icon: '⚡', 
    color: '#eab308', 
    perks: ['early_features'] 
  },
  { 
    level: 20, 
    name: 'Expert', 
    minXP: 5000, 
    maxXP: 9999, 
    icon: '💎', 
    color: '#3b82f6', 
    perks: ['beta_tester'] 
  },
  { 
    level: 25, 
    name: 'Vétéran', 
    minXP: 10000, 
    maxXP: 19999, 
    icon: '🏅', 
    color: '#8b5cf6', 
    perks: ['community_moderator'] 
  },
  { 
    level: 30, 
    name: 'Maître', 
    minXP: 20000, 
    maxXP: 29999, 
    icon: '🏆', 
    color: '#a855f7', 
    perks: ['verified_badge'] 
  },
  { 
    level: 40, 
    name: 'Champion', 
    minXP: 30000, 
    maxXP: 49999, 
    icon: '🌟', 
    color: '#ec4899', 
    perks: ['custom_title'] 
  },
  { 
    level: 50, 
    name: 'Légende', 
    minXP: 50000, 
    maxXP: Infinity, 
    icon: '👑', 
    color: '#f43f5e', 
    perks: ['hall_of_fame'] 
  },
];

/**
 * Calculate user level based on XP
 */
export function calculateLevel(xp: number): UserLevel {
  // Find current level
  let currentLevel = LEVELS[0];
  let nextLevel: Level | null = null;
  
  for (let i = 0; i < LEVELS.length; i++) {
    if (xp >= LEVELS[i].minXP && xp <= LEVELS[i].maxXP) {
      currentLevel = LEVELS[i];
      nextLevel = i < LEVELS.length - 1 ? LEVELS[i + 1] : null;
      break;
    }
  }
  
  // Calculate progress to next level
  const xpInCurrentLevel = xp - currentLevel.minXP;
  const xpNeededForLevel = currentLevel.maxXP - currentLevel.minXP + 1;
  const progressPercent = nextLevel 
    ? Math.min(100, (xpInCurrentLevel / xpNeededForLevel) * 100)
    : 100;
  
  const xpToNextLevel = nextLevel 
    ? nextLevel.minXP - xp
    : 0;
  
  return {
    currentLevel,
    currentXP: xp,
    xpToNextLevel,
    progressPercent,
    nextLevel
  };
}

/**
 * Get level by level number
 */
export function getLevelByNumber(levelNumber: number): Level | null {
  return LEVELS.find(l => l.level === levelNumber) || null;
}

/**
 * Get perks for a specific level
 */
export function getLevelPerks(level: number): string[] {
  const levelData = LEVELS.find(l => l.level === level);
  return levelData?.perks || [];
}

/**
 * Get all levels
 */
export function getAllLevels(): Level[] {
  return LEVELS;
}

/**
 * Check if user leveled up
 */
export function checkLevelUp(oldXP: number, newXP: number): { 
  leveledUp: boolean; 
  oldLevel: number; 
  newLevel: number; 
  levelData?: Level;
} {
  const oldLevelData = calculateLevel(oldXP);
  const newLevelData = calculateLevel(newXP);
  
  const leveledUp = newLevelData.currentLevel.level > oldLevelData.currentLevel.level;
  
  return {
    leveledUp,
    oldLevel: oldLevelData.currentLevel.level,
    newLevel: newLevelData.currentLevel.level,
    levelData: leveledUp ? newLevelData.currentLevel : undefined
  };
}
