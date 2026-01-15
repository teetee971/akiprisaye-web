/**
 * antiCrisisAlertsStore.ts — Local storage for Anti-Crisis alert states
 * 
 * Purpose: Track alert states to prevent spam and duplicate notifications
 * Storage: localStorage (RGPD compliant - all data stored locally)
 * 
 * Anti-spam mechanism:
 * - Tracks last score for each basket/product
 * - Tracks when last alert was sent
 * - Prevents duplicate alerts for same state
 * 
 * @module antiCrisisAlertsStore
 */

const STORAGE_KEY = 'akiprisaye_anti_crisis_alerts';
const ALERT_VERSION = 1;

/**
 * State of alerts for a specific item (basket or product)
 */
export interface AlertState {
  /** Last recorded Anti-Crisis score (0-3) */
  lastScore?: number;
  
  /** Timestamp of last alert sent (milliseconds) */
  lastAlertAt?: number;
  
  /** Number of times this item has triggered an alert */
  alertCount?: number;
}

/**
 * Complete alert storage structure
 */
interface AlertStorageData {
  version: number;
  states: Record<string, AlertState>;
  lastCleanup: number;
}

/**
 * Maximum age of alert states before cleanup (90 days)
 */
const MAX_STATE_AGE_MS = 90 * 24 * 60 * 60 * 1000;

/**
 * Get all stored alert states
 */
function getStoredAlerts(): AlertStorageData {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return {
        version: ALERT_VERSION,
        states: {},
        lastCleanup: Date.now(),
      };
    }

    const data: AlertStorageData = JSON.parse(stored);
    
    // Version migration if needed
    if (data.version !== ALERT_VERSION) {
      console.warn('Alert storage version mismatch, resetting states');
      return {
        version: ALERT_VERSION,
        states: {},
        lastCleanup: Date.now(),
      };
    }

    return data;
  } catch (error) {
    console.error('Error loading alert states:', error);
    return {
      version: ALERT_VERSION,
      states: {},
      lastCleanup: Date.now(),
    };
  }
}

/**
 * Save alert states to localStorage
 */
function saveAlerts(data: AlertStorageData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving alert states:', error);
  }
}

/**
 * Clean up old alert states to prevent storage bloat
 */
function cleanupOldStates(data: AlertStorageData): void {
  const now = Date.now();
  const cutoffTime = now - MAX_STATE_AGE_MS;

  // Remove states with alerts older than retention period
  const cleanedStates: Record<string, AlertState> = {};
  
  for (const [id, state] of Object.entries(data.states)) {
    if (state.lastAlertAt && state.lastAlertAt > cutoffTime) {
      cleanedStates[id] = state;
    } else if (!state.lastAlertAt) {
      // Keep states without alerts (they're tracking but haven't alerted yet)
      cleanedStates[id] = state;
    }
  }

  data.states = cleanedStates;
  data.lastCleanup = now;
}

/**
 * Get alert state for a specific item
 * 
 * @param id - Unique identifier (basketId, productId, or "territory_basket")
 * @returns Current alert state or empty object
 * 
 * @example
 * const state = getAlertState('GP_basket-familial');
 * console.log(state.lastScore); // 2
 */
export function getAlertState(id: string): AlertState {
  const data = getStoredAlerts();
  return data.states[id] || {};
}

/**
 * Set/update alert state for a specific item
 * 
 * @param id - Unique identifier
 * @param state - New alert state
 * 
 * @example
 * setAlertState('GP_basket-familial', {
 *   lastScore: 2,
 *   lastAlertAt: Date.now(),
 *   alertCount: 1
 * });
 */
export function setAlertState(id: string, state: AlertState): void {
  const data = getStoredAlerts();
  data.states[id] = state;

  // Periodic cleanup (once per week)
  const daysSinceCleanup = (Date.now() - data.lastCleanup) / (24 * 60 * 60 * 1000);
  if (daysSinceCleanup >= 7) {
    cleanupOldStates(data);
  }

  saveAlerts(data);
}

/**
 * Clear alert state for a specific item
 * 
 * @param id - Unique identifier
 */
export function clearAlertState(id: string): void {
  const data = getStoredAlerts();
  delete data.states[id];
  saveAlerts(data);
}

/**
 * Clear all alert states (for user privacy/reset)
 */
export function clearAllAlertStates(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Error clearing alert states:', error);
  }
}

/**
 * Get statistics about stored alert states
 */
export function getAlertStorageStats(): {
  totalItems: number;
  itemsWithAlerts: number;
  oldestAlert: string | null;
  newestAlert: string | null;
} {
  const data = getStoredAlerts();
  const states = Object.values(data.states);
  
  const itemsWithAlerts = states.filter(s => s.lastAlertAt !== undefined);
  const alertTimes = itemsWithAlerts
    .map(s => s.lastAlertAt)
    .filter((time): time is number => time !== undefined)
    .sort((a, b) => a - b);

  return {
    totalItems: states.length,
    itemsWithAlerts: itemsWithAlerts.length,
    oldestAlert: alertTimes.length > 0 
      ? new Date(alertTimes[0]).toISOString() 
      : null,
    newestAlert: alertTimes.length > 0 
      ? new Date(alertTimes[alertTimes.length - 1]).toISOString() 
      : null,
  };
}

/**
 * Export all alert states as JSON (for debugging/backup)
 */
export function exportAlertStates(): string {
  const data = getStoredAlerts();
  return JSON.stringify(data, null, 2);
}
