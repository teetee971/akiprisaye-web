/**
 * Calcul du score de confiance des données
 * Transparent et reproductible
 */

export interface DataMetrics {
  nbObservations: number;
  nbStores: number;
  recencyDays: number;
}

export interface ConfidenceScore {
  total: number;
  obsScore: number;
  storeScore: number;
  recencyScore: number;
}

/**
 * Calcule le score de confiance sur 100
 *
 * Répartition :
 * - Observations : max 50 points (5 points par observation, cap à 10)
 * - Magasins : max 25 points (5 points par magasin, cap à 5)
 * - Fraîcheur : max 25 points (pénalité de 2 points par jour au-delà de 0)
 *
 * @param metrics - Métriques des données
 * @returns Score détaillé sur 100
 */
export function calculateConfidenceScore(metrics: DataMetrics): ConfidenceScore {
  // Score observations (cap à 50)
  const obsScore = Math.min(50, metrics.nbObservations * 5);

  // Score magasins (cap à 25)
  const storeScore = Math.min(25, metrics.nbStores * 5);

  // Score fraîcheur (max 25, -2 par jour)
  // 0 jour = 25 points
  // 1-3 jours = 25-19 points (excellent)
  // 4-7 jours = 17-11 points (bon)
  // 8-14 jours = 9-0 points (acceptable)
  // >14 jours = 0 points (dépassé)
  const recencyPenalty = Math.max(0, metrics.recencyDays * 2);
  const recencyScore = Math.max(0, 25 - recencyPenalty);

  // Total
  const total = Math.round(obsScore + storeScore + recencyScore);

  return {
    total: Math.min(100, total),
    obsScore: Math.round(obsScore),
    storeScore: Math.round(storeScore),
    recencyScore: Math.round(recencyScore),
  };
}

/**
 * Catégorise le niveau de confiance
 */
export function getConfidenceLevel(score: number): 'excellent' | 'good' | 'acceptable' | 'limited' {
  if (score >= 80) return 'excellent';
  if (score >= 60) return 'good';
  if (score >= 40) return 'acceptable';
  return 'limited';
}

/**
 * Génère un message explicatif
 */
export function getConfidenceMessage(score: ConfidenceScore): string {
  const level = getConfidenceLevel(score.total);

  switch (level) {
    case 'excellent':
      return 'Données très fiables avec une excellente couverture et fraîcheur.';
    case 'good':
      return 'Données fiables permettant une bonne comparaison.';
    case 'acceptable':
      return "Données suffisantes mais pourrait bénéficier de plus d'observations.";
    case 'limited':
      return 'Données limitées. Les comparaisons peuvent être moins précises.';
  }
}

/**
 * Recommandations d'amélioration
 */
export function getImprovementSuggestions(score: ConfidenceScore): string[] {
  const suggestions: string[] = [];

  if (score.obsScore < 25) {
    suggestions.push("Plus d'observations améliorerait la fiabilité");
  }

  if (score.storeScore < 15) {
    suggestions.push('Données de magasins supplémentaires seraient utiles');
  }

  if (score.recencyScore < 15) {
    suggestions.push('Les données gagneraient à être actualisées');
  }

  return suggestions;
}

/**
 * Vérifie si les données sont suffisantes pour une comparaison
 */
export function isDataSufficient(score: ConfidenceScore): boolean {
  return score.total >= 40 && score.obsScore >= 10;
}

/**
 * Calcule le pourcentage de couverture territoire
 * Basé sur le nombre de magasins couverts vs total estimé
 */
export function calculateTerritoryCoverage(
  nbStoresCovered: number,
  totalStoresInTerritory: number
): number {
  if (totalStoresInTerritory === 0) return 0;
  return Math.min(100, Math.round((nbStoresCovered / totalStoresInTerritory) * 100));
}
