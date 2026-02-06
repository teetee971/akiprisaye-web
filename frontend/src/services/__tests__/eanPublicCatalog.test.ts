/**
 * Unit Tests for EAN Public Catalog Service
 */

import { describe, it, expect } from 'vitest'
import {
  validateEAN13,
  validateEAN8,
  validateEAN,
  getProductByEAN,
  getAllProducts,
} from '../eanPublicCatalog'

describe('eanPublicCatalog', () => {
  describe('validateEAN13', () => {
    it('should validate correct EAN-13', () => {
      expect(validateEAN13('3017620422003')).toBe(true)
      expect(validateEAN13('3228857000852')).toBe(true)
      expect(validateEAN13('3019081238957')).toBe(true)
    })

    it('should reject invalid EAN-13', () => {
      expect(validateEAN13('3017620422004')).toBe(false) // wrong checksum
      expect(validateEAN13('1234567890123')).toBe(false) // wrong checksum
    })

    it('should reject non-numeric EAN-13', () => {
      expect(validateEAN13('301762042200A')).toBe(false)
      expect(validateEAN13('abc1234567890')).toBe(false)
    })

    it('should reject wrong length', () => {
      expect(validateEAN13('123456789012')).toBe(false) // 12 digits
      expect(validateEAN13('12345678901234')).toBe(false) // 14 digits
      expect(validateEAN13('')).toBe(false)
    })
  })

  describe('validateEAN8', () => {
    it('should validate correct EAN-8', () => {
      expect(validateEAN8('12345670')).toBe(true)
      expect(validateEAN8('96385074')).toBe(true)
    })

    it('should reject invalid EAN-8', () => {
      expect(validateEAN8('12345671')).toBe(false) // wrong checksum
    })

    it('should reject non-numeric EAN-8', () => {
      expect(validateEAN8('1234567A')).toBe(false)
    })

    it('should reject wrong length', () => {
      expect(validateEAN8('1234567')).toBe(false) // 7 digits
      expect(validateEAN8('123456789')).toBe(false) // 9 digits
    })
  })

  describe('validateEAN', () => {
    it('should validate both EAN-13 and EAN-8', () => {
      expect(validateEAN('3017620422003')).toBe(true) // EAN-13
      expect(validateEAN('12345670')).toBe(true) // EAN-8
    })

    it('should trim whitespace', () => {
      expect(validateEAN(' 3017620422003 ')).toBe(true)
      expect(validateEAN(' 12345670 ')).toBe(true)
    })

    it('should reject invalid lengths', () => {
      expect(validateEAN('123456')).toBe(false)
      expect(validateEAN('123456789012')).toBe(false) // 12 digits
    })

    it('should reject empty string', () => {
      expect(validateEAN('')).toBe(false)
      expect(validateEAN('   ')).toBe(false)
    })
  })

  describe('getProductByEAN', () => {
    it('should return product for valid EAN', () => {
      const product = getProductByEAN('3017620422003')
      
      expect(product).not.toBeNull()
      expect(product?.ean).toBe('3017620422003')
      expect(product?.name).toBe('Nutella 750g')
      expect(product?.category).toBe('Pâte à tartiner')
    })

    it('should return null for unknown EAN', () => {
      const product = getProductByEAN('9999999999999') // Valid checksum but not in catalog
      expect(product).toBeNull()
    })

    it('should return null for invalid EAN', () => {
      const product = getProductByEAN('1234567890123') // Invalid checksum
      expect(product).toBeNull()
    })

    it('should handle whitespace', () => {
      const product = getProductByEAN(' 3017620422003 ')
      expect(product).not.toBeNull()
      expect(product?.ean).toBe('3017620422003')
    })

    it('should include observed prices', () => {
      const product = getProductByEAN('3017620422003')
      
      expect(product?.observedPrices).toBeDefined()
      expect(Array.isArray(product?.observedPrices)).toBe(true)
      expect(product?.observedPrices!.length).toBeGreaterThan(0)
    })

    it('should include territories', () => {
      const product = getProductByEAN('3017620422003')
      
      expect(product?.territories).toBeDefined()
      expect(Array.isArray(product?.territories)).toBe(true)
      expect(product?.territories.length).toBeGreaterThan(0)
    })

    it('should include lastUpdate', () => {
      const product = getProductByEAN('3017620422003')
      
      expect(product?.lastUpdate).toBeDefined()
    })
  })

  describe('getAllProducts', () => {
    it('should return all products in catalog', () => {
      const products = getAllProducts()
      
      expect(Array.isArray(products)).toBe(true)
      expect(products.length).toBeGreaterThan(0)
    })

    it('should return a copy of the catalog', () => {
      const products1 = getAllProducts()
      const products2 = getAllProducts()
      
      expect(products1).not.toBe(products2) // Different array references
      expect(products1).toEqual(products2) // Same content
    })

    it('should include required fields for each product', () => {
      const products = getAllProducts()
      
      products.forEach(product => {
        expect(product.ean).toBeDefined()
        expect(product.name).toBeDefined()
        expect(product.category).toBeDefined()
        expect(product.territories).toBeDefined()
      })
    })
  })
})
