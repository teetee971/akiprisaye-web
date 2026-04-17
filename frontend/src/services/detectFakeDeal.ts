/**
 * ⑮ SERVICE - Détection de faux bons plans
 * Basé uniquement sur l'historique local
 */

export interface FakeDealResult {
  isFakeDeal: boolean;
  confidence: 'high' | 'medium' | 'low';
  reason: string;
  currentPrice: number;
  avg30Days: number;
  lowestPrice: number;
  percentAboveAverage: number;
}

export interface PriceHistory {
  date: string;
  price: number;
  store?: string;
}

/**
 * Détecte si un prix "promotionnel" est suspect
 *
 * Logique :
 * 1. Calculer moyenne 30 derniers jours
 * 2. Trouver prix le plus bas observé
 * 3. Si prix actuel > moyenne → faux bon plan probable
 *
 * @param currentPrice - Prix actuel affiché
 * @param priceHistory - Historique des prix
 * @param isPromotion - Si une promotion est affichée
 * @returns Résultat de la détection
 */
export function detectFakeDeal(
  currentPrice: number,
  priceHistory: PriceHistory[],
  isPromotion: boolean = false
): FakeDealResult {
  // Pas assez de données
  if (priceHistory.length < 5) {
    return {
      isFakeDeal: false,
      confidence: 'low',
      reason: 'Historique insuffisant pour analyser',
      currentPrice,
      avg30Days: currentPrice,
      lowestPrice: currentPrice,
      percentAboveAverage: 0,
    };
  }

  // Filtrer les 30 derniers jours
  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const recentPrices = priceHistory
    .filter((p) => new Date(p.date).getTime() >= thirtyDaysAgo)
    .map((p) => p.price);

  if (recentPrices.length === 0) {
    return {
      isFakeDeal: false,
      confidence: 'low',
      reason: 'Aucune donnée récente',
      currentPrice,
      avg30Days: currentPrice,
      lowestPrice: currentPrice,
      percentAboveAverage: 0,
    };
  }

  // Calculer moyenne 30 jours
  const avg30Days = recentPrices.reduce((sum, p) => sum + p, 0) / recentPrices.length;

  // Prix le plus bas observé
  const lowestPrice = Math.min(...priceHistory.map((p) => p.price));

  // Différence vs moyenne
  const percentAboveAverage = ((currentPrice - avg30Days) / avg30Days) * 100;

  // Détection
  let isFakeDeal = false;
  let confidence: 'high' | 'medium' | 'low' = 'low';
  let reason = '';

  if (isPromotion && currentPrice > avg30Days) {
    // Promotion affichée MAIS prix > moyenne
    if (percentAboveAverage > 10) {
      isFakeDeal = true;
      confidence = 'high';
      reason = `Prix ${percentAboveAverage.toFixed(0)}% plus élevé que la moyenne récente`;
    } else if (percentAboveAverage > 5) {
      isFakeDeal = true;
      confidence = 'medium';
      reason = `Prix légèrement au-dessus de la moyenne récente (+${percentAboveAverage.toFixed(0)}%)`;
    }
  } else if (currentPrice > avg30Days * 1.15) {
    // Prix anormalement élevé (>15% de la moyenne)
    isFakeDeal = true;
    confidence = 'medium';
    reason = `Prix inhabituellement élevé (+${percentAboveAverage.toFixed(0)}% vs moyenne)`;
  }

  return {
    isFakeDeal,
    confidence,
    reason,
    currentPrice,
    avg30Days,
    lowestPrice,
    percentAboveAverage,
  };
}

/**
 * Génère un message pédagogique
 */
export function getFakeDealMessage(result: FakeDealResult): string {
  if (!result.isFakeDeal) {
    return "Prix cohérent avec l'historique récent";
  }

  const messages = {
    high: [
      `⚠️ Attention : ce prix est ${result.percentAboveAverage.toFixed(0)}% plus élevé que la moyenne des 30 derniers jours.`,
      `Moyenne observée : ${result.avg30Days.toFixed(2)} €`,
      `Prix le plus bas : ${result.lowestPrice.toFixed(2)} €`,
    ],
    medium: [
      `🤔 Ce prix semble élevé par rapport à l'historique récent.`,
      `Moyenne 30 jours : ${result.avg30Days.toFixed(2)} €`,
    ],
    low: [`Prix dans la moyenne, mais vérifiez l'historique.`],
  };

  return messages[result.confidence].join('\n');
}

/**
 * Analyse un ensemble de produits pour trouver les faux bons plans
 */
export function analyzeFakeDeals(
  products: Array<{
    name: string;
    currentPrice: number;
    priceHistory: PriceHistory[];
    isPromotion?: boolean;
  }>
): Array<{
  product: string;
  result: FakeDealResult;
}> {
  return products
    .map((p) => ({
      product: p.name,
      result: detectFakeDeal(p.currentPrice, p.priceHistory, p.isPromotion),
    }))
    .filter((p) => p.result.isFakeDeal)
    .sort((a, b) => b.result.percentAboveAverage - a.result.percentAboveAverage);
}
