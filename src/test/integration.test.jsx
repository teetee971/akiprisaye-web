// Integration tests for the functional React app
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import OCR from '../a-ki-pri-sa-ye-functional/src/pages/OCR.jsx'
import Comparateur from '../a-ki-pri-sa-ye-functional/src/pages/Comparateur.jsx'

// Mock services
vi.mock('../a-ki-pri-sa-ye-functional/src/services/logic.js', () => ({
  saveTicketLines: vi.fn(() => Promise.resolve()),
  searchProducts: vi.fn(() => Promise.resolve([
    {
      id: '1',
      name: 'Banane',
      brand: 'Local',
      category: 'Fruits',
      prices: [
        { store: 'Super U', price: 2.50 },
        { store: 'Carrefour', price: 2.30 }
      ],
      best: { store: 'Carrefour', price: 2.30 }
    }
  ])),
  addToCart: vi.fn(),
  cartTotal: vi.fn(() => 5.80),
  cartItems: vi.fn(() => []),
  clearCart: vi.fn()
}))

vi.mock('../a-ki-pri-sa-ye-functional/src/services/ocrParser.js', () => ({
  ticketParser: {
    parseTicketText: vi.fn(() => ({
      store: 'Super U',
      date: '2024-01-15',
      products: [
        { name: 'banane', price: 2.50, isLocal: true, category: 'fruits' }
      ],
      total: 2.50,
      confidence: 95
    }))
  }
}))

vi.mock('../a-ki-pri-sa-ye-functional/src/services/exportService.js', () => ({
  exportService: {
    exportToCSV: vi.fn(),
    exportToPDF: vi.fn()
  },
  notificationService: {
    getActiveAlerts: vi.fn(() => []),
    checkPriceAlerts: vi.fn(() => []),
    requestPermission: vi.fn(() => Promise.resolve(true)),
    addPriceAlert: vi.fn(),
    removeAlert: vi.fn(),
    sendNotification: vi.fn()
  }
}))

describe('OCR Component Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render OCR interface correctly', () => {
    render(<OCR />)
    
    expect(screen.getByText('🧾 Scanner un ticket (OCR Amélioré)')).toBeInTheDocument()
    expect(screen.getByLabelText('Sélectionner une image de ticket')).toBeInTheDocument()
    expect(screen.getByText('📸 Analyser le ticket')).toBeInTheDocument()
  })

  it('should handle file selection', () => {
    render(<OCR />)
    
    const fileInput = screen.getByLabelText('Sélectionner une image de ticket')
    const file = new File(['test'], 'ticket.jpg', { type: 'image/jpeg' })
    
    fireEvent.change(fileInput, { target: { files: [file] } })
    
    expect(fileInput.files[0]).toBe(file)
  })

  it('should show loading state during OCR analysis', async () => {
    render(<OCR />)
    
    const fileInput = screen.getByLabelText('Sélectionner une image de ticket')
    const analyzeButton = screen.getByText('📸 Analyser le ticket')
    
    const file = new File(['test'], 'ticket.jpg', { type: 'image/jpeg' })
    fireEvent.change(fileInput, { target: { files: [file] } })
    
    fireEvent.click(analyzeButton)
    
    await waitFor(() => {
      expect(screen.getByText(/Analyse en cours/)).toBeInTheDocument()
    })
  })

  it('should display parsed ticket data', async () => {
    render(<OCR />)
    
    const fileInput = screen.getByLabelText('Sélectionner une image de ticket')
    const analyzeButton = screen.getByText('📸 Analyser le ticket')
    
    const file = new File(['test'], 'ticket.jpg', { type: 'image/jpeg' })
    fireEvent.change(fileInput, { target: { files: [file] } })
    
    fireEvent.click(analyzeButton)
    
    await waitFor(() => {
      expect(screen.getByText('📊 Analyse du ticket')).toBeInTheDocument()
      expect(screen.getByText('Super U')).toBeInTheDocument()
      expect(screen.getByText('🛒 Produits détectés')).toBeInTheDocument()
    })
  })
})

