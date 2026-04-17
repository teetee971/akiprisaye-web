import { safeLocalStorage } from './safeLocalStorage';
/**
 * priceHistory.ts — Local price history tracking for baskets
 *
 * Purpose: Track basket price evolution over time per territory
 * Storage: safeLocalStorage (lightweight) or IndexedDB for larger datasets
 * RGPD compliant - all data stored locally
 *
 * @module priceHistory
 */

const STORAGE_KEY = 'akiprisaye_basket_price_history';
const HISTORY_VERSION = 1;
const MAX_HISTORY_DAYS = 90; // Keep 90 days of history
const MAX_ENTRIES_PER_BASKET = 180; // ~2 entries per day for 90 days

/**
 * Price snapshot for a basket in a territory
 */
export interface BasketPriceSnapshot {
  basketId: string;
  territoryId: string;
  totalPrice: number;
  timestamp: number; // Unix timestamp in milliseconds
  date: string; // ISO date string for easier filtering
}

/**
 * Price history structure
 */
interface PriceHistoryData {
  version: number;
  snapshots: BasketPriceSnapshot[];
  lastCleanup: number;
}

/**
 * Trend direction
 */
export type TrendDirection = 'up' | 'down' | 'stable' | 'unknown';

/**
 * Trend analysis result
 */
export interface TrendAnalysis {
  direction: TrendDirection;
  percentageChange: number;
  previousPrice: number | null;
  currentPrice: number | null;
  dataPoints: number;
}

/**
 * Time period for trend analysis
 */
export type TimePeriod = 'day' | 'week' | 'month';

/**
 * Get stored price history
 */
function getStoredHistory(): PriceHistoryData {
  try {
    const stored = safeLocalStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return {
        version: HISTORY_VERSION,
        snapshots: [],
        lastCleanup: Date.now(),
      };
    }

    const data: PriceHistoryData = JSON.parse(stored);

    // Version migration if needed
    if (data.version !== HISTORY_VERSION) {
      console.warn('Price history version mismatch, resetting history');
      return {
        version: HISTORY_VERSION,
        snapshots: [],
        lastCleanup: Date.now(),
      };
    }

    return data;
  } catch (error) {
    console.error('Error loading price history:', error);
    return {
      version: HISTORY_VERSION,
      snapshots: [],
      lastCleanup: Date.now(),
    };
  }
}

/**
 * Save price history to storage
 */
