/**
 * All-Price Aggregator Service
 *
 * Récupère les prix depuis TOUTES les sources disponibles :
 *  1. /api/web-price     → Google Shopping (sites marchands web via SerpAPI)
 *  2. /api/local-price   → Firestore (prix internes + historique)
 *  3. /api/observations  → Contributions citoyennes
 *  4. /api/prices/realtime → Prix temps-réel de la base interne
 *  5. Open Food Facts    → Informations produit (nom, image, marque)
 *
 * Retourne une liste unifiée de prix triée du moins cher au plus cher,
 * avec la source clairement identifiée pour chaque entrée.
 */

export type PriceSource =
  | 'web_merchant'   // Sites marchands (Google Shopping / SerpAPI)
  | 'firestore'      // Base Firestore interne
  | 'observation'    // Contribution citoyenne
  | 'realtime'       // Prix temps-réel API interne
  | 'retailer'       // Prix directs enseignes (Courses U, Leclerc, Carrefour, etc.)
  | 'fallback';      // Données de secours locales

export interface AggregatedPrice {
  id: string;
  merchant: string;       // Nom du magasin / site / enseigne
  price: number;          // Prix en EUR
  currency: 'EUR';
  isPromo: boolean;
  url?: string;           // Lien direct (sites marchands uniquement)
  observedAt: string;     // ISO date
  source: PriceSource;
  reliability: number;    // 0-1, 1 = très fiable
  territory?: string;
}

export interface ProductInfo {
  name: string;
  brand?: string;
  imageUrl?: string;
  quantity?: string;
  categories?: string[];
  /** Nutri-Score grade: 'a' | 'b' | 'c' | 'd' | 'e' */
  nutriScore?: string;
  /** NOVA group (food processing level): 1–4 */
  novaGroup?: number;
  /** Short ingredient text (fr) */
  ingredients?: string;
}

export interface AggregationResult {
  ean: string;
  query: string;
  product: ProductInfo | null;
  prices: AggregatedPrice[];
  bestPrice: AggregatedPrice | null;
  sources: PriceSource[];
  fetchedAt: string;
  warnings: string[];
}

const TIMEOUT_MS = 7000;

async function fetchWithTimeout(url: string, signal?: AbortSignal): Promise<Response> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    return await fetch(url, {
      headers: { Accept: 'application/json' },
      signal: signal ?? ctrl.signal,
    });
  } finally {
    clearTimeout(timer);
  }
}

