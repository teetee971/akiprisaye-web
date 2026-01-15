/**
 * Boat/Ferry Comparison Service v1.0.0
 * 
 * Implements citizen boat/ferry price comparison with:
 * - Read-only data access
 * - Route-based boat matching
 * - Multi-operator aggregation
 * - Vehicle transport analysis
 * - Regular passenger (commuter) analysis
 * - Transparent source tracking
 * - "Observer, pas vendre" philosophy
 */

import type {
  BoatComparisonResult,
  BoatPricePoint,
  BoatPriceRanking,
  BoatRouteAggregation,
  BoatComparisonMetadata,
  BoatSourceSummary,
  BoatComparisonFilter,
  BoatRoute,
  VehicleTransportAnalysis,
  RegularPassengerAnalysis,
  TerritoryBoatStatistics,
} from '../types/boatComparison';

/**
 * Configuration constants
 */
const BOAT_COMPARISON_CONFIG = {
  AVERAGE_PRICE_TOLERANCE_PERCENT: 5,
  MIN_COVERAGE_WARNING_PERCENT: 50,
  MAX_PRICE_AGE_WARNING_DAYS: 30,
} as const;

/**
 * Compare boat prices for a route across operators
 */
export function compareBoatPricesByRoute(
  route: BoatRoute,
  boatPrices: BoatPricePoint[]
): BoatComparisonResult | null {
  if (!route || !boatPrices || boatPrices.length === 0) {
    return null;
  }

  // Filter prices for the specified route
  const routePrices = filterPricesByRoute(boatPrices, route);

  if (routePrices.length === 0) {
    return null;
  }

  // Calculate aggregation
  const aggregation = calculateBoatRouteAggregation(routePrices, route);

  // Rank operators by price
  const rankedPrices = rankBoatPrices(routePrices, aggregation.passengerPricing.averagePrice);

  // Analyze vehicle transport if data available
  const vehicleTransportAnalysis = analyzeVehicleTransport(routePrices, route);

  // Analyze regular passenger options if data available
  const regularPassengerAnalysis = analyzeRegularPassengers(routePrices, route);

  // Generate metadata
  const metadata = generateBoatMetadata(routePrices);

  return {
    route,
    operators: rankedPrices,
    aggregation,
    vehicleTransportAnalysis,
    regularPassengerAnalysis,
    comparisonDate: new Date().toISOString(),
    metadata,
  };
}

/**
 * Filter boat prices by route
 */
export function filterPricesByRoute(
  prices: BoatPricePoint[],
  route: BoatRoute
): BoatPricePoint[] {
  return prices.filter(
    (price) =>
      price.route.origin.code === route.origin.code &&
      price.route.destination.code === route.destination.code
  );
}

/**
 * Calculate route aggregation statistics
 */
