/**
 * International Comparison Service - v4.1.0
 * 
 * Service for comparing cost of living between countries and territories
 * Supports:
 * - DOM vs Metropolitan France
 * - France vs EU
 * - EU vs International
 * 
 * All comparisons use:
 * - Monetary normalization (EUR)
 * - PPP adjustment (Purchasing Power Parity)
 * - Transparent methodology
 * - No subjective ranking or "best country" selection
 * 
 * @module internationalComparisonService
 */

import type {
  CountryCode,
  CurrencyCode,
  CountryCostProfile,
  PPPAdjustment,
  InternationalComparisonResult,
  ComparedCountryResult,
  DOMMetropoleComparison,
  FranceEUComparison,
  EUInternationalComparison,
  MonetaryNormalization,
  ComparisonFilters,
  TimeSeriesComparison,
  ComparisonValidation,
  RegionalComparison,
  RegionCode
} from '../types/internationalComparison';
import type { TerritoryCode } from '../types/extensions';

/**
 * Get country cost profile
 */
export async function getCountryCostProfile(countryCode: CountryCode): Promise<CountryCostProfile> {
  // Mock implementation - in production, would fetch from database or external API
  const mockProfile: CountryCostProfile = {
    country: countryCode,
    countryName: getCountryName(countryCode),
    currency: getCurrency(countryCode),
    data: {
      overallCostIndex: 100 + Math.random() * 40 - 20, // 80-120
      foodCostIndex: 100 + Math.random() * 30 - 15,
      housingCostIndex: 100 + Math.random() * 50 - 25,
      transportCostIndex: 100 + Math.random() * 35 - 17,
      healthcareCostIndex: 100 + Math.random() * 60 - 30,
      educationCostIndex: 100 + Math.random() * 45 - 22,
      averageMonthlyIncome: 2500 + Math.random() * 2000,
      averageRent: 800 + Math.random() * 800,
      basicGroceriesCost: 300 + Math.random() * 200
    },
    lastUpdate: new Date().toISOString(),
    dataQuality: 'high',
    sourcesCount: 12,
    methodology: 'https://akiprisaye.fr/docs/methodologie-comparaisons-internationales'
  };
  
  return mockProfile;
}

/**
 * Get PPP adjustment between two currencies
 */
export async function getPPPAdjustment(
  fromCurrency: CurrencyCode,
  toCurrency: CurrencyCode
): Promise<PPPAdjustment> {
  // Mock implementation - in production, would fetch from OECD/Eurostat
  const exchangeRate = getExchangeRate(fromCurrency, toCurrency);
  const pppRate = exchangeRate * (0.8 + Math.random() * 0.4); // PPP typically differs from exchange rate
  
  return {
    fromCurrency,
    toCurrency,
    pppRate,
    exchangeRate,
    adjustmentFactor: pppRate / exchangeRate,
    referenceYear: 2025,
    source: 'OECD'
  };
}

/**
 * Normalize value to EUR
 */
export async function normalizeToEUR(
  value: number,
  currency: CurrencyCode
): Promise<MonetaryNormalization> {
  if (currency === 'EUR') {
    return {
      originalValue: value,
      originalCurrency: currency,
      normalizedValue: value,
      normalizedCurrency: 'EUR',
      exchangeRate: 1,
      date: new Date().toISOString(),
      source: 'fixed'
    };
  }
  
  const exchangeRate = getExchangeRate(currency, 'EUR');
  
  return {
    originalValue: value,
    originalCurrency: currency,
    normalizedValue: value * exchangeRate,
    normalizedCurrency: 'EUR',
    exchangeRate,
    date: new Date().toISOString(),
    source: 'ECB'
  };
}

/**
 * Compare DOM vs Metropolitan France
 */
export async function compareDOMToMetropole(
  domTerritory: TerritoryCode
): Promise<DOMMetropoleComparison> {
  // Mock implementation - in production, would use real data
  const comparison: DOMMetropoleComparison = {
    dom: domTerritory,
    domName: getTerritoryName(domTerritory),
    metropole: 'FRA',
    metropoleName: 'France Métropolitaine',
    comparison: {
      foodBasket: {
        dom: 130.5,
        metropole: 100,
        difference: 30.5,
        percentageDifference: 30.5
      },
      housing: {
        dom: 115.2,
        metropole: 100,
        difference: 15.2,
        percentageDifference: 15.2
      },
      transport: {
        dom: 125.8,
        metropole: 100,
        difference: 25.8,
        percentageDifference: 25.8
      },
      energy: {
        dom: 140.3,
        metropole: 100,
        difference: 40.3,
        percentageDifference: 40.3
      },
      overall: {
        dom: 127.9,
        metropole: 100,
        difference: 27.9,
        percentageDifference: 27.9
      }
    },
    octroisDeMerEffect: 8.5, // Estimated impact of octroi de mer
    shippingCostsEffect: 12.3, // Estimated impact of shipping
    localProductionRate: 15.7, // Percentage of locally produced goods
    date: new Date().toISOString(),
    methodology: 'https://akiprisaye.fr/docs/methodologie-dom-metropole-v4.1.0'
  };
  
  return comparison;
}

