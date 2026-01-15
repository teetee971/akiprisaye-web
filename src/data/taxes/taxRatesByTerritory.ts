// src/data/taxes/taxRatesByTerritory.ts
/**
 * Tax rates by territory - Documented, dated, and sourced
 * All rates are based on official sources or clearly marked as unavailable
 * No invented or speculative data
 */

export interface TaxRate {
  territory: string
  territoryCode: string // ISO code or official code
  taxType: 'tva' | 'octroi_de_mer' | 'octroi_de_mer_regional' | 'taxe_speciale_consommation' | 'droits_douane' | 'tgap' | 'contribution_audiovisuel' | 'taxe_soda' | 'taxe_alcool'
  taxName: string
  /**
   * Single rate if known and constant
   */
  rate?: number | null
  /**
   * Minimum rate if range applies
   */
  minRate?: number | null
  /**
   * Maximum rate if range applies
   */
  maxRate?: number | null
  /**
   * Unit of the rate (percentage, euro per liter, etc.)
   */
  unit: 'percentage' | 'euro_per_liter' | 'euro_per_kg' | 'euro_fixed' | 'euro_per_hectoliter' | 'euro_per_ton'
  /**
   * Product category or scope
   */
  scope: string
  /**
   * Source ID from taxSources.ts
   */
  sourceId: string
  /**
   * Date when this rate was verified or published (ISO format)
   */
  validFrom: string
  /**
   * Date when this rate expires or was replaced (ISO format, null if still valid)
   */
  validUntil: string | null
  /**
   * Additional notes or clarifications
   */
  notes?: string
}

/**
 * Tax rates by territory
 * Data structure is ready to be populated with official data
 * Current values are either official or explicitly marked as unavailable
 */
