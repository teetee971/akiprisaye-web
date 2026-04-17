import { safeLocalStorage } from '../utils/safeLocalStorage';
/**
 * userPreferences.ts — User preferences and settings
 *
 * Purpose: Centralized user preferences for Anti-Crisis features
 * Storage: safeLocalStorage
 * RGPD compliant: All data stored locally, user controlled
 *
 * @module userPreferences
 */

const PREFERENCES_KEY = 'akiprisaye_user_preferences';
const PREFERENCES_VERSION = 1;

/**
 * User preferences structure
 */
export interface UserPreferences {
  /** Enable Anti-Crisis alerts (opt-in, disabled by default) */
  antiCrisisAlerts: boolean;

  /** Show Anti-Crisis badges in UI (enabled by default) */
  showAntiCrisisBadges: boolean;

  /** Enable Anti-Crisis filter option (enabled by default) */
  enableAntiCrisisFilter: boolean;

  /** Minimum score to show alerts (2 = Anti-Crisis, 3 = Strong only) */
  minAlertScore: 2 | 3;
}

/**
 * Default user preferences
 * Conservative defaults: badges visible, but alerts disabled (opt-in)
 */
export const DEFAULT_PREFERENCES: UserPreferences = {
  antiCrisisAlerts: false, // Opt-in for notifications
  showAntiCrisisBadges: true, // Informational badges shown by default
  enableAntiCrisisFilter: true, // Filter option available by default
  minAlertScore: 2, // Alert on Anti-Crisis (score ≥ 2)
};

/**
 * Preferences storage structure
 */
interface PreferencesData {
  version: number;
  preferences: UserPreferences;
}

/**
 * Get stored user preferences
 */
function getStoredPreferences(): PreferencesData {
  try {
    const stored = safeLocalStorage.getItem(PREFERENCES_KEY);
    if (!stored) {
      return {
        version: PREFERENCES_VERSION,
        preferences: { ...DEFAULT_PREFERENCES },
      };
    }

    const data: PreferencesData = JSON.parse(stored);

    // Version migration if needed
    if (data.version !== PREFERENCES_VERSION) {
      console.warn('Preferences version mismatch, using defaults');
      return {
        version: PREFERENCES_VERSION,
        preferences: { ...DEFAULT_PREFERENCES },
      };
    }

    // Merge with defaults to ensure new preferences are added
    return {
      version: PREFERENCES_VERSION,
      preferences: { ...DEFAULT_PREFERENCES, ...data.preferences },
    };
  } catch (error) {
    console.error('Error loading user preferences:', error);
    return {
      version: PREFERENCES_VERSION,
      preferences: { ...DEFAULT_PREFERENCES },
    };
  }
}

/**
 * Save user preferences to safeLocalStorage
 */
function savePreferences(preferences: UserPreferences): void {
  try {
    const data: PreferencesData = {
      version: PREFERENCES_VERSION,
      preferences,
    };
    safeLocalStorage.setItem(PREFERENCES_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving user preferences:', error);
  }
}

/**
 * Get current user preferences
 *
 * @returns Current preferences or defaults if not set
 */
export function getUserPreferences(): UserPreferences {
  const data = getStoredPreferences();
  return data.preferences;
}

/**
 * Update one or more user preferences
 *
 * @param updates - Partial preferences to update
 *
 * @example
 * updateUserPreferences({ antiCrisisAlerts: true });
 */
export function updateUserPreferences(updates: Partial<UserPreferences>): void {
  const current = getUserPreferences();
  const updated = { ...current, ...updates };
  savePreferences(updated);
}

/**
 * Get a specific preference value
 *
 * @param key - Preference key
 * @returns Preference value
 */
export function getPreference<K extends keyof UserPreferences>(key: K): UserPreferences[K] {
  const preferences = getUserPreferences();
  return preferences[key];
}

/**
 * Set a specific preference value
 *
 * @param key - Preference key
 * @param value - New value
 */
export function setPreference<K extends keyof UserPreferences>(
  key: K,
  value: UserPreferences[K]
): void {
  updateUserPreferences({ [key]: value } as Partial<UserPreferences>);
}

/**
 * Reset preferences to defaults
 */
export function resetPreferences(): void {
  savePreferences({ ...DEFAULT_PREFERENCES });
}

/**
 * Check if Anti-Crisis alerts are enabled
 * Convenience function for alert system
 */
export function areAntiCrisisAlertsEnabled(): boolean {
  return getPreference('antiCrisisAlerts');
}

/**
 * Check if Anti-Crisis badges should be shown
 * Convenience function for UI components
 */
export function shouldShowAntiCrisisBadges(): boolean {
  return getPreference('showAntiCrisisBadges');
}

/**
 * Export preferences as JSON (for backup/debugging)
 */
export function exportPreferences(): string {
  const data = getStoredPreferences();
  return JSON.stringify(data, null, 2);
}
