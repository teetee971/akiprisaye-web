/**
 * API Client for A KI PRI SA YÉ
 * Handles communication with backend services
 */
import { CivicNewsItem, PriceRecord } from '../types/civic'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

/**
 * Fetch civic news items from public sources
 */
export async function fetchNews(): Promise<CivicNewsItem[]> {
  const response = await fetch(`${API_BASE_URL}/api/news`)
  if (!response.ok) {
    throw new Error('Failed to fetch news')
  }
  return response.json()
}

/**
 * Fetch price records with optional filters
 */
export async function fetchPrices(product?: string, territory?: string): Promise<PriceRecord[]> {
  const params = new URLSearchParams()
  if (product) params.set('product', product)
  if (territory) params.set('territory', territory)
  
  const response = await fetch(`${API_BASE_URL}/api/prices?${params}`)
  if (!response.ok) {
    throw new Error('Failed to fetch prices')
  }
  return response.json()
}

/**
 * Get price prediction for a product
 */
export async function fetchPricePrediction(product: string, territory?: string) {
  const params = new URLSearchParams({ product })
  if (territory) params.set('territory', territory)
  
  const response = await fetch(`${API_BASE_URL}/api/prices/prediction?${params}`)
  if (!response.ok) {
    throw new Error('Failed to fetch price prediction')
  }
  return response.json()
}

export default {
  fetchNews,
  fetchPrices,
  fetchPricePrediction
}
