import { safeLocalStorage } from '../utils/safeLocalStorage';

/**
 * Savings Service - Tracks user savings from price comparisons
 * Privacy-first: All data stored locally in localStorage
 */

export interface SavingsEntry {
  id: string;
  date: number; // timestamp
  amount: number; // euros saved
  productName?: string;
  storeName?: string;
  category?: string;
}

export interface MonthlySavings {
  month: string; // YYYY-MM format
  total: number;
  entries: SavingsEntry[];
}

export interface SavingsData {
  entries: SavingsEntry[];
  monthlyGoal: number; // configurable goal in euros
  lastUpdated: number;
}

export interface Badge {
  id: string;
  name: string;
  icon: string;
  description: string;
  unlocked: boolean;
  progress?: number;
  target?: number;
  unlockedAt?: number;
}

const STORAGE_KEY = 'akiprisaye_savings';
const BADGES_KEY = 'akiprisaye_savings_badges';

/**
 * Load savings data from localStorage
 */
export function loadSavingsData(): SavingsData {
  const defaultData: SavingsData = {
    entries: [],
    monthlyGoal: 50, // default goal of 50€
    lastUpdated: Date.now(),
  };

  return safeLocalStorage.getJSON<SavingsData>(STORAGE_KEY, defaultData);
}

/**
 * Save savings data to localStorage
 */
export function saveSavingsData(data: SavingsData): boolean {
  data.lastUpdated = Date.now();
  return safeLocalStorage.setJSON(STORAGE_KEY, data);
}

/**
 * Add a new savings entry
 */
export function addSavingsEntry(
  amount: number,
  productName?: string,
  storeName?: string,
  category?: string
): SavingsEntry {
  const data = loadSavingsData();

  const entry: SavingsEntry = {
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    date: Date.now(),
    amount,
    productName,
    storeName,
    category,
  };

  data.entries.push(entry);
  saveSavingsData(data);

  return entry;
}

/**
 * Get total savings since a specific date
 */
export function getTotalSavings(sinceDate?: number): number {
  const data = loadSavingsData();
  const cutoffDate = sinceDate || 0;

  return data.entries
    .filter((entry) => entry.date >= cutoffDate)
    .reduce((total, entry) => total + entry.amount, 0);
}

/**
 * Get savings for current month
 */
export function getMonthSavings(): number {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  return getTotalSavings(startOfMonth);
}

/**
 * Get savings for current week
 */
export function getWeekSavings(): number {
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  return getTotalSavings(startOfWeek.getTime());
}

/**
 * Get monthly savings grouped by month (last N months)
 */
export function getMonthlySavings(monthsCount: number = 6): MonthlySavings[] {
  const data = loadSavingsData();
  const now = new Date();
  const monthsMap = new Map<string, MonthlySavings>();

  // Initialize last N months
  for (let i = monthsCount - 1; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    monthsMap.set(monthKey, {
      month: monthKey,
      total: 0,
      entries: [],
    });
  }

  // Group entries by month
  data.entries.forEach((entry) => {
    const entryDate = new Date(entry.date);
    const monthKey = `${entryDate.getFullYear()}-${String(entryDate.getMonth() + 1).padStart(2, '0')}`;

    if (monthsMap.has(monthKey)) {
      const monthData = monthsMap.get(monthKey)!;
      monthData.total += entry.amount;
      monthData.entries.push(entry);
    }
  });

  return Array.from(monthsMap.values());
}

/**
 * Update monthly goal
 */
export function setMonthlyGoal(goal: number): boolean {
  const data = loadSavingsData();
  data.monthlyGoal = goal;
  return saveSavingsData(data);
}

/**
 * Get monthly goal progress (0-100)
 */
export function getMonthlyGoalProgress(): number {
  const data = loadSavingsData();
  const monthSavings = getMonthSavings();

  if (data.monthlyGoal <= 0) return 0;

  return Math.min(100, Math.round((monthSavings / data.monthlyGoal) * 100));
}

