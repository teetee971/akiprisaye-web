/**
 * Insurance Comparison Service v1.0.0
 * 
 * Implements citizen insurance price comparison with:
 * - Read-only data access
 * - Territory-based insurance matching
 * - No advice or recommendations
 * - Statistical aggregation
 * - Transparent source tracking
 * - "Observer, pas vendre" philosophy
 */

import type {
  InsuranceComparisonResult,
  InsurancePricePoint,
  InsuranceRanking,
  InsuranceAggregation,
  InsuranceComparisonFilter,
  InsuranceType,
  CoverageLevel,
  Territory,
  InsurancePriceHistory,
  InsuranceHistoricalDataPoint,
  InsuranceProvider,
} from '../types/insuranceComparison';

/**
 * Configuration constants
 */
const INSURANCE_COMPARISON_CONFIG = {
  AVERAGE_PRICE_TOLERANCE_PERCENT: 5,
  MIN_COVERAGE_WARNING_PERCENT: 50,
  // Price category thresholds (5% tolerance for insurance due to higher price variability)
  BELOW_AVERAGE_THRESHOLD: 0.95, // 5% below average
  ABOVE_AVERAGE_THRESHOLD: 1.05, // 5% above average
} as const;

/**
 * Load insurance data from JSON file
 */
export async function loadInsuranceData(): Promise<{
  insurances: InsurancePricePoint[];
  providers: string[];
}> {
  try {
    const response = await fetch('/data/insurance-prices.json');
    if (!response.ok) {
      throw new Error('Failed to load insurance data');
    }
    const data = await response.json();
    return {
      insurances: data.insurances || [],
      providers: data.providers || [],
    };
  } catch (error) {
    console.error('Error loading insurance data:', error);
    return { insurances: [], providers: [] };
  }
}

/**
 * Compare insurance by type and territory
 */
export function compareInsuranceByType(
  insuranceType: InsuranceType,
  territory: Territory,
  insurances: InsurancePricePoint[]
): InsuranceComparisonResult | null {
  if (!insuranceType || !territory || !insurances || insurances.length === 0) {
    return null;
  }

  // Filter insurances for the specified type and territory
  const filteredInsurances = insurances.filter(
    (insurance) =>
      insurance.insuranceType === insuranceType &&
      insurance.territory === territory
  );

  if (filteredInsurances.length === 0) {
    return null;
  }

  // Calculate aggregation
  const aggregation = calculateInsuranceAggregation(filteredInsurances);

  // Rank insurances
  const rankedOffers = rankInsurances(filteredInsurances, aggregation);

  // Extract unique providers
  const providers = Array.from(
    new Set(filteredInsurances.map((i) => i.providerName))
  );

  // Generate metadata
  const metadata = generateInsuranceMetadata(filteredInsurances, providers);

  return {
    insuranceType,
    territory,
    rankedOffers,
    aggregation,
    comparisonDate: new Date().toISOString(),
    metadata,
  };
}

/**
 * Calculate insurance aggregation statistics
 */
export function calculateInsuranceAggregation(
  insurances: InsurancePricePoint[]
): InsuranceAggregation {
  const priceValues = insurances
    .map((i) => i.annualPriceTTC)
    .sort((a, b) => a - b);

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

  // Extract unique coverage levels
  const coverageLevels = Array.from(
    new Set(insurances.map((i) => i.coverageLevel))
  ) as CoverageLevel[];

  return {
    minPrice: Math.round(min * 100) / 100,
    maxPrice: Math.round(max * 100) / 100,
    averagePrice: Math.round(average * 100) / 100,
    medianPrice: Math.round(median * 100) / 100,
    priceRange: Math.round(priceRange * 100) / 100,
    priceRangePercentage: Math.round(priceRangePercentage * 100) / 100,
    standardDeviation: Math.round(standardDeviation * 100) / 100,
    totalOffers: insurances.length,
    coverageLevels,
    lastUpdate: new Date().toISOString(),
  };
}

