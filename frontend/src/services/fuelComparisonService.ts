 
/**
 * Fuel Comparison Service v1.0.0
 * 
 * Implements citizen fuel price comparison with:
 * - Read-only data access
 * - Territory-based fuel station matching
 * - Official price cap tracking
 * - Statistical aggregation
 * - Transparent source tracking
 * - "Observer, pas vendre" philosophy
 */

import type {
  FuelComparisonResult,
  FuelPricePoint,
  FuelPriceRanking,
  FuelAggregation,
  FuelComparisonFilter,
  FuelType,
  Territory,
  FuelPriceHistory,
  FuelHistoricalDataPoint,
} from '../types/fuelComparison';

import {
  fetchOfficialFuelPrices,
  parseAPIResponse,
  getDepartmentFromTerritory,
  calculateDistance,
} from '../utils/fuelPriceAPI';

/**
 * Configuration constants
 */
const FUEL_COMPARISON_CONFIG = {
  AVERAGE_PRICE_TOLERANCE_PERCENT: 5,
  MIN_COVERAGE_WARNING_PERCENT: 50,
  MAX_PRICE_AGE_WARNING_DAYS: 7,
  // Price category thresholds
  BELOW_AVERAGE_THRESHOLD: 0.98, // 2% below average
  ABOVE_AVERAGE_THRESHOLD: 1.02, // 2% above average
} as const;

export interface LiveFuelPricesResult {
  prices: FuelPricePoint[];
  /** ISO 8601 timestamp of when the government API data was fetched (from the Cloudflare proxy) */
  fetchedAt: string | null;
}

/**
 * Fetch live fuel prices from the Cloudflare Function proxy
 * (which calls the official French government API).
 * Falls back to the local JSON bundle if unavailable.
 */
export async function fetchLiveFuelPrices(territory: Territory): Promise<LiveFuelPricesResult> {
  try {
    const url = `${import.meta.env.BASE_URL}api/fuel-prices?territory=${territory}`;
    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!res.ok) throw new Error(`API error ${res.status}`);
    const data = await res.json();
    const prices: FuelPricePoint[] = data.fuelPrices ?? [];
    if (prices.length > 0) return { prices, fetchedAt: data.fetchedAt ?? null };
    throw new Error('Empty response from live API');
  } catch (err) {
    console.warn(`Live API unavailable for ${territory}, falling back to JSON bundle:`, err);
    return { prices: [], fetchedAt: null };
  }
}

/**
 * Load fuel prices — tries live API first, then local JSON fallback.
 */
export async function loadFuelData(): Promise<{
  fuelPrices: FuelPricePoint[];
  stations: any[];
}> {
  try {
    const response = await fetch(`${import.meta.env.BASE_URL}data/fuel-prices.json`);
    if (!response.ok) {
      throw new Error('Failed to load fuel price data');
    }
    const data = await response.json();
    return {
      fuelPrices: data.fuelPrices || [],
      stations: data.stations || [],
    };
  } catch (error) {
    console.error('Error loading fuel data:', error);
    return { fuelPrices: [], stations: [] };
  }
}

/**
 * Fetch fuel prices from API (if available)
 */
export async function fetchFuelPricesFromAPI(
  territory: Territory,
  fuelType?: FuelType
): Promise<FuelPricePoint[]> {
  const department = getDepartmentFromTerritory(territory);
  if (!department) {
    console.warn(`No department mapping for territory: ${territory}`);
    return [];
  }

  try {
    const apiData = await fetchOfficialFuelPrices(department, fuelType);
    return parseAPIResponse(apiData, territory);
  } catch (error) {
    console.error('Error fetching fuel prices from API:', error);
    return [];
  }
}

/**
 * Compare fuel prices by territory
 */
export function compareFuelPricesByTerritory(
  territory: Territory,
  fuelType: FuelType,
  fuelPrices: FuelPricePoint[]
): FuelComparisonResult | null {
  if (!territory || !fuelType || !fuelPrices || fuelPrices.length === 0) {
    return null;
  }

  // Filter prices for the specified territory and fuel type
  const filteredPrices = fuelPrices.filter(
    (price) => price.territory === territory && price.fuelType === fuelType
  );

  if (filteredPrices.length === 0) {
    return null;
  }

  // Calculate aggregation
  const aggregation = calculateFuelAggregation(filteredPrices);

  // Rank prices
  const rankedPrices = rankFuelPrices(filteredPrices, aggregation);

  // Generate metadata
  const metadata = generateMetadata(filteredPrices);

  return {
    territory,
    fuelType,
    rankedPrices,
    aggregation,
    comparisonDate: new Date().toISOString(),
    metadata,
  };
}

