/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * Observatoire Data Loader
 * 
 * Loads real price observation data from JSON files
 * Provides aggregated statistics and comparison functions
 * 
 * @module observatoireDataLoader
 */

/**
 * Observatory data snapshot structure
 */
export interface ObservatoireSnapshot {
  territoire: string;
  date_snapshot: string;
  source: string;
  qualite: string;
  donnees: ObservatoireObservation[];
}

export interface ObservatoireObservation {
  commune?: string;
  enseigne?: string;
  categorie: string;
  produit: string;
  ean?: string;
  unite: string;
  prix: number;
}

/**
 * Aggregated price statistics
 */
export interface PriceStatistics {
  productName: string;
  category: string;
  avgPrice: number;
  minPrice: number;
  maxPrice: number;
  priceChange?: number; // Percentage change between periods
  observations: number;
  lastUpdate: string;
  ean?: string;
  enseignes: string[];
}

/**
 * Load observatoire data from JSON files
 * Fetches data from public folder.
 * Pass `months` to override the default list of month keys to attempt.
 */
/** Default months to probe when no explicit list is provided (most recent first). */
const DEFAULT_SNAPSHOT_MONTHS = [
  '2026-02',
  '2026-01',
  '2025-12',
  '2025-11',
  '2025-10',
  '2025-09',
];

export async function loadObservatoireData(
  territory: string = 'Guadeloupe',
  months: string[] = DEFAULT_SNAPSHOT_MONTHS,
): Promise<ObservatoireSnapshot[]> {
  try {
    const territoryKey = territory.toLowerCase().replace(/\s+/g, '_');
    const snapshots: ObservatoireSnapshot[] = [];

    const fetches = months.map(async (month) => {
      try {
        const url = `${import.meta.env.BASE_URL}data/observatoire/${territoryKey}_${month}.json`;
        const res = await fetch(url);
        if (res.ok) {
          const data: ObservatoireSnapshot = await res.json();
          return data;
        }
      } catch {
        // Snapshot not available for this month – ignore silently
      }
      return null;
    });

    const results = await Promise.all(fetches);
    for (const r of results) {
      if (r) snapshots.push(r);
    }

    // Sort chronologically (oldest first for aggregation)
    snapshots.sort((a, b) => a.date_snapshot.localeCompare(b.date_snapshot));

    return snapshots;
  } catch (error) {
    console.error('Error loading observatoire data:', error);
    return [];
  }
}

/**
 * Load observatoire snapshots for all territories.
 * Returns a map keyed by territory file stem.
 */
export async function loadAllTerritories(
  months: string[] = DEFAULT_SNAPSHOT_MONTHS,
): Promise<Map<string, ObservatoireSnapshot[]>> {
  const { TERRITORIES } = await import('./territoryNormalizationService');
  const result = new Map<string, ObservatoireSnapshot[]>();

  await Promise.all(
    TERRITORIES.map(async (t) => {
      const snaps = await loadObservatoireData(t.labelFull, months);
      if (snaps.length > 0) {
        result.set(t.code, snaps);
      }
    }),
  );
  return result;
}

/**
 * Calculate aggregated statistics from observations
 */
export function calculateStatistics(
  snapshots: ObservatoireSnapshot[]
): PriceStatistics[] {
  if (snapshots.length === 0) return [];
  
  // Group observations by product EAN or name
  const productMap = new Map<string, ObservatoireObservation[]>();
  
  snapshots.forEach(snapshot => {
    snapshot.donnees.forEach(obs => {
      const key = obs.ean || obs.produit;
      if (!productMap.has(key)) {
        productMap.set(key, []);
      }
      productMap.get(key)!.push(obs);
    });
  });
  
  // Calculate statistics for each product
  const statistics: PriceStatistics[] = [];
  
  productMap.forEach((observations, key) => {
    const prices = observations.map(o => o.prix);
    const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    
    // Get unique enseignes
    const enseignes = [...new Set(observations.map(o => o.enseigne).filter(Boolean))];
    
    // Use the first observation for metadata
    const firstObs = observations[0];
    
    statistics.push({
      productName: firstObs.produit,
      category: firstObs.categorie,
      avgPrice: Math.round(avgPrice * 100) / 100,
      minPrice: Math.round(minPrice * 100) / 100,
      maxPrice: Math.round(maxPrice * 100) / 100,
      observations: observations.length,
      lastUpdate: snapshots[snapshots.length - 1].date_snapshot,
      ean: firstObs.ean,
      enseignes: enseignes as string[]
    });
  });
  
  return statistics;
}

