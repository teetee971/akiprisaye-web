import { useState, useEffect } from 'react';
import { storage } from '../services/storageService';

const HISTORY_KEY = 'akiprisaye_search_history';
const MAX_HISTORY = 10;

export interface SearchHistoryItem {
  query: string;
  timestamp: number;
  filters?: unknown;
}

/**
 * Custom hook for managing search history
 * Persists to localStorage with a 10-item limit
 */
export function useSearchHistory() {
  const [history, setHistory] = useState<SearchHistoryItem[]>(() => {
    return storage.get<SearchHistoryItem[]>(HISTORY_KEY, []);
  });

  useEffect(() => {
    storage.set(HISTORY_KEY, history);
  }, [history]);

  const addToHistory = (query: string, filters?: unknown) => {
    setHistory(prev => {
      const newItem: SearchHistoryItem = { query, timestamp: Date.now(), filters };
      // Remove duplicates and add to front
      const filtered = prev.filter(item => item.query !== query);
      return [newItem, ...filtered].slice(0, MAX_HISTORY);
    });
  };

  const removeHistoryItem = (index: number) => {
    setHistory(prev => prev.filter((_item, i) => i !== index));
  };

  const clearHistory = () => {
    setHistory([]);
  };

  return {
    history,
    addToHistory,
    removeHistoryItem,
    clearHistory
  };
}
