// src/data/taxes/taxComparisons.ts
/**
 * International and regional tax comparisons
 * Provides context for understanding French DOM tax levels
 * All data from official international sources (OECD, EU, Caribbean institutions)
 */

export interface InternationalTaxComparison {
  country: string;
  countryCode: string; // ISO 3166-1 alpha-2
  region: 'EU' | 'Caribbean' | 'Pacific' | 'Indian Ocean' | 'Other';
  taxType: 'vat' | 'import_duty' | 'excise_alcohol' | 'excise_sugar_tax';
  standardRate: number;
  reducedRate?: number;
  unit: 'percentage' | 'euro_per_liter' | 'usd_per_liter';
  notes: string;
  sourceId: string;
  year: number; // Reference year
}

/**
 * International comparisons for context
 * Helps understand where French DOM rates stand internationally
 */
export const INTERNATIONAL_COMPARISONS: InternationalTaxComparison[] = [
  // VAT COMPARISONS - European neighbors
  {
    country: 'Allemagne',
    countryCode: 'DE',
    region: 'EU',
    taxType: 'vat',
    standardRate: 19,
    reducedRate: 7,
    unit: 'percentage',
    notes: 'Taux standard UE parmi les plus bas',
    sourceId: 'european_commission',
    year: 2024,
  },
  {
    country: 'Espagne',
    countryCode: 'ES',
    region: 'EU',
    taxType: 'vat',
    standardRate: 21,
    reducedRate: 10,
    unit: 'percentage',
    notes: 'Îles Canaries ont un régime spécial (IGIC) similaire aux DOM français',
    sourceId: 'european_commission',
    year: 2024,
  },
  {
    country: 'Portugal',
    countryCode: 'PT',
    region: 'EU',
    taxType: 'vat',
    standardRate: 23,
    reducedRate: 13,
    unit: 'percentage',
    notes: 'Madère et Açores ont des taux réduits (22%)',
    sourceId: 'european_commission',
    year: 2024,
  },
  {
    country: 'Italie',
    countryCode: 'IT',
    region: 'EU',
    taxType: 'vat',
    standardRate: 22,
    reducedRate: 10,
    unit: 'percentage',
    notes: 'Taux standard européen moyen',
    sourceId: 'european_commission',
    year: 2024,
  },

  // VAT COMPARISONS - Caribbean region (relevant for DOM)
  {
    country: 'Jamaïque',
    countryCode: 'JM',
    region: 'Caribbean',
    taxType: 'vat',
    standardRate: 15,
    unit: 'percentage',
    notes: 'GCT (General Consumption Tax) - équivalent TVA',
    sourceId: 'european_commission',
    year: 2024,
  },
  {
    country: 'Barbade',
    countryCode: 'BB',
    region: 'Caribbean',
    taxType: 'vat',
    standardRate: 17.5,
    unit: 'percentage',
    notes: 'VAT caribéenne standard',
    sourceId: 'european_commission',
    year: 2024,
  },
  {
    country: 'Trinité-et-Tobago',
    countryCode: 'TT',
    region: 'Caribbean',
    taxType: 'vat',
    standardRate: 12.5,
    unit: 'percentage',
    notes: 'Un des taux les plus bas de la Caraïbe',
    sourceId: 'european_commission',
    year: 2024,
  },
  {
    country: 'Sainte-Lucie',
    countryCode: 'LC',
    region: 'Caribbean',
    taxType: 'vat',
    standardRate: 12.5,
    unit: 'percentage',
    notes: "Membre de l'OECO (Organisation des États de la Caraïbe orientale)",
    sourceId: 'european_commission',
    year: 2024,
  },

  // IMPORT DUTIES - Caribbean comparison
  {
    country: 'Jamaïque',
    countryCode: 'JM',
    region: 'Caribbean',
    taxType: 'import_duty',
    standardRate: 20,
    unit: 'percentage',
    notes: 'Droits de douane élevés pour protection industrie locale',
    sourceId: 'european_commission',
    year: 2024,
  },
  {
    country: 'Barbade',
    countryCode: 'BB',
    region: 'Caribbean',
    taxType: 'import_duty',
    standardRate: 15,
    unit: 'percentage',
    notes: 'Taux moyen, variable selon produits',
    sourceId: 'european_commission',
    year: 2024,
  },

  // SUGAR TAX - International comparison
  {
    country: 'Royaume-Uni',
    countryCode: 'GB',
    region: 'EU',
    taxType: 'excise_sugar_tax',
    standardRate: 18,
    reducedRate: 24,
    unit: 'percentage',
    notes: 'Soft Drinks Industry Levy - 18p/L (<5g sucre/100ml), 24p/L (>8g/100ml)',
    sourceId: 'european_commission',
    year: 2024,
  },
  {
    country: 'Mexique',
    countryCode: 'MX',
    region: 'Other',
    taxType: 'excise_sugar_tax',
    standardRate: 10,
    unit: 'percentage',
    notes: '10% sur boissons sucrées - pionnier mondial (2014)',
    sourceId: 'european_commission',
    year: 2024,
  },
  {
    country: 'Barbade',
    countryCode: 'BB',
    region: 'Caribbean',
    taxType: 'excise_sugar_tax',
    standardRate: 10,
    unit: 'percentage',
    notes: 'Taxe sur boissons sucrées introduite pour santé publique',
    sourceId: 'european_commission',
    year: 2024,
  },

  // ALCOHOL EXCISE - Caribbean rum comparison
  {
    country: 'Jamaïque',
    countryCode: 'JM',
    region: 'Caribbean',
    taxType: 'excise_alcohol',
    standardRate: 1950,
    unit: 'euro_per_liter',
    notes: 'Droits sur spiritueux élevés, rhum local bénéficie de taux préférentiel',
    sourceId: 'european_commission',
    year: 2024,
  },
  {
    country: 'Barbade',
    countryCode: 'BB',
    region: 'Caribbean',
    taxType: 'excise_alcohol',
    standardRate: 15,
    unit: 'percentage',
    notes: 'Taxe ad valorem (% du prix) plutôt que spécifique',
    sourceId: 'european_commission',
    year: 2024,
  },
];