function saveHistory(data: PriceHistoryData): void {
  try {
    safeLocalStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving price history:', error);
    // If safeLocalStorage is full, try to cleanup old data
    cleanupOldSnapshots(data, true);
    try {
      safeLocalStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (retryError) {
      console.error('Failed to save after cleanup:', retryError);
    }
  }
}

/**
 * Clean up old snapshots beyond retention period
 */
function cleanupOldSnapshots(data: PriceHistoryData, aggressive: boolean = false): void {
  const now = Date.now();
  const retentionMs = MAX_HISTORY_DAYS * 24 * 60 * 60 * 1000;
  const cutoffTime = now - retentionMs;

  // Remove snapshots older than retention period
  data.snapshots = data.snapshots.filter((s) => s.timestamp > cutoffTime);

  // If aggressive cleanup, also limit per-basket entries
  if (aggressive) {
    const basketGroups = new Map<string, BasketPriceSnapshot[]>();

    data.snapshots.forEach((snapshot) => {
      const key = `${snapshot.basketId}_${snapshot.territoryId}`;
      if (!basketGroups.has(key)) {
        basketGroups.set(key, []);
      }
      basketGroups.get(key)!.push(snapshot);
    });

    // Keep only most recent entries per basket-territory pair
    data.snapshots = [];
    basketGroups.forEach((group) => {
      group.sort((a, b) => b.timestamp - a.timestamp);
      data.snapshots.push(...group.slice(0, MAX_ENTRIES_PER_BASKET));
    });
  }

  data.lastCleanup = now;
}

/**
 * Save a basket price snapshot
 *
 * @param basketId - Unique basket identifier
 * @param territoryId - Territory code
 * @param totalPrice - Total basket price
 * @param date - Optional date (defaults to now)
 *
 * @example
 * saveBasketSnapshot('basket-1', 'GP', 45.50);
 */
export function saveBasketSnapshot(
  basketId: string,
  territoryId: string,
  totalPrice: number,
  date?: Date
): void {
  const data = getStoredHistory();
  const timestamp = date ? date.getTime() : Date.now();
  const dateStr = new Date(timestamp).toISOString().split('T')[0];

  // Check if we already have a snapshot for this basket-territory-date
  const existingIndex = data.snapshots.findIndex(
    (s) => s.basketId === basketId && s.territoryId === territoryId && s.date === dateStr
  );

  const snapshot: BasketPriceSnapshot = {
    basketId,
    territoryId,
    totalPrice,
    timestamp,
    date: dateStr,
  };

  if (existingIndex >= 0) {
    // Update existing snapshot (keep most recent for the day)
    if (data.snapshots[existingIndex].timestamp < timestamp) {
      data.snapshots[existingIndex] = snapshot;
    }
  } else {
    // Add new snapshot
    data.snapshots.push(snapshot);
  }

  // Periodic cleanup (once per day)
  const daysSinceCleanup = (Date.now() - data.lastCleanup) / (24 * 60 * 60 * 1000);
  if (daysSinceCleanup >= 1) {
    cleanupOldSnapshots(data);
  }

  saveHistory(data);
}

/**
 * Get price history for a specific territory
 *
 * @param territoryId - Territory code
 * @param basketId - Optional basket ID to filter
 * @returns Array of price snapshots sorted by timestamp (oldest first)
 */
export function getHistoryByTerritory(
  territoryId: string,
  basketId?: string
): BasketPriceSnapshot[] {
  const data = getStoredHistory();

  let filtered = data.snapshots.filter((s) => s.territoryId === territoryId);

  if (basketId) {
    filtered = filtered.filter((s) => s.basketId === basketId);
  }

  // Sort by timestamp ascending (oldest first)
  return filtered.sort((a, b) => a.timestamp - b.timestamp);
}

/**
 * Get price history for a specific basket across all territories
 *
 * @param basketId - Basket identifier
 * @returns Array of price snapshots sorted by timestamp
 */
export function getHistoryByBasket(basketId: string): BasketPriceSnapshot[] {
  const data = getStoredHistory();
  return data.snapshots
    .filter((s) => s.basketId === basketId)
    .sort((a, b) => a.timestamp - b.timestamp);
}

/**
 * Analyze price trend for a territory
 *
 * @param territoryId - Territory code
 * @param period - Time period to analyze ('day', 'week', 'month')
 * @param basketId - Optional basket ID
 * @returns Trend analysis with direction and percentage change
 *
 * @example
 * const trend = getTrend('GP', 'week', 'basket-1');
 * // Returns: { direction: 'up', percentageChange: 5.2, ... }
 */
export function getTrend(
  territoryId: string,
  period: TimePeriod,
  basketId?: string
): TrendAnalysis {
  const history = getHistoryByTerritory(territoryId, basketId);

  if (history.length === 0) {
    return {
      direction: 'unknown',
      percentageChange: 0,
      previousPrice: null,
      currentPrice: null,
      dataPoints: 0,
    };
  }

  // Define period durations in milliseconds
  const periodMs = {
    day: 24 * 60 * 60 * 1000,
    week: 7 * 24 * 60 * 60 * 1000,
    month: 30 * 24 * 60 * 60 * 1000,
  };

  const now = Date.now();
  const cutoffTime = now - periodMs[period];

  // Get snapshots within the period
  const recentSnapshots = history.filter((s) => s.timestamp >= cutoffTime);

  if (recentSnapshots.length === 0) {
    return {
      direction: 'unknown',
      percentageChange: 0,
      previousPrice: null,
      currentPrice: null,
      dataPoints: history.length,
    };
  }

  // Current price (most recent snapshot)
  const currentSnapshot = recentSnapshots[recentSnapshots.length - 1];
  const currentPrice = currentSnapshot.totalPrice;

  // Compare with snapshot from the beginning of period
  const previousSnapshot = recentSnapshots[0];
  const previousPrice = previousSnapshot.totalPrice;

  // Calculate percentage change
  const percentageChange =
    previousPrice > 0 ? ((currentPrice - previousPrice) / previousPrice) * 100 : 0;

  // Determine trend direction (threshold: 2% to avoid noise)
  const STABILITY_THRESHOLD = 2;
  let direction: TrendDirection = 'stable';

  if (Math.abs(percentageChange) < STABILITY_THRESHOLD) {
    direction = 'stable';
  } else if (percentageChange > 0) {
    direction = 'up';
  } else {
    direction = 'down';
  }

  return {
    direction,
    percentageChange,
    previousPrice,
    currentPrice,
    dataPoints: recentSnapshots.length,
  };
}

/**
 * Get all baskets with available history
 *
 * @returns Array of basket IDs that have price history
 */
export function getBasketsWithHistory(): string[] {
  const data = getStoredHistory();
  const basketIds = new Set(data.snapshots.map((s) => s.basketId));
  return Array.from(basketIds);
}

/**
 * Clear all price history (for privacy/reset)
 */
export function clearPriceHistory(): void {
  try {
    safeLocalStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Error clearing price history:', error);
  }
}

/**
 * Export price history as JSON (for debugging/backup)
 */
export function exportPriceHistory(): string {
  const data = getStoredHistory();
  return JSON.stringify(data, null, 2);
}

/**
 * Get storage statistics
 */
export function getHistoryStats(): {
  totalSnapshots: number;
  basketCount: number;
  territoryCount: number;
  oldestSnapshot: string | null;
  newestSnapshot: string | null;
  storageSizeKB: number;
} {
  const data = getStoredHistory();
  const basketIds = new Set(data.snapshots.map((s) => s.basketId));
  const territoryIds = new Set(data.snapshots.map((s) => s.territoryId));

  const timestamps = data.snapshots.map((s) => s.timestamp).sort((a, b) => a - b);
  const oldestSnapshot = timestamps.length > 0 ? new Date(timestamps[0]).toISOString() : null;
  const newestSnapshot =
    timestamps.length > 0 ? new Date(timestamps[timestamps.length - 1]).toISOString() : null;

  // Estimate storage size
  const jsonStr = JSON.stringify(data);
  const storageSizeKB = new Blob([jsonStr]).size / 1024;

  return {
    totalSnapshots: data.snapshots.length,
    basketCount: basketIds.size,
    territoryCount: territoryIds.size,
    oldestSnapshot,
    newestSnapshot,
    storageSizeKB: Math.round(storageSizeKB * 100) / 100,
  };
}
