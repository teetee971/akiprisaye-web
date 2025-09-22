// Unit tests for Export Service
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ExportService, NotificationService } from '../a-ki-pri-sa-ye-functional/src/services/exportService.js'

// Mock jsPDF
vi.mock('jspdf', () => ({
  jsPDF: vi.fn().mockImplementation(() => ({
    setFontSize: vi.fn(),
    setFont: vi.fn(),
    text: vi.fn(),
    addPage: vi.fn(),
    save: vi.fn(),
    internal: {
      getNumberOfPages: () => 1
    },
    setPage: vi.fn()
  }))
}))

describe('ExportService', () => {
  let exportService

  beforeEach(() => {
    exportService = new ExportService()
    
    // Mock URL.createObjectURL and document methods
    global.URL.createObjectURL = vi.fn(() => 'mock-url')
    global.URL.revokeObjectURL = vi.fn()
    
    Object.defineProperty(document, 'createElement', {
      value: vi.fn(() => ({
        href: '',
        download: '',
        click: vi.fn(),
        style: {}
      }))
    })
    
    Object.defineProperty(document.body, 'appendChild', {
      value: vi.fn()
    })
    
    Object.defineProperty(document.body, 'removeChild', {
      value: vi.fn()
    })
  })

  describe('exportToCSV', () => {
    it('should export product data to CSV', () => {
      const products = [
        {
          name: 'Banane',
          price: 2.50,
          store: 'Super U',
          territory: 'Martinique',
          category: 'Fruits'
        },
        {
          name: 'Riz',
          price: 1.20,
          store: 'Carrefour',
          territory: 'Guadeloupe',
          category: 'Épicerie'
        }
      ]

      expect(() => exportService.exportToCSV(products)).not.toThrow()
    })

    it('should export ticket data to CSV', () => {
      const tickets = [
        {
          date: '2024-01-15',
          store: 'Super U',
          products: [
            { name: 'Banane', price: 2.50, category: 'Fruits', isLocal: true }
          ],
          total: 2.50,
          confidence: 95
        }
      ]

      expect(() => exportService.exportToCSV(tickets)).not.toThrow()
    })

    it('should throw error for empty data', () => {
      expect(() => exportService.exportToCSV([])).toThrow('Aucune donnée à exporter')
    })
  })

  describe('generateProductCSV', () => {
    it('should generate correct CSV format for products', () => {
      const products = [
        {
          name: 'Banane "Bio"',
          price: 2.50,
          store: 'Super U',
          territory: 'Martinique'
        }
      ]

      const csv = exportService.generateProductCSV(products)
      
      expect(csv).toContain('Nom du produit')
      expect(csv).toContain('Prix (€)')
      expect(csv).toContain('Banane "Bio"')
      expect(csv).toContain('2.50')
    })
  })

  describe('arrayToCSV', () => {
    it('should properly escape CSV fields', () => {
      const data = [
        ['Name', 'Price'],
        ['Product "Special"', '2,50']
      ]

      const result = exportService.arrayToCSV(data)
      expect(result).toContain('"Product ""Special"""')
    })
  })

  describe('formatPrice', () => {
    it('should format prices correctly', () => {
      expect(exportService.formatPrice(2.5)).toBe('2.50')
      expect(exportService.formatPrice(0)).toBe('0.00')
      expect(exportService.formatPrice('invalid')).toBe('0.00')
    })
  })

  describe('formatDate', () => {
    it('should format dates correctly', () => {
      const date = new Date('2024-01-15')
      expect(exportService.formatDate(date)).toBe('15/01/2024')
    })
  })
})

describe('NotificationService', () => {
  let notificationService

  beforeEach(() => {
    notificationService = new NotificationService()
    localStorage.clear()
  })

  describe('addPriceAlert', () => {
    it('should add price alert correctly', () => {
      const alert = notificationService.addPriceAlert('Banane', 2.00, 2.50)
      
      expect(alert.productName).toBe('Banane')
      expect(alert.targetPrice).toBe(2.00)
      expect(alert.currentPrice).toBe(2.50)
      expect(alert.isActive).toBe(true)
    })
  })

  describe('checkPriceAlerts', () => {
    it('should detect price drops', () => {
      notificationService.addPriceAlert('Banane', 2.00, 2.50)
      
      const products = [
        { name: 'Banane Premium', price: 1.90, store: 'Super U' }
      ]

      const alerts = notificationService.checkPriceAlerts(products)
      expect(alerts).toHaveLength(1)
      expect(alerts[0].newPrice).toBe(1.90)
    })

    it('should not alert for price increases', () => {
      notificationService.addPriceAlert('Banane', 2.00, 2.50)
      
      const products = [
        { name: 'Banane Premium', price: 2.80, store: 'Super U' }
      ]

      const alerts = notificationService.checkPriceAlerts(products)
      expect(alerts).toHaveLength(0)
    })
  })

  describe('getActiveAlerts', () => {
    it('should return only active alerts', () => {
      notificationService.addPriceAlert('Banane', 2.00, 2.50)
      notificationService.addPriceAlert('Riz', 1.00, 1.20)
      
      const alerts = notificationService.getActiveAlerts()
      expect(alerts).toHaveLength(2)
      expect(alerts.every(a => a.isActive)).toBe(true)
    })
  })

  describe('removeAlert', () => {
    it('should remove alert correctly', () => {
      const alert = notificationService.addPriceAlert('Banane', 2.00, 2.50)
      notificationService.removeAlert(alert.id)
      
      const alerts = notificationService.getActiveAlerts()
      expect(alerts).toHaveLength(0)
    })
  })
})