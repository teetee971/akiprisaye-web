// src/services/predictivePricingService.ts
// Service d'IA prédictive pour anticiper les baisses de prix et promotions
// 100% frontend, aucun appel externe

export type PricePoint = {
  date: string;
  price: number;
};

export type CatalogueItem = {
  id?: string;
  name?: string;
  store?: string;
  observations?: Array<{ date: string; price: number; [key: string]: any }>;
  [key: string]: any;
};

export type PredictionScore = {
  probability: number; // 0-100
  confidence: 'low' | 'medium' | 'high';
  status: 'stable' | 'surveillance' | 'baisse_probable';
  justification: string;
  estimatedTimeframe?: string; // ex: "7-14 jours"
  metrics: {
    trend: number; // tendance générale en %
    volatility: number; // volatilité 0-100
    acceleration: number; // accélération de la baisse
    lastChangePercentage: number;
  };
};

export type ProductPrediction = {
  productId: string;
  productName: string;
  store: string;
  currentPrice: number;
  prediction: PredictionScore;
  observations: PricePoint[];
};

/**
 * Calcule la tendance linéaire des prix (régression simple)
 * Retourne le pourcentage de variation moyen par jour
 */
function calculateTrend(observations: PricePoint[]): number {
  if (observations.length < 2) return 0;

  const sorted = [...observations].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const firstPrice = sorted[0].price;
  const lastPrice = sorted[sorted.length - 1].price;
  const firstDate = new Date(sorted[0].date).getTime();
  const lastDate = new Date(sorted[sorted.length - 1].date).getTime();

  const daysDiff = (lastDate - firstDate) / (1000 * 60 * 60 * 24);
  if (daysDiff === 0) return 0;

  const priceChange = lastPrice - firstPrice;
  const dailyChange = priceChange / daysDiff;

  return (dailyChange / firstPrice) * 100;
}

/**
 * Calcule la volatilité des prix (écart-type relatif)
 */
function calculateVolatility(observations: PricePoint[]): number {
  if (observations.length < 2) return 0;

  const prices = observations.map((o) => o.price);
  const mean = prices.reduce((sum, p) => sum + p, 0) / prices.length;

  const squaredDiffs = prices.map((p) => Math.pow(p - mean, 2));
  const variance = squaredDiffs.reduce((sum, d) => sum + d, 0) / prices.length;
  const stdDev = Math.sqrt(variance);

  // Coefficient de variation en pourcentage
  return mean > 0 ? (stdDev / mean) * 100 : 0;
}

/**
 * Calcule l'accélération de la baisse (comparaison première moitié vs seconde moitié)
 */
function calculateAcceleration(observations: PricePoint[]): number {
  if (observations.length < 4) return 0;

  const sorted = [...observations].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const mid = Math.floor(sorted.length / 2);
  const firstHalf = sorted.slice(0, mid);
  const secondHalf = sorted.slice(mid);

  const trendFirst = calculateTrend(firstHalf);
  const trendSecond = calculateTrend(secondHalf);

  // Si la baisse s'accélère, trendSecond sera plus négatif que trendFirst
  return trendSecond - trendFirst;
}

/**
 * Calcule le pourcentage de variation du dernier prix
 */
function calculateLastChange(observations: PricePoint[]): number {
  if (observations.length < 2) return 0;

  const sorted = [...observations].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const lastPrice = sorted[sorted.length - 1].price;
  const previousPrice = sorted[sorted.length - 2].price;

  return ((lastPrice - previousPrice) / previousPrice) * 100;
}

/**
 * Détermine le statut et le niveau de confiance
 */
function determineStatus(
  trend: number,
  acceleration: number,
  volatility: number,
  lastChange: number
): { status: PredictionScore['status']; confidence: PredictionScore['confidence'] } {
  // Baisse probable : tendance négative forte + accélération négative
  if (trend < -2 && acceleration < -1 && lastChange < -5) {
    return { status: 'baisse_probable', confidence: 'high' };
  }

  if (trend < -1 && (acceleration < 0 || lastChange < -3)) {
    return { status: 'baisse_probable', confidence: 'medium' };
  }

  // Surveillance : tendance légèrement négative ou volatilité élevée
  if (trend < -0.5 || (volatility > 15 && trend < 0)) {
    return { status: 'surveillance', confidence: 'medium' };
  }

  if (volatility > 20) {
    return { status: 'surveillance', confidence: 'low' };
  }

  // Stable : pas de mouvement significatif
  return { status: 'stable', confidence: 'high' };
}

/**
 * Calcule le score de probabilité (0-100)
 */
