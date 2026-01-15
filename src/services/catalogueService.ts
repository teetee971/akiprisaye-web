// src/services/catalogueService.ts
// Catalogue service: small scaffolding for roadmap

export type Product = {
  id: string
  name: string
  sku?: string
  price?: number
  territory?: string
  [key: string]: any
}

// Fetch catalogue from a source (placeholder)
export async function fetchCatalogue(source?: string): Promise<Product[]> {
  // TODO: implement real fetching (HTTP, cloud storage, etc.)
  // For now return an empty array to allow other parts to compile.
  console.info('fetchCatalogue called', { source })
  return []
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
