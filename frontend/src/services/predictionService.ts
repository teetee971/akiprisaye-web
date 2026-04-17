/**
 * src/services/predictionService.ts
 *
 * Fonctions pures pour prédiction statistique légère, locale et explicable.
 * - Ne fait aucun appel externe, ne stocke rien.
 * - Entrées : observations[] (champs date ISO, price number)
 * - Sortie : PredictionResult (label, slope, volatility, explanation, confidenceLow, confidenceHigh)
 *
 * Règles figées (expliquées) :
 * - Régression linéaire price ~ time (jours) -> slope (prix par jour)
 * - Volatilité = écart-type / moyenne (coefficient de variation)
 * - SI slope < -eps AND volatility < volThreshold -> "Baisse probable"
 * - SI slope > eps -> "Hausse probable"
 * - SINON -> "Prix stable"
 * - Intervalles de confiance (±1 σ résiduelle autour de la prédiction à J+30)
 */

export type Observation = { date: string; price: number; store?: string };
export type PredictionLabel =
  | 'Baisse probable'
  | 'Hausse probable'
  | 'Prix stable'
  | 'Données insuffisantes';

export type PredictionResult = {
  label: PredictionLabel;
  slopePerDay: number | null; // prix / jour
  volatility: number | null; // coefficient de variation (std / mean)
  usedCount: number;
  explanation: string;
  /** Prix prédit dans ~30 jours (null si données insuffisantes) */
  predictedPrice: number | null;
  /** Borne basse de l'intervalle de confiance à ±1σ (null si données insuffisantes) */
  confidenceLow: number | null;
  /** Borne haute de l'intervalle de confiance à ±1σ (null si données insuffisantes) */
  confidenceHigh: number | null;
};

function toTs(d: string) {
  return new Date(d).getTime();
}

function mean(nums: number[]) {
  if (!nums.length) return null;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function stddev(nums: number[], _mean?: number) {
  if (!nums.length) return null;
  const m = _mean ?? nums.reduce((a, b) => a + b, 0) / nums.length;
  const v = nums.reduce((s, x) => s + (x - m) ** 2, 0) / nums.length;
  return Math.sqrt(v);
}

/**
 * linearRegressionDays
 * - Retourne slope (prix / jour) et intercept si possible, sinon null
 */
export function linearRegressionDays(
  observations: Observation[]
): { slopePerDay: number; intercept: number } | null {
  if (!observations || observations.length < 2) return null;
  const sorted = [...observations].slice().sort((a, b) => toTs(a.date) - toTs(b.date));
  const t0 = toTs(sorted[0].date);
  const xs = sorted.map((o) => (toTs(o.date) - t0) / (1000 * 3600 * 24)); // jours
  const ys = sorted.map((o) => o.price);
  const xmean = mean(xs)!;
  const ymean = mean(ys)!;
  let num = 0,
    den = 0;
  for (let i = 0; i < xs.length; i++) {
    num += (xs[i] - xmean) * (ys[i] - ymean);
    den += (xs[i] - xmean) ** 2;
  }
  if (den === 0) return null;
  const slope = num / den;
  const intercept = ymean - slope * xmean;
  return { slopePerDay: slope, intercept };
}

/**
 * Calcule l'écart-type résiduel (σ) de la régression.
 * σ = sqrt(Σ(y_i - ŷ_i)² / (n - 2))
 * Utilisé pour construire les intervalles de confiance.
 */
function residualStdDev(sorted: Observation[], slope: number, intercept: number): number {
  const t0 = toTs(sorted[0].date);
  const n = sorted.length;
  if (n < 3) return 0;
  let sse = 0;
  for (const obs of sorted) {
    const x = (toTs(obs.date) - t0) / (1000 * 3600 * 24);
    const predicted = slope * x + intercept;
    sse += (obs.price - predicted) ** 2;
  }
  return Math.sqrt(sse / (n - 2));
}

/**
 * computePrediction
 * - observations: list of {date, price}
 * - options:
 *    - window: last N observations to use (default 10)
 *    - epsSlope: minimal slope threshold (prix/jour) considered meaningful
 *    - volatilityThreshold: coefficient of variation threshold for "stable"
 *    - horizonDays: nombre de jours à projeter pour le prix prédit (default 30)
 */
export function computePrediction(
  observations: Observation[],
  options?: {
    window?: number;
    epsSlope?: number;
    volatilityThreshold?: number;
    horizonDays?: number;
  }
): PredictionResult {
  const window = options?.window ?? 10;
  const epsSlope = options?.epsSlope ?? 0.001; // prix/unité par jour
  const volatilityThreshold = options?.volatilityThreshold ?? 0.08; // 8%
  const horizonDays = options?.horizonDays ?? 30;

  const nullIntervals = { predictedPrice: null, confidenceLow: null, confidenceHigh: null };

  if (!observations || observations.length < 3) {
    return {
      label: 'Données insuffisantes',
      slopePerDay: null,
      volatility: null,
      usedCount: observations?.length ?? 0,
      explanation:
        "Pas assez d'observations (au moins 3 requises) pour une analyse statistique fiable.",
      ...nullIntervals,
    };
  }

  const sorted = [...observations].slice().sort((a, b) => toTs(a.date) - toTs(b.date));
  const tail = sorted.slice(-window);

  const reg = linearRegressionDays(tail);
  if (!reg) {
    return {
      label: 'Données insuffisantes',
      slopePerDay: null,
      volatility: null,
      usedCount: tail.length,
      explanation: "Les observations n'ont pas de variation temporelle exploitable.",
      ...nullIntervals,
    };
  }

  const prices = tail.map((o) => o.price);
  const mu = mean(prices)!;
  const sd = stddev(prices, mu)!;
  const volatility = mu === 0 ? null : sd / Math.abs(mu);

  const slope = reg.slopePerDay;

  let label: PredictionLabel = 'Prix stable';
  if (slope < -epsSlope && volatility !== null && volatility < volatilityThreshold)
    label = 'Baisse probable';
  else if (slope > epsSlope) label = 'Hausse probable';
  else label = 'Prix stable';

  const explanation = [
    `Analyse basée sur les ${tail.length} dernières observations.`,
    `Pente estimée: ${slope.toFixed(4)} (prix/jour).`,
    `Volatilité (écart‐type relative): ${volatility !== null ? volatility.toFixed(3) : 'n/a'}.`,
    label === 'Baisse probable'
      ? `La pente négative combinée à une volatilité faible suggère une baisse probable.`
      : label === 'Hausse probable'
        ? `La pente positive suggère une hausse probable.`
        : `Aucune tendance claire détectée — prix stable selon les règles définies.`,
  ].join(' ');

  // Calcul des intervalles de confiance
  // On projette le prix à J+horizonDays depuis la dernière observation
  const t0 = toTs(tail[0].date);
  const tLast = toTs(tail[tail.length - 1].date);
  const daysLast = (tLast - t0) / (1000 * 3600 * 24);
  const xFuture = daysLast + horizonDays;
  const predictedPrice = slope * xFuture + reg.intercept;
  const sigma = residualStdDev(tail, slope, reg.intercept);
  // Borne basse/haute à ±1σ résiduelle, minées à 0 (un prix ne peut pas être négatif)
  const confidenceLow = Math.max(0, predictedPrice - sigma);
  const confidenceHigh = Math.max(0, predictedPrice + sigma);

  return {
    label,
    slopePerDay: slope,
    volatility,
    usedCount: tail.length,
    explanation,
    predictedPrice,
    confidenceLow,
    confidenceHigh,
  };
}

export default { computePrediction, linearRegressionDays };