/**
 * Compare France vs EU
 */
export async function compareFranceToEU(
  indicator: string = 'overall-cost'
): Promise<FranceEUComparison> {
  const euCountries: CountryCode[] = [
    'FRA', 'DEU', 'ESP', 'ITA', 'NLD', 'BEL', 'AUT', 'PRT', 'GRC', 'IRL',
    'FIN', 'DNK', 'SWE', 'POL', 'CZE', 'HUN', 'ROU', 'BGR', 'HRV', 'SVK',
    'SVN', 'LTU', 'LVA', 'EST', 'LUX', 'CYP', 'MLT'
  ];
  
  // Mock France data
  const france: ComparedCountryResult = {
    country: 'FRA',
    countryName: 'France',
    rawValue: 100,
    rawCurrency: 'EUR',
    normalizedValue: 100,
    normalizedCurrency: 'EUR',
    pppAdjustedValue: 100,
    pppAdjustment: await getPPPAdjustment('EUR', 'EUR'),
    differenceFromReference: 0,
    percentageDifference: 0,
    ranking: 10,
    confidence: 'high'
  };
  
  // Mock EU average
  const euAverage: ComparedCountryResult = {
    country: 'EU27',
    countryName: 'EU Average',
    rawValue: 95.5,
    rawCurrency: 'EUR',
    normalizedValue: 95.5,
    normalizedCurrency: 'EUR',
    pppAdjustedValue: 95.5,
    pppAdjustment: await getPPPAdjustment('EUR', 'EUR'),
    differenceFromReference: -4.5,
    percentageDifference: -4.5,
    confidence: 'high'
  };
  
  // Mock EU median
  const euMedian: ComparedCountryResult = {
    country: 'EU27',
    countryName: 'EU Median',
    rawValue: 93.2,
    rawCurrency: 'EUR',
    normalizedValue: 93.2,
    normalizedCurrency: 'EUR',
    pppAdjustedValue: 93.2,
    pppAdjustment: await getPPPAdjustment('EUR', 'EUR'),
    differenceFromReference: -6.8,
    percentageDifference: -6.8,
    confidence: 'high'
  };
  
  return {
    france: 'FRA',
    euCountries,
    indicator,
    results: {
      france,
      euAverage,
      euMedian,
      euCountries: [france] // Would include all EU countries in production
    },
    franceRankInEU: 10,
    totalEUCountries: 27,
    date: new Date().toISOString(),
    methodology: 'https://akiprisaye.fr/docs/methodologie-france-eu-v4.1.0'
  };
}

/**
 * Compare EU vs International
 */
export async function compareEUToInternational(
  internationalCountries: CountryCode[],
  indicator: string = 'overall-cost'
): Promise<EUInternationalComparison> {
  // Mock EU average
  const euAverage: ComparedCountryResult = {
    country: 'EU27',
    countryName: 'EU Average',
    rawValue: 100,
    rawCurrency: 'EUR',
    normalizedValue: 100,
    normalizedCurrency: 'EUR',
    pppAdjustedValue: 100,
    pppAdjustment: await getPPPAdjustment('EUR', 'EUR'),
    differenceFromReference: 0,
    percentageDifference: 0,
    confidence: 'high'
  };
  
  // Mock international countries
  const internationalResults: ComparedCountryResult[] = [];
  for (const country of internationalCountries) {
    const currency = getCurrency(country);
    const rawValue = 80 + Math.random() * 60; // 80-140
    const normalization = await normalizeToEUR(rawValue, currency);
    const pppAdjustment = await getPPPAdjustment(currency, 'EUR');
    const pppAdjustedValue = normalization.normalizedValue * pppAdjustment.adjustmentFactor;
    
    internationalResults.push({
      country,
      countryName: getCountryName(country),
      rawValue,
      rawCurrency: currency,
      normalizedValue: normalization.normalizedValue,
      normalizedCurrency: 'EUR',
      pppAdjustedValue,
      pppAdjustment,
      differenceFromReference: pppAdjustedValue - 100,
      percentageDifference: ((pppAdjustedValue - 100) / 100) * 100,
      confidence: 'medium'
    });
  }
  
  return {
    eu: 'EU27',
    internationalCountries,
    indicator,
    results: {
      euAverage,
      internationalCountries: internationalResults
    },
    date: new Date().toISOString(),
    methodology: 'https://akiprisaye.fr/docs/methodologie-eu-international-v4.1.0'
  };
}

