// Unit tests for OCR Parser
import { describe, it, expect, beforeEach } from 'vitest'
import { TicketParser } from '../a-ki-pri-sa-ye-functional/src/services/ocrParser.js'

describe('TicketParser', () => {
  let parser

  beforeEach(() => {
    parser = new TicketParser()
  })

  describe('parseTicketText', () => {
    it('should parse a simple ticket correctly', () => {
      const ocrText = `
        SUPER U MARTINIQUE
        123 RUE DE LA PAIX
        Tel: 0596 12 34 56
        
        Banane Antilles    2.50€
        Riz Uncle Ben's    1.20€
        Ananas local       3.80€
        
        TOTAL             7.50€
        
        Merci de votre visite
      `

      const result = parser.parseTicketText(ocrText)
      
      expect(result.store).toContain('Super U')
      expect(result.products).toHaveLength(3)
      expect(result.products[0].name).toBe('banane antilles')
      expect(result.products[0].price).toBe(2.50)
      expect(result.products[0].isLocal).toBe(true)
      expect(result.total).toBe(7.50)
      expect(result.confidence).toBeGreaterThan(80)
    })

    it('should handle DOM-TOM specific products', () => {
      const ocrText = `
        GÉANT GUADELOUPE
        
        Christophine       1.80€
        Igname violet      2.20€
        Ti-punch blanc     12.50€
        Lambi frais        8.90€
      `

      const result = parser.parseTicketText(ocrText)
      
      expect(result.products.every(p => p.isLocal)).toBe(true)
      expect(result.products.find(p => p.name.includes('christophine'))).toBeDefined()
      expect(result.products.find(p => p.name.includes('igname'))).toBeDefined()
    })

    it('should categorize products correctly', () => {
      const ocrText = `
        Banane             2.50€
        Riz basmati        3.20€
        Poisson rouge      12.80€
        Rhum blanc         15.90€
      `

      const result = parser.parseTicketText(ocrText)
      
      const fruitProduct = result.products.find(p => p.name.includes('banane'))
      const riceProduct = result.products.find(p => p.name.includes('riz'))
      const fishProduct = result.products.find(p => p.name.includes('poisson'))
      const rumProduct = result.products.find(p => p.name.includes('rhum'))

      expect(fruitProduct.category).toBe('fruits')
      expect(riceProduct.category).toBe('légumes/féculents')
      expect(fishProduct.category).toBe('protéines')
      expect(rumProduct.category).toBe('boissons')
    })
  })

  describe('extractStoreName', () => {
    it('should identify common DOM-TOM stores', () => {
      expect(parser.extractStoreName(['SUPER U MARTINIQUE'])).toBe('Super U')
      expect(parser.extractStoreName(['CARREFOUR MARKET'])).toBe('Carrefour')
      expect(parser.extractStoreName(['LEADER PRICE GUADELOUPE'])).toBe('Leader Price')
      expect(parser.extractStoreName(['ECO MAX'])).toBe('Eco Max')
    })
  })

  describe('extractPricesFromLine', () => {
    it('should extract prices in various formats', () => {
      expect(parser.extractPricesFromLine('Banane 2.50€')).toEqual([2.50])
      expect(parser.extractPricesFromLine('Riz 1,20 EUR')).toEqual([1.20])
      expect(parser.extractPricesFromLine('€ 3.80 Ananas')).toEqual([3.80])
      expect(parser.extractPricesFromLine('Total: 15.50')).toEqual([15.50])
    })
  })

  describe('calculateConfidence', () => {
    it('should calculate confidence based on extracted data quality', () => {
      const highQualityResult = {
        store: 'Super U',
        products: [
          { name: 'banane', price: 2.50, isLocal: true, category: 'fruits' },
          { name: 'riz', price: 1.20, isLocal: false, category: 'épicerie' }
        ],
        total: 3.70,
        date: '2024-01-15'
      }

      const lowQualityResult = {
        store: 'Magasin inconnu',
        products: [],
        total: null,
        date: null
      }

      expect(parser.calculateConfidence(highQualityResult)).toBeGreaterThan(80)
      expect(parser.calculateConfidence(lowQualityResult)).toBeLessThan(30)
    })
  })
})