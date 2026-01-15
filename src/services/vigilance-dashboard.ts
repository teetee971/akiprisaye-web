/**
 * Vigilance Dashboard Service
 * "A KI PRI SA YÉ" - Public citizen vigilance based ONLY on real observed data
 * 
 * NO COMMERCIAL RATINGS, NO PUNITIVE RANKINGS, NO DECISION-MAKING AI
 * Transparent aggregation to make weak signals visible
 */

import type { Observation } from '../schemas/observation';
import type { PriceAnomaly } from './anomaly-detection';
import type { Alert } from './alerts';

/**
 * Time period for analysis
 */
export type TimePeriod = '7j' | '30j' | '90j' | 'tout';

/**
 * Global vigilance indicators
 */
export interface VigilanceGlobale {
  /** Number of active anomalies */
  anomalies_actives: number;
  /** Number of active citizen alerts */
  alertes_actives: number;
  /** Total observations available */
  observations_totales: number;
  /** Most monitored products (no store ranking) */
  produits_surveilles: Array<{
    produit: string;
    nb_alertes: number;
    nb_anomalies: number;
  }>;
  /** Analysis period */
  periode: TimePeriod;
  /** Last update timestamp */
  derniere_maj: string;
}

/**
 * Territory-specific indicators
 */
export interface VigilanceTerritoire {
  /** Territory name */
  territoire: string;
  /** Number of anomalies in this territory */
  nb_anomalies: number;
  /** Number of alerts in this territory */
  nb_alertes: number;
  /** Number of observations available */
  nb_observations: number;
  /** Evolution over time */
  evolution: {
    periode: string; // e.g., "7j", "30j"
    variation_anomalies: number; // percentage
    variation_alertes: number; // percentage
  };
  /** Affected categories */
  categories_concernees: string[];
}

/**
 * Category-specific indicators
 */
export interface VigilanceCategorie {
  /** Category name */
  categorie: string;
  /** Number of anomalies */
  nb_anomalies: number;
  /** Number of alerts */
  nb_alertes: number;
  /** Affected territories */
  territoires_concernes: string[];
  /** Most affected products */
  produits_concernes: Array<{
    produit: string;
    nb_signaux: number;
  }>;
}

/**
 * Complete dashboard data
 */
export interface DashboardVigilance {
  /** Global indicators */
  global: VigilanceGlobale;
  /** Per-territory indicators */
  par_territoire: VigilanceTerritoire[];
  /** Per-category indicators */
  par_categorie: VigilanceCategorie[];
  /** Metadata */
  metadata: {
    source: 'observatoire_citoyen';
    methode: 'agregation_transparente';
    periode_analyse: TimePeriod;
    date_generation: string;
    avertissement: string;
  };
}

/**
 * Time series data point
 */
export interface TimeSeriesPoint {
  date: string;
  valeur: number;
}

/**
 * Calculate days offset for period
 */
function getPeriodDays(period: TimePeriod): number | null {
  switch (period) {
    case '7j': return 7;
    case '30j': return 30;
    case '90j': return 90;
    case 'tout': return null;
  }
}

/**
 * Filter data by time period
 */
function filterByPeriod<T extends { date: string }>(
  items: T[],
  period: TimePeriod
): T[] {
  const days = getPeriodDays(period);
  if (days === null) return items;
  
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffStr = cutoff.toISOString().split('T')[0];
  
  return items.filter(item => item.date >= cutoffStr);
}

/**
 * Calculate global vigilance indicators
 */