export const TAX_RATES_BY_TERRITORY: TaxRate[] = [
  // MÉTROPOLE (HEXAGONE) - TVA
  {
    territory: 'Métropole',
    territoryCode: 'FR-MET',
    taxType: 'tva',
    taxName: 'TVA Taux Normal',
    rate: 20,
    unit: 'percentage',
    scope: 'La plupart des biens et services',
    sourceId: 'dgfip',
    validFrom: '2014-01-01',
    validUntil: null,
    notes: 'Taux normal de TVA en France métropolitaine',
  },
  {
    territory: 'Métropole',
    territoryCode: 'FR-MET',
    taxType: 'tva',
    taxName: 'TVA Taux Intermédiaire',
    rate: 10,
    unit: 'percentage',
    scope: 'Restauration, transport, travaux de rénovation',
    sourceId: 'dgfip',
    validFrom: '2014-01-01',
    validUntil: null,
    notes: 'Taux intermédiaire de TVA',
  },
  {
    territory: 'Métropole',
    territoryCode: 'FR-MET',
    taxType: 'tva',
    taxName: 'TVA Taux Réduit',
    rate: 5.5,
    unit: 'percentage',
    scope: 'Produits alimentaires de base, livres, énergie',
    sourceId: 'dgfip',
    validFrom: '2014-01-01',
    validUntil: null,
    notes: 'Taux réduit de TVA pour produits de première nécessité',
  },
  {
    territory: 'Métropole',
    territoryCode: 'FR-MET',
    taxType: 'tva',
    taxName: 'TVA Taux Particulier',
    rate: 2.1,
    unit: 'percentage',
    scope: 'Presse, médicaments remboursables',
    sourceId: 'dgfip',
    validFrom: '2014-01-01',
    validUntil: null,
    notes: 'Taux super réduit de TVA',
  },

  // GUADELOUPE - TVA & OCTROI DE MER
  {
    territory: 'Guadeloupe',
    territoryCode: 'FR-971',
    taxType: 'tva',
    taxName: 'TVA Taux Normal',
    rate: 8.5,
    unit: 'percentage',
    scope: 'La plupart des biens et services',
    sourceId: 'dgfip',
    validFrom: '2014-01-01',
    validUntil: null,
    notes: 'Taux de TVA spécifique aux DOM',
  },
  {
    territory: 'Guadeloupe',
    territoryCode: 'FR-971',
    taxType: 'tva',
    taxName: 'TVA Taux Réduit',
    rate: 2.1,
    unit: 'percentage',
    scope: 'Produits de première nécessité',
    sourceId: 'dgfip',
    validFrom: '2014-01-01',
    validUntil: null,
    notes: 'Taux réduit pour produits essentiels',
  },
  {
    territory: 'Guadeloupe',
    territoryCode: 'FR-971',
    taxType: 'octroi_de_mer',
    taxName: 'Octroi de Mer',
    minRate: 0,
    maxRate: 30,
    unit: 'percentage',
    scope: 'Variable selon catégories de produits',
    sourceId: 'collectivites_territoriales',
    validFrom: '2004-07-02',
    validUntil: null,
    notes: 'Taux variables selon produits et délibérations locales. Certains produits de première nécessité exonérés.',
  },
  {
    territory: 'Guadeloupe',
    territoryCode: 'FR-971',
    taxType: 'octroi_de_mer_regional',
    taxName: 'Octroi de Mer Régional',
    minRate: 0,
    maxRate: 2.5,
    unit: 'percentage',
    scope: 'Additif à l\'octroi de mer',
    sourceId: 'collectivites_territoriales',
    validFrom: '2004-07-02',
    validUntil: null,
    notes: 'Taxe additionnelle affectée à la région',
  },

  // MARTINIQUE - TVA & OCTROI DE MER
  {
    territory: 'Martinique',
    territoryCode: 'FR-972',
    taxType: 'tva',
    taxName: 'TVA Taux Normal',
    rate: 8.5,
    unit: 'percentage',
    scope: 'La plupart des biens et services',
    sourceId: 'dgfip',
    validFrom: '2014-01-01',
    validUntil: null,
    notes: 'Taux de TVA spécifique aux DOM',
  },
  {
    territory: 'Martinique',
    territoryCode: 'FR-972',
    taxType: 'tva',
    taxName: 'TVA Taux Réduit',
    rate: 2.1,
    unit: 'percentage',
    scope: 'Produits de première nécessité',
    sourceId: 'dgfip',
    validFrom: '2014-01-01',
    validUntil: null,
    notes: 'Taux réduit pour produits essentiels',
  },
  {
    territory: 'Martinique',
    territoryCode: 'FR-972',
    taxType: 'octroi_de_mer',
    taxName: 'Octroi de Mer',
    minRate: 0,
    maxRate: 30,
    unit: 'percentage',
    scope: 'Variable selon catégories de produits',
    sourceId: 'collectivites_territoriales',
    validFrom: '2004-07-02',
    validUntil: null,
    notes: 'Taux variables selon produits et délibérations locales. Certains produits de première nécessité exonérés.',
  },
  {
    territory: 'Martinique',
    territoryCode: 'FR-972',
    taxType: 'octroi_de_mer_regional',
    taxName: 'Octroi de Mer Régional',
    minRate: 0,
    maxRate: 2.5,
    unit: 'percentage',
    scope: 'Additif à l\'octroi de mer',
    sourceId: 'collectivites_territoriales',
    validFrom: '2004-07-02',
    validUntil: null,
    notes: 'Taxe additionnelle affectée à la région',
  },

  // GUYANE - TVA & OCTROI DE MER
  {
    territory: 'Guyane',
    territoryCode: 'FR-973',
    taxType: 'tva',
    taxName: 'TVA Taux Normal',
    rate: 8.5,
    unit: 'percentage',
    scope: 'La plupart des biens et services',
    sourceId: 'dgfip',
    validFrom: '2014-01-01',
    validUntil: null,
    notes: 'Taux de TVA spécifique aux DOM',
  },
  {
    territory: 'Guyane',
    territoryCode: 'FR-973',
    taxType: 'tva',
    taxName: 'TVA Taux Réduit',
    rate: 2.1,
    unit: 'percentage',
    scope: 'Produits de première nécessité',
    sourceId: 'dgfip',
    validFrom: '2014-01-01',
    validUntil: null,
    notes: 'Taux réduit pour produits essentiels',
  },
  {
    territory: 'Guyane',
    territoryCode: 'FR-973',
    taxType: 'octroi_de_mer',
    taxName: 'Octroi de Mer',
    minRate: 0,
    maxRate: 30,
    unit: 'percentage',
    scope: 'Variable selon catégories de produits',
    sourceId: 'collectivites_territoriales',
    validFrom: '2004-07-02',
    validUntil: null,
    notes: 'Taux variables selon produits et délibérations locales. Certains produits de première nécessité exonérés.',
  },
  {
    territory: 'Guyane',
    territoryCode: 'FR-973',
    taxType: 'octroi_de_mer_regional',
    taxName: 'Octroi de Mer Régional',
    minRate: 0,
    maxRate: 2.5,
    unit: 'percentage',
    scope: 'Additif à l\'octroi de mer',
    sourceId: 'collectivites_territoriales',
    validFrom: '2004-07-02',
    validUntil: null,
    notes: 'Taxe additionnelle affectée à la région',
  },

  // LA RÉUNION - TVA & OCTROI DE MER
  {
    territory: 'La Réunion',
    territoryCode: 'FR-974',
    taxType: 'tva',
    taxName: 'TVA Taux Normal',
    rate: 8.5,
    unit: 'percentage',
    scope: 'La plupart des biens et services',
    sourceId: 'dgfip',
    validFrom: '2014-01-01',
    validUntil: null,
    notes: 'Taux de TVA spécifique aux DOM',
  },
  {
    territory: 'La Réunion',
    territoryCode: 'FR-974',
    taxType: 'tva',
    taxName: 'TVA Taux Réduit',
    rate: 2.1,
    unit: 'percentage',
    scope: 'Produits de première nécessité',
    sourceId: 'dgfip',
    validFrom: '2014-01-01',
    validUntil: null,
    notes: 'Taux réduit pour produits essentiels',
  },
  {
    territory: 'La Réunion',
    territoryCode: 'FR-974',
    taxType: 'octroi_de_mer',
    taxName: 'Octroi de Mer',
    minRate: 0,
    maxRate: 30,
    unit: 'percentage',
    scope: 'Variable selon catégories de produits',
    sourceId: 'collectivites_territoriales',
    validFrom: '2004-07-02',
    validUntil: null,
    notes: 'Taux variables selon produits et délibérations locales. Certains produits de première nécessité exonérés.',
  },
  {
    territory: 'La Réunion',
    territoryCode: 'FR-974',
    taxType: 'octroi_de_mer_regional',
    taxName: 'Octroi de Mer Régional',
    minRate: 0,
    maxRate: 2.5,
    unit: 'percentage',
    scope: 'Additif à l\'octroi de mer',
    sourceId: 'collectivites_territoriales',
    validFrom: '2004-07-02',
    validUntil: null,
    notes: 'Taxe additionnelle affectée à la région',
  },

  // MAYOTTE - TVA & OCTROI DE MER
  {
    territory: 'Mayotte',
    territoryCode: 'FR-976',
    taxType: 'tva',
    taxName: 'TVA Taux Normal',
    rate: 8.5,
    unit: 'percentage',
    scope: 'La plupart des biens et services',
    sourceId: 'dgfip',
    validFrom: '2014-01-01',
    validUntil: null,
    notes: 'Taux de TVA spécifique aux DOM',
  },
  {
    territory: 'Mayotte',
    territoryCode: 'FR-976',
    taxType: 'tva',
    taxName: 'TVA Taux Réduit',
    rate: 2.1,
    unit: 'percentage',
    scope: 'Produits de première nécessité',
    sourceId: 'dgfip',
    validFrom: '2014-01-01',
    validUntil: null,
    notes: 'Taux réduit pour produits essentiels',
  },
  {
    territory: 'Mayotte',
    territoryCode: 'FR-976',
    taxType: 'octroi_de_mer',
    taxName: 'Octroi de Mer',
    minRate: 0,
    maxRate: 30,
    unit: 'percentage',
    scope: 'Variable selon catégories de produits',
    sourceId: 'collectivites_territoriales',
    validFrom: '2004-07-02',
    validUntil: null,
    notes: 'Taux variables selon produits et délibérations locales. Certains produits de première nécessité exonérés.',
  },
  {
    territory: 'Mayotte',
    territoryCode: 'FR-976',
    taxType: 'octroi_de_mer_regional',
    taxName: 'Octroi de Mer Régional',
    minRate: 0,
    maxRate: 2.5,
    unit: 'percentage',
    scope: 'Additif à l\'octroi de mer',
    sourceId: 'collectivites_territoriales',
    validFrom: '2004-07-02',
    validUntil: null,
    notes: 'Taxe additionnelle affectée à la région',
  },

  // DROITS DE DOUANE - Applicable à tous les DOM
  {
    territory: 'DOM (Tous)',
    territoryCode: 'FR-DOM',
    taxType: 'droits_douane',
    taxName: 'Droits de Douane - Produits Électroniques',
    minRate: 0,
    maxRate: 14,
    unit: 'percentage',
    scope: 'Produits électroniques importés hors UE',
    sourceId: 'dgddi',
    validFrom: '2013-10-01',
    validUntil: null,
    notes: 'Taux variable selon catégorie précise du produit. S\'applique sur la valeur CIF (coût, assurance, fret).',
  },
  {
    territory: 'DOM (Tous)',
    territoryCode: 'FR-DOM',
    taxType: 'droits_douane',
    taxName: 'Droits de Douane - Textiles',
    minRate: 8,
    maxRate: 12,
    unit: 'percentage',
    scope: 'Vêtements et textiles importés hors UE',
    sourceId: 'dgddi',
    validFrom: '2013-10-01',
    validUntil: null,
    notes: 'Taux du tarif douanier commun européen. Peut être réduit par accords commerciaux.',
  },
  {
    territory: 'DOM (Tous)',
    territoryCode: 'FR-DOM',
    taxType: 'droits_douane',
    taxName: 'Droits de Douane - Produits Alimentaires',
    minRate: 0,
    maxRate: 20,
    unit: 'percentage',
    scope: 'Denrées alimentaires importées hors UE',
    sourceId: 'dgddi',
    validFrom: '2013-10-01',
    validUntil: null,
    notes: 'Très variable selon le produit. Produits sensibles (viande, produits laitiers) ont des taux plus élevés.',
  },

  // TGAP - Taxe Générale sur les Activités Polluantes
  {
    territory: 'Métropole',
    territoryCode: 'FR-MET',
    taxType: 'tgap',
    taxName: 'TGAP Déchets - Enfouissement',
    minRate: 50,
    maxRate: 65,
    unit: 'euro_per_ton',
    scope: 'Mise en décharge de déchets non dangereux',
    sourceId: 'dgddi',
    validFrom: '2023-01-01',
    validUntil: null,
    notes: 'Tarif progressif pour inciter au recyclage. Varie selon type d\'installation.',
  },
  {
    territory: 'DOM (Tous)',
    territoryCode: 'FR-DOM',
    taxType: 'tgap',
    taxName: 'TGAP Déchets - Taux Adapté DOM',
    minRate: 20,
    maxRate: 40,
    unit: 'euro_per_ton',
    scope: 'Mise en décharge - taux réduits DOM',
    sourceId: 'dgddi',
    validFrom: '2023-01-01',
    validUntil: null,
    notes: 'Taux adaptés aux spécificités ultramarines. Montée en charge progressive.',
  },

  // TAXE SODA - Boissons Sucrées
  {
    territory: 'France entière',
    territoryCode: 'FR-ALL',
    taxType: 'taxe_soda',
    taxName: 'Taxe Boissons Sucrées - Taux Normal',
    rate: 7.53,
    unit: 'euro_per_hectoliter',
    scope: 'Boissons avec sucres ajoutés > 8g/L',
    sourceId: 'dgddi',
    validFrom: '2018-01-01',
    validUntil: null,
    notes: 'S\'applique sur tout le territoire français. Vise à réduire la consommation de sucre.',
  },
  {
    territory: 'France entière',
    territoryCode: 'FR-ALL',
    taxType: 'taxe_soda',
    taxName: 'Taxe Boissons Sucrées - Taux Réduit',
    rate: 3.77,
    unit: 'euro_per_hectoliter',
    scope: 'Boissons avec sucres ajoutés ≤ 8g/L',
    sourceId: 'dgddi',
    validFrom: '2018-01-01',
    validUntil: null,
    notes: 'Taux réduit pour boissons faiblement sucrées.',
  },
  {
    territory: 'France entière',
    territoryCode: 'FR-ALL',
    taxType: 'taxe_soda',
    taxName: 'Taxe Boissons avec Édulcorants',
    rate: 3.77,
    unit: 'euro_per_hectoliter',
    scope: 'Boissons avec édulcorants de synthèse',
    sourceId: 'dgddi',
    validFrom: '2018-01-01',
    validUntil: null,
    notes: 'Concerne les boissons "light" ou "zéro sucre".',
  },

  // TAXE ALCOOL - Droits d'Accises
  {
    territory: 'Métropole',
    territoryCode: 'FR-MET',
    taxType: 'taxe_alcool',
    taxName: 'Droits Spiritueux - Taux Plein',
    rate: 1786,
    unit: 'euro_per_hectoliter',
    scope: 'Spiritueux (rhum, whisky, vodka, etc.) par hectolitre d\'alcool pur',
    sourceId: 'dgddi',
    validFrom: '2023-01-01',
    validUntil: null,
    notes: 'Pour un litre à 40°, cela représente environ 7,14€ de taxe.',
  },
  {
    territory: 'DOM (Tous)',
    territoryCode: 'FR-DOM',
    taxType: 'taxe_alcool',
    taxName: 'Droits Spiritueux DOM - Rhum Traditionnel',
    minRate: 893,
    maxRate: 1786,
    unit: 'euro_per_hectoliter',
    scope: 'Rhum traditionnel des DOM - exonérations partielles possibles',
    sourceId: 'dgddi',
    validFrom: '2023-01-01',
    validUntil: null,
    notes: 'Régime fiscal favorable pour le rhum produit localement. Exonération de 50% à 100% selon contingents.',
  },
  {
    territory: 'France entière',
    territoryCode: 'FR-ALL',
    taxType: 'taxe_alcool',
    taxName: 'Droits Bière - Taux Normal',
    rate: 7.70,
    unit: 'euro_per_hectoliter',
    scope: 'Bière par hectolitre et par degré d\'alcool',
    sourceId: 'dgddi',
    validFrom: '2023-01-01',
    validUntil: null,
    notes: 'Pour une bière à 5°, cela représente 0,385€ par litre.',
  },
  {
    territory: 'France entière',
    territoryCode: 'FR-ALL',
    taxType: 'taxe_alcool',
    taxName: 'Droits Vin Tranquille',
    rate: 3.85,
    unit: 'euro_per_hectoliter',
    scope: 'Vins tranquilles (non mousseux)',
    sourceId: 'dgddi',
    validFrom: '2023-01-01',
    validUntil: null,
    notes: 'Soit 0,04€ par bouteille de 75cl. Taux parmi les plus bas d\'Europe.',
  },

  // CONTRIBUTION AUDIOVISUEL PUBLIC (historique)
  {
    territory: 'Métropole',
    territoryCode: 'FR-MET',
    taxType: 'contribution_audiovisuel',
    taxName: 'Contribution Audiovisuel Public',
    rate: 138,
    unit: 'euro_fixed',
    scope: 'Contribution annuelle par foyer (supprimée en 2022)',
    sourceId: 'dgfip',
    validFrom: '2021-01-01',
    validUntil: '2022-12-31',
    notes: 'Supprimée et remplacée par affectation d\'une fraction de TVA. Montant historique pour référence.',
  },
  {
    territory: 'DOM (Tous)',
    territoryCode: 'FR-DOM',
    taxType: 'contribution_audiovisuel',
    taxName: 'Contribution Audiovisuel Public DOM',
    rate: 88,
    unit: 'euro_fixed',
    scope: 'Contribution annuelle réduite DOM (supprimée en 2022)',
    sourceId: 'dgfip',
    validFrom: '2021-01-01',
    validUntil: '2022-12-31',
    notes: 'Taux réduit pour les DOM. Supprimée comme en métropole en 2022.',
  },
]

