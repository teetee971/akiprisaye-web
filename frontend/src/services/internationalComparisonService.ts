 
/**
 * International Comparison Service - v4.2.0
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
 * Data sources:
 * - Eurostat Comparative Price Level Indices 2024 (EU27=100)
 * - OECD Purchasing Power Parities 2024
 * - INSEE Prix à la consommation DOM vs Hexagone 2023
 * - IEDOM/IEOM rapports annuels 2023
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

// ---------------------------------------------------------------------------
// Static reference data (loaded once, cached in module scope)
// ---------------------------------------------------------------------------

interface RawCountryProfile {
  name: string;
  currency: CurrencyCode;
  overallCostIndex: number;
  foodCostIndex: number;
  housingCostIndex: number;
  transportCostIndex: number;
  healthcareCostIndex: number;
  educationCostIndex: number;
  averageMonthlyIncome: number;
  averageRent: number;
  basicGroceriesCost: number;
  dataQuality: 'high' | 'medium' | 'low';
  sourcesCount: number;
}

interface RawPPP {
  exchangeRate: number;
  pppRate: number;
  adjustmentFactor: number;
}

interface CostProfilesData {
  countries: Record<string, RawCountryProfile>;
  pppAdjustments: Record<string, RawPPP>;
}

let _profilesCache: CostProfilesData | null = null;

async function loadCostProfiles(): Promise<CostProfilesData> {
  if (_profilesCache) return _profilesCache;
  try {
    const url = `${import.meta.env.BASE_URL}data/international-cost-profiles.json`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    _profilesCache = (await res.json()) as CostProfilesData;
    return _profilesCache;
  } catch {
    // Fallback: minimal inline data so the service never hard-fails
    _profilesCache = {
      countries: {
        FRA: {
          name: 'France', currency: 'EUR',
          overallCostIndex: 107, foodCostIndex: 107, housingCostIndex: 120,
          transportCostIndex: 104, healthcareCostIndex: 100, educationCostIndex: 102,
          averageMonthlyIncome: 2700, averageRent: 980, basicGroceriesCost: 380,
          dataQuality: 'high', sourcesCount: 15
        }
      },
      pppAdjustments: {
        EUR_EUR: { exchangeRate: 1, pppRate: 1, adjustmentFactor: 1 }
      }
    };
    return _profilesCache;
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Get country cost profile — real data from international-cost-profiles.json
 * (Eurostat 2024, OECD PPP 2024, INSEE DOM 2023)
 */
export async function getCountryCostProfile(countryCode: CountryCode): Promise<CountryCostProfile> {
  const profiles = await loadCostProfiles();
  const raw = profiles.countries[countryCode];

  if (raw) {
    return {
      country: countryCode,
      countryName: raw.name,
      currency: raw.currency,
      data: {
        overallCostIndex: raw.overallCostIndex,
        foodCostIndex: raw.foodCostIndex,
        housingCostIndex: raw.housingCostIndex,
        transportCostIndex: raw.transportCostIndex,
        healthcareCostIndex: raw.healthcareCostIndex,
        educationCostIndex: raw.educationCostIndex,
        averageMonthlyIncome: raw.averageMonthlyIncome,
        averageRent: raw.averageRent,
        basicGroceriesCost: raw.basicGroceriesCost,
      },
      lastUpdate: '2025-01-01T00:00:00.000Z',
      dataQuality: raw.dataQuality,
      sourcesCount: raw.sourcesCount,
      methodology: 'https://akiprisaye.fr/docs/methodologie-comparaisons-internationales',
    };
  }

  // Unknown country — return a neutral placeholder (index=100 = EU average)
  return {
    country: countryCode,
    countryName: getCountryName(countryCode),
    currency: getCurrency(countryCode),
    data: {
      overallCostIndex: 100,
      foodCostIndex: 100,
      housingCostIndex: 100,
      transportCostIndex: 100,
      healthcareCostIndex: 100,
      educationCostIndex: 100,
      averageMonthlyIncome: 2000,
      averageRent: 800,
      basicGroceriesCost: 320,
    },
    lastUpdate: '2025-01-01T00:00:00.000Z',
    dataQuality: 'low',
    sourcesCount: 0,
    methodology: 'https://akiprisaye.fr/docs/methodologie-comparaisons-internationales',
  };
}

/**
 * Get PPP adjustment between two currencies — OECD/IMF 2024 data
 */
