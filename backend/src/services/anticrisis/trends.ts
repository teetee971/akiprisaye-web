/**
 * Service de calcul de tendances de prix
 * Version: 1.0.0
 * 
 * Calculs:
 * - Statistiques de base (moyenne, min, max, volatilité)
 * - Tendances temporelles (YoY, MoM, pente)
 * - Détection de stabilité
 * 
 * Utilisation pour Anti-Crisis Basket:
 * - Exclure automatiquement les produits instables
 * - Identifier les tendances à long terme
 * - Fournir des métriques pour la transparence
 */

/**
 * Métriques de tendance pour un produit
 */
export interface TrendMetrics {
  /** Prix moyen sur la période */
  avgPrice: number;
  /** Prix minimum observé */
  min: number;
  /** Prix maximum observé */
  max: number;
  /** Volatilité (écart-type) */
  volatility: number;
  /** Variation Year-over-Year en % (si données ≥ 12 mois) */
  yoyPct?: number;
  /** Variation Month-over-Month en % */
  momPct?: number;
  /** Tendance linéaire (pente de régression) */
  slope: number;
  /** Produit stable (volatilité faible et tendance faible) */
  stable: boolean;
  /** Nombre d'observations */
  observations: number;
}

/**
 * Résultat de sélection de produits anti-crise
 */
export interface AntiCrisisSelection {
  productId: string;
  metrics: TrendMetrics;
}

/**
 * Calcule les métriques de tendance pour une série de prix
 * 
 * @param prices - Tableau de prix chronologique
 * @returns Métriques de tendance calculées
 */
export function computeTrend(prices: number[]): TrendMetrics {
  const n = prices.length;
  
  if (n === 0) {
    throw new Error('Cannot compute trend on empty price array');
  }

  // Statistiques de base
  const avg = prices.reduce((a, b) => a + b, 0) / n;
  const min = Math.min(...prices);
  const max = Math.max(...prices);

  // Volatilité (écart-type)
  const variance = prices.reduce((a, b) => a + (b - avg) ** 2, 0) / n;
  const volatility = Math.sqrt(variance);

  // MoM (Month-over-Month) - comparer le dernier mois avec l'avant-dernier
  // Guard contre division par zéro
  const momPct = n > 1 && prices[n - 2] !== 0
    ? ((prices[n - 1] - prices[n - 2]) / prices[n - 2]) * 100
    : undefined;

  // YoY (Year-over-Year) - comparer le dernier mois avec le même mois l'année précédente
  // Nécessite au moins 13 observations (mois actuel + 12 mois précédents)
  // Guard contre division par zéro
  const yoyPct = n >= 13 && prices[n - 13] !== 0
    ? ((prices[n - 1] - prices[n - 13]) / prices[n - 13]) * 100
    : undefined;

  // Régression linéaire simple pour calculer la tendance (pente)
  // y = ax + b, on calcule a (slope)
  const xs = prices.map((_, i) => i); // [0, 1, 2, ..., n-1]
  const xAvg = (n - 1) / 2;
  const yAvg = avg;
  
  const numerator = xs.reduce((sum, x, i) => sum + (x - xAvg) * (prices[i] - yAvg), 0);
  const denominator = xs.reduce((sum, x) => sum + (x - xAvg) ** 2, 0);
  const slope = denominator !== 0 ? numerator / denominator : 0;

  // Critères de stabilité:
  // 1. Volatilité < 0.12 (coefficient de variation < ~12%)
  // 2. Pente faible en valeur absolue (< 0.02 pour éviter les tendances fortes)
  const coefficientOfVariation = (volatility / avg) * 100;
  const stable = coefficientOfVariation < 12 && Math.abs(slope) < 0.02;

  return {
    avgPrice: Number(avg.toFixed(2)),
    min: Number(min.toFixed(2)),
    max: Number(max.toFixed(2)),
    volatility: Number(volatility.toFixed(3)),
    momPct: momPct !== undefined ? Number(momPct.toFixed(2)) : undefined,
    yoyPct: yoyPct !== undefined ? Number(yoyPct.toFixed(2)) : undefined,
    slope: Number(slope.toFixed(4)),
    stable,
    observations: n,
  };
}

/**
 * Sélectionne les produits éligibles au panier anti-crise
 * basé sur leur stabilité de prix sur la période
 * 
 * @param series - Map de productId vers tableau de prix
 * @returns Produits stables triés par prix moyen croissant
 */
export function selectAntiCrisisProducts(
  series: Record<string, number[]>
): AntiCrisisSelection[] {
  return Object.entries(series)
    .map(([productId, prices]) => ({
      productId,
      metrics: computeTrend(prices),
    }))
    .filter(x => x.metrics.stable) // Ne garder que les produits stables
    .sort((a, b) => a.metrics.avgPrice - b.metrics.avgPrice); // Trier par prix croissant
}

/**
 * Convertit un dataset de points de prix en séries par produit/territoire/enseigne
 * 
 * @param pricePoints - Tableau de points de prix
 * @param territory - Territoire à filtrer (optionnel)
 * @returns Map de clés uniques vers tableaux de prix
 */
export function groupPricePoints<T extends { productId: string; storeId: string; price: number; territory?: string }>(
  pricePoints: T[],
  territory?: string
): Record<string, number[]> {
  const groups: Record<string, number[]> = {};

  for (const point of pricePoints) {
    // Filtrer par territoire si spécifié
    if (territory && point.territory && point.territory !== territory) {
      continue;
    }

    // Clé unique: productId + storeId (+ territoire si disponible)
    const key = point.territory
      ? `${point.productId}_${point.storeId}_${point.territory}`
      : `${point.productId}_${point.storeId}`;

    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(point.price);
  }

  return groups;
}
