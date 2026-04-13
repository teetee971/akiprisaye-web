/**
 * OpenPrices provider
 *
 * Open Prices (https://prices.openfoodfacts.org) is the crowd-sourced
 * price database from the Open Food Facts ecosystem.
 *
 * Two functions are exported:
 *  - searchOpenPrices        — product identity lookup (stub)
 *  - fetchPriceObservations  — real price rows by barcode
 */

export interface OpenPriceProduct {
  id: string;
  name: string;
  barcode: string;
  image?: string;
  brand?: string;
  source: 'open_prices';
}

/** A price observation row returned by this provider. */
export interface OpenPricesObservation {
  retailer: string;
  territory: string;
  price: number;
  currency: 'EUR';
  observedAt: string;
  source: 'open_prices';
}

// ─── Internal API types ───────────────────────────────────────────────────────

interface OpenPricesApiLocation {
  name?: string;
  country?: string;
  city?: string;
}

interface OpenPricesApiPrice {
  price?: number;
  currency?: string;
  date?: string;
  location?: OpenPricesApiLocation;
}

interface OpenPricesApiResponse {
  items?: OpenPricesApiPrice[];
}

interface OpenPricesProductApiItem {
  id?: string | number;
  code?: string;
  product_name?: string;
  product_name_fr?: string;
  image_url?: string;
  brands?: string;
}

interface OpenPricesProductSearchResponse {
  items?: OpenPricesProductApiItem[];
}

/** Timeout for all outbound Open Prices API requests (ms). */
const OPEN_PRICES_API_TIMEOUT_MS = 5000;

/**
 * Search for products by name or barcode using the Open Prices product endpoint.
 *
 * Uses the Open Food Facts / Open Prices products API at:
 *   https://prices.openfoodfacts.org/api/v1/products?search=<query>&page_size=10
 *
 * Returns an empty array on any network or parse error.
 *
 * @param query - product name or barcode
 */
export async function searchOpenPrices(query: string): Promise<OpenPriceProduct[]> {
  if (!query.trim()) return [];

  const encoded = encodeURIComponent(query.trim());
  const url = `https://prices.openfoodfacts.org/api/v1/products?search=${encoded}&page_size=10`;

  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'AKiPriSaYe/1.0 (contact@akiprisaye.fr)' },
      signal: AbortSignal.timeout(OPEN_PRICES_API_TIMEOUT_MS),
    });

    if (!res.ok) return [];

    const data = (await res.json()) as OpenPricesProductSearchResponse;

    return (data.items ?? [])
      .filter(
        (item): item is OpenPricesProductApiItem & { code: string } =>
          typeof item.code === 'string' && item.code.length > 0,
      )
      .map((item) => ({
        id: String(item.id ?? item.code),
        name: item.product_name_fr ?? item.product_name ?? item.code,
        barcode: item.code,
        image: item.image_url,
        brand: item.brands,
        source: 'open_prices' as const,
      }));
  } catch {
    return [];
  }
}

/**
 * Fetch crowd-sourced price observations for a given barcode from Open Prices.
 *
 * Filters to EUR-denominated rows only.  Returns an empty array on any
 * network or parse error so that the compare pipeline degrades gracefully.
 *
 * @param barcode   - EAN/UPC barcode of the product
 * @param territory - Caller territory code; used as default when the API
 *                    does not return a country for a location entry.
 */
export async function fetchPriceObservations(
  barcode: string,
  territory: string,
): Promise<OpenPricesObservation[]> {
  const encoded = encodeURIComponent(barcode);
  const url = `https://prices.openfoodfacts.org/api/v1/prices?product_code=${encoded}&page_size=20`;

  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'AKiPriSaYe/1.0 (contact@akiprisaye.fr)' },
      signal: AbortSignal.timeout(OPEN_PRICES_API_TIMEOUT_MS),
    });

    if (!res.ok) return [];

    const data = (await res.json()) as OpenPricesApiResponse;

    return (data.items ?? [])
      .filter(
        (item): item is OpenPricesApiPrice & { price: number; date: string } =>
          typeof item.price === 'number' &&
          item.currency === 'EUR' &&
          typeof item.date === 'string' &&
          item.date.length > 0,
      )
      .map((item) => ({
        retailer: item.location?.name ?? 'Enseigne inconnue',
        territory: item.location?.country ?? territory,
        price: item.price,
        currency: 'EUR' as const,
        observedAt: item.date,
        source: 'open_prices' as const,
      }));
  } catch {
    return [];
  }
}