/**
 * Calculate fuel aggregation statistics
 */
export function calculateFuelAggregation(
  prices: FuelPricePoint[]
): FuelAggregation {
  const priceValues = prices.map((p) => p.pricePerLiter).sort((a, b) => a - b);

  const min = Math.min(...priceValues);
  const max = Math.max(...priceValues);
  const sum = priceValues.reduce((acc, price) => acc + price, 0);
  const average = sum / priceValues.length;

  // Calculate median
  const median =
    priceValues.length % 2 === 0
      ? (priceValues[priceValues.length / 2 - 1] +
          priceValues[priceValues.length / 2]) /
        2
      : priceValues[Math.floor(priceValues.length / 2)];

  // Calculate standard deviation
  const variance =
    priceValues.reduce((acc, price) => acc + Math.pow(price - average, 2), 0) /
    priceValues.length;
  const standardDeviation = Math.sqrt(variance);

  const priceRange = max - min;
  const priceRangePercentage = min > 0 ? (priceRange / min) * 100 : 0;

  // Find price cap if any
  const priceCapPrices = prices.filter((p) => p.isPriceCapPlafonne);
  const priceCapOfficiel =
    priceCapPrices.length > 0
      ? Math.min(...priceCapPrices.map((p) => p.pricePerLiter))
      : undefined;

  return {
    minPrice: Math.round(min * 1000) / 1000,
    maxPrice: Math.round(max * 1000) / 1000,
    averagePrice: Math.round(average * 1000) / 1000,
    medianPrice: Math.round(median * 1000) / 1000,
    priceRange: Math.round(priceRange * 1000) / 1000,
    priceRangePercentage: Math.round(priceRangePercentage * 100) / 100,
    standardDeviation: Math.round(standardDeviation * 1000) / 1000,
    priceCapOfficiel,
    totalStations: new Set(prices.map((p) => p.station.id)).size,
    lastUpdate: new Date().toISOString(),
  };
}

/**
 * Rank fuel prices
 */
function rankFuelPrices(
  prices: FuelPricePoint[],
  aggregation: FuelAggregation
): FuelPriceRanking[] {
  const sortedPrices = [...prices].sort(
    (a, b) => a.pricePerLiter - b.pricePerLiter
  );

  const cheapestPrice = aggregation.minPrice;
  const averagePrice = aggregation.averagePrice;

  return sortedPrices.map((price, index) => {
    const priceValue = price.pricePerLiter;
    const differenceFromCheapest = priceValue - cheapestPrice;
    const percentageFromCheapest =
      cheapestPrice > 0 ? (differenceFromCheapest / cheapestPrice) * 100 : 0;

    const differenceFromAverage = priceValue - averagePrice;
    const percentageFromAverage =
      averagePrice > 0 ? (differenceFromAverage / averagePrice) * 100 : 0;

    // Determine category
    let category: FuelPriceRanking['priceCategory'];
    if (index === 0) {
      category = 'cheapest';
    } else if (index === sortedPrices.length - 1) {
      category = 'most_expensive';
    } else if (priceValue < averagePrice * FUEL_COMPARISON_CONFIG.BELOW_AVERAGE_THRESHOLD) {
      category = 'below_average';
    } else if (priceValue > averagePrice * FUEL_COMPARISON_CONFIG.ABOVE_AVERAGE_THRESHOLD) {
      category = 'above_average';
    } else {
      category = 'average';
    }

    return {
      rank: index + 1,
      fuelPrice: price,
      absoluteDifferenceFromCheapest:
        Math.round(differenceFromCheapest * 1000) / 1000,
      percentageDifferenceFromCheapest:
        Math.round(percentageFromCheapest * 100) / 100,
      absoluteDifferenceFromAverage:
        Math.round(differenceFromAverage * 1000) / 1000,
      percentageDifferenceFromAverage:
        Math.round(percentageFromAverage * 100) / 100,
      priceCategory: category,
    };
  });
}

/**
 * Filter fuel prices
 */
