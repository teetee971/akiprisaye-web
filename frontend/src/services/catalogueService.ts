// src/services/catalogueService.ts
// Catalogue service: small scaffolding for roadmap

export type Product = {
  id: string;
  name: string;
  sku?: string;
  price?: number;
  territory?: string;
  [key: string]: any;
};

export type CatalogueItemRaw = Product;

// In-memory cache to avoid redundant network fetches within a session
const _cache: Map<string, Product[]> = new Map();

/**
 * Fetch catalogue from an HTTP source or the bundled data JSON.
 * Falls back to empty array on any network / parse error.
 */
export async function fetchCatalogue(source?: string): Promise<Product[]> {
  const url = source ?? '/data/catalogue-prices.json';

  const cached = _cache.get(url);
  if (cached) return cached;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.warn('[catalogueService] fetchCatalogue: non-OK response', response.status, url);
      return [];
    }

    const raw: unknown = await response.json();

    // Accept both a direct array or an object wrapping { products: [] }
    let records: Product[] = [];
    if (Array.isArray(raw)) {
      records = raw as Product[];
    } else if (
      raw &&
      typeof raw === 'object' &&
      Array.isArray((raw as Record<string, unknown>).products)
    ) {
      records = (raw as Record<string, unknown>).products as Product[];
    } else if (
      raw &&
      typeof raw === 'object' &&
      Array.isArray((raw as Record<string, unknown>).items)
    ) {
      records = (raw as Record<string, unknown>).items as Product[];
    }

    _cache.set(url, records);
    return records;
  } catch (error) {
    console.warn('[catalogueService] fetchCatalogue error', error);
    return [];
  }
}

/** Clear the in-memory session cache (useful for tests or forced refresh). */
export function clearCatalogueCache(): void {
  _cache.clear();
}

// Basic validation of catalogue entries
export function validateCatalogue(records: Product[]): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  records.forEach((r, i) => {
    if (!r.id) errors.push(`row:${i} missing id`);
    if (!r.name) errors.push(`row:${i} missing name`);
    // add more checks as needed
  });

  return { valid: errors.length === 0, errors };
}

// Index products for fast lookup (in-memory map)
export function indexProducts(records: Product[]): Record<string, Product> {
  return records.reduce<Record<string, Product>>((acc, p) => {
    if (p.id) acc[p.id] = p;
    return acc;
  }, {});
}

export default {
  fetchCatalogue,
  clearCatalogueCache,
  validateCatalogue,
  indexProducts,
};