export function calculateBoatRouteAggregation(
  prices: BoatPricePoint[],
  route: BoatRoute
): BoatRouteAggregation {
  if (prices.length === 0) {
    throw new Error('Cannot calculate aggregation with no prices');
  }

  const passengerPrices = prices.map((p) => p.pricing.passengerPrice);
  const operators = new Set(prices.map((p) => p.operator));

  const minPrice = Math.min(...passengerPrices);
  const maxPrice = Math.max(...passengerPrices);
  const averagePrice = passengerPrices.reduce((sum, p) => sum + p, 0) / passengerPrices.length;
  
  // Calculate median
  const sortedPrices = [...passengerPrices].sort((a, b) => a - b);
  const medianPrice =
    sortedPrices.length % 2 === 0
      ? (sortedPrices[sortedPrices.length / 2 - 1] + sortedPrices[sortedPrices.length / 2]) / 2
      : sortedPrices[Math.floor(sortedPrices.length / 2)];

  const priceRange = maxPrice - minPrice;
  const priceRangePercentage = (priceRange / minPrice) * 100;

  // Get observation dates
  const observationDates = prices.map((p) => new Date(p.observationDate).getTime());
  const oldestObservation = new Date(Math.min(...observationDates)).toISOString();
  const newestObservation = new Date(Math.max(...observationDates)).toISOString();

  // Calculate vehicle pricing if available
  const vehiclePrices = prices
    .filter((p) => p.pricing.vehiclePrice?.car)
    .map((p) => p.pricing.vehiclePrice!.car);

  let vehiclePricing;
  if (vehiclePrices.length > 0) {
    vehiclePricing = {
      carAverage: Math.round((vehiclePrices.reduce((sum, p) => sum + p, 0) / vehiclePrices.length) * 100) / 100,
      carMin: Math.round(Math.min(...vehiclePrices) * 100) / 100,
      carMax: Math.round(Math.max(...vehiclePrices) * 100) / 100,
    };
  }

  // Analyze frequency
  const dailyServices = prices.filter((p) => 
    p.schedule.frequency.toLowerCase().includes('daily') || 
    p.schedule.frequency.toLowerCase().includes('quotidien')
  ).length;

  const weeklyServiceCounts = prices.map((p) => {
    const freq = p.schedule.frequency.toLowerCase();
    if (freq.includes('daily') || freq.includes('quotidien')) return 7;
    const match = freq.match(/(\d+)x?\s*\/?\s*(week|semaine)/i);
    return match ? parseInt(match[1]) : 1;
  });

  const averageDailyFrequency = weeklyServiceCounts.reduce((sum, count) => sum + count, 0) / 7 / operators.size;

  return {
    route,
    operatorCount: operators.size,
    passengerPricing: {
      averagePrice: Math.round(averagePrice * 100) / 100,
      minPrice: Math.round(minPrice * 100) / 100,
      maxPrice: Math.round(maxPrice * 100) / 100,
      priceRange: Math.round(priceRange * 100) / 100,
      priceRangePercentage: Math.round(priceRangePercentage * 100) / 100,
      medianPrice: Math.round(medianPrice * 100) / 100,
    },
    vehiclePricing,
    observationPeriod: {
      from: oldestObservation,
      to: newestObservation,
    },
    totalObservations: prices.length,
    lastUpdate: new Date().toISOString(),
    frequencyAnalysis: {
      dailyServices,
      weeklyServices: prices.length,
      averageDailyFrequency: Math.round(averageDailyFrequency * 10) / 10,
    },
  };
}

/**
 * Rank boat prices
 */
export function rankBoatPrices(
  prices: BoatPricePoint[],
  averagePrice: number
): BoatPriceRanking[] {
  if (prices.length === 0) {
    return [];
  }

  // Sort by passenger price ascending
  const sortedPrices = [...prices].sort((a, b) => a.pricing.passengerPrice - b.pricing.passengerPrice);
  const cheapestPrice = sortedPrices[0].pricing.passengerPrice;

  return sortedPrices.map((price, index) => {
    const absoluteDifferenceFromCheapest = price.pricing.passengerPrice - cheapestPrice;
    const percentageDifferenceFromCheapest =
      cheapestPrice > 0 ? (absoluteDifferenceFromCheapest / cheapestPrice) * 100 : 0;

    const absoluteDifferenceFromAverage = price.pricing.passengerPrice - averagePrice;
    const percentageDifferenceFromAverage =
      averagePrice > 0 ? (absoluteDifferenceFromAverage / averagePrice) * 100 : 0;

    // Categorize price
    let priceCategory: BoatPriceRanking['priceCategory'];
    if (index === 0) {
      priceCategory = 'cheapest';
    } else if (index === sortedPrices.length - 1) {
      priceCategory = 'most_expensive';
    } else if (
      Math.abs(percentageDifferenceFromAverage) <= BOAT_COMPARISON_CONFIG.AVERAGE_PRICE_TOLERANCE_PERCENT
    ) {
      priceCategory = 'average';
    } else if (price.pricing.passengerPrice < averagePrice) {
      priceCategory = 'below_average';
    } else {
      priceCategory = 'above_average';
    }

    return {
      rank: index + 1,
      boatPrice: price,
      absoluteDifferenceFromCheapest: Math.round(absoluteDifferenceFromCheapest * 100) / 100,
      percentageDifferenceFromCheapest: Math.round(percentageDifferenceFromCheapest * 100) / 100,
      absoluteDifferenceFromAverage: Math.round(absoluteDifferenceFromAverage * 100) / 100,
      percentageDifferenceFromAverage: Math.round(percentageDifferenceFromAverage * 100) / 100,
      priceCategory,
    };
  });
}

/**
 * Analyze vehicle transport options
 */
