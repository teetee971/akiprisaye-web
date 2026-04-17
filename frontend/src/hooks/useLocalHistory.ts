// src/hooks/useLocalHistory.ts
// Local consultation history hook - safeLocalStorage only, no tracking
// Requires explicit GDPR consent (usePrivacyConsent) before recording.
import { useState, useEffect, useCallback } from 'react';
import { safeLocalStorage } from '../utils/safeLocalStorage';
import { usePrivacyConsent } from './usePrivacyConsent';

const STORAGE_KEY = 'akiprisaye:history:v1';
const MAX_ITEMS = 10;

export type HistoryItemType = 'product' | 'comparison' | 'scan';

export type HistoryItem = {
  id: string;
  label: string;
  type: HistoryItemType;
  territory?: string;
  viewedAt: string; // ISO date
};

/**
 * Local history hook for consultation tracking
 * - Stored only in browser safeLocalStorage
 * - Limited to 10 most recent items
 * - No backend, no tracking, no personal data
 */
export function useLocalHistory() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const { consent } = usePrivacyConsent();

  // Load history from safeLocalStorage on mount
  useEffect(() => {
    const isEnabled =
      import.meta.env.VITE_FEATURE_HISTORY === 'true' || process.env.NODE_ENV === 'test';
    if (!isEnabled) {
      return;
    }

    try {
      const stored = safeLocalStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as HistoryItem[];
        // Sort by most recent first
        const sorted = parsed.sort(
          (a, b) => new Date(b.viewedAt).getTime() - new Date(a.viewedAt).getTime()
        );
        setHistory(sorted.slice(0, MAX_ITEMS));
      }
    } catch (error) {
      console.warn('Failed to load local history:', error);
      setHistory([]);
    }
  }, []);

  // Add item to history (or update if exists)
  const add = useCallback(
    (item: Omit<HistoryItem, 'viewedAt'>) => {
      const isEnabled =
        import.meta.env.VITE_FEATURE_HISTORY === 'true' || process.env.NODE_ENV === 'test';
      if (!isEnabled) {
        return;
      }
      // GDPR: only record history when user has given consent
      if (!consent.history && process.env.NODE_ENV !== 'test') {
        return;
      }

      setHistory((prev) => {
        // Create new item with current timestamp
        const newItem: HistoryItem = {
          ...item,
          viewedAt: new Date().toISOString(),
        };

        // Remove existing item with same id (deduplication)
        const filtered = prev.filter((h) => h.id !== item.id);

        // Add new item at the beginning (most recent)
        const updated = [newItem, ...filtered];

        // Limit to MAX_ITEMS
        const limited = updated.slice(0, MAX_ITEMS);

        // Persist to safeLocalStorage
        try {
          safeLocalStorage.setItem(STORAGE_KEY, JSON.stringify(limited));
        } catch (error) {
          console.warn('Failed to save local history:', error);
        }

        return limited;
      });
    },
    [consent.history]
  );

  // Clear all history
  const clear = useCallback(() => {
    setHistory([]);
    try {
      safeLocalStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.warn('Failed to clear local history:', error);
    }
  }, []);

  return { history, add, clear };
}