function calculateGlobalVigilance(
  observations: Observation[],
  anomalies: PriceAnomaly[],
  alerts: Alert[],
  period: TimePeriod
): VigilanceGlobale {
  const filteredAnomalies = filterByPeriod(anomalies, period);
  const filteredAlerts = filterByPeriod(
    alerts.map(a => ({ ...a, date: a.date_observation })),
    period
  );
  
  // Count products being monitored
  const productCounts = new Map<string, { anomalies: number; alertes: number }>();
  
  for (const anomaly of filteredAnomalies) {
    const current = productCounts.get(anomaly.produit) || { anomalies: 0, alertes: 0 };
    productCounts.set(anomaly.produit, { ...current, anomalies: current.anomalies + 1 });
  }
  
  for (const alert of filteredAlerts) {
    const current = productCounts.get(alert.produit) || { anomalies: 0, alertes: 0 };
    productCounts.set(alert.produit, { ...current, alertes: current.alertes + 1 });
  }
  
  // Sort by total signals
  const produitsSurveilles = Array.from(productCounts.entries())
    .map(([produit, counts]) => ({
      produit,
      nb_alertes: counts.alertes,
      nb_anomalies: counts.anomalies
    }))
    .sort((a, b) => 
      (b.nb_alertes + b.nb_anomalies) - (a.nb_alertes + a.nb_anomalies)
    )
    .slice(0, 10); // Top 10
  
  return {
    anomalies_actives: filteredAnomalies.length,
    alertes_actives: filteredAlerts.length,
    observations_totales: observations.length,
    produits_surveilles: produitsSurveilles,
    periode: period,
    derniere_maj: new Date().toISOString()
  };
}

/**
 * Calculate territory-specific indicators
 */
function calculateTerritoireVigilance(
  observations: Observation[],
  anomalies: PriceAnomaly[],
  alerts: Alert[],
  period: TimePeriod
): VigilanceTerritoire[] {
  const territories = new Set(observations.map(obs => obs.territoire));
  const result: VigilanceTerritoire[] = [];
  
  const filteredAnomalies = filterByPeriod(anomalies, period);
  const filteredAlerts = filterByPeriod(
    alerts.map(a => ({ ...a, date: a.date_observation })),
    period
  );
  
  for (const territoire of territories) {
    const territoireObs = observations.filter(obs => obs.territoire === territoire);
    const territoireAnomalies = filteredAnomalies.filter(a => a.territoire === territoire);
    const territoireAlerts = filteredAlerts.filter(a => a.territoire === territoire);
    
    // Get affected categories
    const categories = new Set<string>();
    for (const obs of territoireObs) {
      for (const product of obs.produits) {
        if (product.categorie) categories.add(product.categorie);
      }
    }
    
    // Calculate evolution (compare to previous period)
    const prevPeriodDays = getPeriodDays(period);
    let variationAnomalies = 0;
    let variationAlertes = 0;
    
    if (prevPeriodDays) {
      const prevCutoff = new Date();
      prevCutoff.setDate(prevCutoff.getDate() - prevPeriodDays * 2);
      const prevCutoffStr = prevCutoff.toISOString().split('T')[0];
      
      const currentCutoff = new Date();
      currentCutoff.setDate(currentCutoff.getDate() - prevPeriodDays);
      const currentCutoffStr = currentCutoff.toISOString().split('T')[0];
      
      const prevAnomalies = anomalies.filter(
        a => a.territoire === territoire && a.date >= prevCutoffStr && a.date < currentCutoffStr
      );
      const prevAlerts = alerts.filter(
        a => a.territoire === territoire && a.date_observation >= prevCutoffStr && a.date_observation < currentCutoffStr
      );
      
      if (prevAnomalies.length > 0) {
        variationAnomalies = ((territoireAnomalies.length - prevAnomalies.length) / prevAnomalies.length) * 100;
      }
      if (prevAlerts.length > 0) {
        variationAlertes = ((territoireAlerts.length - prevAlerts.length) / prevAlerts.length) * 100;
      }
    }
    
    result.push({
      territoire,
      nb_anomalies: territoireAnomalies.length,
      nb_alertes: territoireAlerts.length,
      nb_observations: territoireObs.length,
      evolution: {
        periode: period,
        variation_anomalies: variationAnomalies,
        variation_alertes: variationAlertes
      },
      categories_concernees: Array.from(categories)
    });
  }
  
  return result.sort((a, b) => 
    (b.nb_anomalies + b.nb_alertes) - (a.nb_anomalies + a.nb_alertes)
  );
}

/**
 * Calculate category-specific indicators
 */
