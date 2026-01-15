/**
 * Unit Tests for Store Comparison Service
 */

import { describe, it, expect } from 'vitest'
import {
  compareStoresForProduct,
  getUniqueProducts,
} from '../storeComparisonService'

const mockCatalogueData = [
  {
    id: 'p-001',
    name: 'Riz 1kg',
    store: 'Supermarché A',
    territory: 'GP',
    currency: '€',
    observations: [
      { date: '2025-11-01T10:00:00Z', price: 2.50 },
      { date: '2025-11-08T10:00:00Z', price: 2.45 },
      { date: '2025-11-15T10:00:00Z', price: 2.30 },
      { date: '2025-11-22T10:00:00Z', price: 2.20 },
      { date: '2025-11-29T10:00:00Z', price: 1.95 },
    ],
  },
  {
    id: 'p-002',
    name: 'Riz 1kg',
    store: 'Épicerie B',
    territory: 'GP',
    currency: '€',
    observations: [
      { date: '2025-11-01T10:00:00Z', price: 2.80 },
      { date: '2025-11-15T10:00:00Z', price: 2.75 },
      { date: '2025-11-29T10:00:00Z', price: 2.70 },
    ],
  },
  {
    id: 'p-003',
    name: 'Lait UHT 1L',
    store: 'Supermarché A',
    territory: 'RE',
    currency: '€',
    observations: [
      { date: '2025-11-01T10:00:00Z', price: 1.20 },
      { date: '2025-11-10T10:00:00Z', price: 1.18 },
    ],
  },
]

describe('storeComparisonService', () => {
  describe('compareStoresForProduct', () => {
    it('should return null for non-existent product', () => {
      const result = compareStoresForProduct('Produit Inexistant', mockCatalogueData)
      expect(result).toBeNull()
    })

    it('should compare stores for existing product', () => {
      const result = compareStoresForProduct('Riz 1kg', mockCatalogueData)
      
      expect(result).not.toBeNull()
      expect(result?.productName).toBe('Riz 1kg')
      expect(result?.comparisons).toHaveLength(2)
    })

    it('should identify best price correctly', () => {
      const result = compareStoresForProduct('Riz 1kg', mockCatalogueData)
      
      expect(result?.bestPrice).toBe(1.95)
      expect(result?.bestStore).toBe('Supermarché A')
    })

    it('should mark best price comparison', () => {
      const result = compareStoresForProduct('Riz 1kg', mockCatalogueData)
      
      const bestComparison = result?.comparisons.find(c => c.isBestPrice)
      expect(bestComparison?.store).toBe('Supermarché A')
      expect(bestComparison?.currentPrice).toBe(1.95)
    })

    it('should calculate price differences correctly', () => {
      const result = compareStoresForProduct('Riz 1kg', mockCatalogueData)
      
      const epicerieB = result?.comparisons.find(c => c.store === 'Épicerie B')
      expect(epicerieB?.differenceFromBest.amount).toBeCloseTo(0.75, 2)
      expect(epicerieB?.differenceFromBest.percentage).toBeGreaterThan(0)
    })

    it('should calculate trend for stores', () => {
      const result = compareStoresForProduct('Riz 1kg', mockCatalogueData)
      
      expect(result?.comparisons[0].trend30d).toBeDefined()
      expect(typeof result?.comparisons[0].trend30d).toBe('number')
    })

    it('should sort comparisons by price ascending', () => {
      const result = compareStoresForProduct('Riz 1kg', mockCatalogueData)
      
      expect(result?.comparisons[0].currentPrice).toBeLessThanOrEqual(
        result?.comparisons[1].currentPrice || 0
      )
    })
  })

  describe('getUniqueProducts', () => {
    it('should return unique product names', () => {
      const products = getUniqueProducts(mockCatalogueData)
      
      expect(products).toContain('Riz 1kg')
      expect(products).toContain('Lait UHT 1L')
      expect(products).toHaveLength(2)
    })

    it('should return empty array for empty catalogue', () => {
      const products = getUniqueProducts([])
      expect(products).toEqual([])
    })

    it('should return sorted product names', () => {
      const products = getUniqueProducts(mockCatalogueData)
      
      expect(products[0]).toBe('Lait UHT 1L')
      expect(products[1]).toBe('Riz 1kg')
    })
  })
})
