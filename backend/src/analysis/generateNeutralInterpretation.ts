/**
 * Neutral Interpretation Generation Module
 * 
 * Generates automatic neutral, legally-safe statistical interpretations
 * without causal attribution or store references.
 * 
 * Key Principles:
 * - No store/brand names
 * - No causal attribution
 * - Descriptive language only
 * - Institutional tone
 * - Public-friendly text
 */

/**
 * Input statistics for interpretation generation
 */
export type ObservationStats = {
  observationsUsed: number;      // Number of observations used in analysis
  observationsMax: number;       // Maximum available observations
  territoriesCovered: number;    // Number of territories covered
  dispersionIndex: number;       // Normalized standard deviation (0-100)
  method: 'full' | 'stratified'; // Statistical sampling method
};

/**
 * Generated interpretation result
 */
export type NeutralInterpretation = {
  signalLevel: number;           // 0-100: Statistical signal intensity
  interpretation: string;        // Neutral explanation text
  method: 'full' | 'stratified'; // Statistical method used
};

/**
 * Generate a neutral statistical interpretation from observation data
 * 
 * @param stats - Observation statistics
 * @returns Neutral interpretation with signal level
 */
export function generateNeutralInterpretation(
  stats: ObservationStats
): NeutralInterpretation {
  // Validate inputs
  if (stats.observationsUsed < 0 || stats.observationsMax <= 0) {
    throw new Error('Invalid observation counts');
  }
  if (stats.territoriesCovered < 0) {
    throw new Error('Invalid territory count');
  }
  if (stats.dispersionIndex < 0 || stats.dispersionIndex > 100) {
    throw new Error('Dispersion index must be between 0 and 100');
  }

  // Calculate signal level components
  const observationRatio = stats.observationsUsed / stats.observationsMax;
  const observationScore = Math.min(50, observationRatio * 50);
  const territoryScore = Math.min(25, stats.territoriesCovered * 5);
  const dispersionScore = Math.min(25, stats.dispersionIndex * 0.25);

  // Calculate final signal level (0-100)
  const signalLevel = Math.min(
    100,
    Math.round(observationScore + territoryScore + dispersionScore)
  );

  // Generate interpretation text based on signal level
  const interpretation = generateInterpretationText(
    signalLevel,
    stats.observationsUsed,
    stats.observationsMax,
    stats.territoriesCovered,
    stats.dispersionIndex,
    stats.method
  );

  return {
    signalLevel,
    interpretation,
    method: stats.method,
  };
}

/**
 * Generate interpretation text based on signal level and statistics
 * Uses neutral, descriptive language with no causal attribution
 * 
 * @private
 */
function generateInterpretationText(
  signalLevel: number,
  observationsUsed: number,
  observationsMax: number,
  territoriesCovered: number,
  dispersionIndex: number,
  method: 'full' | 'stratified'
): string {
  const usageRate = (observationsUsed / observationsMax) * 100;
  const methodLabel = method === 'full' ? 'exhaustive' : 'par échantillonnage stratifié';

  // Signal level categories
  if (signalLevel >= 80) {
    return generateStrongSignalText(
      observationsUsed,
      usageRate,
      territoriesCovered,
      dispersionIndex,
      methodLabel
    );
  } else if (signalLevel >= 60) {
    return generateMarkedSignalText(
      observationsUsed,
      territoriesCovered,
      dispersionIndex,
      methodLabel
    );
  } else if (signalLevel >= 40) {
    return generateModerateSignalText(
      observationsUsed,
      territoriesCovered,
      methodLabel
    );
  } else if (signalLevel >= 20) {
    return generateLimitedSignalText(
      observationsUsed,
      methodLabel
    );
  } else {
    return generateMinimalSignalText(
      observationsUsed,
      methodLabel
    );
  }
}

/**
 * Generate text for strong signal (80-100)
 * @private
 */
function generateStrongSignalText(
  observationsUsed: number,
  usageRate: number,
  territoriesCovered: number,
  dispersionIndex: number,
  methodLabel: string
): string {
  const volumeDesc = observationsUsed > 1000 ? 'un volume important' : 'un volume significatif';
  const coverageDesc = territoriesCovered > 3 ? 'un périmètre étendu' : 'plusieurs zones géographiques';
  const dispersionDesc = dispersionIndex > 60 ? 'une forte dispersion' : 'une dispersion notable';

  return `L'analyse statistique ${methodLabel} révèle une dynamique significative basée sur ${volumeDesc} de ${observationsUsed.toLocaleString('fr-FR')} observations (${usageRate.toFixed(1)}% de la base disponible). Les données couvrent ${coverageDesc} avec ${dispersionDesc} des valeurs observées. Cette intensité statistique élevée suggère des variations structurelles sur la période analysée, sans qu'il soit possible d'en identifier les causes spécifiques.`;
}