// ---------------------------------------------------------------------------
// Source 1 — Google Shopping via /api/web-price
// ---------------------------------------------------------------------------
async function fetchWebMerchantPrices(
  query: string,
  territory: string,
  signal?: AbortSignal,
): Promise<AggregatedPrice[]> {
  try {
    const params = new URLSearchParams({ q: query, territory });
    const res = await fetchWithTimeout(`/api/web-price?${params.toString()}`, signal);
    if (!res.ok) return [];
    const payload = await res.json() as {
      ok?: boolean;
      results?: Array<{ title?: string; merchant?: string; price?: number; url?: string }>;
      warning?: string;
    };
    if (!payload.ok || !Array.isArray(payload.results)) return [];
    return payload.results
      .filter((r) => typeof r.price === 'number' && r.price > 0)
      .map((r, i) => ({
        id: `web-${i}`,
        merchant: r.merchant ?? r.title ?? 'Marchand web',
        price: r.price as number,
        currency: 'EUR' as const,
        isPromo: false,
        url: r.url,
        observedAt: new Date().toISOString(),
        source: 'web_merchant' as PriceSource,
        reliability: 0.75,
        territory,
      }));
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// Source 2 — Firestore via /api/local-price
// ---------------------------------------------------------------------------
async function fetchFirestorePrices(
  barcode: string,
  territory: string,
  signal?: AbortSignal,
): Promise<{ prices: AggregatedPrice[]; productName?: string }> {
  try {
    const params = new URLSearchParams({ barcode, territory, days: '30' });
    const res = await fetchWithTimeout(`/api/local-price?${params.toString()}`, signal);
    if (!res.ok) return { prices: [] };
    const payload = await res.json() as {
      ok?: boolean;
      product?: { name?: string; imageUrl?: string };
      aggregate?: {
        min?: number | null;
        median?: number | null;
        max?: number | null;
        sampleCount?: number;
        lastObservedAt?: number | null;
      };
      timeseries?: Array<{ date: string; median?: number | null; sampleCount?: number }>;
    };
    if (!payload.ok) return { prices: [] };

    const prices: AggregatedPrice[] = [];
    const agg = payload.aggregate;

    if (agg?.median != null) {
      const observedAt = agg.lastObservedAt ? new Date(agg.lastObservedAt).toISOString() : new Date().toISOString();
      prices.push({
        id: 'firestore-median',
        merchant: 'Prix médian local (base interne)',
        price: agg.median,
        currency: 'EUR',
        isPromo: false,
        observedAt,
        source: 'firestore',
        reliability: 0.9,
        territory,
      });
      if (agg.min != null && agg.min !== agg.median) {
        prices.push({
          id: 'firestore-min',
          merchant: 'Meilleur prix local observé',
          price: agg.min,
          currency: 'EUR',
          isPromo: true,
          observedAt,
          source: 'firestore',
          reliability: 0.85,
          territory,
        });
      }
    }
    return { prices, productName: payload.product?.name };
  } catch {
    return { prices: [] };
  }
}

// ---------------------------------------------------------------------------
// Source 3 — Contributions citoyennes via /api/observations
// ---------------------------------------------------------------------------
async function fetchObservationPrices(
  barcode: string,
  territory: string,
  signal?: AbortSignal,
): Promise<AggregatedPrice[]> {
  try {
    const params = new URLSearchParams({ barcode, territory });
    const res = await fetchWithTimeout(`/api/observations?${params.toString()}`, signal);
    if (!res.ok) return [];
    const payload = await res.json() as {
      observations?: Array<{
        id: string;
        storeName?: string | null;
        storeId?: string | null;
        price: number;
        observedAt: string;
        source?: string;
      }>;
    };
    if (!Array.isArray(payload.observations)) return [];

    // Deduplicate by store — keep latest observation
    const byStore = new Map<string, AggregatedPrice>();
    for (const obs of payload.observations) {
      const storeKey = obs.storeId ?? obs.storeName ?? obs.id;
      const existing = byStore.get(storeKey);
      if (!existing || obs.observedAt > existing.observedAt) {
        byStore.set(storeKey, {
          id: `obs-${obs.id}`,
          merchant: obs.storeName ?? obs.storeId ?? 'Contribution citoyenne',
          price: obs.price,
          currency: 'EUR',
          isPromo: false,
          observedAt: obs.observedAt,
          source: 'observation',
          reliability: obs.source === 'partner' ? 0.9 : 0.7,
          territory,
        });
      }
    }
    return Array.from(byStore.values());
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// Source 4 — Temps réel via /api/prices/realtime
// ---------------------------------------------------------------------------
async function fetchRealtimePrices(
  ean: string,
  territory: string,
  signal?: AbortSignal,
): Promise<AggregatedPrice[]> {
  try {
    // Pass ean + territory so the endpoint filters server-side on OpenPrices
    const params = new URLSearchParams({ ean, territory });
    const res = await fetchWithTimeout(`/api/prices/realtime?${params.toString()}`, signal);
    if (!res.ok) return [];
    const payload = await res.json() as {
      items?: Array<{
        productId?: string;
        productLabel?: string;
        territory?: string;
        price?: number;
        source?: string;
        observedAt?: string | null;
        isDiscounted?: boolean;
        locationId?: string;
      }>;
    };
    if (!Array.isArray(payload.items)) return [];
    return payload.items
      .filter((item) => {
        const matchesEan = !item.productId || item.productId === ean;
        const matchesTerritory = !territory || !item.territory || item.territory.toLowerCase() === territory.toLowerCase();
        return matchesEan && matchesTerritory && typeof item.price === 'number' && item.price > 0;
      })
      .map((item, i) => ({
        id: `rt-${i}`,
        merchant: item.locationId ? `Magasin #${item.locationId}` : (item.source ?? 'Prix temps réel'),
        price: item.price as number,
        currency: 'EUR',
        isPromo: item.isDiscounted === true,
        observedAt: item.observedAt ?? new Date().toISOString(),
        source: 'realtime' as PriceSource,
        reliability: 0.85,
        territory,
      }));
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// Source 5 — Retailer Search (direct enseigne prices)
// ---------------------------------------------------------------------------
async function fetchRetailerSearchPrices(
  query: string,
  territory: string,
  signal?: AbortSignal,
): Promise<AggregatedPrice[]> {
  try {
    const params = new URLSearchParams({
      retailer: 'all',
      q: query,
      territory,
      pageSize: '8',
      sort: 'price_asc',
    });
    const res = await fetchWithTimeout(`/api/retailer-search?${params.toString()}`, signal);
    if (!res.ok) return [];
    const payload = await res.json() as {
      status?: string;
      results?: Array<{
        title?: string;
        brand?: string;
        price?: number;
        currency?: string;
        pageUrl?: string;
        imageUrl?: string;
      }>;
    };
    if (!Array.isArray(payload.results)) return [];
    return payload.results
      .filter((r) => typeof r.price === 'number' && r.price > 0)
      .map((r, i) => ({
        id: `retailer-${i}`,
        merchant: r.brand ? `${r.brand} (enseigne)` : (r.title ?? 'Enseigne'),
        price: r.price as number,
        currency: 'EUR' as const,
        isPromo: false,
        url: r.pageUrl,
        observedAt: new Date().toISOString(),
        source: 'retailer' as PriceSource,
        reliability: 0.85,
        territory,
      }));
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// Source 6 — Open Food Facts (infos produit)
// ---------------------------------------------------------------------------
async function fetchProductInfo(barcode: string): Promise<ProductInfo | null> {
  try {
    const res = await fetch(
      `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(barcode)}.json`,
      { headers: { Accept: 'application/json' } },
    );
    if (!res.ok) return null;
    const payload = await res.json() as {
      status?: number;
      product?: {
        product_name_fr?: string;
        product_name?: string;
        brands?: string;
        image_front_url?: string;
        image_url?: string;
        quantity?: string;
        categories_tags?: string[];
        nutriscore_grade?: string;
        nova_group?: number;
        ingredients_text_fr?: string;
        ingredients_text?: string;
      };
    };
    if (payload.status !== 1 || !payload.product) return null;
    const p = payload.product;
    const rawIngredients = (p.ingredients_text_fr || p.ingredients_text || '').trim();
    return {
      name: (p.product_name_fr || p.product_name || '').trim() || `Produit ${barcode}`,
      brand: p.brands,
      imageUrl: p.image_front_url || p.image_url,
      quantity: p.quantity,
      categories: Array.isArray(p.categories_tags) ? p.categories_tags.slice(0, 5) : [],
      nutriScore: p.nutriscore_grade ? p.nutriscore_grade.toUpperCase() : undefined,
      novaGroup: p.nova_group ?? undefined,
      ingredients: rawIngredients ? rawIngredients.slice(0, 300) : undefined,
    };
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Main aggregator
// ---------------------------------------------------------------------------

/**
 * Fetch and aggregate prices from ALL available sources.
 *
 * @param ean      EAN barcode (8–14 digits)
 * @param query    Human-readable query (product name or barcode string)
 * @param territory  Territory code ('gp', 'mq', 'gf', 're', 'yt', 'fr')
 * @param signal   Optional AbortSignal for cancellation
 */
export async function aggregateAllPrices(
  ean: string,
  query: string,
  territory = 'gp',
  signal?: AbortSignal,
): Promise<AggregationResult> {
  const warnings: string[] = [];

  // Fire all sources in parallel
  const [webPrices, { prices: firestorePrices, productName: firestoreProductName }, observationPrices, realtimePrices, retailerPrices, productInfo] =
    await Promise.all([
      fetchWebMerchantPrices(query || ean, territory, signal),
      fetchFirestorePrices(ean, territory, signal),
      fetchObservationPrices(ean, territory, signal),
      fetchRealtimePrices(ean, territory, signal),
      fetchRetailerSearchPrices(query || ean, territory, signal),
      fetchProductInfo(ean),
    ]);

  if (webPrices.length === 0) warnings.push('Prix marchands web indisponibles (clé SerpAPI non configurée ou hors ligne)');
  if (firestorePrices.length === 0) warnings.push('Base Firestore indisponible pour ce produit');
  if (observationPrices.length === 0) warnings.push('Aucune observation citoyenne enregistrée pour ce produit');

  // Merge all prices
  const allPrices = [...webPrices, ...firestorePrices, ...observationPrices, ...realtimePrices, ...retailerPrices];

  // Deduplicate: if same merchant + same price (rounded to cent), keep most reliable
  const deduped = new Map<string, AggregatedPrice>();
  for (const p of allPrices) {
    const key = `${p.merchant.toLowerCase().replace(/\s+/g, '_')}-${p.price.toFixed(2)}`;
    const existing = deduped.get(key);
    if (!existing || p.reliability > existing.reliability) {
      deduped.set(key, p);
    }
  }

  const prices = Array.from(deduped.values()).sort((a, b) => a.price - b.price);

  const product: ProductInfo | null = productInfo ?? (firestoreProductName ? { name: firestoreProductName } : null);
  const bestPrice = prices.length > 0 ? prices[0] : null;
  const sources = [...new Set(prices.map((p) => p.source))];

  return {
    ean,
    query: query || ean,
    product,
    prices,
    bestPrice,
    sources,
    fetchedAt: new Date().toISOString(),
    warnings,
  };
}
