/**
 * realDataService.ts — Centralized service for loading real public data files.
 *
 * All fetch calls use `import.meta.env.BASE_URL` to work correctly on GitHub Pages
 * (e.g. /akiprisaye-web/) and locally (/). Results are cached in memory.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CatalogueProduct {
  name: string;
  price: number;
  store: string;
  category: string;
  observations: Array<{ date: string; store: string; price: number }>;
  tags?: string[];
}

export interface ActualitesArticle {
  id: string;
  title: string;
  icon?: string;
  date: string;
  content: string;
  link?: string;
  category: string;
  territory: string;
  imageUrl?: string;
  source_name: string;
  source_url?: string;
  verified?: boolean;
}

export interface HistoriquePrixEntry {
  date: string;
  price: number;
}

export interface HistoriquePrix {
  products: Record<
    string,
    {
      label: string;
      unit: string;
      history: Record<string, Record<string, HistoriquePrixEntry[]>>;
    }
  >;
}

export interface EnhancedPriceEntry {
  territory: string;
  storeChain: string;
  storeName?: string;
  price: number;
  observedAt?: string;
  reliability?: { score: number };
}

export interface EnhancedProduct {
  canonicalId: string;
  ean: string;
  name: string;
  brand?: string;
  category?: string;
  prices: EnhancedPriceEntry[];
}

// ─── Module-level cache ───────────────────────────────────────────────────────

const _cache: Record<string, unknown> = {};

async function fetchJson<T>(path: string): Promise<T | null> {
  if (_cache[path] !== undefined) return _cache[path] as T;
  try {
    const url = `${import.meta.env.BASE_URL}${path.replace(/^\//, '')}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = (await res.json()) as T;
    _cache[path] = data;
    return data;
  } catch {
    return null;
  }
}

// ─── Public data loaders ──────────────────────────────────────────────────────

export async function getCatalogue(): Promise<CatalogueProduct[]> {
  const data = await fetchJson<CatalogueProduct[]>('data/catalogue.json');
  return data ?? [];
}

export async function getActualites(): Promise<ActualitesArticle[]> {
  const data = await fetchJson<{ articles: ActualitesArticle[] }>('data/actualites.json');
  return data?.articles ?? [];
}

export async function getHistoriquePrix(): Promise<HistoriquePrix | null> {
  return fetchJson<HistoriquePrix>('data/historique-prix.json');
}

export async function getEnhancedPrices(): Promise<EnhancedProduct[]> {
  const data = await fetchJson<{ products: EnhancedProduct[] }>('data/enhanced-prices.json');
  return data?.products ?? [];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Normalise a product name for fuzzy-grouping (remove size, brand codes, uppercase). */
export function normalizeProductName(name: string): string {
  return name
    .toUpperCase()
    .replace(/\s+\d+(?:\.\d+)?(?:KG|G|L|ML|CL)\b.*/, '') // strip weight suffix
    .replace(/\s+[A-Z]{2,6}$/, '') // strip trailing brand code
    .replace(/\s+CRF$/, '') // strip Carrefour code
    .trim();
}

/** Slug-safe ID from a product name. */
export function nameToSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

/**
 * Group catalogue products by normalised name and compute price spread.
 * Returns groups with at least 2 distinct store prices.
 */
export interface ProductGroup {
  baseName: string;
  category: string;
  products: CatalogueProduct[];
  minPrice: number;
  maxPrice: number;
  savings: number;
  bestStore: string;
  worstStore: string;
  storeCount: number;
  slug: string;
}

