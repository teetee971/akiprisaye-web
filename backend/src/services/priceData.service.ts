import { PriceRecord } from '../types/civic'

/**
 * Price Data Service
 * Handles fetching and managing price records from public sources
 */

// Mock data for demonstration - in production, this would fetch from official APIs
export const mockPriceData: PriceRecord[] = [
  {
    product: "Lait UHT 1L",
    territory: "Guadeloupe",
    price: 1.85,
    date: "2025-11-01",
    source: {
      name: "DGCCRF",
      url: "https://www.economie.gouv.fr/dgccrf"
    }
  },
  {
    product: "Lait UHT 1L",
    territory: "Guadeloupe",
    price: 1.79,
    date: "2025-11-15",
    source: {
      name: "DGCCRF",
      url: "https://www.economie.gouv.fr/dgccrf"
    }
  }
]

/**
 * Get price records with optional filters
 */
export async function getPriceRecords(product?: string, territory?: string): Promise<PriceRecord[]> {
  let filteredPrices = mockPriceData
  
  if (product) {
    filteredPrices = filteredPrices.filter(p => p.product === product)
  }
  
  if (territory) {
    filteredPrices = filteredPrices.filter(p => p.territory === territory)
  }
  
  return filteredPrices
}
