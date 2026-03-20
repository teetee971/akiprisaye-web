/**
 * OpenPrices provider — stub
 *
 * Open Prices (https://prices.openfoodfacts.org) is the emerging
 * crowd-sourced price database from the Open Food Facts ecosystem.
 * The API is still maturing; this stub is ready to be wired once an
 * official endpoint stabilises.
 *
 * Return type mirrors the shape expected by products.service.ts so
 * this provider can be swapped in without touching the service layer.
 */

export interface OpenPriceProduct {
  id: string;
  name: string;
  barcode: string;
  image?: string;
  brand?: string;
  source: 'open_prices';
}

/**
 * Stub — always resolves to an empty list.
 * Replace the body with a real fetch once the Open Prices search API
 * is stable and has reliable DROM-COM territory coverage.
 *
 * @param _query - product name or barcode (unused until wired)
 */
export async function searchOpenPrices(_query: string): Promise<OpenPriceProduct[]> {
  // TODO: wire real endpoint
  // const res = await fetch(`https://prices.openfoodfacts.org/api/v1/prices?q=${encodeURIComponent(_query)}`);
  return [];
}