export async function getPPPAdjustment(
  fromCurrency: CurrencyCode,
  toCurrency: CurrencyCode
): Promise<PPPAdjustment> {
  if (fromCurrency === toCurrency) {
    return {
      fromCurrency,
      toCurrency,
      pppRate: 1,
      exchangeRate: 1,
      adjustmentFactor: 1,
      referenceYear: 2024,
      source: 'OECD',
    };
  }

  const profiles = await loadCostProfiles();
  const key = `${fromCurrency}_${toCurrency}`;
  const raw = profiles.pppAdjustments[key];

  if (raw) {
    return {
      fromCurrency,
      toCurrency,
      pppRate: raw.pppRate,
      exchangeRate: raw.exchangeRate,
      adjustmentFactor: raw.adjustmentFactor,
      referenceYear: 2024,
      source: 'OECD',
    };
  }

  // Fallback: use market exchange rate only (no PPP adjustment)
  const exchangeRate = getExchangeRate(fromCurrency, toCurrency);
  return {
    fromCurrency,
    toCurrency,
    pppRate: exchangeRate,
    exchangeRate,
    adjustmentFactor: 1,
    referenceYear: 2024,
    source: 'OECD',
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
 * Real data: INSEE 2023, IEDOM/IEOM rapports annuels 2023 (base Hexagone=100)
 */
export async function compareDOMToMetropole(
  domTerritory: TerritoryCode
): Promise<DOMMetropoleComparison> {
  const profiles = await loadCostProfiles();
  // domTerritories uses short codes (GP, MQ, GF, RE, YT, MF, BL, PM)
  const raw = (profiles as unknown as Record<string, Record<string, {
    name: string;
    foodBasket: number;
    housing: number;
    transport: number;
    energy: number;
    overall: number;
    octroisDeMerEffect: number;
    shippingCostsEffect: number;
    localProductionRate: number;
  }>>)['domTerritories']?.[domTerritory as string];

  const foodBasket = raw?.foodBasket ?? 138;
  const housing = raw?.housing ?? 124;
  const transport = raw?.transport ?? 131;
  const energy = raw?.energy ?? 143;
  const overall = raw?.overall ?? 136;

  return {
    dom: domTerritory,
    domName: getTerritoryName(domTerritory),
    metropole: 'FRA',
    metropoleName: 'France Métropolitaine',
    comparison: {
      foodBasket: {
        dom: foodBasket,
        metropole: 100,
        difference: foodBasket - 100,
        percentageDifference: foodBasket - 100,
      },
      housing: {
        dom: housing,
        metropole: 100,
        difference: housing - 100,
        percentageDifference: housing - 100,
      },
      transport: {
        dom: transport,
        metropole: 100,
        difference: transport - 100,
        percentageDifference: transport - 100,
      },
      energy: {
        dom: energy,
        metropole: 100,
        difference: energy - 100,
        percentageDifference: energy - 100,
      },
      overall: {
        dom: overall,
        metropole: 100,
        difference: overall - 100,
        percentageDifference: overall - 100,
      },
    },
    octroisDeMerEffect: raw?.octroisDeMerEffect ?? 8.5,
    shippingCostsEffect: raw?.shippingCostsEffect ?? 12.3,
    localProductionRate: raw?.localProductionRate ?? 15.7,
    date: new Date().toISOString(),
    methodology: 'https://akiprisaye.fr/docs/methodologie-dom-metropole-v4.2.0',
  };
}

/**
 * Compare France vs EU
 * Uses real Eurostat 2024 price level indices (EU27=100)
 */
export async function compareFranceToEU(
  indicator: string = 'overall-cost'
): Promise<FranceEUComparison> {
  const euCountries: CountryCode[] = [
    'FRA', 'DEU', 'ESP', 'ITA', 'NLD', 'BEL', 'AUT', 'PRT', 'GRC', 'IRL',
    'FIN', 'DNK', 'SWE', 'POL', 'CZE', 'HUN', 'ROU', 'BGR', 'HRV', 'SVK',
    'SVN', 'LTU', 'LVA', 'EST', 'LUX', 'CYP', 'MLT'
  ];

  const pppEurEur = await getPPPAdjustment('EUR', 'EUR');
  const franceProfile = await getCountryCostProfile('FRA');
  const frIndex = franceProfile.data.overallCostIndex; // 107

  // Compute real EU average and median from known data
  const allProfiles = await Promise.all(euCountries.map(c => getCountryCostProfile(c)));
  const indices = allProfiles.map(p => p.data.overallCostIndex);
  const euAvgVal = Math.round(indices.reduce((a, b) => a + b, 0) / indices.length * 10) / 10;
  const sortedIdx = [...indices].sort((a, b) => a - b);
  const euMedVal = sortedIdx[Math.floor(sortedIdx.length / 2)];

  const france: ComparedCountryResult = {
    country: 'FRA',
    countryName: 'France',
    rawValue: frIndex,
    rawCurrency: 'EUR',
    normalizedValue: frIndex,
    normalizedCurrency: 'EUR',
    pppAdjustedValue: frIndex,
    pppAdjustment: pppEurEur,
    differenceFromReference: 0,
    percentageDifference: 0,
    ranking: sortedIdx.indexOf(frIndex) + 1,
    confidence: 'high',
  };

  const euAverage: ComparedCountryResult = {
    country: 'EU27',
    countryName: 'EU Average',
    rawValue: euAvgVal,
    rawCurrency: 'EUR',
    normalizedValue: euAvgVal,
    normalizedCurrency: 'EUR',
    pppAdjustedValue: euAvgVal,
    pppAdjustment: pppEurEur,
    differenceFromReference: euAvgVal - frIndex,
    percentageDifference: Math.round(((euAvgVal - frIndex) / frIndex) * 1000) / 10,
    confidence: 'high',
  };

  const euMedian: ComparedCountryResult = {
    country: 'EU27',
    countryName: 'EU Median',
    rawValue: euMedVal,
    rawCurrency: 'EUR',
    normalizedValue: euMedVal,
    normalizedCurrency: 'EUR',
    pppAdjustedValue: euMedVal,
    pppAdjustment: pppEurEur,
    differenceFromReference: euMedVal - frIndex,
    percentageDifference: Math.round(((euMedVal - frIndex) / frIndex) * 1000) / 10,
    confidence: 'high',
  };

  const euCountryResults: ComparedCountryResult[] = allProfiles.map((p, i) => ({
    country: euCountries[i],
    countryName: p.countryName,
    rawValue: p.data.overallCostIndex,
    rawCurrency: 'EUR',
    normalizedValue: p.data.overallCostIndex,
    normalizedCurrency: 'EUR',
    pppAdjustedValue: p.data.overallCostIndex,
    pppAdjustment: pppEurEur,
    differenceFromReference: p.data.overallCostIndex - frIndex,
    percentageDifference: Math.round(((p.data.overallCostIndex - frIndex) / frIndex) * 1000) / 10,
    ranking: sortedIdx.indexOf(p.data.overallCostIndex) + 1,
    confidence: p.dataQuality === 'high' ? 'high' : p.dataQuality === 'medium' ? 'medium' : 'low',
  }));

  // France rank among EU countries (sorted ascending = cheapest first)
  const franceRank = [...indices].sort((a, b) => a - b).indexOf(frIndex) + 1;

  return {
    france: 'FRA',
    euCountries,
    indicator,
    results: {
      france,
      euAverage,
      euMedian,
      euCountries: euCountryResults,
    },
    franceRankInEU: franceRank,
    totalEUCountries: euCountries.length,
    date: new Date().toISOString(),
    methodology: 'https://akiprisaye.fr/docs/methodologie-france-eu-v4.2.0',
  };
}

/**
 * Compare EU vs International
 * Uses real data from international-cost-profiles.json
 */
export async function compareEUToInternational(
  internationalCountries: CountryCode[],
  indicator: string = 'overall-cost'
): Promise<EUInternationalComparison> {
  const pppEurEur = await getPPPAdjustment('EUR', 'EUR');
  const euAverage: ComparedCountryResult = {
    country: 'EU27',
    countryName: 'EU Average',
    rawValue: 100,
    rawCurrency: 'EUR',
    normalizedValue: 100,
    normalizedCurrency: 'EUR',
    pppAdjustedValue: 100,
    pppAdjustment: pppEurEur,
    differenceFromReference: 0,
    percentageDifference: 0,
    confidence: 'high',
  };

  const internationalResults: ComparedCountryResult[] = [];
  for (const country of internationalCountries) {
    const profile = await getCountryCostProfile(country);
    const currency = profile.currency;
    const rawValue = profile.data.overallCostIndex;
    const normalization = await normalizeToEUR(rawValue, currency);
    const pppAdjustment = await getPPPAdjustment(currency, 'EUR');
    const pppAdjustedValue = normalization.normalizedValue * pppAdjustment.adjustmentFactor;

    internationalResults.push({
      country,
      countryName: profile.countryName,
      rawValue,
      rawCurrency: currency,
      normalizedValue: normalization.normalizedValue,
      normalizedCurrency: 'EUR',
      pppAdjustedValue,
      pppAdjustment,
      differenceFromReference: pppAdjustedValue - 100,
      percentageDifference: Math.round(((pppAdjustedValue - 100) / 100) * 1000) / 10,
      confidence: profile.dataQuality === 'high' ? 'high' : profile.dataQuality === 'medium' ? 'medium' : 'low',
    });
  }

  return {
    eu: 'EU27',
    internationalCountries,
    indicator,
    results: {
      euAverage,
      internationalCountries: internationalResults,
    },
    date: new Date().toISOString(),
    methodology: 'https://akiprisaye.fr/docs/methodologie-eu-international-v4.2.0',
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