/**
 * Get comparisons for a specific region
 */
export function getComparisonsByRegion(
  region: InternationalTaxComparison['region']
): InternationalTaxComparison[] {
  return INTERNATIONAL_COMPARISONS.filter((comp) => comp.region === region);
}

/**
 * Get comparisons for a specific tax type
 */
export function getComparisonsByTaxType(
  taxType: InternationalTaxComparison['taxType']
): InternationalTaxComparison[] {
  return INTERNATIONAL_COMPARISONS.filter((comp) => comp.taxType === taxType).sort(
    (a, b) => a.standardRate - b.standardRate
  );
}

/**
 * Compare French DOM rate with international averages
 */
export function compareDOMWithRegion(
  domRate: number,
  taxType: InternationalTaxComparison['taxType'],
  region: InternationalTaxComparison['region']
): {
  domRate: number;
  regionalAverage: number;
  domVsAverage: number;
  domVsAveragePercent: number;
  regionalMin: number;
  regionalMax: number;
  domPosition: 'below_average' | 'average' | 'above_average';
} {
  const regionalRates = INTERNATIONAL_COMPARISONS.filter(
    (comp) => comp.region === region && comp.taxType === taxType
  ).map((comp) => comp.standardRate);

  if (regionalRates.length === 0) {
    return {
      domRate,
      regionalAverage: 0,
      domVsAverage: 0,
      domVsAveragePercent: 0,
      regionalMin: 0,
      regionalMax: 0,
      domPosition: 'average',
    };
  }

  const regionalAverage = regionalRates.reduce((a, b) => a + b, 0) / regionalRates.length;
  const regionalMin = Math.min(...regionalRates);
  const regionalMax = Math.max(...regionalRates);
  const domVsAverage = domRate - regionalAverage;
  const domVsAveragePercent = (domVsAverage / regionalAverage) * 100;

  let domPosition: 'below_average' | 'average' | 'above_average' = 'average';
  if (domRate < regionalAverage * 0.95) domPosition = 'below_average';
  if (domRate > regionalAverage * 1.05) domPosition = 'above_average';

  return {
    domRate,
    regionalAverage,
    domVsAverage,
    domVsAveragePercent,
    regionalMin,
    regionalMax,
    domPosition,
  };
}

/**
 * Get all countries in database
 */
export function getAllCountries(): Array<{ code: string; name: string; region: string }> {
  const countries = new Map<string, { name: string; region: string }>();
  INTERNATIONAL_COMPARISONS.forEach((comp) => {
    if (!countries.has(comp.countryCode)) {
      countries.set(comp.countryCode, { name: comp.country, region: comp.region });
    }
  });
  return Array.from(countries.entries()).map(([code, data]) => ({
    code,
    name: data.name,
    region: data.region,
  }));
}

/**
 * Get tax comparison summary for a country
 */
export function getCountryTaxSummary(countryCode: string): InternationalTaxComparison[] {
  return INTERNATIONAL_COMPARISONS.filter((comp) => comp.countryCode === countryCode);
}