export function analyzeVehicleTransport(
  prices: BoatPricePoint[],
  route: BoatRoute
): VehicleTransportAnalysis | undefined {
  const operatorsWithVehicles = prices.filter((p) => p.pricing.vehiclePrice);

  if (operatorsWithVehicles.length === 0) {
    return undefined;
  }

  const operators = operatorsWithVehicles.map((price) => {
    const vehicleTypes: ('car' | 'motorcycle' | 'van' | 'truck')[] = [];
    const pricing: { vehicleType: 'car' | 'motorcycle' | 'van' | 'truck'; price: number }[] = [];

    if (price.pricing.vehiclePrice?.car) {
      vehicleTypes.push('car');
      pricing.push({ vehicleType: 'car', price: price.pricing.vehiclePrice.car });
    }
    if (price.pricing.vehiclePrice?.motorcycle) {
      vehicleTypes.push('motorcycle');
      pricing.push({ vehicleType: 'motorcycle', price: price.pricing.vehiclePrice.motorcycle });
    }
    if (price.pricing.vehiclePrice?.van) {
      vehicleTypes.push('van');
      pricing.push({ vehicleType: 'van', price: price.pricing.vehiclePrice.van });
    }
    if (price.pricing.vehiclePrice?.truck) {
      vehicleTypes.push('truck');
      pricing.push({ vehicleType: 'truck', price: price.pricing.vehiclePrice.truck });
    }

    // Determine availability based on capacity and frequency
    let availability: 'high' | 'medium' | 'low' = 'medium';
    if (price.schedule.frequency.toLowerCase().includes('daily')) {
      availability = 'high';
    } else if (price.schedule.frequency.includes('1x') || price.schedule.frequency.includes('2x')) {
      availability = 'low';
    }

    return {
      operator: price.operator,
      vehicleTypes,
      pricing,
      availability,
    };
  });

  const recommendations: string[] = [];
  if (operators.every((op) => op.availability === 'low')) {
    recommendations.push('⚠️ Réservation recommandée : capacité limitée sur cette route');
  }
  if (operators.length === 1) {
    recommendations.push('ℹ️ Un seul opérateur propose le transport de véhicules sur cette route');
  }

  return {
    route,
    operators,
    recommendations,
  };
}

/**
 * Analyze regular passenger options
 */
export function analyzeRegularPassengers(
  prices: BoatPricePoint[],
  route: BoatRoute
): RegularPassengerAnalysis | undefined {
  // This would require subscription data which we'll mock for now
  // In a real implementation, this would come from the database
  const operators = prices.map((price) => ({
    operator: price.operator,
    hasSubscription: false, // Would check if subscriptions exist
    subscriptionTypes: undefined,
  }));

  return {
    route,
    operators,
  };
}

/**
 * Generate metadata for transparency
 */
export function generateBoatMetadata(prices: BoatPricePoint[]): BoatComparisonMetadata {
  const operators = new Set(prices.map((p) => p.operator));
  const sources = prices.reduce((acc, price) => {
    const sourceType = price.source.type;
    if (!acc[sourceType]) {
      acc[sourceType] = { count: 0, operators: new Set<string>() };
    }
    acc[sourceType].count++;
    acc[sourceType].operators.add(price.operator);
    return acc;
  }, {} as Record<string, { count: number; operators: Set<string> }>);

  const sourceSummaries: BoatSourceSummary[] = Object.entries(sources).map(([source, data]) => ({
    source: source as any,
    observationCount: data.count,
    operatorCount: data.operators.size,
    percentage: Math.round((data.count / prices.length) * 100 * 100) / 100,
  }));

  const observationDates = prices.map((p) => new Date(p.observationDate).getTime());
  const oldestObservation = new Date(Math.min(...observationDates)).toISOString();
  const newestObservation = new Date(Math.max(...observationDates)).toISOString();

  const operatorsWithData = operators.size;
  const coveragePercentage = 100;

  const warnings: string[] = [];
  const limitations: string[] = [
    'Les prix affichés sont des observations et peuvent varier',
    'Les tarifs ne prennent pas en compte les promotions ou réductions groupes',
    'Comparaison basée sur les données disponibles uniquement',
  ];

  if (coveragePercentage < BOAT_COMPARISON_CONFIG.MIN_COVERAGE_WARNING_PERCENT) {
    warnings.push(`Couverture des opérateurs limitée (${coveragePercentage}%)`);
  }

  const now = Date.now();
  const oldestAgeMs = now - Math.min(...observationDates);
  const oldestAgeDays = oldestAgeMs / (1000 * 60 * 60 * 24);
  if (oldestAgeDays > BOAT_COMPARISON_CONFIG.MAX_PRICE_AGE_WARNING_DAYS) {
    warnings.push(`Certaines données datent de plus de ${BOAT_COMPARISON_CONFIG.MAX_PRICE_AGE_WARNING_DAYS} jours`);
  }

  return {
    methodology: 'v1.0.0',
    aggregationMethod: 'mean',
    dataQuality: {
      totalOperators: operators.size,
      operatorsWithData,
      coveragePercentage: Math.round(coveragePercentage * 100) / 100,
      oldestObservation,
      newestObservation,
    },
    sources: sourceSummaries,
    warnings: warnings.length > 0 ? warnings : undefined,
    limitations,
    disclaimer:
      'A KI PRI SA YÉ observe les prix, ne vend pas. Transparence sur les écarts, pas d\'affiliation opaque.',
  };
}

