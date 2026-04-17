/**
 * Territory Comparison Service
 * "A KI PRI SA YÉ" - Comparison based EXCLUSIVELY on real observed data
 *
 * NO ESTIMATES, NO FICTITIOUS AVERAGES, NO EXTRAPOLATION
 * Only real prices from validated receipt tickets
 */

import type { Observation, Product } from '../schemas/observation';

/**
 * Price statistics for a territory
 */
export interface TerritoryPriceStats {
  territoire: string;
  /** Number of observations found */
  observation_count: number;
  /** Minimum price observed (or null if no data) */
  prix_min: number | null;
  /** Maximum price observed (or null if no data) */
  prix_max: number | null;
  /** Median price (only if ≥3 observations, otherwise null) */
  prix_median: number | null;
  /** All observed prices (for transparency) */
  prix_observes: number[];
  /** Date range of observations */
  date_debut: string | null;
  date_fin: string | null;
  /** Enseignes where prices were observed */
  enseignes: string[];
}

/**
 * Comparison result between territories
 */
export interface ComparisonResult {
  /** Product or category being compared */
  produit_ou_categorie: string;
  /** Type: "produit" or "categorie" */
  type: 'produit' | 'categorie';
  /** Time period of comparison */
  periode: {
    debut: string;
    fin: string;
  };
  /** Statistics per territory */
  territoires: TerritoryPriceStats[];
  /** Total observations across all territories */
  total_observations: number;
  /** Metadata for transparency */
  metadata: {
    source: 'observatoire_citoyen';
    methode: 'prix_reels_uniquement';
    avertissement: string;
  };
}

/**
 * Filter criteria for comparison
 */
export interface ComparisonFilter {
  /** Territories to compare (empty = all) */
  territoires?: string[];
  /** Exact product name or category */
  produit?: string;
  categorie?: string;
  /** Date range (ISO format YYYY-MM-DD) */
  date_debut?: string;
  date_fin?: string;
}

/**
 * Calculate median of an array of numbers
 */
function calculateMedian(values: number[]): number | null {
  if (values.length < 3) {
    return null; // Not enough data for meaningful median
  }

  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);

  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  } else {
    return sorted[mid];
  }
}

/**
 * Extract prices from observations matching product/category
 */
function extractPrices(
  observations: Observation[],
  filter: ComparisonFilter
): Array<{ prix: number; date: string; enseigne: string }> {
  const prices: Array<{ prix: number; date: string; enseigne: string }> = [];

  for (const obs of observations) {
    for (const product of obs.produits) {
      let matches = false;

      // Match by exact product name
      if (filter.produit && product.nom.toLowerCase().includes(filter.produit.toLowerCase())) {
        matches = true;
      }

      // Match by category
      if (filter.categorie && product.categorie?.toLowerCase() === filter.categorie.toLowerCase()) {
        matches = true;
      }

      if (matches) {
        prices.push({
          prix: product.prix_total,
          date: obs.date,
          enseigne: obs.enseigne,
        });
      }
    }
  }

  return prices;
}

/**
 * Filter observations by date range
 */
function filterByDateRange(
  observations: Observation[],
  dateDebut?: string,
  dateFin?: string
): Observation[] {
  return observations.filter((obs) => {
    if (dateDebut && obs.date < dateDebut) return false;
    if (dateFin && obs.date > dateFin) return false;
    return true;
  });
}

/**
 * Get unique enseignes from price data
 */
function getUniqueEnseignes(
  prices: Array<{ prix: number; date: string; enseigne: string }>
): string[] {
  const enseignes = new Set(prices.map((p) => p.enseigne));
  return Array.from(enseignes).sort();
}

/**
 * Get date range from price data
 */
function getDateRange(prices: Array<{ prix: number; date: string; enseigne: string }>): {
  debut: string | null;
  fin: string | null;
} {
  if (prices.length === 0) {
    return { debut: null, fin: null };
  }

  const dates = prices.map((p) => p.date).sort();
  return {
    debut: dates[0],
    fin: dates[dates.length - 1],
  };
}

