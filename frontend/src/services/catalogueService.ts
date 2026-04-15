 
// src/services/catalogueService.ts
// Catalogue service: fetch and validate product catalogue data

export type Product = {
  id: string
  name: string
  sku?: string
  price?: number
  territory?: string
  [key: string]: any
}

export type CatalogueItemRaw = Product

/**
 * Fetch catalogue from the static JSON asset served at /data/catalogue.json.
 * Falls back to an empty array on network or parse errors so callers degrade gracefully.
 */
export async function fetchCatalogue(source?: string): Promise<Product[]> {
  const url = source ?? '/data/catalogue.json';
  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.warn('[catalogueService] HTTP error fetching catalogue', response.status, url);
      return [];
    }
    const data: unknown = await response.json();
    if (!Array.isArray(data)) {
      console.warn('[catalogueService] Expected array, got:', typeof data);
      return [];
    }
    return data as Product[];
  } catch (error) {
    console.error('[catalogueService] Failed to fetch catalogue:', error);
    return [];
  }
}

// Basic validation of catalogue entries
export function validateCatalogue(records: Product[]): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  records.forEach((r, i) => {
    if (!r.id) errors.push(`row:${i} missing id`)
    if (!r.name) errors.push(`row:${i} missing name`)
    // add more checks as needed
  })

  return { valid: errors.length === 0, errors }
}

// Index products for fast lookup (in-memory map)
export function indexProducts(records: Product[]): Record<string, Product> {
  return records.reduce<Record<string, Product>>((acc, p) => {
    if (p.id) acc[p.id] = p
    return acc
  }, {})
}

export default {
  fetchCatalogue,
  validateCatalogue,
  indexProducts,
}