/**
 * Filter boat prices by criteria
 */
export function filterBoatPrices(
  prices: BoatPricePoint[],
  filter: BoatComparisonFilter
): BoatPricePoint[] {
  let filtered = prices;

  if (filter.routeType) {
    filtered = filtered.filter((p) => p.route.routeType === filter.routeType);
  }

  if (filter.originTerritory) {
    filtered = filtered.filter((p) => p.route.origin.territory === filter.originTerritory);
  }

  if (filter.destinationTerritory) {
    filtered = filtered.filter((p) => p.route.destination.territory === filter.destinationTerritory);
  }

  if (filter.operator) {
    filtered = filtered.filter((p) => p.operator.toLowerCase().includes(filter.operator!.toLowerCase()));
  }

  if (filter.serviceClass) {
    filtered = filtered.filter((p) => p.serviceClass === filter.serviceClass);
  }

  if (filter.maxPriceAge) {
    const maxAgeMs = filter.maxPriceAge * 24 * 60 * 60 * 1000;
    const cutoffDate = Date.now() - maxAgeMs;
    filtered = filtered.filter((p) => new Date(p.observationDate).getTime() >= cutoffDate);
  }

  if (filter.minConfidence) {
    const confidenceLevels = { low: 0, medium: 1, high: 2 };
    const minLevel = confidenceLevels[filter.minConfidence];
    filtered = filtered.filter((p) => confidenceLevels[p.confidence] >= minLevel);
  }

  if (filter.verifiedOnly) {
    filtered = filtered.filter((p) => p.verified);
  }

  if (filter.vehicleTransport) {
    filtered = filtered.filter((p) => p.pricing.vehiclePrice);
  }

  if (filter.dailyService) {
    filtered = filtered.filter((p) => 
      p.schedule.frequency.toLowerCase().includes('daily') || 
      p.schedule.frequency.toLowerCase().includes('quotidien')
    );
  }

  return filtered;
}

/**
 * Get cheapest boat option
 */
export function getCheapestBoat(prices: BoatPricePoint[]): BoatPricePoint | null {
  if (prices.length === 0) return null;
  return prices.reduce((min, price) => 
    (price.pricing.passengerPrice < min.pricing.passengerPrice ? price : min)
  );
}

/**
 * Get most expensive boat option
 */
export function getMostExpensiveBoat(prices: BoatPricePoint[]): BoatPricePoint | null {
  if (prices.length === 0) return null;
  return prices.reduce((max, price) => 
    (price.pricing.passengerPrice > max.pricing.passengerPrice ? price : max)
  );
}

/**
 * Calculate potential savings
 */
export function calculatePotentialSavings(
  prices: BoatPricePoint[]
): { absolute: number; percentage: number } | null {
  const cheapest = getCheapestBoat(prices);
  const mostExpensive = getMostExpensiveBoat(prices);

  if (!cheapest || !mostExpensive || mostExpensive.pricing.passengerPrice === 0) {
    return null;
  }

  const absolute = mostExpensive.pricing.passengerPrice - cheapest.pricing.passengerPrice;
  const percentage = (absolute / mostExpensive.pricing.passengerPrice) * 100;

  return {
    absolute: Math.round(absolute * 100) / 100,
    percentage: Math.round(percentage * 100) / 100,
  };
}
