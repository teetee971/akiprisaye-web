 
/**
 * Price Anomaly Detection Service
 * "A KI PRI SA YÉ" - Detection based EXCLUSIVELY on real observed data
 * 
 * NO COMMERCIAL PREDICTIONS, NO OPAQUE SCORES
 * Only signals based on historical deviations from real observed prices
 * 
 * ETHICS: An anomaly is a signal, NOT an accusation
 */

import type { Observation } from '../schemas/observation';

/**
 * Detection method types (all explainable)
 */
export type DetectionMethod = 
  | 'iqr' // Interquartile Range (statistical outlier detection)
  | 'relative_deviation' // Percentage deviation from recent median
  | 'fixed_threshold'; // Fixed percentage threshold

/**
 * Anomaly level
 */
export type AnomalyLevel = 
  | 'hausse_inhabituelle' // Unusual increase
  | 'variation_forte' // Strong variation
  | 'a_surveiller'; // To monitor

/**
 * Detected price anomaly
 */
export interface PriceAnomaly {
  /** Product name */
  produit: string;
  /** Territory where observed */
  territoire: string;
  /** Commune where observed */
  commune: string;
  /** Store brand (optional for privacy) */
  enseigne?: string;
  /** Date of observation (ISO format) */
  date: string;
  /** Observed price that triggered the anomaly */
  prix_observe: number;
  /** Reference price (median of recent historical data) */
  prix_reference: number;
  /** Absolute deviation */
  ecart_absolu: number;
  /** Percentage deviation */
  ecart_pourcent: number;
  /** Detection method used */
  methode: DetectionMethod;
  /** Threshold that triggered detection */
  seuil: number;
  /** Anomaly level */
  niveau: AnomalyLevel;
  /** Number of historical observations used for reference */
  observations_historiques: number;
  /** Explanation of why this is flagged */
  explication: string;
  /** Source observation ID */
  observation_id: string;
}

/**
 * Anomaly detection configuration
 */
export interface AnomalyDetectionConfig {
  /** Method to use for detection */
  methode: DetectionMethod;
  /** Minimum number of historical observations required */
  min_observations: number;
  /** Number of days to look back for historical data */
  lookback_days: number;
  /** Threshold for detection (interpretation depends on method) */
  seuil: number;
}

/**
 * Default configuration (conservative and transparent)
 */
export const DEFAULT_CONFIG: AnomalyDetectionConfig = {
  methode: 'relative_deviation',
  min_observations: 10,
  lookback_days: 90, // 3 months
  seuil: 20 // 20% deviation triggers anomaly
};

/**
 * Calculate median of array
 */
function calculateMedian(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 
    ? (sorted[mid - 1] + sorted[mid]) / 2 
    : sorted[mid];
}

/**
 * Calculate quartiles for IQR method
 */
function calculateQuartiles(values: number[]): { q1: number; q3: number; iqr: number } {
  const sorted = [...values].sort((a, b) => a - b);
  const n = sorted.length;
  
  const q1Index = Math.floor(n / 4);
  const q3Index = Math.floor(3 * n / 4);
  
  const q1 = sorted[q1Index];
  const q3 = sorted[q3Index];
  const iqr = q3 - q1;
  
  return { q1, q3, iqr };
}

/**
 * Detect anomaly using IQR method
 * Outliers are values outside [Q1 - 1.5*IQR, Q3 + 1.5*IQR]
 */
function detectAnomalyIQR(
  observedPrice: number,
  historicalPrices: number[],
  config: AnomalyDetectionConfig
): { isAnomaly: boolean; reference: number; explanation: string } {
  const { q1, q3, iqr } = calculateQuartiles(historicalPrices);
  const lowerBound = q1 - 1.5 * iqr;
  const upperBound = q3 + 1.5 * iqr;
  const median = calculateMedian(historicalPrices);
  
  const isAnomaly = observedPrice < lowerBound || observedPrice > upperBound;
  
  let explanation = '';
  if (isAnomaly) {
    if (observedPrice > upperBound) {
      explanation = `Prix supérieur à la borne haute (Q3 + 1.5*IQR = ${upperBound.toFixed(2)}€). Méthode: écart interquartile.`;
    } else {
      explanation = `Prix inférieur à la borne basse (Q1 - 1.5*IQR = ${lowerBound.toFixed(2)}€). Méthode: écart interquartile.`;
    }
  }
  
  return { isAnomaly, reference: median, explanation };
}