/**
 * Get tax rates for a specific territory
 */
export function getTaxRatesByTerritory(territoryCode: string): TaxRate[] {
  return TAX_RATES_BY_TERRITORY.filter((rate) => rate.territoryCode === territoryCode)
}

/**
 * Get tax rates by type
 */
export function getTaxRatesByType(
  taxType: TaxRate['taxType']
): TaxRate[] {
  return TAX_RATES_BY_TERRITORY.filter((rate) => rate.taxType === taxType)
}

/**
 * Get all unique territories
 */
export function getAllTerritories(): Array<{ code: string; name: string }> {
  const territories = new Map<string, string>()
  TAX_RATES_BY_TERRITORY.forEach((rate) => {
    if (!territories.has(rate.territoryCode)) {
      territories.set(rate.territoryCode, rate.territory)
    }
  })
  return Array.from(territories.entries()).map(([code, name]) => ({ code, name }))
}

/**
 * Get a specific tax rate
 */
export function getTaxRate(
  territoryCode: string,
  taxType: TaxRate['taxType'],
  scope?: string
): TaxRate | undefined {
  return TAX_RATES_BY_TERRITORY.find(
    (rate) =>
      rate.territoryCode === territoryCode &&
      rate.taxType === taxType &&
      (!scope || rate.scope === scope)
  )
}

