/**
 * Housing Cost Observatory Service v2.4.0
 * 
 * Implements citizen housing cost observation with:
 * - Read-only data access (no data modification)
 * - Rent analysis by surface, type, territory
 * - Aggregations: mean, median, min/max, dispersion
 * - Simple historical variations
 * - Transparent source tracking
 * - No recommendations or legal/financial advice
 * - No proprietary scoring
 * - Observed data only (listings, public records)
 */

import type {
  HousingPricePoint,
  HousingCostPerM2,
  HousingTerritoryAggregation,
  HousingCostComparisonResult,
  HousingCostMetadata,
  HousingSourceSummary,
  HousingCostFilter,
  HousingType,
  HousingCostHistory,
  HousingCostVariation,
  HousingCostRanking,
} from '../types/housingCost';
import type { Territory } from '../types/priceAlerts';

/**
 * Configuration constants
 */
const HOUSING_CONFIG = {
  MEDIAN_TOLERANCE_PERCENT: 15,   // ±15% for median category
  MIN_COVERAGE_WARNING_PERCENT: 50,
  MAX_PRICE_AGE_WARNING_DAYS: 30,
  STABLE_VARIATION_THRESHOLD: 5,  // ±5% considered stable
} as const;

/**
 * Analyze housing costs for a territory
 */
export function analyzeHousingCosts(
  pricePoints: HousingPricePoint[],
  territory: Territory,
  housingType?: HousingType
): HousingCostComparisonResult | null {
  if (!pricePoints || pricePoints.length === 0) {
    return null;
  }

  // Filter by territory and optional housing type
  let filtered = pricePoints.filter(p => p.territory === territory);
  if (housingType) {
    filtered = filtered.filter(p => p.type === housingType);
  }

  if (filtered.length === 0) {
    return null;
  }

  // Calculate rent per m² for each point
  const pricePointsWithM2: HousingCostPerM2[] = filtered.map(p => ({
    pricePoint: p,
    rentPerM2: Math.round((p.rent / p.surface) * 100) / 100,
    totalCostPerM2: p.charges 
      ? Math.round(((p.rent + p.charges) / p.surface) * 100) / 100
      : undefined,
  }));

  // Calculate aggregation
  const aggregation = calculateHousingAggregation(filtered, territory, housingType);

  // Generate metadata
  const metadata = generateHousingMetadata(filtered);

  return {
    territory,
    housingType,
    pricePoints: pricePointsWithM2,
    aggregation,
    comparisonDate: new Date().toISOString(),
    metadata,
  };
}

/**
 * Calculate housing aggregation statistics
 */
export function calculateHousingAggregation(
  pricePoints: HousingPricePoint[],
  territory: Territory,
  housingType?: HousingType
): HousingTerritoryAggregation {
  if (pricePoints.length === 0) {
    throw new Error('Cannot calculate aggregation for empty price list');
  }

  const rents = pricePoints.map(p => p.rent);
  const surfaces = pricePoints.map(p => p.surface);
  const rentsPerM2 = pricePoints.map(p => p.rent / p.surface);

  // Calculate basic statistics
  const averageRent = rents.reduce((sum, r) => sum + r, 0) / rents.length;
  const medianRent = calculateMedian(rents);
  const minRent = Math.min(...rents);
  const maxRent = Math.max(...rents);

  const averageSurface = surfaces.reduce((sum, s) => sum + s, 0) / surfaces.length;
  const medianSurface = calculateMedian(surfaces);

  const averageRentPerM2 = rentsPerM2.reduce((sum, r) => sum + r, 0) / rentsPerM2.length;
  const medianRentPerM2 = calculateMedian(rentsPerM2);

  // Calculate dispersion
  const stdDev = calculateStandardDeviation(rents, averageRent);
  const coeffVar = averageRent > 0 ? (stdDev / averageRent) * 100 : 0;
  const percentile25 = calculatePercentile(rents, 25);
  const percentile75 = calculatePercentile(rents, 75);
  const iqr = percentile75 - percentile25;

  // Urban/rural breakdown
  const urbanRuralBreakdown = {
    urban: pricePoints.filter(p => p.location?.urbanRuralClassification === 'urban').length,
    suburban: pricePoints.filter(p => p.location?.urbanRuralClassification === 'suburban').length,
    rural: pricePoints.filter(p => p.location?.urbanRuralClassification === 'rural').length,
  };

  // Date range
  const dates = pricePoints.map(p => new Date(p.observationDate).getTime());
  const oldestDate = new Date(Math.min(...dates)).toISOString();
  const newestDate = new Date(Math.max(...dates)).toISOString();

  return {
    territory,
    housingType,
    statistics: {
      listingCount: pricePoints.length,
      averageRent: Math.round(averageRent * 100) / 100,
      medianRent: Math.round(medianRent * 100) / 100,
      minRent: Math.round(minRent * 100) / 100,
      maxRent: Math.round(maxRent * 100) / 100,
      averageSurface: Math.round(averageSurface * 100) / 100,
      medianSurface: Math.round(medianSurface * 100) / 100,
      averageRentPerM2: Math.round(averageRentPerM2 * 100) / 100,
      medianRentPerM2: Math.round(medianRentPerM2 * 100) / 100,
    },
    dispersion: {
      standardDeviation: Math.round(stdDev * 100) / 100,
      coefficientOfVariation: Math.round(coeffVar * 100) / 100,
      interquartileRange: Math.round(iqr * 100) / 100,
      percentile25: Math.round(percentile25 * 100) / 100,
      percentile75: Math.round(percentile75 * 100) / 100,
    },
    urbanRuralBreakdown,
    observationPeriod: {
      from: oldestDate,
      to: newestDate,
    },
    lastUpdate: new Date().toISOString(),
  };
}

