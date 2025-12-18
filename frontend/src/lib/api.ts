import { CivicNewsItem } from '../types/civic'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

export async function fetchNews(): Promise<CivicNewsItem[]> {
  const response = await fetch(`${API_BASE_URL}/api/news`)
  if (!response.ok) {
    throw new Error('Failed to fetch news')
  }
  return response.json()
}

export async function fetchPrices(product?: string, territory?: string) {
  const params = new URLSearchParams()
  if (product) params.set('product', product)
  if (territory) params.set('territory', territory)
  
  const response = await fetch(`${API_BASE_URL}/api/prices?${params}`)
  if (!response.ok) {
    throw new Error('Failed to fetch prices')
  }
  return response.json()
}