/**
 * Generate text for marked signal (60-79)
 * @private
 */
function generateMarkedSignalText(
  observationsUsed: number,
  territoriesCovered: number,
  dispersionIndex: number,
  methodLabel: string
): string {
  const coverageDesc = territoriesCovered > 2 ? 'un périmètre élargi' : 'plusieurs territoires';
  const dispersionDesc = dispersionIndex > 50 ? 'une dispersion marquée' : 'une certaine variabilité';

  return `L'analyse statistique ${methodLabel} identifie des tendances marquées sur ${coverageDesc}, basées sur ${observationsUsed.toLocaleString('fr-FR')} observations. Les données présentent ${dispersionDesc}, caractéristique d'évolutions différenciées selon les zones géographiques. Le volume de données collectées permet d'observer des dynamiques significatives, sans préjuger de leurs origines.`;
}

/**
 * Generate text for moderate signal (40-59)
 * @private
 */
function generateModerateSignalText(
  observationsUsed: number,
  territoriesCovered: number,
  methodLabel: string
): string {
  const coverageDesc = territoriesCovered > 1 ? 'plusieurs zones géographiques' : 'la zone observée';

  return `L'analyse statistique ${methodLabel} détecte des évolutions modérées sur ${coverageDesc}. Le volume de ${observationsUsed.toLocaleString('fr-FR')} observations collectées permet d'identifier des variations ponctuelles, mais nécessite une interprétation prudente compte tenu de la dispersion observée. Ces données descriptives ne permettent pas de conclusions définitives sur les dynamiques sous-jacentes.`;
}

/**
 * Generate text for limited signal (20-39)
 * @private
 */
function generateLimitedSignalText(
  observationsUsed: number,
  methodLabel: string
): string {
  return `L'analyse statistique ${methodLabel} repose sur ${observationsUsed.toLocaleString('fr-FR')} observations, permettant d'identifier des variations ponctuelles. Le volume limité de données collectées et leur dispersion restreignent la portée de l'analyse. Les résultats doivent être considérés comme des indicateurs préliminaires nécessitant une validation par des observations complémentaires.`;
}

/**
 * Generate text for minimal signal (0-19)
 * @private
 */
function generateMinimalSignalText(
  observationsUsed: number,
  methodLabel: string
): string {
  return `L'analyse statistique ${methodLabel} s'appuie sur un volume limité de ${observationsUsed.toLocaleString('fr-FR')} observations. Les données collectées ne permettent pas d'identifier de tendance claire ou significative. L'absence de signal fort peut résulter soit d'une stabilité effective, soit d'une insuffisance de données. Toute interprétation doit être considérée avec une extrême prudence.`;
}

/**
 * Validate that generated text follows neutrality rules
 * @internal
 */
export function validateNeutralText(text: string): boolean {
  // Prohibited terms (accusatory or causal)
  const prohibitedTerms = [
    'responsable',
    'cause',
    'hausse abusive',
    'enseigne dominante',
    'surprofit',
    'abus',
    'fraude',
    'arnaque',
    'exploitation',
    'injustifié',
    'anormal',
    'suspect',
  ];

  // Check for prohibited terms (case insensitive)
  const lowerText = text.toLowerCase();
  for (const term of prohibitedTerms) {
    if (lowerText.includes(term.toLowerCase())) {
      return false;
    }
  }

  // Must contain approved descriptive terms
  const requiredPatterns = [
    /analys[e|é]/i,
    /observ[e|é|ation]/i,
    /statistique/i,
  ];

  let hasRequiredPattern = false;
  for (const pattern of requiredPatterns) {
    if (pattern.test(text)) {
      hasRequiredPattern = true;
      break;
    }
  }

  return hasRequiredPattern;
}

/**
 * Helper function to calculate dispersion index from price data
 * Normalizes standard deviation to 0-100 scale
 * 
 * @param prices - Array of price values
 * @returns Dispersion index (0-100)
 */
export function calculateDispersionIndex(prices: number[]): number {
  if (prices.length < 2) return 0;

  // Calculate mean
  const mean = prices.reduce((sum, price) => sum + price, 0) / prices.length;

  // Calculate standard deviation
  const variance = prices.reduce((sum, price) => {
    return sum + Math.pow(price - mean, 2);
  }, 0) / prices.length;

  const stdDev = Math.sqrt(variance);

  // Normalize to 0-100 scale (coefficient of variation * 100)
  // Capped at 100 for extreme cases
  const coefficientOfVariation = mean > 0 ? (stdDev / mean) * 100 : 0;
  return Math.min(100, Math.round(coefficientOfVariation));
}