/**
 * Compare prices across territories based on real observed data only
 *
 * @param observations - All observations from index.json
 * @param filter - Comparison criteria
 * @returns Comparison results with statistics per territory
 */
export function compareTerritoriesPrices(
  observations: Observation[],
  filter: ComparisonFilter
): ComparisonResult {
  // Validate filter
  if (!filter.produit && !filter.categorie) {
    throw new Error('Either produit or categorie must be specified');
  }

  // Filter observations by date range
  const filteredObs = filterByDateRange(observations, filter.date_debut, filter.date_fin);

  // Group observations by territory
  const territoireGroups: Record<string, Observation[]> = {};

  for (const obs of filteredObs) {
    // Filter by territory if specified
    if (filter.territoires && filter.territoires.length > 0) {
      if (!filter.territoires.includes(obs.territoire)) {
        continue;
      }
    }

    if (!territoireGroups[obs.territoire]) {
      territoireGroups[obs.territoire] = [];
    }
    territoireGroups[obs.territoire].push(obs);
  }

  // Calculate statistics for each territory
  const territoireStats: TerritoryPriceStats[] = [];
  let totalObservations = 0;

  for (const [territoire, territoireObs] of Object.entries(territoireGroups)) {
    const prices = extractPrices(territoireObs, filter);
    const priceValues = prices.map((p) => p.prix);

    if (priceValues.length > 0) {
      const dateRange = getDateRange(prices);

      territoireStats.push({
        territoire,
        observation_count: priceValues.length,
        prix_min: Math.min(...priceValues),
        prix_max: Math.max(...priceValues),
        prix_median: calculateMedian(priceValues),
        prix_observes: priceValues,
        date_debut: dateRange.debut,
        date_fin: dateRange.fin,
        enseignes: getUniqueEnseignes(prices),
      });

      totalObservations += priceValues.length;
    } else {
      // Include territory with null data for transparency
      territoireStats.push({
        territoire,
        observation_count: 0,
        prix_min: null,
        prix_max: null,
        prix_median: null,
        prix_observes: [],
        date_debut: null,
        date_fin: null,
        enseignes: [],
      });
    }
  }

  // Sort by territory name for consistent display
  territoireStats.sort((a, b) => a.territoire.localeCompare(b.territoire));

  // Determine period
  let periodeDebut = filter.date_debut || '';
  let periodeFin = filter.date_fin || '';

  if (!periodeDebut || !periodeFin) {
    // Calculate from all observations
    const allDates = filteredObs.map((obs) => obs.date).sort();
    if (allDates.length > 0) {
      periodeDebut = periodeDebut || allDates[0];
      periodeFin = periodeFin || allDates[allDates.length - 1];
    }
  }

  return {
    produit_ou_categorie: filter.produit || filter.categorie || '',
    type: filter.produit ? 'produit' : 'categorie',
    periode: {
      debut: periodeDebut,
      fin: periodeFin,
    },
    territoires: territoireStats,
    total_observations: totalObservations,
    metadata: {
      source: 'observatoire_citoyen',
      methode: 'prix_reels_uniquement',
      avertissement:
        'Ces données sont basées exclusivement sur des prix réels observés. Les territoires sans données ne sont pas estimés.',
    },
  };
}

/**
 * Get list of available products from observations
 */
export function getAvailableProducts(observations: Observation[]): string[] {
  const products = new Set<string>();

  for (const obs of observations) {
    for (const product of obs.produits) {
      products.add(product.nom);
    }
  }

  return Array.from(products).sort();
}

/**
 * Get list of available categories from observations
 */
export function getAvailableCategories(observations: Observation[]): string[] {
  const categories = new Set<string>();

  for (const obs of observations) {
    for (const product of obs.produits) {
      if (product.categorie) {
        categories.add(product.categorie);
      }
    }
  }

  return Array.from(categories).sort();
}

/**
 * Get list of territories with observations
 */
export function getAvailableTerritories(observations: Observation[]): string[] {
  const territories = new Set(observations.map((obs) => obs.territoire));
  return Array.from(territories).sort();
}