/**
 * Detect anomaly using relative deviation method
 * Anomaly if deviation from median > threshold %
 */
function detectAnomalyRelativeDeviation(
  observedPrice: number,
  historicalPrices: number[],
  config: AnomalyDetectionConfig
): { isAnomaly: boolean; reference: number; explanation: string } {
  const median = calculateMedian(historicalPrices);
  const deviation = ((observedPrice - median) / median) * 100;
  
  const isAnomaly = Math.abs(deviation) >= config.seuil;
  
  let explanation = '';
  if (isAnomaly) {
    if (deviation > 0) {
      explanation = `Écart de +${deviation.toFixed(1)}% par rapport à la médiane (${median.toFixed(2)}€). Seuil: ${config.seuil}%.`;
    } else {
      explanation = `Écart de ${deviation.toFixed(1)}% par rapport à la médiane (${median.toFixed(2)}€). Seuil: ${config.seuil}%.`;
    }
  }
  
  return { isAnomaly, reference: median, explanation };
}

/**
 * Detect anomaly using fixed threshold method
 * Anomaly if price change > threshold %
 */
function detectAnomalyFixedThreshold(
  observedPrice: number,
  historicalPrices: number[],
  config: AnomalyDetectionConfig
): { isAnomaly: boolean; reference: number; explanation: string } {
  const median = calculateMedian(historicalPrices);
  const percentChange = ((observedPrice - median) / median) * 100;
  
  const isAnomaly = percentChange >= config.seuil;
  
  let explanation = '';
  if (isAnomaly) {
    explanation = `Hausse de ${percentChange.toFixed(1)}% par rapport à la médiane récente (${median.toFixed(2)}€). Seuil fixe: ${config.seuil}%.`;
  }
  
  return { isAnomaly, reference: median, explanation };
}

/**
 * Determine anomaly level based on deviation percentage
 */
function determineAnomalyLevel(deviationPercent: number): AnomalyLevel {
  const absDeviation = Math.abs(deviationPercent);
  
  if (absDeviation >= 50) {
    return 'variation_forte';
  } else if (absDeviation >= 30) {
    return 'hausse_inhabituelle';
  } else {
    return 'a_surveiller';
  }
}

/**
 * Get historical prices for a product in a territory
 */
function getHistoricalPrices(
  observations: Observation[],
  produit: string,
  territoire: string,
  beforeDate: string,
  lookbackDays: number
): number[] {
  const cutoffDate = new Date(beforeDate);
  cutoffDate.setDate(cutoffDate.getDate() - lookbackDays);
  const cutoffStr = cutoffDate.toISOString().split('T')[0];
  
  const prices: number[] = [];
  
  for (const obs of observations) {
    // Must be same territory and before the observation date
    if (obs.territoire !== territoire || obs.date >= beforeDate || obs.date < cutoffStr) {
      continue;
    }
    
    // Extract prices for matching product
    for (const product of obs.produits) {
      if (product.nom.toLowerCase() === produit.toLowerCase()) {
        prices.push(product.prix_total);
      }
    }
  }
  
  return prices;
}

/**
 * Detect anomalies in observations
 * 
 * @param observations - All observations from index.json
 * @param config - Detection configuration
 * @returns Array of detected anomalies
 */