/**
 * Get general international comparison
 */
export async function getInternationalComparison(
  referenceCountry: CountryCode,
  comparedCountries: CountryCode[],
  indicator: string,
  filters?: ComparisonFilters
): Promise<InternationalComparisonResult> {
  const referenceProfile = await getCountryCostProfile(referenceCountry);
  const comparedResults: ComparedCountryResult[] = [];
  
  for (const country of comparedCountries) {
    const profile = await getCountryCostProfile(country);
    const currency = profile.currency;
    
    // Get indicator value
    const rawValue = profile.data.overallCostIndex; // Simplified
    
    // Normalize to EUR
    const normalization = await normalizeToEUR(rawValue, currency);
    
    // Apply PPP adjustment
    const pppAdjustment = await getPPPAdjustment(currency, 'EUR');
    const pppAdjustedValue = normalization.normalizedValue * pppAdjustment.adjustmentFactor;
    
    // Compare to reference
    const referenceValue = referenceProfile.data.overallCostIndex;
    
    comparedResults.push({
      country,
      countryName: getCountryName(country),
      rawValue,
      rawCurrency: currency,
      normalizedValue: normalization.normalizedValue,
      normalizedCurrency: 'EUR',
      pppAdjustedValue,
      pppAdjustment,
      differenceFromReference: pppAdjustedValue - referenceValue,
      percentageDifference: ((pppAdjustedValue - referenceValue) / referenceValue) * 100,
      confidence: profile.dataQuality === 'high' ? 'high' : profile.dataQuality === 'medium' ? 'medium' : 'low'
    });
  }
  
  // Sort by PPP adjusted value
  comparedResults.sort((a, b) => a.pppAdjustedValue - b.pppAdjustedValue);
  
  // Assign rankings
  comparedResults.forEach((result, index) => {
    result.ranking = index + 1;
  });
  
  return {
    comparisonId: `comp-${Date.now()}`,
    comparisonType: 'custom',
    referenceCountry,
    referenceCountryName: getCountryName(referenceCountry),
    comparedCountries: comparedResults,
    indicator,
    date: new Date().toISOString(),
    methodology: 'https://akiprisaye.fr/docs/methodologie-comparaisons-internationales-v4.1.0',
    disclaimers: [
      'Rankings are purely factual and do not represent quality of life judgments.',
      'PPP adjustments are based on OECD data and may not reflect local purchasing power perfectly.',
      'Data quality varies by country. Check confidence scores.',
      'Comparisons are for statistical reference only, not recommendations.'
    ]
  };
}

/**
 * Get regional comparison
 */
export async function getRegionalComparison(
  region: RegionCode,
  indicator: string
): Promise<RegionalComparison> {
  const countries = getCountriesInRegion(region);
  const results: ComparedCountryResult[] = [];
  
  for (const country of countries) {
    const profile = await getCountryCostProfile(country);
    const value = profile.data.overallCostIndex;
    
    results.push({
      country,
      countryName: getCountryName(country),
      rawValue: value,
      rawCurrency: profile.currency,
      normalizedValue: value,
      normalizedCurrency: 'EUR',
      pppAdjustedValue: value,
      pppAdjustment: await getPPPAdjustment(profile.currency, 'EUR'),
      differenceFromReference: 0,
      percentageDifference: 0,
      confidence: 'medium'
    });
  }
  
  const values = results.map(r => r.pppAdjustedValue);
  const average = values.reduce((sum, v) => sum + v, 0) / values.length;
  const sorted = [...values].sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)];
  
  return {
    region,
    regionName: getRegionName(region),
    countries,
    indicator,
    regionalAverage: average,
    regionalMedian: median,
    regionalMin: Math.min(...values),
    regionalMax: Math.max(...values),
    countryResults: results,
    date: new Date().toISOString(),
    methodology: 'https://akiprisaye.fr/docs/methodologie-comparaisons-regionales-v4.1.0'
  };
}

/**
 * Validate comparison
 */
