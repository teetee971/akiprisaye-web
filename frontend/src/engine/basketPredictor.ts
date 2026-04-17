/**
 * basketPredictor.ts — Best-basket predictor (V3)
 *
 * Given a list of products with per-retailer prices, finds which retailer
 * minimises the total basket cost.
 *
 * MVP version:
 *   - Groups products by retailer and sums their prices
 *   - Returns retailers sorted cheapest-first
 *
 * Advanced version (same module):
 *   - Mixed-retailer baskets (buy product A from retailer 1, B from retailer 2)
 *   - Threshold filter: only worth switching if saving > MIN_SAVING_EUR
 */

// ── Types ─────────────────────────────────────────────────────────────────────

export interface BasketItem {
  /** Product name */
  name: string;
  /** Canonical retailer name */
  retailer: string;
  /** Price in EUR for this product at this retailer */
  price: number;
  /** Optional: product category */
  category?: string;
}

export interface BasketResult {
  /** Retailer name */
  retailer: string;
  /** Total basket cost at this retailer in EUR */
  totalCost: number;
  /** Number of products available at this retailer */
  availableCount: number;
  /** Products covered by this retailer */
  products: { name: string; price: number }[];
}

export interface MixedBasketResult {
  /** Total cost when buying each product from its cheapest retailer */
  totalCost: number;
  /** Saving versus the single most expensive full basket */
  saving: number;
  /** Per-product best assignments */
  assignments: { name: string; retailer: string; price: number }[];
}

// ── Simple basket predictor ───────────────────────────────────────────────────

/**
 * Predict the cheapest single-retailer basket.
 *
 * @param products  Flat list of basket items (one row per product×retailer combo)
 * @returns         Retailers sorted by total basket cost, cheapest first
 *
 * @example
 * const result = predictBestBasket([
 *   { name: 'Lait', retailer: 'Carrefour',  price: 1.20 },
 *   { name: 'Lait', retailer: 'E.Leclerc',  price: 1.05 },
 *   { name: 'Riz',  retailer: 'Carrefour',  price: 2.30 },
 *   { name: 'Riz',  retailer: 'E.Leclerc',  price: 2.50 },
 * ]);
 * // → [{ retailer: 'E.Leclerc', totalCost: 3.55, ... }, ...]
 */
export function predictBestBasket(products: BasketItem[]): BasketResult[] {
  // Group by retailer
  const grouped = new Map<string, BasketItem[]>();
  for (const item of products) {
    if (!grouped.has(item.retailer)) grouped.set(item.retailer, []);
    grouped.get(item.retailer)!.push(item);
  }

  const results: BasketResult[] = [];

  for (const [retailer, items] of grouped) {
    const totalCost = items.reduce((sum, i) => sum + i.price, 0);
    results.push({
      retailer,
      totalCost: parseFloat(totalCost.toFixed(2)),
      availableCount: items.length,
      products: items.map(({ name, price }) => ({ name, price })),
    });
  }

  return results.sort((a, b) => a.totalCost - b.totalCost);
}

// ── Mixed-basket predictor ────────────────────────────────────────────────────

/**
 * Predict the optimal mixed basket (buy each product from its cheapest retailer).
 *
 * @param products      Full price matrix (one row per product×retailer combo)
 * @param minSaving     Minimum saving (€) to report — avoids recommending
 *                      trivial switches (default 0.50 €)
 */
export function predictMixedBasket(
  products: BasketItem[],
  minSaving = 0.5
): MixedBasketResult | null {
  // Find the cheapest retailer for each unique product
  const bestByProduct = new Map<string, BasketItem>();
  for (const item of products) {
    const existing = bestByProduct.get(item.name);
    if (!existing || item.price < existing.price) {
      bestByProduct.set(item.name, item);
    }
  }

  const assignments = [...bestByProduct.values()].map(({ name, retailer, price }) => ({
    name,
    retailer,
    price,
  }));

  const mixedTotal = assignments.reduce((sum, a) => sum + a.price, 0);

  // Compare with the most expensive single-retailer basket
  const singleBaskets = predictBestBasket(products);
  const worstCost = singleBaskets[singleBaskets.length - 1]?.totalCost ?? mixedTotal;
  const saving = parseFloat((worstCost - mixedTotal).toFixed(2));

  if (saving < minSaving) return null;

  return {
    totalCost: parseFloat(mixedTotal.toFixed(2)),
    saving,
    assignments,
  };
}

/**
 * Format a basket result into a human-readable summary line.
 */
export function formatBasketSummary(result: BasketResult): string {
  return `${result.retailer} — ${result.totalCost.toFixed(2).replace('.', ',')} € (${result.availableCount} produits)`;
}
