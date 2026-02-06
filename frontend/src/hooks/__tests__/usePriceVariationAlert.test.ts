// src/hooks/__tests__/usePriceVariationAlert.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { usePriceVariationAlert, type PricePoint } from '../usePriceVariationAlert'

// Mock import.meta.env
vi.stubGlobal('import', {
  meta: {
    env: {
      VITE_FEATURE_PRICE_ALERT: 'true',
    },
  },
})

describe('usePriceVariationAlert', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return no alert for empty price array', () => {
    const { result } = renderHook(() => usePriceVariationAlert([]))
    
    expect(result.current.showAlert).toBe(false)
    expect(result.current.variation).toBe(0)
    expect(result.current.direction).toBeNull()
  })

  it('should return no alert for single price point', () => {
    const prices: PricePoint[] = [
      { value: 5.99, date: '2026-01-01T00:00:00Z' },
    ]

    const { result } = renderHook(() => usePriceVariationAlert(prices))
    
    expect(result.current.showAlert).toBe(false)
    expect(result.current.variation).toBe(0)
    expect(result.current.direction).toBeNull()
  })

  it('should return no alert for variation below 15% threshold', () => {
    const prices: PricePoint[] = [
      { value: 6.00, date: '2026-01-01T00:00:00Z' },
      { value: 6.50, date: '2026-01-02T00:00:00Z' }, // +8.3% variation
    ]

    const { result } = renderHook(() => usePriceVariationAlert(prices))
    
    expect(result.current.showAlert).toBe(false)
    expect(result.current.direction).toBeNull()
  })

  it('should trigger upward alert for +15% variation', () => {
    const prices: PricePoint[] = [
      { value: 6.00, date: '2026-01-01T00:00:00Z' },
      { value: 6.90, date: '2026-01-02T00:00:00Z' }, // +15% variation
    ]

    const { result } = renderHook(() => usePriceVariationAlert(prices))
    
    expect(result.current.showAlert).toBe(true)
    expect(result.current.direction).toBe('up')
    expect(result.current.variation).toBe(15)
  })

  it('should trigger downward alert for -15% variation', () => {
    const prices: PricePoint[] = [
      { value: 6.00, date: '2026-01-01T00:00:00Z' },
      { value: 5.10, date: '2026-01-02T00:00:00Z' }, // -15% variation
    ]

    const { result } = renderHook(() => usePriceVariationAlert(prices))
    
    expect(result.current.showAlert).toBe(true)
    expect(result.current.direction).toBe('down')
    expect(result.current.variation).toBe(-15)
  })

  it('should trigger upward alert for significant price increase (+20%)', () => {
    const prices: PricePoint[] = [
      { value: 5.00, date: '2026-01-01T00:00:00Z' },
      { value: 6.00, date: '2026-01-02T00:00:00Z' }, // +20% variation
    ]

    const { result } = renderHook(() => usePriceVariationAlert(prices))
    
    expect(result.current.showAlert).toBe(true)
    expect(result.current.direction).toBe('up')
    expect(result.current.variation).toBe(20)
  })

  it('should trigger downward alert for significant price decrease (-25%)', () => {
    const prices: PricePoint[] = [
      { value: 8.00, date: '2026-01-01T00:00:00Z' },
      { value: 6.00, date: '2026-01-02T00:00:00Z' }, // -25% variation
    ]

    const { result } = renderHook(() => usePriceVariationAlert(prices))
    
    expect(result.current.showAlert).toBe(true)
    expect(result.current.direction).toBe('down')
    expect(result.current.variation).toBe(-25)
  })

  it('should calculate variation against average of previous prices', () => {
    const prices: PricePoint[] = [
      { value: 5.00, date: '2026-01-01T00:00:00Z' },
      { value: 6.00, date: '2026-01-02T00:00:00Z' },
      { value: 7.00, date: '2026-01-03T00:00:00Z' },
      { value: 8.28, date: '2026-01-04T00:00:00Z' }, // Average: 6.00, Latest: 8.28 = +38%
    ]

    const { result } = renderHook(() => usePriceVariationAlert(prices))
    
    expect(result.current.showAlert).toBe(true)
    expect(result.current.direction).toBe('up')
    expect(result.current.variation).toBe(38)
  })

  it('should handle unsorted dates correctly', () => {
    const prices: PricePoint[] = [
      { value: 6.00, date: '2026-01-03T00:00:00Z' }, // Middle date
      { value: 5.00, date: '2026-01-01T00:00:00Z' }, // Earliest date
      { value: 7.50, date: '2026-01-05T00:00:00Z' }, // Latest date (+36% from avg 5.5)
    ]

    const { result } = renderHook(() => usePriceVariationAlert(prices))
    
    expect(result.current.showAlert).toBe(true)
    expect(result.current.direction).toBe('up')
    expect(result.current.variation).toBeGreaterThanOrEqual(15)
  })

  it('should round variation to integer', () => {
    const prices: PricePoint[] = [
      { value: 6.00, date: '2026-01-01T00:00:00Z' },
      { value: 6.97, date: '2026-01-02T00:00:00Z' }, // +16.17% variation
    ]

    const { result } = renderHook(() => usePriceVariationAlert(prices))
    
    expect(result.current.showAlert).toBe(true)
    expect(Number.isInteger(result.current.variation)).toBe(true)
    expect(result.current.variation).toBe(16)
  })

  it('should handle very large price increases', () => {
    const prices: PricePoint[] = [
      { value: 5.00, date: '2026-01-01T00:00:00Z' },
      { value: 15.00, date: '2026-01-02T00:00:00Z' }, // +200% variation
    ]

    const { result } = renderHook(() => usePriceVariationAlert(prices))
    
    expect(result.current.showAlert).toBe(true)
    expect(result.current.direction).toBe('up')
    expect(result.current.variation).toBe(200)
  })

  it('should handle very large price decreases', () => {
    const prices: PricePoint[] = [
      { value: 10.00, date: '2026-01-01T00:00:00Z' },
      { value: 2.00, date: '2026-01-02T00:00:00Z' }, // -80% variation
    ]

    const { result } = renderHook(() => usePriceVariationAlert(prices))
    
    expect(result.current.showAlert).toBe(true)
    expect(result.current.direction).toBe('down')
    expect(result.current.variation).toBe(-80)
  })

  it('should work with multiple historical prices', () => {
    const prices: PricePoint[] = [
      { value: 5.00, date: '2026-01-01T00:00:00Z' },
      { value: 5.10, date: '2026-01-02T00:00:00Z' },
      { value: 5.20, date: '2026-01-03T00:00:00Z' },
      { value: 5.05, date: '2026-01-04T00:00:00Z' },
      { value: 5.15, date: '2026-01-05T00:00:00Z' },
      { value: 6.00, date: '2026-01-06T00:00:00Z' }, // Average: 5.10, Latest: 6.00 = +17.6%
    ]

    const { result } = renderHook(() => usePriceVariationAlert(prices))
    
    expect(result.current.showAlert).toBe(true)
    expect(result.current.direction).toBe('up')
    expect(result.current.variation).toBeGreaterThanOrEqual(15)
  })

  it('should handle exact 15% threshold (boundary test)', () => {
    const prices: PricePoint[] = [
      { value: 10.00, date: '2026-01-01T00:00:00Z' },
      { value: 11.50, date: '2026-01-02T00:00:00Z' }, // Exactly +15%
    ]

    const { result } = renderHook(() => usePriceVariationAlert(prices))
    
    expect(result.current.showAlert).toBe(true)
    expect(result.current.direction).toBe('up')
    expect(result.current.variation).toBe(15)
  })

  it('should handle exact -15% threshold (boundary test)', () => {
    const prices: PricePoint[] = [
      { value: 10.00, date: '2026-01-01T00:00:00Z' },
      { value: 8.50, date: '2026-01-02T00:00:00Z' }, // Exactly -15%
    ]

    const { result } = renderHook(() => usePriceVariationAlert(prices))
    
    expect(result.current.showAlert).toBe(true)
    expect(result.current.direction).toBe('down')
    expect(result.current.variation).toBe(-15)
  })

  it('should not show alert when just below threshold (14.9%)', () => {
    const prices: PricePoint[] = [
      { value: 10.00, date: '2026-01-01T00:00:00Z' },
      { value: 11.49, date: '2026-01-02T00:00:00Z' }, // +14.9%
    ]

    const { result } = renderHook(() => usePriceVariationAlert(prices))
    
    expect(result.current.showAlert).toBe(false)
    expect(result.current.direction).toBeNull()
  })
})
