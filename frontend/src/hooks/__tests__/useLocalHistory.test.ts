// src/hooks/__tests__/useLocalHistory.test.ts
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useLocalHistory, type HistoryItem } from '../useLocalHistory'

const STORAGE_KEY = 'akiprisaye:history:v1'

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    },
  }
})()

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
})

// Mock import.meta.env
vi.stubGlobal('import', {
  meta: {
    env: {
      VITE_FEATURE_HISTORY: 'true',
    },
  },
})

describe('useLocalHistory', () => {
  beforeEach(() => {
    localStorageMock.clear()
  })

  afterEach(() => {
    localStorageMock.clear()
  })

  it('should initialize with empty history', () => {
    const { result } = renderHook(() => useLocalHistory())
    expect(result.current.history).toEqual([])
  })

  it('should load history from localStorage on mount', () => {
    const existingHistory: HistoryItem[] = [
      {
        id: 'prod-1',
        label: 'Product 1',
        type: 'product',
        territory: 'GP',
        viewedAt: new Date().toISOString(),
      },
    ]

    localStorageMock.setItem(STORAGE_KEY, JSON.stringify(existingHistory))

    const { result } = renderHook(() => useLocalHistory())
    expect(result.current.history).toHaveLength(1)
    expect(result.current.history[0].label).toBe('Product 1')
  })

  it('should add new item to history', () => {
    const { result } = renderHook(() => useLocalHistory())

    act(() => {
      result.current.add({
        id: 'prod-1',
        label: 'Product 1',
        type: 'product',
        territory: 'GP',
      })
    })

    expect(result.current.history).toHaveLength(1)
    expect(result.current.history[0].label).toBe('Product 1')
    expect(result.current.history[0].viewedAt).toBeDefined()
  })

  it('should persist history to localStorage when adding item', () => {
    const { result } = renderHook(() => useLocalHistory())

    act(() => {
      result.current.add({
        id: 'prod-1',
        label: 'Product 1',
        type: 'product',
      })
    })

    const stored = localStorageMock.getItem(STORAGE_KEY)
    expect(stored).toBeDefined()
    
    const parsed = JSON.parse(stored!)
    expect(parsed).toHaveLength(1)
    expect(parsed[0].label).toBe('Product 1')
  })

  it('should deduplicate items with same id (move to top)', () => {
    const { result } = renderHook(() => useLocalHistory())

    act(() => {
      result.current.add({
        id: 'prod-1',
        label: 'Product 1',
        type: 'product',
      })
    })

    act(() => {
      result.current.add({
        id: 'prod-2',
        label: 'Product 2',
        type: 'product',
      })
    })

    expect(result.current.history).toHaveLength(2)
    expect(result.current.history[0].label).toBe('Product 2') // Most recent first

    // Re-add product 1 (should move to top)
    act(() => {
      result.current.add({
        id: 'prod-1',
        label: 'Product 1 Updated',
        type: 'product',
      })
    })

    expect(result.current.history).toHaveLength(2)
    expect(result.current.history[0].label).toBe('Product 1 Updated') // Moved to top
    expect(result.current.history[1].label).toBe('Product 2')
  })

  it('should limit history to 10 items maximum', () => {
    const { result } = renderHook(() => useLocalHistory())

    // Add 15 items
    act(() => {
      for (let i = 1; i <= 15; i++) {
        result.current.add({
          id: `prod-${i}`,
          label: `Product ${i}`,
          type: 'product',
        })
      }
    })

    expect(result.current.history).toHaveLength(10)
    // Most recent item should be first
    expect(result.current.history[0].label).toBe('Product 15')
    // Oldest kept item should be 10th
    expect(result.current.history[9].label).toBe('Product 6')
  })

  it('should clear all history', () => {
    const { result } = renderHook(() => useLocalHistory())

    act(() => {
      result.current.add({
        id: 'prod-1',
        label: 'Product 1',
        type: 'product',
      })
      result.current.add({
        id: 'prod-2',
        label: 'Product 2',
        type: 'product',
      })
    })

    expect(result.current.history).toHaveLength(2)

    act(() => {
      result.current.clear()
    })

    expect(result.current.history).toHaveLength(0)
    expect(localStorageMock.getItem(STORAGE_KEY)).toBeNull()
  })

  it('should handle different history item types', () => {
    const { result } = renderHook(() => useLocalHistory())

    act(() => {
      result.current.add({
        id: 'prod-1',
        label: 'Product 1',
        type: 'product',
      })
      result.current.add({
        id: 'comp-1',
        label: 'Comparison 1',
        type: 'comparison',
        territory: 'MQ',
      })
      result.current.add({
        id: 'scan-1',
        label: 'Scanned Item',
        type: 'scan',
      })
    })

    expect(result.current.history).toHaveLength(3)
    expect(result.current.history[0].type).toBe('scan')
    expect(result.current.history[1].type).toBe('comparison')
    expect(result.current.history[2].type).toBe('product')
  })

  it('should sort history by most recent first', () => {
    const now = new Date()
    const hour1 = new Date(now.getTime() - 60 * 60 * 1000).toISOString()
    const hour2 = new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString()
    const hour3 = new Date(now.getTime() - 3 * 60 * 60 * 1000).toISOString()

    const existingHistory: HistoryItem[] = [
      { id: 'prod-3', label: 'Product 3', type: 'product', viewedAt: hour3 },
      { id: 'prod-1', label: 'Product 1', type: 'product', viewedAt: hour1 },
      { id: 'prod-2', label: 'Product 2', type: 'product', viewedAt: hour2 },
    ]

    localStorageMock.setItem(STORAGE_KEY, JSON.stringify(existingHistory))

    const { result } = renderHook(() => useLocalHistory())

    // Should be sorted with most recent first
    expect(result.current.history[0].label).toBe('Product 1') // 1 hour ago
    expect(result.current.history[1].label).toBe('Product 2') // 2 hours ago
    expect(result.current.history[2].label).toBe('Product 3') // 3 hours ago
  })

  it('should handle corrupted localStorage data gracefully', () => {
    localStorageMock.setItem(STORAGE_KEY, 'invalid json')

    const { result } = renderHook(() => useLocalHistory())
    expect(result.current.history).toEqual([])
  })

  it('should handle missing territory field', () => {
    const { result } = renderHook(() => useLocalHistory())

    act(() => {
      result.current.add({
        id: 'prod-1',
        label: 'Product 1',
        type: 'product',
        // territory omitted
      })
    })

    expect(result.current.history[0].territory).toBeUndefined()
  })
})