/**
 * Rank insurances
 */
function rankInsurances(
  insurances: InsurancePricePoint[],
  aggregation: InsuranceAggregation
): InsuranceRanking[] {
  const sortedInsurances = [...insurances].sort(
    (a, b) => a.annualPriceTTC - b.annualPriceTTC
  );

  const cheapestPrice = aggregation.minPrice;
  const averagePrice = aggregation.averagePrice;

  return sortedInsurances.map((insurance, index) => {
    const price = insurance.annualPriceTTC;
    const differenceFromCheapest = price - cheapestPrice;
    const percentageFromCheapest =
      cheapestPrice > 0 ? (differenceFromCheapest / cheapestPrice) * 100 : 0;

    const differenceFromAverage = price - averagePrice;
    const percentageFromAverage =
      averagePrice > 0 ? (differenceFromAverage / averagePrice) * 100 : 0;

    // Determine category
    let category: InsuranceRanking['priceCategory'];
    if (index === 0) {
      category = 'cheapest';
    } else if (index === sortedInsurances.length - 1) {
      category = 'most_expensive';
    } else if (price < averagePrice * INSURANCE_COMPARISON_CONFIG.BELOW_AVERAGE_THRESHOLD) {
      category = 'below_average';
    } else if (price > averagePrice * INSURANCE_COMPARISON_CONFIG.ABOVE_AVERAGE_THRESHOLD) {
      category = 'above_average';
    } else {
      category = 'average';
    }

    return {
      rank: index + 1,
      insurance: insurance,
      absoluteDifferenceFromCheapest:
        Math.round(differenceFromCheapest * 100) / 100,
      percentageDifferenceFromCheapest:
        Math.round(percentageFromCheapest * 100) / 100,
      absoluteDifferenceFromAverage:
        Math.round(differenceFromAverage * 100) / 100,
      percentageDifferenceFromAverage:
        Math.round(percentageFromAverage * 100) / 100,
      priceCategory: category,
    };
  });
}

/**
 * Filter insurances
 */
export function filterInsurances(
  insurances: InsurancePricePoint[],
  filter: InsuranceComparisonFilter
): InsurancePricePoint[] {
  let filtered = [...insurances];

  if (filter.territory) {
    filtered = filtered.filter((i) => i.territory === filter.territory);
  }

  if (filter.insuranceType) {
    filtered = filtered.filter((i) => i.insuranceType === filter.insuranceType);
  }

  if (filter.coverageLevel) {
    filtered = filtered.filter((i) => i.coverageLevel === filter.coverageLevel);
  }

  if (filter.maxAnnualPrice !== undefined) {
    filtered = filtered.filter((i) => i.annualPriceTTC <= filter.maxAnnualPrice!);
  }

  if (filter.minAnnualPrice !== undefined) {
    filtered = filtered.filter((i) => i.annualPriceTTC >= filter.minAnnualPrice!);
  }

  if (filter.provider) {
    filtered = filtered.filter(
      (i) =>
        i.providerName &&
        i.providerName.toLowerCase().includes(filter.provider!.toLowerCase())
    );
  }

  if (filter.specificCoverage) {
    filtered = filtered.filter((i) =>
      i.mainCoverages.some((coverage) =>
        coverage.toLowerCase().includes(filter.specificCoverage!.toLowerCase())
      )
    );
  }

  return filtered;
}

/**
 * Generate comparison metadata
 */
