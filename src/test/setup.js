import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock Firebase
const mockFirestore = {
  collection: () => ({
    add: () => Promise.resolve({ id: 'mock-id' }),
    doc: () => ({
      set: () => Promise.resolve(),
      get: () => Promise.resolve({ data: () => ({}) }),
    }),
    getDocs: () => Promise.resolve({
      docs: []
    })
  })
}

global.db = mockFirestore

// Mock Tesseract
global.Tesseract = {
  recognize: () => Promise.resolve({
    data: { text: 'Mock OCR text\nBanane 2.50€\nRiz 1.20€' }
  })
}

// Mock notifications
Object.defineProperty(window, 'Notification', {
  value: class MockNotification {
    constructor(title, options) {
      this.title = title
      this.options = options
    }
    close() {}
    static requestPermission = () => Promise.resolve('granted')
    static permission = 'granted'
  }
})

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}
global.localStorage = localStorageMock

// Mock fetch
global.fetch = vi.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({
      products: [
        {
          id: '1',
          name: 'Banane',
          brand: 'Local',
          category: 'Fruits',
          prices: [
            { store: 'Super U', price: 2.50 },
            { store: 'Carrefour', price: 2.30 }
          ]
        }
      ]
    }),
  })
)