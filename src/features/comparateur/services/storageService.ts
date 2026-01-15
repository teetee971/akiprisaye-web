/**
 * Storage Service - Safe localStorage operations with error handling
 */

export const storage = {
  /**
   * Get item from localStorage with fallback
   */
  get<T>(key: string, defaultValue: T): T {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error(`Storage error reading ${key}:`, error);
      return defaultValue;
    }
  },

  /**
   * Set item in localStorage
   */
  set(key: string, value: unknown): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Storage error writing ${key}:`, error);
      // Handle quota exceeded
      if (error instanceof Error && error.name === 'QuotaExceededError') {
        console.warn('localStorage quota exceeded');
      }
    }
  },

  /**
   * Remove item from localStorage
   */
  remove(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`Storage error removing ${key}:`, error);
    }
  },

  /**
   * Clear all localStorage
   */
  clear(): void {
    try {
      localStorage.clear();
    } catch (error) {
      console.error('Storage error clearing:', error);
    }
  }
};