/**
 * Badge definitions for gamification
 */
const BADGE_DEFINITIONS: Omit<Badge, 'unlocked' | 'progress' | 'unlockedAt'>[] = [
  {
    id: 'beginner',
    name: 'Économe débutant',
    icon: '🥉',
    description: 'Économisez 10€',
    target: 10,
  },
  {
    id: 'confirmed',
    name: 'Économe confirmé',
    icon: '🥈',
    description: 'Économisez 50€',
    target: 50,
  },
  {
    id: 'master',
    name: 'Maître des économies',
    icon: '🥇',
    description: 'Économisez 200€',
    target: 200,
  },
  {
    id: 'champion',
    name: 'Champion annuel',
    icon: '🏆',
    description: 'Économisez 500€',
    target: 500,
  },
  {
    id: 'first_saving',
    name: 'Premier pas',
    icon: '🎯',
    description: 'Faites votre première économie',
    target: 1,
  },
  {
    id: 'monthly_goal',
    name: 'Objectif atteint',
    icon: '⭐',
    description: 'Atteignez votre objectif mensuel',
    target: 1,
  },
];

/**
 * Get all badges with unlock status
 */
export function getBadges(): Badge[] {
  const totalSavings = getTotalSavings();
  const goalProgress = getMonthlyGoalProgress();
  const savingsCount = loadSavingsData().entries.length;
  const unlockedBadges = safeLocalStorage.getJSON<Record<string, number>>(BADGES_KEY, {});

  return BADGE_DEFINITIONS.map((badgeDef) => {
    let progress = 0;
    let unlocked = false;

    switch (badgeDef.id) {
      case 'first_saving':
        progress = savingsCount;
        unlocked = savingsCount >= 1;
        break;
      case 'beginner':
        progress = totalSavings;
        unlocked = totalSavings >= 10;
        break;
      case 'confirmed':
        progress = totalSavings;
        unlocked = totalSavings >= 50;
        break;
      case 'master':
        progress = totalSavings;
        unlocked = totalSavings >= 200;
        break;
      case 'champion':
        progress = totalSavings;
        unlocked = totalSavings >= 500;
        break;
      case 'monthly_goal':
        progress = goalProgress;
        unlocked = goalProgress >= 100;
        break;
    }

    // Track when badge was unlocked
    let unlockedAt = unlockedBadges[badgeDef.id];
    if (unlocked && !unlockedAt) {
      unlockedAt = Date.now();
      unlockedBadges[badgeDef.id] = unlockedAt;
      safeLocalStorage.setJSON(BADGES_KEY, unlockedBadges);
    }

    return {
      ...badgeDef,
      unlocked,
      progress: Math.min(progress, badgeDef.target || progress),
      unlockedAt,
    };
  });
}

/**
 * Clear all savings data (for privacy)
 */
export function clearSavingsData(): void {
  safeLocalStorage.removeItem(STORAGE_KEY);
  safeLocalStorage.removeItem(BADGES_KEY);
}

/**
 * Get savings statistics
 */
export interface SavingsStats {
  totalSavings: number;
  monthSavings: number;
  weekSavings: number;
  entriesCount: number;
  averageSaving: number;
  bestSaving: number;
}

export function getSavingsStats(): SavingsStats {
  const data = loadSavingsData();
  const totalSavings = getTotalSavings();
  const monthSavings = getMonthSavings();
  const weekSavings = getWeekSavings();
  const entriesCount = data.entries.length;

  const averageSaving = entriesCount > 0 ? totalSavings / entriesCount : 0;
  const bestSaving = data.entries.length > 0 ? Math.max(...data.entries.map((e) => e.amount)) : 0;

  return {
    totalSavings,
    monthSavings,
    weekSavings,
    entriesCount,
    averageSaving,
    bestSaving,
  };
}