export function detectPriceAnomalies(
  observations: Observation[],
  config: AnomalyDetectionConfig = DEFAULT_CONFIG
): PriceAnomaly[] {
  const anomalies: PriceAnomaly[] = [];
  
  // Sort observations by date (oldest first)
  const sortedObs = [...observations].sort((a, b) => a.date.localeCompare(b.date));
  
  for (const obs of sortedObs) {
    for (const product of obs.produits) {
      // Get historical prices for this product in this territory
      const historicalPrices = getHistoricalPrices(
        sortedObs,
        product.nom,
        obs.territoire,
        obs.date,
        config.lookback_days
      );
      
      // Skip if insufficient historical data
      if (historicalPrices.length < config.min_observations) {
        continue;
      }
      
      // Detect anomaly based on method
      let result: { isAnomaly: boolean; reference: number; explanation: string };
      
      switch (config.methode) {
        case 'iqr':
          result = detectAnomalyIQR(product.prix_total, historicalPrices, config);
          break;
        case 'relative_deviation':
          result = detectAnomalyRelativeDeviation(product.prix_total, historicalPrices, config);
          break;
        case 'fixed_threshold':
          result = detectAnomalyFixedThreshold(product.prix_total, historicalPrices, config);
          break;
        default:
          continue;
      }
      
      // If anomaly detected, add to results
      if (result.isAnomaly) {
        const ecartAbsolu = product.prix_total - result.reference;
        const ecartPourcent = (ecartAbsolu / result.reference) * 100;
        
        anomalies.push({
          produit: product.nom,
          territoire: obs.territoire,
          commune: obs.commune,
          enseigne: obs.enseigne,
          date: obs.date,
          prix_observe: product.prix_total,
          prix_reference: result.reference,
          ecart_absolu: ecartAbsolu,
          ecart_pourcent: ecartPourcent,
          methode: config.methode,
          seuil: config.seuil,
          niveau: determineAnomalyLevel(ecartPourcent),
          observations_historiques: historicalPrices.length,
          explication: result.explanation,
          observation_id: obs.id
        });
      }
    }
  }
  
  // Sort anomalies by date (most recent first)
  anomalies.sort((a, b) => b.date.localeCompare(a.date));
  
  return anomalies;
}

/**
 * Filter anomalies by criteria
 */
export function filterAnomalies(
  anomalies: PriceAnomaly[],
  filters: {
    territoire?: string;
    produit?: string;
    categorie?: string;
    date_debut?: string;
    date_fin?: string;
    niveau?: AnomalyLevel;
  }
): PriceAnomaly[] {
  return anomalies.filter(anomaly => {
    if (filters.territoire && anomaly.territoire !== filters.territoire) {
      return false;
    }
    
    if (filters.produit && !anomaly.produit.toLowerCase().includes(filters.produit.toLowerCase())) {
      return false;
    }
    
    if (filters.date_debut && anomaly.date < filters.date_debut) {
      return false;
    }
    
    if (filters.date_fin && anomaly.date > filters.date_fin) {
      return false;
    }
    
    if (filters.niveau && anomaly.niveau !== filters.niveau) {
      return false;
    }
    
    return true;
  });
}

/**
 * Get anomaly statistics
 */
export function getAnomalyStats(anomalies: PriceAnomaly[]): {
  total: number;
  par_niveau: Record<AnomalyLevel, number>;
  par_territoire: Record<string, number>;
  ecart_moyen: number;
} {
  const stats = {
    total: anomalies.length,
    par_niveau: {
      hausse_inhabituelle: 0,
      variation_forte: 0,
      a_surveiller: 0
    } as Record<AnomalyLevel, number>,
    par_territoire: {} as Record<string, number>,
    ecart_moyen: 0
  };
  
  let totalEcart = 0;
  
  for (const anomaly of anomalies) {
    stats.par_niveau[anomaly.niveau]++;
    
    if (!stats.par_territoire[anomaly.territoire]) {
      stats.par_territoire[anomaly.territoire] = 0;
    }
    stats.par_territoire[anomaly.territoire]++;
    
    totalEcart += Math.abs(anomaly.ecart_pourcent);
  }
  
  if (anomalies.length > 0) {
    stats.ecart_moyen = totalEcart / anomalies.length;
  }
  
  return stats;
}