/**
 * Calculate price change between two snapshots
 */
export function calculatePriceChange(
  oldSnapshot: ObservatoireSnapshot,
  newSnapshot: ObservatoireSnapshot
): Map<string, number> {
  const changes = new Map<string, number>();
  
  // Create maps by EAN or product name
  const oldPrices = new Map<string, number[]>();
  const newPrices = new Map<string, number[]>();
  
  oldSnapshot.donnees.forEach(obs => {
    const key = obs.ean || obs.produit;
    if (!oldPrices.has(key)) oldPrices.set(key, []);
    oldPrices.get(key)!.push(obs.prix);
  });
  
  newSnapshot.donnees.forEach(obs => {
    const key = obs.ean || obs.produit;
    if (!newPrices.has(key)) newPrices.set(key, []);
    newPrices.get(key)!.push(obs.prix);
  });
  
  // Calculate average price change for each product
  oldPrices.forEach((oldPriceList, key) => {
    const newPriceList = newPrices.get(key);
    if (newPriceList && newPriceList.length > 0) {
      const oldAvg = oldPriceList.reduce((a, b) => a + b, 0) / oldPriceList.length;
      const newAvg = newPriceList.reduce((a, b) => a + b, 0) / newPriceList.length;
      const changePercent = ((newAvg - oldAvg) / oldAvg) * 100;
      changes.set(key, Math.round(changePercent * 10) / 10);
    }
  });
  
  return changes;
}

/**
 * Get dispersion statistics (price variance between stores)
 */
export function getDispersionByStore(
  snapshot: ObservatoireSnapshot
): Map<string, { min: number; max: number; variance: number }> {
  const dispersion = new Map();
  
  // Group by product
  const productMap = new Map<string, ObservatoireObservation[]>();
  
  snapshot.donnees.forEach(obs => {
    const key = obs.ean || obs.produit;
    if (!productMap.has(key)) {
      productMap.set(key, []);
    }
    productMap.get(key)!.push(obs);
  });
  
  // Calculate dispersion for each product
  productMap.forEach((observations, key) => {
    if (observations.length > 1) {
      const prices = observations.map(o => o.prix);
      const min = Math.min(...prices);
      const max = Math.max(...prices);
      const variance = max - min;
      
      dispersion.set(key, {
        min: Math.round(min * 100) / 100,
        max: Math.round(max * 100) / 100,
        variance: Math.round(variance * 100) / 100
      });
    }
  });
  
  return dispersion;
}

/**
 * Export utility: Convert to CSV format
 */
export function exportToCSV(statistics: PriceStatistics[]): string {
  const headers = [
    'Produit',
    'Catégorie',
    'Prix Moyen (€)',
    'Prix Min (€)',
    'Prix Max (€)',
    'Écart',
    'Observations',
    'EAN',
    'Enseignes'
  ];
  
  const rows = statistics.map(stat => [
    stat.productName,
    stat.category,
    stat.avgPrice.toFixed(2),
    stat.minPrice.toFixed(2),
    stat.maxPrice.toFixed(2),
    (stat.maxPrice - stat.minPrice).toFixed(2),
    stat.observations.toString(),
    stat.ean || '',
    stat.enseignes.join('; ')
  ]);
  
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');
  
  return csvContent;
}
