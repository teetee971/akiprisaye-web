 
// src/hooks/usePriceVariationAlert.ts
// Price variation alert hook - client-side calculation only
import { useMemo } from 'react'

export type PricePoint = {
  value: number
  date: string
}

export type VariationDirection = 'up' | 'down' | null

export type PriceVariationAlert = {
  showAlert: boolean
  variation: number
  direction: VariationDirection
}

const ALERT_THRESHOLD = 15 // ±15% variation threshold

/**
 * Calculate price variation alert based on historical prices
 * - Requires at least 2 price points
 * - Compares latest price to reference (average or previous)
 * - Triggers alert if variation ≥ ±15%
 * - 100% client-side, no backend calls
 */
export function usePriceVariationAlert(prices: PricePoint[]): PriceVariationAlert {
  return useMemo(() => {
    // Check feature flag
    const isEnabled =
      import.meta.env.VITE_FEATURE_PRICE_ALERT === 'true' ||
      process.env.NODE_ENV === 'test'
    if (!isEnabled) {
      return {
        showAlert: false,
        variation: 0,
        direction: null,
      }
    }

    // Need at least 2 prices to calculate variation
    if (!prices || prices.length < 2) {
      return {
        showAlert: false,
        variation: 0,
        direction: null,
      }
    }

    // Sort by date (most recent last)
    const sorted = [...prices].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    )

    // Get latest price
    const latestPrice = sorted[sorted.length - 1].value

    // Calculate reference price (average of previous prices)
    const previousPrices = sorted.slice(0, -1).map(p => p.value)
    const referencePrice = previousPrices.reduce((sum, p) => sum + p, 0) / previousPrices.length

    // Calculate variation percentage
    const variation = ((latestPrice - referencePrice) / referencePrice) * 100

    // Determine if alert should be shown (≥ ±15%)
    const showAlert = Math.abs(variation) >= ALERT_THRESHOLD

    // Determine direction
    let direction: VariationDirection = null
    if (showAlert) {
      direction = variation > 0 ? 'up' : 'down'
    }

    return {
      showAlert,
      variation: Math.round(variation), // Round to integer for display
      direction,
    }
  }, [prices])
}