function calculateCategorieVigilance(
  observations: Observation[],
  anomalies: PriceAnomaly[],
  alerts: Alert[],
  period: TimePeriod
): VigilanceCategorie[] {
  const categories = new Set<string>();
  for (const obs of observations) {
    for (const product of obs.produits) {
      if (product.categorie) categories.add(product.categorie);
    }
  }
  
  const filteredAnomalies = filterByPeriod(anomalies, period);
  const filteredAlerts = filterByPeriod(
    alerts.map(a => ({ ...a, date: a.date_observation })),
    period
  );
  
  const result: VigilanceCategorie[] = [];
  
  for (const categorie of categories) {
    // Find products in this category
    const categoryProducts = new Set<string>();
    for (const obs of observations) {
      for (const product of obs.produits) {
        if (product.categorie === categorie) {
          categoryProducts.add(product.nom);
        }
      }
    }
    
    // Count signals
    const categoryAnomalies = filteredAnomalies.filter(a => {
      for (const obs of observations) {
        for (const product of obs.produits) {
          if (product.nom === a.produit && product.categorie === categorie) {
            return true;
          }
        }
      }
      return false;
    });
    
    const categoryAlerts = filteredAlerts.filter(a => 
      categoryProducts.has(a.produit)
    );
    
    // Get affected territories
    const territoires = new Set(
      [...categoryAnomalies.map(a => a.territoire), ...categoryAlerts.map(a => a.territoire)]
    );
    
    // Count signals per product
    const productSignals = new Map<string, number>();
    for (const anomaly of categoryAnomalies) {
      productSignals.set(anomaly.produit, (productSignals.get(anomaly.produit) || 0) + 1);
    }
    for (const alert of categoryAlerts) {
      productSignals.set(alert.produit, (productSignals.get(alert.produit) || 0) + 1);
    }
    
    const produitsConcernes = Array.from(productSignals.entries())
      .map(([produit, nb_signaux]) => ({ produit, nb_signaux }))
      .sort((a, b) => b.nb_signaux - a.nb_signaux)
      .slice(0, 5); // Top 5
    
    result.push({
      categorie,
      nb_anomalies: categoryAnomalies.length,
      nb_alertes: categoryAlerts.length,
      territoires_concernes: Array.from(territoires),
      produits_concernes: produitsConcernes
    });
  }
  
  return result.sort((a, b) => 
    (b.nb_anomalies + b.nb_alertes) - (a.nb_anomalies + a.nb_alertes)
  );
}

/**
 * Generate complete vigilance dashboard
 */
export function generateVigilanceDashboard(
  observations: Observation[],
  anomalies: PriceAnomaly[],
  alerts: Alert[],
  period: TimePeriod = '30j'
): DashboardVigilance {
  return {
    global: calculateGlobalVigilance(observations, anomalies, alerts, period),
    par_territoire: calculateTerritoireVigilance(observations, anomalies, alerts, period),
    par_categorie: calculateCategorieVigilance(observations, anomalies, alerts, period),
    metadata: {
      source: 'observatoire_citoyen',
      methode: 'agregation_transparente',
      periode_analyse: period,
      date_generation: new Date().toISOString(),
      avertissement: 'Ces indicateurs sont basés exclusivement sur des données réelles observées. ' +
        'Un signal ne constitue pas une preuve d\'abus et nécessite une analyse contextuelle.'
    }
  };
}

/**
 * Generate time series for anomalies
 */
export function generateAnomaliesTimeSeries(
  anomalies: PriceAnomaly[],
  period: TimePeriod
): TimeSeriesPoint[] {
  const filtered = filterByPeriod(anomalies, period);
  
  // Group by date
  const countByDate = new Map<string, number>();
  for (const anomaly of filtered) {
    const count = countByDate.get(anomaly.date) || 0;
    countByDate.set(anomaly.date, count + 1);
  }
  
  // Convert to array and sort
  return Array.from(countByDate.entries())
    .map(([date, valeur]) => ({ date, valeur }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Generate time series for alerts
 */
export function generateAlertesTimeSeries(
  alerts: Alert[],
  period: TimePeriod
): TimeSeriesPoint[] {
  const filtered = filterByPeriod(
    alerts.map(a => ({ ...a, date: a.date_observation })),
    period
  );
  
  // Group by date
  const countByDate = new Map<string, number>();
  for (const alert of filtered) {
    const count = countByDate.get(alert.date_observation) || 0;
    countByDate.set(alert.date_observation, count + 1);
  }
  
  // Convert to array and sort
  return Array.from(countByDate.entries())
    .map(([date, valeur]) => ({ date, valeur }))
    .sort((a, b) => a.date.localeCompare(b.date));
}