describe('Comparateur Component Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render comparateur interface correctly', () => {
    render(<Comparateur />)
    
    expect(screen.getByText('🛒 Comparer les prix / Panier malin')).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/Rechercher un produit/)).toBeInTheDocument()
    expect(screen.getByText('📤 Exporter')).toBeInTheDocument()
  })

  it('should handle product search', async () => {
    const { searchProducts } = await import('../a-ki-pri-sa-ye-functional/src/services/logic.js')
    
    render(<Comparateur />)
    
    const searchInput = screen.getByPlaceholderText(/Rechercher un produit/)
    const searchButton = screen.getByText('🔍 Rechercher')
    
    fireEvent.change(searchInput, { target: { value: 'banane' } })
    fireEvent.click(searchButton)
    
    await waitFor(() => {
      expect(searchProducts).toHaveBeenCalledWith('banane')
    })
  })

  it('should display search results', async () => {
    render(<Comparateur />)
    
    const searchInput = screen.getByPlaceholderText(/Rechercher un produit/)
    const searchButton = screen.getByText('🔍 Rechercher')
    
    fireEvent.change(searchInput, { target: { value: 'banane' } })
    fireEvent.click(searchButton)
    
    await waitFor(() => {
      expect(screen.getByText('Banane')).toBeInTheDocument()
      expect(screen.getByText('2.30€')).toBeInTheDocument()
      expect(screen.getByText('Carrefour')).toBeInTheDocument()
    })
  })

  it('should show export menu on click', async () => {
    render(<Comparateur />)
    
    const exportButton = screen.getByText('📤 Exporter')
    fireEvent.click(exportButton)
    
    await waitFor(() => {
      expect(screen.getByText('📊 CSV - Résultats')).toBeInTheDocument()
      expect(screen.getByText('📄 PDF - Résultats')).toBeInTheDocument()
    })
  })

  it('should handle export actions', async () => {
    const { exportService } = await import('../a-ki-pri-sa-ye-functional/src/services/exportService.js')
    
    render(<Comparateur />)
    
    // First search for products
    const searchInput = screen.getByPlaceholderText(/Rechercher un produit/)
    const searchButton = screen.getByText('🔍 Rechercher')
    
    fireEvent.change(searchInput, { target: { value: 'banane' } })
    fireEvent.click(searchButton)
    
    await waitFor(() => {
      expect(screen.getByText('Banane')).toBeInTheDocument()
    })
    
    // Then test export
    const exportButton = screen.getByText('📤 Exporter')
    fireEvent.click(exportButton)
    
    await waitFor(() => {
      const csvExportButton = screen.getByText('📊 CSV - Résultats')
      fireEvent.click(csvExportButton)
    })
    
    await waitFor(() => {
      expect(exportService.exportToCSV).toHaveBeenCalled()
    })
  })

  it('should handle price alerts', async () => {
    render(<Comparateur />)
    
    // Search for products first
    const searchInput = screen.getByPlaceholderText(/Rechercher un produit/)
    const searchButton = screen.getByText('🔍 Rechercher')
    
    fireEvent.change(searchInput, { target: { value: 'banane' } })
    fireEvent.click(searchButton)
    
    await waitFor(() => {
      const alertButton = screen.getByText('🔔 Alerte prix')
      fireEvent.click(alertButton)
    })
    
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Prix cible (€)')).toBeInTheDocument()
    })
  })
})

describe('App Performance', () => {
  it('should load components within reasonable time', async () => {
    const startTime = performance.now()
    
    render(<OCR />)
    
    const endTime = performance.now()
    const loadTime = endTime - startTime
    
    // Component should load in less than 100ms
    expect(loadTime).toBeLessThan(100)
  })

  it('should handle large product lists efficiently', async () => {
    // Mock large dataset
    const largeProductList = Array.from({ length: 1000 }, (_, i) => ({
      id: i.toString(),
      name: `Product ${i}`,
      brand: 'Test Brand',
      category: 'Test Category',
      prices: [{ store: 'Test Store', price: Math.random() * 10 }],
      best: { store: 'Test Store', price: Math.random() * 10 }
    }))

    const { searchProducts } = await import('../a-ki-pri-sa-ye-functional/src/services/logic.js')
    searchProducts.mockResolvedValue(largeProductList)
    
    const startTime = performance.now()
    
    render(<Comparateur />)
    
    const searchButton = screen.getByText('🔍 Rechercher')
    fireEvent.click(searchButton)
    
    await waitFor(() => {
      expect(searchProducts).toHaveBeenCalled()
    })
    
    const endTime = performance.now()
    const renderTime = endTime - startTime
    
    // Should handle large lists in under 1 second
    expect(renderTime).toBeLessThan(1000)
  })
})