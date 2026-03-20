/**
 * Products aggregation service
 *
 * Merges results from multiple providers (OpenFoodFacts, OpenPrices)
 * and deduplicates by barcode.  Handles partial provider failures
 * gracefully — a failed provider never breaks the response.
 */

import { searchOpenFoodFacts, lookupByBarcode } from '../providers/openfoodfacts.provider.js';
import { searchOpenPrices } from '../providers/openprices.provider.js';

export interface AggregatedProduct {
  id: string;
  name: string;
  barcode: string;
  image?: string;
  brand?: string;
  category?: string;
  source: string;
}

/**
 * Detect whether a string looks like an EAN-8, EAN-13, or similar barcode.
 */
function isBarcode(query: string): boolean {
  return /^\d{8,14}$/.test(query.trim());
}

/**
 * Search across all configured providers and return a deduplicated list.
 * If the query is a barcode, the OpenFoodFacts product-by-EAN endpoint is
 * tried first for a faster, more accurate lookup.
 */
export async function searchProducts(query: string): Promise<AggregatedProduct[]> {
  const trimmed = query.trim();

  // Fast path for barcode lookups
  if (isBarcode(trimmed)) {
    try {
      const product = await lookupByBarcode(trimmed);
      if (product) return [product];
    } catch {
      // fall through to full search
    }
  }

  const [offResult, opResult] = await Promise.allSettled([
    searchOpenFoodFacts(trimmed),
    searchOpenPrices(trimmed),
  ]);

  const offProducts = offResult.status === 'fulfilled' ? offResult.value : [];
  const opProducts  = opResult.status  === 'fulfilled' ? opResult.value  : [];

  const merged: AggregatedProduct[] = [...offProducts, ...opProducts];

  // Deduplicate by barcode, then by name
  const seen = new Set<string>();
  return merged.filter((p) => {
    const key = p.barcode || p.name;
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
