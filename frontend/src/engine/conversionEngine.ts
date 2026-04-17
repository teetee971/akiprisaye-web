/**
 * conversionEngine.ts — Central conversion logic (V1)
 *
 * Pure functions: no side-effects, no external calls, no imports from React.
 * Use these helpers from any component or page that needs to drive affiliate clicks.
 *
 * RGPD: no PII, localStorage only via callers.
 */

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ConversionProduct {
  /** Unique identifier (barcode, slug, or name) */
  id: string;
  name: string;
  price?: number;
  /** 0–100 composite score from pipeline */
  score?: number;
  /** Fractional price drop vs previous price, 0–1 (e.g. 0.15 = -15%) */
  priceDrop?: number;
  /** Whether the product is trending (clicks / views signal) */
  trending?: boolean;
  /** Best retailer name */
  retailer?: string;
  /** Affiliate or detail URL */
  url?: string;
  category?: string;
  territory?: string;
}

export type DealBadge = '🔥 Prix en baisse' | '⭐ Top deal' | '📈 Populaire';

// ── Core functions ────────────────────────────────────────────────────────────

/**
 * Returns the single best product, sorted by score descending.
 * Returns undefined when the list is empty or no product has a score.
 */
export function getBestDeal(products: ConversionProduct[]): ConversionProduct | undefined {
  return [...products]
    .filter((p) => p.price != null && p.score != null)
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))[0];
}

/**
 * Returns an ordered array of dynamic badge labels for a product.
 * Callers render these however they like (UrgencyBadge, plain text, etc.).
 */
export function getBadges(product: ConversionProduct): DealBadge[] {
  const badges: DealBadge[] = [];
  if ((product.priceDrop ?? 0) > 0.1) badges.push('🔥 Prix en baisse');
  if ((product.score ?? 0) > 90) badges.push('⭐ Top deal');
  if (product.trending) badges.push('📈 Populaire');
  return badges;
}

/**
 * Returns true when a product qualifies for a retention price-drop alert
 * (priceDrop > 20% and the product is in the user's favorites list).
 */
export function shouldShowPriceDropAlert(
  product: ConversionProduct,
  favoriteIds: string[]
): boolean {
  return (product.priceDrop ?? 0) > 0.2 && favoriteIds.includes(product.id);
}

/**
 * Sorts products by score descending, best first.
 * Products without a score are pushed to the bottom.
 */
export function sortByScore(products: ConversionProduct[]): ConversionProduct[] {
  return [...products].sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
}