/**
 * Calculate median
 */
function calculateMedian(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

/**
 * Calculate standard deviation
 */
function calculateStandardDeviation(values: number[], mean: number): number {
  if (values.length === 0) return 0;
  const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
  const variance = squaredDiffs.reduce((sum, d) => sum + d, 0) / values.length;
  return Math.sqrt(variance);
}

/**
 * Calculate percentile
 */
function calculatePercentile(values: number[], percentile: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = (percentile / 100) * (sorted.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  const weight = index - lower;
  return sorted[lower] * (1 - weight) + sorted[upper] * weight;
}

/**
 * Generate metadata for transparency
 */
export function generateHousingMetadata(
  pricePoints: HousingPricePoint[]
): HousingCostMetadata {
  const totalListings = pricePoints.length;
  const listingsWithData = totalListings;

  // Date range
  const dates = pricePoints.map(p => new Date(p.observationDate).getTime());
  const oldestDate = new Date(Math.min(...dates)).toISOString();
  const newestDate = new Date(Math.max(...dates)).toISOString();

  // Source summary
  const sourceCounts = new Map<string, number>();
  pricePoints.forEach(p => {
    const sourceType = p.source.type;
    sourceCounts.set(sourceType, (sourceCounts.get(sourceType) || 0) + 1);
  });

  const sources: HousingSourceSummary[] = Array.from(sourceCounts.entries()).map(
    ([source, count]) => ({
      source: source as any,
      observationCount: count,
      percentage: Math.round((count / totalListings) * 100 * 100) / 100,
    })
  );

  // Warnings
  const warnings: string[] = [];
  const coveragePercentage = (listingsWithData / totalListings) * 100;
  if (coveragePercentage < HOUSING_CONFIG.MIN_COVERAGE_WARNING_PERCENT) {
    warnings.push(`Low coverage: Only ${Math.round(coveragePercentage)}% of listings have complete data`);
  }

  const now = Date.now();
  const maxAgeMs = HOUSING_CONFIG.MAX_PRICE_AGE_WARNING_DAYS * 24 * 60 * 60 * 1000;
  const hasOldData = pricePoints.some(
    p => now - new Date(p.observationDate).getTime() > maxAgeMs
  );
  if (hasOldData) {
    warnings.push(
      `Some observations are older than ${HOUSING_CONFIG.MAX_PRICE_AGE_WARNING_DAYS} days`
    );
  }

  return {
    methodology: 'v2.4.0',
    aggregationMethod: 'median',
    dataQuality: {
      totalListings,
      listingsWithData,
      coveragePercentage: Math.round(coveragePercentage * 100) / 100,
      oldestObservation: oldestDate,
      newestObservation: newestDate,
    },
    sources,
    warnings: warnings.length > 0 ? warnings : undefined,
    limitations: [
      'Data represents observed listings only, not all available housing',
      'Prices may vary based on location, condition, and amenities',
      'Does not include all costs (notary fees, moving costs, etc.)',
      'No recommendation or legal/financial advice is provided',
      'Market conditions may change rapidly',
    ],
  };
}

/**
 * Apply filters to housing price points
 */
export function applyHousingFilters(
  pricePoints: HousingPricePoint[],
  filter: HousingCostFilter
): HousingPricePoint[] {
  let filtered = pricePoints;

  if (filter.territory) {
    filtered = filtered.filter(p => p.territory === filter.territory);
  }

  if (filter.housingType) {
    filtered = filtered.filter(p => p.type === filter.housingType);
  }

  if (filter.minSurface !== undefined) {
    filtered = filtered.filter(p => p.surface >= filter.minSurface!);
  }

  if (filter.maxSurface !== undefined) {
    filtered = filtered.filter(p => p.surface <= filter.maxSurface!);
  }

  if (filter.minRent !== undefined) {
    filtered = filtered.filter(p => p.rent >= filter.minRent!);
  }

  if (filter.maxRent !== undefined) {
    filtered = filtered.filter(p => p.rent <= filter.maxRent!);
  }

  if (filter.furnished !== undefined) {
    filtered = filtered.filter(p => p.furnished === filter.furnished);
  }

  if (filter.urbanRuralClassification) {
    filtered = filtered.filter(
      p => p.location?.urbanRuralClassification === filter.urbanRuralClassification
    );
  }

  if (filter.maxPriceAge) {
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() - filter.maxPriceAge);
    filtered = filtered.filter(p => new Date(p.observationDate) >= maxDate);
  }

  if (filter.minConfidence) {
    const confidenceLevels = { low: 1, medium: 2, high: 3 };
    const minLevel = confidenceLevels[filter.minConfidence];
    filtered = filtered.filter(p => confidenceLevels[p.confidence] >= minLevel);
  }

  if (filter.verifiedOnly) {
    filtered = filtered.filter(p => p.verified);
  }

  return filtered;
}

/**
 * Build housing cost history
 */
export function buildHousingHistory(
  pricePoints: HousingPricePoint[],
  territory: Territory,
  housingType?: HousingType
): HousingCostHistory[] {
  if (pricePoints.length === 0) {
    return [];
  }

  // Filter by territory and optional type
  let filtered = pricePoints.filter(p => p.territory === territory);
  if (housingType) {
    filtered = filtered.filter(p => p.type === housingType);
  }

  // Group by month
  const monthlyGroups = new Map<string, HousingPricePoint[]>();
  filtered.forEach(p => {
    const date = new Date(p.observationDate);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    if (!monthlyGroups.has(monthKey)) {
      monthlyGroups.set(monthKey, []);
    }
    monthlyGroups.get(monthKey)!.push(p);
  });

  // Build history points
  const history: HousingCostHistory[] = [];
  monthlyGroups.forEach((points, monthKey) => {
    const rents = points.map(p => p.rent);
    const rentsPerM2 = points.map(p => p.rent / p.surface);

    history.push({
      date: `${monthKey}-01`,
      territory,
      housingType,
      averageRent: Math.round((rents.reduce((sum, r) => sum + r, 0) / rents.length) * 100) / 100,
      medianRent: Math.round(calculateMedian(rents) * 100) / 100,
      averageRentPerM2: Math.round((rentsPerM2.reduce((sum, r) => sum + r, 0) / rentsPerM2.length) * 100) / 100,
      medianRentPerM2: Math.round(calculateMedian(rentsPerM2) * 100) / 100,
      listingCount: points.length,
      sources: points.map(p => p.source),
    });
  });

  return history.sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Calculate housing cost variation
 */
export function calculateHousingVariation(
  history: HousingCostHistory[]
): HousingCostVariation | null {
  if (history.length < 2) {
    return null;
  }

  const first = history[0];
  const last = history[history.length - 1];

  const absoluteChange = last.medianRent - first.medianRent;
  const percentageChange = first.medianRent > 0
    ? (absoluteChange / first.medianRent) * 100
    : 0;

  let direction: 'increase' | 'decrease' | 'stable';
  if (Math.abs(percentageChange) < HOUSING_CONFIG.STABLE_VARIATION_THRESHOLD) {
    direction = 'stable';
  } else {
    direction = percentageChange > 0 ? 'increase' : 'decrease';
  }

  const confidence = history.length >= 6 ? 'high' : history.length >= 3 ? 'medium' : 'low';

  return {
    territory: first.territory,
    housingType: first.housingType,
    period: {
      from: first.date,
      to: last.date,
    },
    variation: {
      absoluteChange: Math.round(absoluteChange * 100) / 100,
      percentageChange: Math.round(percentageChange * 100) / 100,
      direction,
    },
    confidence,
    methodology: 'v2.4.0',
  };
}

/**
 * Rank housing by rent per m²
 */
export function rankHousingByRentPerM2(
  pricePoints: HousingPricePoint[],
  medianRentPerM2: number
): HousingCostRanking[] {
  if (pricePoints.length === 0) {
    return [];
  }

  const withRentPerM2 = pricePoints.map(p => ({
    pricePoint: p,
    rentPerM2: p.rent / p.surface,
  }));

  const sorted = withRentPerM2.sort((a, b) => a.rentPerM2 - b.rentPerM2);

  return sorted.map((item, index) => {
    const absoluteDiff = item.rentPerM2 - medianRentPerM2;
    const percentageDiff = medianRentPerM2 > 0 ? (absoluteDiff / medianRentPerM2) * 100 : 0;

    let category: HousingCostRanking['priceCategory'];
    if (percentageDiff < -HOUSING_CONFIG.MEDIAN_TOLERANCE_PERCENT) {
      category = 'very_low';
    } else if (percentageDiff < 0) {
      category = 'low';
    } else if (percentageDiff <= HOUSING_CONFIG.MEDIAN_TOLERANCE_PERCENT) {
      category = 'median';
    } else if (percentageDiff <= HOUSING_CONFIG.MEDIAN_TOLERANCE_PERCENT * 2) {
      category = 'high';
    } else {
      category = 'very_high';
    }

    return {
      rank: index + 1,
      pricePoint: item.pricePoint,
      rentPerM2: Math.round(item.rentPerM2 * 100) / 100,
      absoluteDifferenceFromMedian: Math.round(absoluteDiff * 100) / 100,
      percentageDifferenceFromMedian: Math.round(percentageDiff * 100) / 100,
      priceCategory: category,
    };
  });
}