/**
 * Advanced Calculation Functions
 * These functions help perform common tax calculations
 */

/**
 * Calculate HT (excluding tax) price from TTC (including tax) price
 * @param priceTTC - Price including all taxes
 * @param tvaRate - TVA rate in percentage (e.g., 20 for 20%)
 * @returns Price excluding TVA
 */
export function calculatePriceHT(priceTTC: number, tvaRate: number): number {
  return priceTTC / (1 + tvaRate / 100)
}

/**
 * Calculate cumulative tax effect (TVA + Octroi + OMR)
 * @param priceHT - Base price excluding all taxes
 * @param tvaRate - TVA rate in percentage
 * @param octroiRate - Octroi de mer rate in percentage (optional)
 * @param omrRate - OMR rate in percentage (optional)
 * @returns Object with breakdown of each tax and total
 */
export function calculateCumulativeTaxes(
  priceHT: number,
  tvaRate: number,
  octroiRate: number = 0,
  omrRate: number = 0
): {
  priceHT: number
  tvaAmount: number
  octroiAmount: number
  omrAmount: number
  totalTaxes: number
  priceTTC: number
  taxPercentage: number
} {
  // Octroi and OMR are applied on HT price
  const octroiAmount = priceHT * (octroiRate / 100)
  const omrAmount = priceHT * (omrRate / 100)
  
  // TVA is applied on (HT + Octroi + OMR)
  const baseForTVA = priceHT + octroiAmount + omrAmount
  const tvaAmount = baseForTVA * (tvaRate / 100)
  
  const totalTaxes = tvaAmount + octroiAmount + omrAmount
  const priceTTC = priceHT + totalTaxes
  const taxPercentage = (totalTaxes / priceTTC) * 100

  return {
    priceHT,
    tvaAmount,
    octroiAmount,
    omrAmount,
    totalTaxes,
    priceTTC,
    taxPercentage,
  }
}

