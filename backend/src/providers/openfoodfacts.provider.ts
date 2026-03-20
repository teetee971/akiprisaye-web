/**
 * OpenFoodFacts provider
 *
 * Fetches product identity (name, barcode, image) from the public
 * OpenFoodFacts API.  Price data is NOT returned here — OFF is only
 * used for product enrichment.
 *
 * Docs: https://wiki.openfoodfacts.org/API
 */

export interface OffProduct {
  id: string;
  name: string;
  barcode: string;
  image?: string;
  brand?: string;
  source: 'open_food_facts';
}

interface OffApiProduct {
  id?: string;
  _id?: string;
  code?: string;
  product_name?: string;
  generic_name?: string;
  image_front_url?: string;
  image_url?: string;
  brands?: string;
}

/**
 * Search OpenFoodFacts by product name or barcode.
 * Returns up to 10 deduplicated results.
 */
export async function searchOpenFoodFacts(query: string): Promise<OffProduct[]> {
  const encoded = encodeURIComponent(query);
  const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encoded}&search_simple=1&json=1&page_size=10`;

  const res = await fetch(url, {
    headers: { 'User-Agent': 'AKiPriSaYe/1.0 (contact@akiprisaye.fr)' },
    signal: AbortSignal.timeout(5000),
  });

  if (!res.ok) throw new Error(`OpenFoodFacts ${res.status}`);

  const data = (await res.json()) as { products?: OffApiProduct[] };

  return (data.products ?? []).map((p) => ({
    id:     p.id ?? p._id ?? p.code ?? '',
    name:   p.product_name ?? p.generic_name ?? 'Produit inconnu',
    barcode: p.code ?? '',
    image:  p.image_front_url ?? p.image_url ?? undefined,
    brand:  p.brands ?? undefined,
    source: 'open_food_facts' as const,
  }));
}

/**
 * Lookup a single product by barcode (EAN).
 * Returns null if not found.
 */
export async function lookupByBarcode(barcode: string): Promise<OffProduct | null> {
  const url = `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(barcode)}.json`;

  const res = await fetch(url, {
    headers: { 'User-Agent': 'AKiPriSaYe/1.0 (contact@akiprisaye.fr)' },
    signal: AbortSignal.timeout(5000),
  });

  if (!res.ok) return null;

  const data = (await res.json()) as { status: number; product?: OffApiProduct };
  if (data.status !== 1 || !data.product) return null;

  const p = data.product;
  return {
    id:     p.id ?? p._id ?? p.code ?? barcode,
    name:   p.product_name ?? p.generic_name ?? 'Produit inconnu',
    barcode,
    image:  p.image_front_url ?? p.image_url ?? undefined,
    brand:  p.brands ?? undefined,
    source: 'open_food_facts' as const,
  };
}
