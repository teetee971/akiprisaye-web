import { safeLocalStorage } from './safeLocalStorage';
/**
 * Shopping Statistics Tracker
 * Privacy-first local storage of shopping statistics
 * NO DATA IS SENT TO SERVER - ALL LOCAL
 */

export interface ShoppingStats {
  totalTrips: number;
  totalDistance: number;
  fuelSaved: number;
  co2Saved: number;
  favoriteStores: string[];
  mostBoughtProducts: string[];
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
}

const STORAGE_KEY = 'shopping-stats-v1';
const BADGES_KEY = 'shopping-badges-v1';

/**
 * Initialize or load stats from safeLocalStorage
 */
export function loadStats(): ShoppingStats {
  try {
    const stored = safeLocalStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error loading stats:', error);
  }

  // Default stats
  return {
    totalTrips: 0,
    totalDistance: 0,
    fuelSaved: 0,
    co2Saved: 0,
    favoriteStores: [],
    mostBoughtProducts: [],
    lastUpdated: Date.now()
  };
}

/**
 * Save stats to safeLocalStorage
 */
export function saveStats(stats: ShoppingStats): void {
  try {
    stats.lastUpdated = Date.now();
    safeLocalStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
  } catch (error) {
    console.error('Error saving stats:', error);
  }
}

/**
 * Track a completed shopping trip
 */
export function trackTrip(
  distance: number,
  stores: string[],
  products: string[],
  fuelSaved: number = 0,
  co2Saved: number = 0
): ShoppingStats {
  const stats = loadStats();

  stats.totalTrips++;
  stats.totalDistance += distance;
  stats.fuelSaved += fuelSaved;
  stats.co2Saved += co2Saved;

  // Update favorite stores
  stores.forEach(store => {
    if (!stats.favoriteStores.includes(store)) {
      stats.favoriteStores.push(store);
    }
  });

  // Update most bought products
  products.forEach(product => {
    if (!stats.mostBoughtProducts.includes(product)) {
      stats.mostBoughtProducts.push(product);
    }
  });

  saveStats(stats);
  return stats;
}

/**
 * Clear all stats (for privacy)
 */
export function clearStats(): void {
  try {
    safeLocalStorage.removeItem(STORAGE_KEY);
    safeLocalStorage.removeItem(BADGES_KEY);
  } catch (error) {
    console.error('Error clearing stats:', error);
  }
}

/**
 * Badge definitions
 */
const BADGE_DEFINITIONS: Omit<Badge, 'unlocked' | 'progress'>[] = [
  {
    id: 'first_trip',
    name: 'Premier Pas',
    icon: '👶',
    description: 'Complétez votre première course optimisée',
    target: 1
  },
  {
    id: 'eco_warrior',
    name: 'Guerrier Écolo',
    icon: '🌱',
    description: 'Économisez 100 kg de CO₂',
    target: 100
  },
  {
    id: 'fuel_saver',
    name: 'Économe',
    icon: '⛽',
    description: 'Économisez 50 litres de carburant',
    target: 50
  },
  {
    id: 'road_master',
    name: 'Maître des Routes',
    icon: '🗺️',
    description: 'Parcourez 500 km optimisés',
    target: 500
  },
  {
    id: 'frequent_shopper',
    name: 'Habitué',
    icon: '🛒',
    description: 'Complétez 20 courses',
    target: 20
  },
  {
    id: 'super_saver',
    name: 'Super Économe',
    icon: '💎',
    description: 'Économisez 200 litres de carburant',
    target: 200
  },
  {
    id: 'planet_hero',
    name: 'Héros de la Planète',
    icon: '🌍',
    description: 'Économisez 500 kg de CO₂',
    target: 500
  },
  {
    id: 'legend',
    name: 'Légende',
    icon: '🏆',
    description: 'Parcourez 1000 km optimisés',
    target: 1000
  }
];

/**
 * Get badges with unlock status
 */
export function getBadges(stats: ShoppingStats): Badge[] {
  return BADGE_DEFINITIONS.map(badge => {
    let progress = 0;
    let unlocked = false;

    switch (badge.id) {
      case 'first_trip':
        progress = stats.totalTrips;
        unlocked = stats.totalTrips >= 1;
        break;
      case 'eco_warrior':
        progress = stats.co2Saved;
        unlocked = stats.co2Saved >= 100;
        break;
      case 'fuel_saver':
        progress = stats.fuelSaved;
        unlocked = stats.fuelSaved >= 50;
        break;
      case 'road_master':
        progress = stats.totalDistance;
        unlocked = stats.totalDistance >= 500;
        break;
      case 'frequent_shopper':
        progress = stats.totalTrips;
        unlocked = stats.totalTrips >= 20;
        break;
      case 'super_saver':
        progress = stats.fuelSaved;
        unlocked = stats.fuelSaved >= 200;
        break;
      case 'planet_hero':
        progress = stats.co2Saved;
        unlocked = stats.co2Saved >= 500;
        break;
      case 'legend':
        progress = stats.totalDistance;
        unlocked = stats.totalDistance >= 1000;
        break;
    }

    return {
      ...badge,
      unlocked,
      progress: Math.min(progress, badge.target || progress)
    };
  });
}

/**
 * Get newly unlocked badges since last check
 */
export function getNewBadges(stats: ShoppingStats): Badge[] {
  try {
    const stored = safeLocalStorage.getItem(BADGES_KEY);
    const previouslyUnlocked = stored ? JSON.parse(stored) : [];
    const currentBadges = getBadges(stats);
    const currentlyUnlocked = currentBadges.filter(b => b.unlocked).map(b => b.id);

    const newlyUnlocked = currentlyUnlocked.filter(id => !previouslyUnlocked.includes(id));
    
    // Update stored badges
    safeLocalStorage.setItem(BADGES_KEY, JSON.stringify(currentlyUnlocked));

    return currentBadges.filter(b => newlyUnlocked.includes(b.id));
  } catch (error) {
    console.error('Error getting new badges:', error);
    return [];
  }
}