function generateInsuranceMetadata(
  insurances: InsurancePricePoint[],
  providers: string[]
) {
  const coverageLevels = Array.from(
    new Set(insurances.map((i) => i.coverageLevel))
  ) as CoverageLevel[];

  const warnings: string[] = [];
  const limitations: string[] = [
    'Les prix indiqués sont des tarifs annuels TTC observés',
    'Les garanties et franchises peuvent varier selon les profils',
    'Aucun conseil personnalisé - Comparaison informative uniquement',
    'Architecture prête - Données à enrichir avec contributions citoyennes',
  ];

  // Check for data completeness
  const totalPossibleOffers = providers.length * coverageLevels.length;
  const coveragePercentage = (insurances.length / totalPossibleOffers) * 100;

  if (coveragePercentage < INSURANCE_COMPARISON_CONFIG.MIN_COVERAGE_WARNING_PERCENT) {
    warnings.push(
      'Couverture partielle des offres - Données en cours de collecte'
    );
  }

  return {
    totalOffers: insurances.length,
    providers,
    coverageLevels,
    dataSource: 'Contributions citoyennes + sites officiels assureurs',
    methodology: 'v1.0.0',
    warnings: warnings.length > 0 ? warnings : undefined,
    limitations,
    disclaimer:
      'A KI PRI SA YÉ observe les prix, ne vend pas. Aucune recommandation - Comparaison informative uniquement.',
  };
}

/**
 * Get insurance price history
 */
export function getInsurancePriceHistory(
  insurances: InsurancePricePoint[],
  insuranceType: InsuranceType,
  territory: Territory,
  coverageLevel?: CoverageLevel
): InsurancePriceHistory | null {
  let filteredInsurances = insurances.filter(
    (i) => i.insuranceType === insuranceType && i.territory === territory
  );

  if (coverageLevel) {
    filteredInsurances = filteredInsurances.filter(
      (i) => i.coverageLevel === coverageLevel
    );
  }

  if (filteredInsurances.length === 0) {
    return null;
  }

  // Group by date
  const groupedByDate = new Map<string, InsurancePricePoint[]>();
  for (const insurance of filteredInsurances) {
    const dateKey = insurance.observationDate.split('T')[0];
    if (!groupedByDate.has(dateKey)) {
      groupedByDate.set(dateKey, []);
    }
    groupedByDate.get(dateKey)!.push(insurance);
  }

  // Create time series
  const timeSeries: InsuranceHistoricalDataPoint[] = Array.from(
    groupedByDate.entries()
  )
    .map(([date, dateInsurances]) => {
      const priceValues = dateInsurances.map((i) => i.annualPriceTTC);
      return {
        date: date,
        averagePrice:
          Math.round(
            (priceValues.reduce((a, b) => a + b, 0) / priceValues.length) * 100
          ) / 100,
        minPrice: Math.round(Math.min(...priceValues) * 100) / 100,
        maxPrice: Math.round(Math.max(...priceValues) * 100) / 100,
        observationCount: dateInsurances.length,
      };
    })
    .sort((a, b) => a.date.localeCompare(b.date));

  return {
    insuranceType,
    territory,
    coverageLevel,
    timeSeries,
    period: {
      startDate: timeSeries[0]?.date || new Date().toISOString(),
      endDate:
        timeSeries[timeSeries.length - 1]?.date || new Date().toISOString(),
    },
  };
}

/**
 * Get providers information
 */
export function getProvidersInfo(
  insurances: InsurancePricePoint[]
): InsuranceProvider[] {
  const providerMap = new Map<string, InsurancePricePoint[]>();

  for (const insurance of insurances) {
    if (!providerMap.has(insurance.providerName)) {
      providerMap.set(insurance.providerName, []);
    }
    providerMap.get(insurance.providerName)!.push(insurance);
  }

  return Array.from(providerMap.entries()).map(([name, offers]) => {
    const prices = offers.map((o) => o.annualPriceTTC);
    const averagePrice =
      Math.round(
        (prices.reduce((a, b) => a + b, 0) / prices.length) * 100
      ) / 100;
    const territories = Array.from(new Set(offers.map((o) => o.territory)));

    return {
      name,
      offers,
      territories,
      averagePrice,
      offerCount: offers.length,
    };
  });
}
