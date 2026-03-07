 
/**
 * antiCrisisReading.ts — Anti-Crisis Reading Logic
 * 
 * Purpose: Determine which territories and categories show below-average price pressure
 * 
 * LEGAL NOTICE:
 * This is a DESCRIPTIVE tool, not a recommendation or advice tool.
 * "Anti-Crisis Reading" means: zones with below-average observed price pressure.
 * Does not constitute purchase advice or commercial incentive.
 * 
 * Methodology:
 * - Territory qualifies if ILPP < national average
 * - Categories listed are those with observed stability
 * - No specific products or stores mentioned
 * - Aggregated observations only
 * 
 * @module antiCrisisReading
 */

import territoriesData from '../data/territories-ilpp.json';

/**
 * Time range type for temporal analysis
 */
export type TimeRange = '30d' | '90d';

/**
 * Territory data structure (with temporal data)
 */
export interface TerritoryData {
  name: string;
  code: string;
  ilpp: {
    '30d': number;
    '90d': number;
  };
  lastUpdated: string;
  antiCrise: {
    '30d': string[];
    '90d': string[];
  };
}

/**
 * Anti-Crisis reading result
 */
export interface AntiCrisisReadingResult {
  /** Territory identifier */
  territoryId: string;
  
  /** Territory name */
  territoryName: string;
  
  /** ILPP score */
  ilpp: number;
  
  /** Whether territory qualifies for Anti-Crisis reading */
  qualifiesForReading: boolean;
  
  /** Stable categories (if any) */
  stableCategories: string[];
  
  /** Comparison to national average */
  comparisonToNational: 'below' | 'equal' | 'above';
  
  /** Difference from national average */
  differenceFromNational: number;
}

/**
 * Legal disclaimer for Anti-Crisis reading
 * MUST be displayed whenever Anti-Crisis reading is shown
 */
export const ANTI_CRISIS_READING_DISCLAIMER = 
  'Lecture descriptive des zones et catégories présentant une pression de prix inférieure à la moyenne observée. ' +
  'Ne constitue ni un conseil d\'achat, ni une incitation commerciale.';

/**
 * Definition of Anti-Crisis reading (for user education)
 */
export const ANTI_CRISIS_READING_DEFINITION =
  'La lecture "Anti-Crise" identifie les territoires où la pression des prix observée est inférieure à la moyenne nationale, ' +
  'ainsi que les catégories de produits y présentant une stabilité relative. ' +
  'Cette analyse est purement descriptive et basée sur des données agrégées.';

/**
 * Get national average ILPP for a specific time range
 * 
 * @param timeRange - Time period ('30d' or '90d')
 * @returns National average ILPP score for the period
 */
export function getNationalAverage(timeRange: TimeRange = '90d'): number {
  return (territoriesData.nationalAverage as any)[timeRange];
}

/**
 * Get all territory data
 * 
 * @returns Map of territory ID to territory data
 */
export function getAllTerritories(): Record<string, TerritoryData> {
  return territoriesData.territories as Record<string, TerritoryData>;
}

/**
 * Get territory data by ID
 * 
 * @param territoryId - Territory identifier (e.g., 'FR-971')
 * @returns Territory data or null if not found
 */
export function getTerritoryData(territoryId: string): TerritoryData | null {
  const territories = getAllTerritories();
  return territories[territoryId] || null;
}

/**
 * Check if territory qualifies for Anti-Crisis reading
 * 
 * Qualification criteria:
 * 1. ILPP < national average
 * 2. Has at least one stable category
 * 
 * @param ilpp - Territory ILPP score
 * @param nationalAvg - National average ILPP
 * @param stableCategories - Array of stable categories
 * @returns true if qualifies for Anti-Crisis reading
 */
export function isAntiCrise(
  ilpp: number,
  nationalAvg: number,
  stableCategories: string[]
): boolean {
  return ilpp < nationalAvg && stableCategories.length > 0;
}

/**
 * Compute Anti-Crisis reading for a territory
 * 
 * @param territoryId - Territory identifier
 * @param timeRange - Time period for analysis ('30d' or '90d')
 * @returns Anti-Crisis reading result
 * 
 * @example
 * const reading = getAntiCrisisReading('FR-973', '30d');
 * if (reading.qualifiesForReading) {
 *   console.log(`${reading.territoryName}: ${reading.stableCategories.join(', ')}`);
 * }
 */
