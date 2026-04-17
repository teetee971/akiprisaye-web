/**
 * scoreEnseigneService.ts — Score "vie chère" par enseigne
 *
 * Calcule, à partir des données catalogue-prices.json et hexagone-prices.json,
 * un indice moyen de surcoût par enseigne DOM, sur le panier de produits communs.
 *
 * Résultat : classement des enseignes du moins cher au plus cher,
 * par territoire, avec score global.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CatalogueEntry {
  ean?: string;
  productName?: string;
  territory: string;
  retailer: string;
  price: number;
  priceRef?: number;
  ecartPercent?: number;
}

export interface EnseigneScore {
  retailer: string;
  territory: string;
  /** Nombre de produits communs dans le panier */
  productCount: number;
  /** Coût total du panier pour cette enseigne */
  basketCost: number;
  /** Coût total du même panier en métropole (si disponible) */
  basketCostRef?: number;
  /** Surcoût moyen en % vs métropole (si disponible) */
  avgEcartPercent?: number;
  /** Rang parmi les enseignes du même territoire (1 = moins cher) */
  rank?: number;
}

export interface ScoreEnseigneResult {
  lastUpdated: string | null;
  byTerritory: Record<string, EnseigneScore[]>;
  global: EnseigneScore[];
}

// ─── Loader ───────────────────────────────────────────────────────────────────

async function loadCataloguePrices(): Promise<CatalogueEntry[]> {
  try {
    const baseUrl = import.meta.env.BASE_URL ?? '/';
    const res = await fetch(`${baseUrl}data/catalogue-prices.json`);
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data?.prices) ? data.prices : [];
  } catch {
    return [];
  }
}

// ─── Computation ──────────────────────────────────────────────────────────────

/**
 * Calcule les scores vie chère par enseigne à partir des données catalogue.
 */
export async function computeScoreEnseigne(): Promise<ScoreEnseigneResult> {
  const prices = await loadCataloguePrices();
  if (prices.length === 0) {
    return { lastUpdated: null, byTerritory: {}, global: [] };
  }

  // Group by retailer + territory
  const groups = new Map<string, CatalogueEntry[]>();
  for (const p of prices) {
    if (!p.price || p.price <= 0) continue;
    const key = `${p.retailer}||${p.territory}`;
    const g = groups.get(key) ?? [];
    g.push(p);
    groups.set(key, g);
  }

  const scores: EnseigneScore[] = [];

  for (const [key, entries] of groups.entries()) {
    const [retailer, territory] = key.split('||');
    const totalCost = entries.reduce((s, e) => s + e.price, 0);

    const withRef = entries.filter(
      (e) => e.priceRef !== undefined && e.priceRef !== null && e.priceRef > 0
    );
    const totalRef =
      withRef.length > 0 ? withRef.reduce((s, e) => s + (e.priceRef as number), 0) : undefined;
    const avgEcart =
      withRef.length > 0
        ? Math.round(
            (withRef.reduce((s, e) => s + (e.ecartPercent ?? 0), 0) / withRef.length) * 10
          ) / 10
        : undefined;

    scores.push({
      retailer,
      territory,
      productCount: entries.length,
      basketCost: Math.round(totalCost * 100) / 100,
      basketCostRef: totalRef !== undefined ? Math.round(totalRef * 100) / 100 : undefined,
      avgEcartPercent: avgEcart,
    });
  }

  // Rank within each territory by basketCost (lower = better)
  const byTerritory: Record<string, EnseigneScore[]> = {};
  for (const score of scores) {
    const arr = byTerritory[score.territory] ?? [];
    arr.push(score);
    byTerritory[score.territory] = arr;
  }
  for (const terr of Object.keys(byTerritory)) {
    byTerritory[terr].sort((a, b) => a.basketCost - b.basketCost);
    byTerritory[terr].forEach((s, i) => {
      s.rank = i + 1;
    });
  }

  // Global sort by avgEcartPercent then by basketCost
  const global = [...scores].sort(
    (a, b) => (a.avgEcartPercent ?? a.basketCost) - (b.avgEcartPercent ?? b.basketCost)
  );

  return {
    lastUpdated: new Date().toISOString(),
    byTerritory,
    global,
  };
}
