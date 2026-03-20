/**
 * OpenFoodFacts provider
 *
 * Fetches product identity (name, barcode, image, brand, category) from the
 * public OpenFoodFacts API.  Price data is NOT returned here — OFF is only
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
  category?: string;
  source: 'open_food_facts';
}

/** Partial product used for enrichment — all fields optional except barcode. */
export interface OffEnrichable {
  barcode: string;
  image?: string;
  brand?: string;
  category?: string;
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
  categories_tags?: string[];
}

/** Extract the first human-readable category label from OFF categories_tags. */
function extractCategory(tags: string[] | undefined): string | undefined {
  if (!tags || tags.length === 0) return undefined;
  // OFF tags look like "en:beverages" or "fr:boissons" — strip the lang prefix.
  const tag = tags[0];
  const colon = tag.indexOf(':');
  return colon >= 0 ? tag.slice(colon + 1) : tag;
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
    id:       p.id ?? p._id ?? p.code ?? '',
    name:     p.product_name ?? p.generic_name ?? 'Produit inconnu',
    barcode:  p.code ?? '',
    image:    p.image_front_url ?? p.image_url ?? undefined,
    brand:    p.brands ?? undefined,
    category: extractCategory(p.categories_tags),
    source:   'open_food_facts' as const,
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
    id:       p.id ?? p._id ?? p.code ?? barcode,
    name:     p.product_name ?? p.generic_name ?? 'Produit inconnu',
    barcode,
    image:    p.image_front_url ?? p.image_url ?? undefined,
    brand:    p.brands ?? undefined,
    category: extractCategory(p.categories_tags),
    source:   'open_food_facts' as const,
  };
}

/**
 * Enrich a partial product record with missing image / brand / category from
 * OpenFoodFacts.  Fields that are already set are left untouched.
 *
 * Returns `null` on any network or parse error so callers can degrade
 * gracefully.
 *
 * @param partial - The product to enrich; must have a valid barcode.
 */
export async function enrichProduct(partial: OffEnrichable): Promise<OffProduct | null> {
  // Nothing to enrich if all fields are already present.
  if (partial.image && partial.brand && partial.category) return null;

  try {
    const found = await lookupByBarcode(partial.barcode);
    if (!found) return null;

    return {
      ...found,
      // Prefer the values we already have over what OFF returns.
      image:    partial.image    ?? found.image,
      brand:    partial.brand    ?? found.brand,
      category: partial.category ?? found.category,
    };
  } catch {
    return null;
  }
}