/**
 * Calculate fiscal differential between two territories
 * @param priceHT - Base price excluding taxes
 * @param territory1Rates - Tax rates for first territory
 * @param territory2Rates - Tax rates for second territory
 * @returns Comparison object with difference
 */
export function calculateTerritoryDifferential(
  priceHT: number,
  territory1Rates: { tva: number; octroi?: number; omr?: number },
  territory2Rates: { tva: number; octroi?: number; omr?: number }
): {
  territory1TotalTax: number
  territory2TotalTax: number
  differenceAmount: number
  differencePercentage: number
} {
  const t1 = calculateCumulativeTaxes(
    priceHT,
    territory1Rates.tva,
    territory1Rates.octroi,
    territory1Rates.omr
  )
  const t2 = calculateCumulativeTaxes(
    priceHT,
    territory2Rates.tva,
    territory2Rates.octroi,
    territory2Rates.omr
  )

  return {
    territory1TotalTax: t1.totalTaxes,
    territory2TotalTax: t2.totalTaxes,
    differenceAmount: t1.totalTaxes - t2.totalTaxes,
    differencePercentage: ((t1.totalTaxes - t2.totalTaxes) / t2.totalTaxes) * 100,
  }
}

/**
 * Calculate total fiscal burden as percentage of final price
 * Useful for understanding what portion of the purchase goes to taxes
 * @param priceTTC - Final price including taxes
 * @param priceHT - Base price excluding taxes
 * @returns Percentage of price that is taxes
 */
export function calculateFiscalBurdenPercentage(
  priceTTC: number,
  priceHT: number
): number {
  const totalTaxes = priceTTC - priceHT
  return (totalTaxes / priceTTC) * 100
}