export function getAntiCrisisReading(
  territoryId: string,
  timeRange: TimeRange = '90d'
): AntiCrisisReadingResult | null {
  const territory = getTerritoryData(territoryId);
  if (!territory) {
    return null;
  }

  const nationalAvg = getNationalAverage(timeRange);
  const ilpp = territory.ilpp[timeRange];
  const stableCategories = territory.antiCrise[timeRange];
  const differenceFromNational = ilpp - nationalAvg;
  
  let comparisonToNational: 'below' | 'equal' | 'above';
  if (Math.abs(differenceFromNational) < 1) {
    comparisonToNational = 'equal';
  } else if (differenceFromNational < 0) {
    comparisonToNational = 'below';
  } else {
    comparisonToNational = 'above';
  }

  const qualifiesForReading = isAntiCrise(
    ilpp,
    nationalAvg,
    stableCategories
  );

  return {
    territoryId,
    territoryName: territory.name,
    ilpp,
    qualifiesForReading,
    stableCategories,
    comparisonToNational,
    differenceFromNational,
  };
}

/**
 * Get all territories that qualify for Anti-Crisis reading
 * Sorted by ILPP (lowest pressure first)
 * 
 * @param timeRange - Time period for analysis ('30d' or '90d')
 * @returns Array of Anti-Crisis reading results
 */
export function getAllAntiCrisisReadings(timeRange: TimeRange = '90d'): AntiCrisisReadingResult[] {
  const territories = getAllTerritories();
  const readings: AntiCrisisReadingResult[] = [];

  for (const [territoryId, _] of Object.entries(territories)) {
    const reading = getAntiCrisisReading(territoryId, timeRange);
    if (reading && reading.qualifiesForReading) {
      readings.push(reading);
    }
  }

  // Sort by ILPP ascending (lowest pressure first)
  return readings.sort((a, b) => a.ilpp - b.ilpp);
}

/**
 * Get human-readable explanation of Anti-Crisis reading
 * 
 * @param reading - Anti-Crisis reading result
 * @returns Descriptive explanation
 */
export function explainAntiCrisisReading(reading: AntiCrisisReadingResult): string {
  if (!reading.qualifiesForReading) {
    return `${reading.territoryName} présente une pression de prix supérieure à la moyenne nationale.`;
  }

  const diffText = Math.abs(reading.differenceFromNational).toFixed(0);
  
  return `${reading.territoryName} présente une pression de prix inférieure de ${diffText} points ` +
         `à la moyenne nationale (${reading.ilpp} vs ${getNationalAverage('90d').toFixed(0)}). ` +
         `Les catégories suivantes y montrent une stabilité relative : ${reading.stableCategories.join(', ')}.`;
}

/**
 * Get summary statistics for Anti-Crisis readings
 * 
 * @returns Summary object with counts and percentages
 */
export function getAntiCrisisReadingStats(): {
  totalTerritories: number;
  qualifyingTerritories: number;
  percentageQualifying: number;
  lowestIlpp: number | null;
  highestIlpp: number | null;
} {
  const territories = getAllTerritories();
  const allReadings = Object.keys(territories).map(id => getAntiCrisisReading(id)).filter(r => r !== null) as AntiCrisisReadingResult[];
  const qualifying = allReadings.filter(r => r.qualifiesForReading);

  const ilppScores = qualifying.map(r => r.ilpp);

  return {
    totalTerritories: allReadings.length,
    qualifyingTerritories: qualifying.length,
    percentageQualifying: allReadings.length > 0 
      ? (qualifying.length / allReadings.length) * 100 
      : 0,
    lowestIlpp: ilppScores.length > 0 ? Math.min(...ilppScores) : null,
    highestIlpp: ilppScores.length > 0 ? Math.max(...ilppScores) : null,
  };
}

/**
 * Format stable categories for display
 * Ensures proper capitalization and formatting
 * 
 * @param categories - Array of category names
 * @returns Formatted string
 */
export function formatStableCategories(categories: string[]): string {
  if (categories.length === 0) {
    return 'Aucune catégorie identifiée';
  }

  if (categories.length === 1) {
    return categories[0];
  }

  if (categories.length === 2) {
    return categories.join(' et ');
  }

  const allButLast = categories.slice(0, -1);
  const last = categories[categories.length - 1];
  return `${allButLast.join(', ')} et ${last}`;
}
