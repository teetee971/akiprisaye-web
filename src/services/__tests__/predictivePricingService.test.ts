/**
 * Unit Tests for Predictive Pricing Service
 */

import { describe, it, expect } from 'vitest'
import {
  predictPriceChange,
  analyzeCatalogue,
  filterByStatus,
  sortByProbability,
  type PricePoint,
} from '../predictivePricingService'

const mockObservations: PricePoint[] = [
  { date: '2025-11-01T10:00:00Z', price: 2.50 },
  { date: '2025-11-08T10:00:00Z', price: 2.45 },
  { date: '2025-11-15T10:00:00Z', price: 2.30 },
  { date: '2025-11-22T10:00:00Z', price: 2.20 },
  { date: '2025-11-29T10:00:00Z', price: 1.95 },
]

const mockStableObservations: PricePoint[] = [
  { date: '2025-11-01T10:00:00Z', price: 2.50 },
  { date: '2025-11-08T10:00:00Z', price: 2.51 },
  { date: '2025-11-15T10:00:00Z', price: 2.49 },
  { date: '2025-11-22T10:00:00Z', price: 2.50 },
  { date: '2025-11-29T10:00:00Z', price: 2.50 },
]

const mockVolatileObservations: PricePoint[] = [
  { date: '2025-11-01T10:00:00Z', price: 2.50 },
  { date: '2025-11-08T10:00:00Z', price: 3.00 },
  { date: '2025-11-15T10:00:00Z', price: 2.20 },
  { date: '2025-11-22T10:00:00Z', price: 2.80 },
  { date: '2025-11-29T10:00:00Z', price: 2.40 },
]