function calculateProbability(
  trend: number,
  acceleration: number,
  volatility: number,
  lastChange: number
): number {
  let score = 0;

  // Facteur tendance (40 points max)
  if (trend < -2) score += 40;
  else if (trend < -1) score += 30;
  else if (trend < -0.5) score += 15;
  else if (trend < 0) score += 5;

  // Facteur accélération (30 points max)
  if (acceleration < -2) score += 30;
  else if (acceleration < -1) score += 20;
  else if (acceleration < -0.5) score += 10;
  else if (acceleration < 0) score += 5;

  // Facteur dernier changement (20 points max)
  if (lastChange < -10) score += 20;
  else if (lastChange < -5) score += 15;
  else if (lastChange < -2) score += 10;
  else if (lastChange < 0) score += 5;

  // Facteur volatilité (10 points max)
  if (volatility > 25) score += 10;
  else if (volatility > 15) score += 7;
  else if (volatility > 10) score += 4;

  return Math.min(100, Math.max(0, score));
}

/**
 * Génère la justification textuelle
 */
function generateJustification(
  trend: number,
  acceleration: number,
  volatility: number,
  lastChange: number,
  status: PredictionScore['status']
): string {
  const parts: string[] = [];

  if (status === 'baisse_probable') {
    parts.push('Baisse de prix probable détectée.');

    if (trend < -2) {
      parts.push(`Tendance baissière forte (${trend.toFixed(1)}% par jour).`);
    }

    if (acceleration < -1) {
      parts.push('Accélération de la baisse observée.');
    }

    if (lastChange < -5) {
      parts.push(`Dernière baisse significative: ${Math.abs(lastChange).toFixed(1)}%.`);
    }
  } else if (status === 'surveillance') {
    parts.push('Produit à surveiller.');

    if (volatility > 15) {
      parts.push(`Volatilité élevée (${volatility.toFixed(1)}%).`);
    }

    if (trend < 0) {
      parts.push('Tendance légèrement baissière.');
    }
  } else {
    parts.push('Prix stable.');

    if (Math.abs(trend) < 0.5) {
      parts.push('Aucune variation significative récente.');
    }
  }

  return parts.join(' ');
}

/**
 * Estime la fenêtre temporelle pour une baisse probable
 */
function estimateTimeframe(
  trend: number,
  acceleration: number,
  status: PredictionScore['status']
): string | undefined {
  if (status !== 'baisse_probable') return undefined;

  if (trend < -3 || acceleration < -2) {
    return '3-7 jours';
  } else if (trend < -2 || acceleration < -1) {
    return '7-14 jours';
  } else if (trend < -1) {
    return '14-21 jours';
  }

  return '21-30 jours';
}

/**
 * Analyse prédictive pour un produit donné
 */
export function predictPriceChange(observations: PricePoint[]): PredictionScore {
  if (observations.length < 2) {
    return {
      probability: 0,
      confidence: 'low',
      status: 'stable',
      justification: 'Données insuffisantes pour une prédiction.',
      metrics: {
        trend: 0,
        volatility: 0,
        acceleration: 0,
        lastChangePercentage: 0,
      },
    };
  }

  const trend = calculateTrend(observations);
  const volatility = calculateVolatility(observations);
  const acceleration = calculateAcceleration(observations);
  const lastChange = calculateLastChange(observations);

  const { status, confidence } = determineStatus(trend, acceleration, volatility, lastChange);
  const probability = calculateProbability(trend, acceleration, volatility, lastChange);
  const justification = generateJustification(trend, acceleration, volatility, lastChange, status);
  const estimatedTimeframe = estimateTimeframe(trend, acceleration, status);

  return {
    probability,
    confidence,
    status,
    justification,
    estimatedTimeframe,
    metrics: {
      trend,
      volatility,
      acceleration,
      lastChangePercentage: lastChange,
    },
  };
}

/**
 * Analyse tous les produits du catalogue
 */
export function analyzeCatalogue(catalogueData: CatalogueItem[]): ProductPrediction[] {
  const predictions: ProductPrediction[] = [];

  catalogueData.forEach((item) => {
    if (!item.observations || item.observations.length === 0) return;

    const observations: PricePoint[] = item.observations.map((obs) => ({
      date: obs.date,
      price: obs.price,
    }));

    const sorted = [...observations].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    const currentPrice = sorted[0].price;

    const prediction = predictPriceChange(observations);

    predictions.push({
      productId: item.id || '',
      productName: item.name || '',
      store: item.store || '',
      currentPrice,
      prediction,
      observations,
    });
  });

  return predictions;
}

/**
 * Filtre les prédictions par statut
 */
export function filterByStatus(
  predictions: ProductPrediction[],
  status: PredictionScore['status']
): ProductPrediction[] {
  return predictions.filter((p) => p.prediction.status === status);
}

/**
 * Trie les prédictions par probabilité décroissante
 */
export function sortByProbability(predictions: ProductPrediction[]): ProductPrediction[] {
  return [...predictions].sort((a, b) => b.prediction.probability - a.prediction.probability);
}

export default {
  predictPriceChange,
  analyzeCatalogue,
  filterByStatus,
  sortByProbability,
};
