// src/hooks/__tests__/useSearchHistory.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSearchHistory, type SearchHistoryEntry } from '../useSearchHistory';

const STORAGE_KEY = 'akiprisaye:search-history:v1';

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('useSearchHistory', () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  afterEach(() => {
    localStorageMock.clear();
  });

  it('should initialize with empty history', () => {
    const { result } = renderHook(() => useSearchHistory());
    expect(result.current.history).toEqual([]);
  });

  it('should load history from localStorage on mount', () => {
    const existing: SearchHistoryEntry[] = [
      {
        id: 'search-1',
        label: 'Coca-Cola',
        type: 'text',
        query: 'coca-cola',
        createdAt: new Date().toISOString(),
      },
    ];
    localStorageMock.setItem(STORAGE_KEY, JSON.stringify(existing));

    const { result } = renderHook(() => useSearchHistory());
    expect(result.current.history).toHaveLength(1);
    expect(result.current.history[0].label).toBe('Coca-Cola');
  });

  it('should add a new entry to history', () => {
    const { result } = renderHook(() => useSearchHistory());

    act(() => {
      result.current.addEntry({ label: 'Riz', type: 'text', query: 'riz' });
    });

    expect(result.current.history).toHaveLength(1);
    expect(result.current.history[0].label).toBe('Riz');
    expect(result.current.history[0].id).toMatch(/^search-/);
    expect(result.current.history[0].createdAt).toBeDefined();
  });

  it('should persist entry to localStorage', () => {
    const { result } = renderHook(() => useSearchHistory());

    act(() => {
      result.current.addEntry({ label: 'Nutella', type: 'text', query: 'nutella' });
    });

    const stored = localStorageMock.getItem(STORAGE_KEY);
    expect(stored).not.toBeNull();
    const parsed = JSON.parse(stored!) as SearchHistoryEntry[];
    expect(parsed).toHaveLength(1);
    expect(parsed[0].label).toBe('Nutella');
  });

  it('should deduplicate consecutive identical searches', () => {
    const { result } = renderHook(() => useSearchHistory());

    act(() => {
      result.current.addEntry({ label: 'Lait', type: 'text', query: 'lait' });
    });

    act(() => {
      result.current.addEntry({ label: 'Lait', type: 'text', query: 'lait' });
    });

    expect(result.current.history).toHaveLength(1);
  });

  it('should add barcode search entries', () => {
    const { result } = renderHook(() => useSearchHistory());

    act(() => {
      result.current.addEntry({ label: 'EAN 3017620422003', type: 'barcode', barcode: '3017620422003' });
    });

    expect(result.current.history).toHaveLength(1);
    expect(result.current.history[0].type).toBe('barcode');
    expect(result.current.history[0].barcode).toBe('3017620422003');
  });

  it('should limit history to 20 entries maximum', () => {
    const { result } = renderHook(() => useSearchHistory());

    act(() => {
      for (let i = 1; i <= 25; i++) {
        result.current.addEntry({ label: `Product ${i}`, type: 'text', query: `product ${i}` });
      }
    });

    expect(result.current.history).toHaveLength(20);
    expect(result.current.history[0].label).toBe('Product 25');
    expect(result.current.history[19].label).toBe('Product 6');
  });

  it('should remove a specific entry by id', () => {
    const { result } = renderHook(() => useSearchHistory());

    act(() => {
      result.current.addEntry({ label: 'Café', type: 'text', query: 'café' });
      result.current.addEntry({ label: 'Huile', type: 'text', query: 'huile' });
    });

    const idToRemove = result.current.history[1].id;

    act(() => {
      result.current.removeEntry(idToRemove);
    });

    expect(result.current.history).toHaveLength(1);
    expect(result.current.history[0].label).toBe('Huile');
  });

  it('should clear all history', () => {
    const { result } = renderHook(() => useSearchHistory());

    act(() => {
      result.current.addEntry({ label: 'Eau', type: 'text', query: 'eau' });
      result.current.addEntry({ label: 'Pain', type: 'text', query: 'pain' });
    });

    expect(result.current.history).toHaveLength(2);

    act(() => {
      result.current.clearHistory();
    });

    expect(result.current.history).toHaveLength(0);
    expect(localStorageMock.getItem(STORAGE_KEY)).toBeNull();
  });

  it('should handle corrupted localStorage data gracefully', () => {
    localStorageMock.setItem(STORAGE_KEY, 'invalid-json{{{');

    const { result } = renderHook(() => useSearchHistory());
    expect(result.current.history).toEqual([]);
  });

  it('should keep entries most-recent first', () => {
    const { result } = renderHook(() => useSearchHistory());

    act(() => {
      result.current.addEntry({ label: 'Premier', type: 'text', query: 'premier' });
      result.current.addEntry({ label: 'Deuxième', type: 'text', query: 'deuxième' });
    });

    expect(result.current.history[0].label).toBe('Deuxième');
    expect(result.current.history[1].label).toBe('Premier');
  });
});