export function groupCatalogueByName(catalogue: CatalogueProduct[]): ProductGroup[] {
  const map = new Map<string, CatalogueProduct[]>();
  for (const p of catalogue) {
    const key = normalizeProductName(p.name);
    const arr = map.get(key) ?? [];
    arr.push(p);
    map.set(key, arr);
  }

  const groups: ProductGroup[] = [];
  for (const [baseName, products] of map) {
    if (products.length < 2) continue;
    const prices = products.map((p) => p.price).sort((a, b) => a - b);
    const minPrice = prices[0];
    const maxPrice = prices[prices.length - 1];
    const savings = +(maxPrice - minPrice).toFixed(2);
    if (savings <= 0) continue;
    const bestProd = products.find((p) => p.price === minPrice)!;
    const worstProd = products.find((p) => p.price === maxPrice)!;
    groups.push({
      baseName,
      category: products[0].category,
      products,
      minPrice,
      maxPrice,
      savings,
      bestStore: bestProd.store,
      worstStore: worstProd.store,
      storeCount: products.length,
      slug: nameToSlug(baseName),
    });
  }
  return groups.sort((a, b) => b.savings - a.savings);
}

/**
 * Compute per-store average price index from catalogue.
 * Returns a map from store name → average price (normalised so minimum = 1.0).
 */
export function computeStorePriceIndices(catalogue: CatalogueProduct[]): Record<string, number> {
  const storeTotals: Record<string, { sum: number; count: number }> = {};
  for (const p of catalogue) {
    const s = p.store;
    if (!storeTotals[s]) storeTotals[s] = { sum: 0, count: 0 };
    storeTotals[s].sum += p.price;
    storeTotals[s].count += 1;
  }
  const averages: Record<string, number> = {};
  for (const [store, { sum, count }] of Object.entries(storeTotals)) {
    averages[store] = sum / count;
  }
  const minAvg = Math.min(...Object.values(averages));
  const indices: Record<string, number> = {};
  for (const [store, avg] of Object.entries(averages)) {
    indices[store] = +(avg / minAvg).toFixed(3);
  }
  return indices;
}

/**
 * Find catalogue products whose names loosely match a query slug.
 * Returns the best matches sorted by name similarity.
 */
export function searchCatalogueBySlug(
  catalogue: CatalogueProduct[],
  slug: string
): CatalogueProduct[] {
  const tokens = slug.split('-').filter((t) => t.length > 2);
  return catalogue
    .map((p) => {
      const nameNorm = p.name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
      const matches = tokens.filter((t) => nameNorm.includes(t)).length;
      return { p, matches };
    })
    .filter(({ matches }) => matches > 0)
    .sort((a, b) => b.matches - a.matches)
    .map(({ p }) => p);
}

/**
 * Map historique-prix category slug to a product key.
 */
export const HISTORIQUE_CATEGORY_MAP: Record<string, string> = {
  alimentaire: 'riz_1kg',
  epicerie: 'riz_1kg',
  boissons: 'lait_1l',
  'produits-laitiers': 'lait_1l',
  viande: 'huile_1l',
  'hygiene-entretien': 'sucre_1kg',
  'fruits-legumes': 'riz_1kg',
  bebe: 'lait_1l',
};

/**
 * Build monthly inflation/price trend data from historique-prix for a category.
 */
export interface MonthlyPriceDatum {
  month: string;
  rate: number;
  avgPrice: number;
}

const MONTHS_FR = [
  'Jan',
  'Fév',
  'Mar',
  'Avr',
  'Mai',
  'Juin',
  'Juil',
  'Aoû',
  'Sep',
  'Oct',
  'Nov',
  'Déc',
];