describe('predictivePricingService', () => {
  describe('predictPriceChange', () => {
    it('should return low confidence for insufficient data', () => {
      const result = predictPriceChange([{ date: '2025-11-01T10:00:00Z', price: 2.50 }])
      
      expect(result.confidence).toBe('low')
      expect(result.status).toBe('stable')
      expect(result.probability).toBe(0)
    })

    it('should detect downward trend', () => {
      const result = predictPriceChange(mockObservations)
      
      expect(result.status === 'baisse_probable' || result.status === 'surveillance').toBe(true)
      expect(result.probability).toBeGreaterThan(30)
      expect(result.metrics.trend).toBeLessThan(0)
    })

    it('should detect stable prices', () => {
      const result = predictPriceChange(mockStableObservations)
      
      expect(result.status).toBe('stable')
      expect(result.probability).toBeLessThan(30)
      expect(Math.abs(result.metrics.trend)).toBeLessThan(0.5)
    })

    it('should calculate volatility for volatile prices', () => {
      const result = predictPriceChange(mockVolatileObservations)
      
      expect(result.metrics.volatility).toBeGreaterThan(10)
      expect(result.probability).toBeGreaterThanOrEqual(0)
      expect(result.probability).toBeLessThanOrEqual(100)
    })

    it('should calculate negative trend for decreasing prices', () => {
      const result = predictPriceChange(mockObservations)
      
      expect(result.metrics.trend).toBeLessThan(0)
    })

    it('should calculate volatility correctly', () => {
      const result = predictPriceChange(mockObservations)
      
      expect(result.metrics.volatility).toBeGreaterThan(0)
      expect(result.metrics.volatility).toBeLessThan(100)
    })

    it('should provide justification text', () => {
      const result = predictPriceChange(mockObservations)
      
      expect(result.justification).toBeTruthy()
      expect(typeof result.justification).toBe('string')
      expect(result.justification.length).toBeGreaterThan(10)
    })

    it('should provide estimated timeframe for baisse_probable', () => {
      const result = predictPriceChange(mockObservations)
      
      if (result.status === 'baisse_probable') {
        expect(result.estimatedTimeframe).toBeDefined()
      }
    })

    it('should calculate acceleration correctly', () => {
      const result = predictPriceChange(mockObservations)
      
      expect(result.metrics.acceleration).toBeDefined()
      expect(typeof result.metrics.acceleration).toBe('number')
    })

    it('should calculate last change percentage', () => {
      const result = predictPriceChange(mockObservations)
      
      expect(result.metrics.lastChangePercentage).toBeDefined()
      expect(typeof result.metrics.lastChangePercentage).toBe('number')
    })

    it('should have probability between 0 and 100', () => {
      const result = predictPriceChange(mockObservations)
      
      expect(result.probability).toBeGreaterThanOrEqual(0)
      expect(result.probability).toBeLessThanOrEqual(100)
    })

    it('should assign higher probability to stronger trends', () => {
      const strongTrend = predictPriceChange(mockObservations)
      const weakTrend = predictPriceChange(mockStableObservations)
      
      expect(strongTrend.probability).toBeGreaterThan(weakTrend.probability)
    })
  })

  describe('analyzeCatalogue', () => {
    const mockCatalogue = [
      {
        id: 'p-001',
        name: 'Riz 1kg',
        store: 'Supermarché A',
        observations: mockObservations,
      },
      {
        id: 'p-002',
        name: 'Lait 1L',
        store: 'Épicerie B',
        observations: mockStableObservations,
      },
    ]

    it('should analyze all products in catalogue', () => {
      const results = analyzeCatalogue(mockCatalogue)
      
      expect(results).toHaveLength(2)
    })

    it('should include product details in results', () => {
      const results = analyzeCatalogue(mockCatalogue)
      
      expect(results[0].productId).toBe('p-001')
      expect(results[0].productName).toBe('Riz 1kg')
      expect(results[0].store).toBe('Supermarché A')
    })

    it('should include current price', () => {
      const results = analyzeCatalogue(mockCatalogue)
      
      expect(results[0].currentPrice).toBe(1.95)
    })

    it('should skip products without observations', () => {
      const catalogueWithEmpty = [
        ...mockCatalogue,
        { id: 'p-003', name: 'Farine', store: 'Store C', observations: [] },
      ]
      
      const results = analyzeCatalogue(catalogueWithEmpty)
      expect(results).toHaveLength(2)
    })

    it('should include prediction for each product', () => {
      const results = analyzeCatalogue(mockCatalogue)
      
      results.forEach(result => {
        expect(result.prediction).toBeDefined()
        expect(result.prediction.probability).toBeDefined()
        expect(result.prediction.status).toBeDefined()
      })
    })
  })

  describe('filterByStatus', () => {
    const mockPredictions = [
      {
        productId: 'p-001',
        productName: 'Riz',
        store: 'A',
        currentPrice: 2.0,
        prediction: {
          probability: 80,
          confidence: 'high' as const,
          status: 'baisse_probable' as const,
          justification: 'Test',
          metrics: { trend: -2, volatility: 10, acceleration: -1, lastChangePercentage: -5 },
        },
        observations: [],
      },
      {
        productId: 'p-002',
        productName: 'Lait',
        store: 'B',
        currentPrice: 1.5,
        prediction: {
          probability: 30,
          confidence: 'medium' as const,
          status: 'stable' as const,
          justification: 'Test',
          metrics: { trend: 0, volatility: 5, acceleration: 0, lastChangePercentage: 0 },
        },
        observations: [],
      },
    ]

    it('should filter by baisse_probable status', () => {
      const filtered = filterByStatus(mockPredictions, 'baisse_probable')
      
      expect(filtered).toHaveLength(1)
      expect(filtered[0].productId).toBe('p-001')
    })

    it('should filter by stable status', () => {
      const filtered = filterByStatus(mockPredictions, 'stable')
      
      expect(filtered).toHaveLength(1)
      expect(filtered[0].productId).toBe('p-002')
    })

    it('should return empty array when no matches', () => {
      const filtered = filterByStatus(mockPredictions, 'surveillance')
      
      expect(filtered).toHaveLength(0)
    })
  })

  describe('sortByProbability', () => {
    const mockPredictions = [
      {
        productId: 'p-001',
        productName: 'Riz',
        store: 'A',
        currentPrice: 2.0,
        prediction: {
          probability: 50,
          confidence: 'medium' as const,
          status: 'surveillance' as const,
          justification: 'Test',
          metrics: { trend: -1, volatility: 15, acceleration: 0, lastChangePercentage: -2 },
        },
        observations: [],
      },
      {
        productId: 'p-002',
        productName: 'Lait',
        store: 'B',
        currentPrice: 1.5,
        prediction: {
          probability: 80,
          confidence: 'high' as const,
          status: 'baisse_probable' as const,
          justification: 'Test',
          metrics: { trend: -2, volatility: 10, acceleration: -1, lastChangePercentage: -5 },
        },
        observations: [],
      },
      {
        productId: 'p-003',
        productName: 'Farine',
        store: 'C',
        currentPrice: 1.8,
        prediction: {
          probability: 30,
          confidence: 'low' as const,
          status: 'stable' as const,
          justification: 'Test',
          metrics: { trend: 0, volatility: 5, acceleration: 0, lastChangePercentage: 0 },
        },
        observations: [],
      },
    ]

    it('should sort by probability descending', () => {
      const sorted = sortByProbability(mockPredictions)
      
      expect(sorted[0].productId).toBe('p-002')
      expect(sorted[1].productId).toBe('p-001')
      expect(sorted[2].productId).toBe('p-003')
    })

    it('should not mutate original array', () => {
      const original = [...mockPredictions]
      sortByProbability(mockPredictions)
      
      expect(mockPredictions).toEqual(original)
    })

    it('should handle empty array', () => {
      const sorted = sortByProbability([])
      expect(sorted).toEqual([])
    })
  })
})