export async function validateComparison(
  referenceCountry: CountryCode,
  comparedCountries: CountryCode[]
): Promise<ComparisonValidation> {
  const warnings: string[] = [];
  const errors: string[] = [];
  
  // Check for missing data
  if (comparedCountries.length === 0) {
    errors.push('No countries to compare');
  }
  
  // Check for same country comparison
  if (comparedCountries.includes(referenceCountry)) {
    warnings.push('Reference country is also in compared countries');
  }
  
  // Check data quality
  let qualityScore = 100;
  for (const country of [referenceCountry, ...comparedCountries]) {
    const profile = await getCountryCostProfile(country);
    if (profile.dataQuality === 'low') {
      warnings.push(`Low data quality for ${getCountryName(country)}`);
      qualityScore -= 10;
    }
  }
  
  return {
    isValid: errors.length === 0,
    warnings,
    errors,
    dataQualityScore: Math.max(0, qualityScore)
  };
}

// Helper functions

function getCountryName(code: CountryCode): string {
  const names: Record<string, string> = {
    'FRA': 'France',
    'DEU': 'Germany',
    'ESP': 'Spain',
    'ITA': 'Italy',
    'GBR': 'United Kingdom',
    'USA': 'United States',
    'JPN': 'Japan',
    'CHN': 'China',
    'CAN': 'Canada',
    'AUS': 'Australia'
  };
  return names[code] || code;
}

function getTerritoryName(code: TerritoryCode): string {
  const names: Record<string, string> = {
    'GLP': 'Guadeloupe',
    'MTQ': 'Martinique',
    'GUF': 'Guyane',
    'REU': 'La Réunion',
    'MYT': 'Mayotte',
    'FRA': 'France Métropolitaine'
  };
  return names[code] || code;
}

function getCurrency(code: CountryCode): CurrencyCode {
  const currencies: Record<string, CurrencyCode> = {
    'FRA': 'EUR',
    'DEU': 'EUR',
    'ESP': 'EUR',
    'ITA': 'EUR',
    'GBR': 'GBP',
    'USA': 'USD',
    'JPN': 'JPY',
    'CHN': 'CNY',
    'CAN': 'CAD',
    'AUS': 'AUD'
  };
  return currencies[code] || 'EUR';
}

function getExchangeRate(from: CurrencyCode, to: CurrencyCode): number {
  if (from === to) return 1;
  
  // Mock exchange rates to EUR
  const toEUR: Record<string, number> = {
    'EUR': 1,
    'USD': 0.92,
    'GBP': 1.16,
    'JPY': 0.0062,
    'CHF': 1.05,
    'CAD': 0.68,
    'AUD': 0.61
  };
  
  if (to === 'EUR' && from in toEUR) {
    return toEUR[from];
  }
  
  // For other conversions, go through EUR
  const fromToEUR = toEUR[from] || 1;
  const toToEUR = toEUR[to] || 1;
  return fromToEUR / toToEUR;
}

function getRegionName(region: RegionCode): string {
  const names: Record<RegionCode, string> = {
    'DOM': 'Départements d\'Outre-Mer',
    'ROM': 'Régions d\'Outre-Mer',
    'EU': 'Union Européenne',
    'EU27': 'Union Européenne (27)',
    'NAFTA': 'Amérique du Nord',
    'ASIA': 'Asie',
    'OCEANIA': 'Océanie',
    'AFRICA': 'Afrique',
    'SOUTH_AMERICA': 'Amérique du Sud'
  };
  return names[region] || region;
}

function getCountriesInRegion(region: RegionCode): CountryCode[] {
  const regions: Record<RegionCode, CountryCode[]> = {
    'DOM': ['GLP', 'MTQ', 'GUF', 'REU', 'MYT'],
    'ROM': ['GLP', 'MTQ', 'GUF', 'REU', 'MYT'],
    'EU': ['FRA', 'DEU', 'ESP', 'ITA', 'NLD', 'BEL', 'AUT', 'PRT'],
    'EU27': ['FRA', 'DEU', 'ESP', 'ITA', 'NLD', 'BEL', 'AUT', 'PRT'],
    'NAFTA': ['USA', 'CAN', 'MEX'],
    'ASIA': ['JPN', 'CHN', 'KOR', 'IND', 'THA'],
    'OCEANIA': ['AUS', 'NZL'],
    'AFRICA': ['ZAF', 'EGY', 'NGA', 'KEN'],
    'SOUTH_AMERICA': ['BRA', 'ARG', 'CHL', 'COL']
  };
  return regions[region] || [];
}
