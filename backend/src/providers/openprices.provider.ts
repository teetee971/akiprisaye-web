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

// ─── Public functions ─────────────────────────────────────────────────────────

/**
 * Stub — always resolves to an empty list.
 * Replace the body with a real fetch once the Open Prices search API
 * is stable and has reliable DROM-COM territory coverage.
 *
 * @param _query - product name or barcode (unused until wired)
 */
export async function searchOpenPrices(_query: string): Promise<OpenPriceProduct[]> {
  return [];
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
      signal: AbortSignal.timeout(5000),
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
