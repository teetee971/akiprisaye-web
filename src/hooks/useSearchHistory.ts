import { useCallback, useEffect, useState } from 'react';
import { safeLocalStorage } from '../utils/safeLocalStorage';

export type SearchHistoryType = 'text' | 'barcode' | 'ocr';

export type SearchHistoryEntry = {
  id: string;
  label: string;
  type: SearchHistoryType;
  query?: string;
  barcode?: string;
  createdAt: string;
};

const STORAGE_KEY = 'akiprisaye:search-history:v1';
const MAX_ENTRIES = 20;

const readHistory = (): SearchHistoryEntry[] => {
  if (typeof window === 'undefined' || !safeLocalStorage) {
    return [];
  }
  const raw = safeLocalStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as SearchHistoryEntry[];
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
};

const buildDedupKey = (entry: Pick<SearchHistoryEntry, 'type' | 'query' | 'barcode' | 'label'>) => {
  const normalizedLabel = entry.label.trim().toLowerCase();
  const normalizedQuery = entry.query?.trim().toLowerCase() ?? '';
  const normalizedBarcode = entry.barcode?.trim().toLowerCase() ?? '';
  return `${entry.type}:${normalizedBarcode}:${normalizedQuery}:${normalizedLabel}`;
};

export function useSearchHistory() {
  const [history, setHistory] = useState<SearchHistoryEntry[]>([]);

  useEffect(() => {
    setHistory(readHistory());
  }, []);

  const addEntry = useCallback(
    (entry: Omit<SearchHistoryEntry, 'id' | 'createdAt'>) => {
      setHistory((prev) => {
        const dedupeKey = buildDedupKey(entry);
        const lastEntry = prev[0];
        if (lastEntry && buildDedupKey(lastEntry) === dedupeKey) {
          return prev;
        }
        const nextEntry: SearchHistoryEntry = {
          ...entry,
          id: `search-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          createdAt: new Date().toISOString(),
        };
        const next = [nextEntry, ...prev].slice(0, MAX_ENTRIES);
        if (typeof window !== 'undefined' && safeLocalStorage) {
          safeLocalStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        }
        return next;
      });
    },
    []
  );

  const removeEntry = useCallback((id: string) => {
    setHistory((prev) => {
      const next = prev.filter((entry) => entry.id !== id);
      if (typeof window !== 'undefined' && safeLocalStorage) {
        safeLocalStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      }
      return next;
    });
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
    if (typeof window === 'undefined' || !safeLocalStorage) return;
    safeLocalStorage.removeItem(STORAGE_KEY);
  }, []);

  return {
    history,
    addEntry,
    removeEntry,
    clearHistory,
  };
}