export function filterFuelPrices(
  prices: FuelPricePoint[],
  filter: FuelComparisonFilter
): FuelPricePoint[] {
  let filtered = [...prices];

  if (filter.territory) {
    filtered = filtered.filter((p) => p.territory === filter.territory);
  }

  if (filter.fuelType) {
    filtered = filtered.filter((p) => p.fuelType === filter.fuelType);
  }

  if (filter.maxPrice !== undefined) {
    filtered = filtered.filter((p) => p.pricePerLiter <= filter.maxPrice!);
  }

  if (filter.onlyPriceCap) {
    filtered = filtered.filter((p) => p.isPriceCapPlafonne);
  }

  if (filter.brand) {
    filtered = filtered.filter(
      (p) =>
        p.station.brand &&
        p.station.brand.toLowerCase().includes(filter.brand!.toLowerCase())
    );
  }

  if (filter.city) {
    filtered = filtered.filter(
      (p) =>
        p.station.city &&
        p.station.city.toLowerCase().includes(filter.city!.toLowerCase())
    );
  }

  if (filter.userLocation && filter.maxDistanceKm) {
    filtered = filtered.filter((p) => {
      if (!p.station.location) return false;
      const distance = calculateDistance(
        filter.userLocation!.lat,
        filter.userLocation!.lng,
        p.station.location.lat,
        p.station.location.lng
      );
      return distance <= filter.maxDistanceKm!;
    });
  }

  return filtered;
}

/**
 * Generate comparison metadata
 */
function generateMetadata(prices: FuelPricePoint[]) {
  const uniqueStations = new Set(prices.map((p) => p.station.id));
  const dates = prices
    .map((p) => new Date(p.observationDate).getTime())
    .filter((d) => !isNaN(d));

  const oldestObservation =
    dates.length > 0 ? new Date(Math.min(...dates)).toISOString() : undefined;
  const newestObservation =
    dates.length > 0 ? new Date(Math.max(...dates)).toISOString() : undefined;

  const warnings: string[] = [];
  const limitations: string[] = [];

  // Check data age
  if (newestObservation) {
    const daysSinceUpdate =
      (Date.now() - new Date(newestObservation).getTime()) /
      (1000 * 60 * 60 * 24);
    if (daysSinceUpdate > FUEL_COMPARISON_CONFIG.MAX_PRICE_AGE_WARNING_DAYS) {
      warnings.push(
        `Les données les plus récentes datent de ${Math.floor(daysSinceUpdate)} jours`
      );
    }
  }

  limitations.push('Les prix peuvent varier en cours de journée');
  limitations.push('Données basées sur les remontées officielles et citoyennes');

  return {
    totalStations: uniqueStations.size,
    dataSource: 'prix-carburants.gouv.fr + contributions citoyennes',
    methodology: 'v1.0.0',
    coveragePercentage: 100,
    oldestObservation,
    newestObservation,
    warnings: warnings.length > 0 ? warnings : undefined,
    limitations,
  };
}

/**
 * Get fuel price history
 */
export function getFuelPriceHistory(
  prices: FuelPricePoint[],
  territory: Territory,
  fuelType: FuelType
): FuelPriceHistory | null {
  const filteredPrices = prices.filter(
    (p) => p.territory === territory && p.fuelType === fuelType
  );

  if (filteredPrices.length === 0) {
    return null;
  }

  // Group by date
  const groupedByDate = new Map<string, FuelPricePoint[]>();
  for (const price of filteredPrices) {
    const dateKey = price.observationDate.split('T')[0];
    if (!groupedByDate.has(dateKey)) {
      groupedByDate.set(dateKey, []);
    }
    groupedByDate.get(dateKey)!.push(price);
  }

  // Create time series
  const timeSeries: FuelHistoricalDataPoint[] = Array.from(
    groupedByDate.entries()
  )
    .map(([date, datePrices]) => {
      const priceValues = datePrices.map((p) => p.pricePerLiter);
      return {
        date: date,
        averagePrice:
          Math.round(
            (priceValues.reduce((a, b) => a + b, 0) / priceValues.length) * 1000
          ) / 1000,
        minPrice: Math.round(Math.min(...priceValues) * 1000) / 1000,
        maxPrice: Math.round(Math.max(...priceValues) * 1000) / 1000,
        observationCount: datePrices.length,
      };
    })
    .sort((a, b) => a.date.localeCompare(b.date));

  return {
    territory,
    fuelType,
    timeSeries,
    period: {
      startDate: timeSeries[0]?.date || new Date().toISOString(),
      endDate:
        timeSeries[timeSeries.length - 1]?.date || new Date().toISOString(),
    },
  };
}