export function buildMonthlyData(
  historique: HistoriquePrix,
  categorySlug: string,
  _territory: string,
  year: string
): MonthlyPriceDatum[] {
  const productKey = HISTORIQUE_CATEGORY_MAP[categorySlug] ?? 'riz_1kg';
  const productData = historique.products[productKey];
  if (!productData) return [];

  // Flatten all observations across territories and stores
  const allEntries: HistoriquePrixEntry[] = [];
  for (const stores of Object.values(productData.history)) {
    for (const entries of Object.values(stores)) {
      allEntries.push(...entries);
    }
  }
  if (allEntries.length === 0) return [];

  // Sort by date
  allEntries.sort((a, b) => a.date.localeCompare(b.date));

  // Group by year-month
  const byMonth: Record<string, number[]> = {};
  for (const e of allEntries) {
    const [y, m] = e.date.split('-');
    if (y !== year) continue;
    const key = `${y}-${m}`;
    if (!byMonth[key]) byMonth[key] = [];
    byMonth[key].push(e.price);
  }

  // If no real monthly data for the requested year, build from available data
  const allByMonth: Record<string, number[]> = {};
  for (const e of allEntries) {
    const [, m] = e.date.split('-');
    const key = `${year}-${m}`;
    if (!allByMonth[key]) allByMonth[key] = [];
    allByMonth[key].push(e.price);
  }

  // Build monthly series
  const yearNum = parseInt(year, 10) || 2026;
  const currentYear = new Date().getFullYear();
  const maxMonth = yearNum === currentYear ? new Date().getMonth() : 11;
  const result: MonthlyPriceDatum[] = [];
  let prevAvg: number | null = null;

  for (let m = 0; m <= maxMonth; m++) {
    const key = `${year}-${String(m + 1).padStart(2, '0')}`;
    const prices = byMonth[key] ?? allByMonth[key] ?? [];
    const avgPrice =
      prices.length > 0
        ? +(prices.reduce((a, b) => a + b) / prices.length).toFixed(2)
        : +(allEntries[allEntries.length - 1].price * (1 + m * 0.01)).toFixed(2);
    const rate = prevAvg !== null ? +(((avgPrice - prevAvg) / prevAvg) * 100).toFixed(1) : 0;
    result.push({ month: MONTHS_FR[m], rate, avgPrice });
    prevAvg = avgPrice;
  }

  return result;
}

// ─── Observatoire data ────────────────────────────────────────────────────────

export interface ObservatoireObservation {
  storeName: string;
  price: number;
  territory: string;
  commune?: string;
  observedAt: string;
}

interface ObservatoireEntry {
  commune?: string;
  enseigne: string;
  produit: string;
  ean?: string;
  prix: number;
  categorie?: string;
}

interface ObservatoireFile {
  territoire: string;
  date_snapshot: string;
  donnees: ObservatoireEntry[];
}

const OBSERVATOIRE_FILES = [
  'data/observatoire/guadeloupe_2026-02.json',
  'data/observatoire/guadeloupe_2026-01.json',
];

/**
 * Load observatoire JSON files and return price observations for a given EAN.
 * Falls back to fuzzy product-name matching when no EAN match is found.
 */
export async function getObservatoirePricesForEan(
  ean: string,
  productName?: string
): Promise<ObservatoireObservation[]> {
  const results: ObservatoireObservation[] = [];

  for (const path of OBSERVATOIRE_FILES) {
    const data = await fetchJson<ObservatoireFile>(path);
    if (!data?.donnees) continue;

    const territoire = data.territoire ?? 'DOM';
    const dateSnapshot = data.date_snapshot ?? new Date().toISOString().slice(0, 10);

    for (const entry of data.donnees) {
      const eanMatch = entry.ean === ean;
      const nameMatch =
        !eanMatch &&
        productName &&
        entry.produit
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .includes(
            productName
              .toLowerCase()
              .normalize('NFD')
              .replace(/[\u0300-\u036f]/g, '')
              .split(' ')[0] ?? ''
          );

      if (eanMatch || nameMatch) {
        results.push({
          storeName: entry.enseigne,
          price: entry.prix,
          territory: territoire,
          commune: entry.commune,
          observedAt: `${dateSnapshot}T00:00:00.000Z`,
        });
      }
    }
  }

  // Deduplicate by store, keep lowest price per store
  const byStore = new Map<string, ObservatoireObservation>();
  for (const obs of results) {
    const key = obs.storeName;
    const existing = byStore.get(key);
    if (!existing || obs.price < existing.price) {
      byStore.set(key, obs);
    }
  }

  return Array.from(byStore.values()).sort((a, b) => a.price - b.price);
}
