// src/data/taxes/taxHistory.ts
/**
 * Historical tax rates - Evolution over time
 * Allows temporal comparison and understanding of fiscal policy changes
 * All data from official sources with exact dates
 */

export interface HistoricalTaxRate {
  taxType: 'tva' | 'octroi_de_mer' | 'taxe_soda' | 'taxe_alcool' | 'contribution_audiovisuel';
  taxName: string;
  territory: string;
  territoryCode: string;
  rate: number;
  unit: 'percentage' | 'euro_fixed' | 'euro_per_hectoliter';
  scope: string;
  validFrom: string; // ISO date
  validUntil: string; // ISO date
  changeReason: string; // Why the rate changed
  sourceId: string;
}

/**
 * Historical tax rates showing evolution over time
 * Useful for understanding fiscal policy trends
 */
export const HISTORICAL_TAX_RATES: HistoricalTaxRate[] = [
  // TVA MÉTROPOLE - Historical evolution
  {
    taxType: 'tva',
    taxName: 'TVA Taux Normal',
    territory: 'Métropole',
    territoryCode: 'FR-MET',
    rate: 18.6,
    unit: 'percentage',
    scope: 'Taux normal général',
    validFrom: '1995-08-01',
    validUntil: '2000-03-31',
    changeReason: 'Harmonisation européenne et besoins budgétaires',
    sourceId: 'dgfip',
  },
  {
    taxType: 'tva',
    taxName: 'TVA Taux Normal',
    territory: 'Métropole',
    territoryCode: 'FR-MET',
    rate: 19.6,
    unit: 'percentage',
    scope: 'Taux normal général',
    validFrom: '2000-04-01',
    validUntil: '2013-12-31',
    changeReason: 'Augmentation pour financement de la réduction du temps de travail',
    sourceId: 'dgfip',
  },
  {
    taxType: 'tva',
    taxName: 'TVA Taux Normal',
    territory: 'Métropole',
    territoryCode: 'FR-MET',
    rate: 20,
    unit: 'percentage',
    scope: 'Taux normal général',
    validFrom: '2014-01-01',
    validUntil: '9999-12-31',
    changeReason: 'Augmentation pour réduction du déficit public',
    sourceId: 'dgfip',
  },

  // TVA DOM - Historical evolution
  {
    taxType: 'tva',
    taxName: 'TVA DOM Taux Normal',
    territory: 'DOM (971, 972, 973, 974, 976)',
    territoryCode: 'FR-DOM',
    rate: 7.5,
    unit: 'percentage',
    scope: 'Taux normal DOM avant 2000',
    validFrom: '1992-01-01',
    validUntil: '1999-12-31',
    changeReason: 'Taux spécifique DOM pour compétitivité',
    sourceId: 'dgfip',
  },
  {
    taxType: 'tva',
    taxName: 'TVA DOM Taux Normal',
    territory: 'DOM (971, 972, 973, 974, 976)',
    territoryCode: 'FR-DOM',
    rate: 8.5,
    unit: 'percentage',
    scope: 'Taux normal DOM actuel',
    validFrom: '2000-01-01',
    validUntil: '9999-12-31',
    changeReason: 'Ajustement pour convergence partielle avec métropole',
    sourceId: 'dgfip',
  },

  // TAXE SODA - Creation and evolution
  {
    taxType: 'taxe_soda',
    taxName: 'Taxe Sodas - Création',
    territory: 'France entière',
    territoryCode: 'FR-ALL',
    rate: 7.16,
    unit: 'euro_per_hectoliter',
    scope: 'Première version de la taxe soda',
    validFrom: '2012-01-01',
    validUntil: '2017-12-31',
    changeReason: 'Création pour lutte contre obésité et diabète',
    sourceId: 'dgddi',
  },
  {
    taxType: 'taxe_soda',
    taxName: 'Taxe Sodas - Réforme',
    territory: 'France entière',
    territoryCode: 'FR-ALL',
    rate: 7.53,
    unit: 'euro_per_hectoliter',
    scope: 'Version réformée avec taux gradués selon teneur en sucre',
    validFrom: '2018-01-01',
    validUntil: '9999-12-31',
    changeReason: 'Réforme pour inciter à la réduction du sucre (taux modulé)',
    sourceId: 'dgddi',
  },

  // CONTRIBUTION AUDIOVISUEL - Evolution and suppression
  {
    taxType: 'contribution_audiovisuel',
    taxName: 'Redevance Audiovisuelle',
    territory: 'Métropole',
    territoryCode: 'FR-MET',
    rate: 116.5,
    unit: 'euro_fixed',
    scope: 'Redevance TV couleur',
    validFrom: '2005-01-01',
    validUntil: '2014-12-31',
    changeReason: 'Indexation régulière sur inflation',
    sourceId: 'dgfip',
  },
  {
    taxType: 'contribution_audiovisuel',
    taxName: 'Contribution Audiovisuel Public',
    territory: 'Métropole',
    territoryCode: 'FR-MET',
    rate: 138,
    unit: 'euro_fixed',
    scope: "Contribution à l'audiovisuel public",
    validFrom: '2015-01-01',
    validUntil: '2022-12-31',
    changeReason: 'Indexation et changement de dénomination. Supprimée fin 2022.',
    sourceId: 'dgfip',
  },

  // TAXE ALCOOL - Historical rates for DOM rum
  {
    taxType: 'taxe_alcool',
    taxName: 'Droits Rhum DOM - Ancien régime',
    territory: 'DOM',
    territoryCode: 'FR-DOM',
    rate: 0,
    unit: 'euro_per_hectoliter',
    scope: 'Exonération totale avant 2014',
    validFrom: '1930-01-01',
    validUntil: '2013-12-31',
    changeReason: 'Régime historique de faveur pour filière canne à sucre',
    sourceId: 'dgddi',
  },
  {
    taxType: 'taxe_alcool',
    taxName: 'Droits Rhum DOM - Transition',
    territory: 'DOM',
    territoryCode: 'FR-DOM',
    rate: 446.5,
    unit: 'euro_per_hectoliter',
    scope: 'Phase transitoire (25% du taux plein)',
    validFrom: '2014-01-01',
    validUntil: '2020-12-31',
    changeReason: 'Mise en conformité avec règles UE - montée en charge progressive',
    sourceId: 'dgddi',
  },
  {
    taxType: 'taxe_alcool',
    taxName: 'Droits Rhum DOM - Régime actuel',
    territory: 'DOM',
    territoryCode: 'FR-DOM',
    rate: 893,
    unit: 'euro_per_hectoliter',
    scope: 'Taux réduit permanent (50% du taux plein)',
    validFrom: '2021-01-01',
    validUntil: '9999-12-31',
    changeReason: 'Régime stabilisé avec exonération partielle maintenue',
    sourceId: 'dgddi',
  },
];

/**
 * Get historical rates for a specific tax type
 */
export function getHistoricalRates(taxType: HistoricalTaxRate['taxType']): HistoricalTaxRate[] {
  return HISTORICAL_TAX_RATES.filter((rate) => rate.taxType === taxType).sort(
    (a, b) => new Date(a.validFrom).getTime() - new Date(b.validFrom).getTime()
  );
}

/**
 * Get historical rates for a territory
 */
export function getHistoricalRatesByTerritory(territoryCode: string): HistoricalTaxRate[] {
  return HISTORICAL_TAX_RATES.filter(
    (rate) =>
      rate.territoryCode === territoryCode ||
      rate.territoryCode === 'FR-ALL' ||
      (territoryCode.startsWith('FR-97') && rate.territoryCode === 'FR-DOM')
  ).sort((a, b) => new Date(a.validFrom).getTime() - new Date(b.validFrom).getTime());
}

/**
 * Get rate at a specific date
 */
export function getRateAtDate(
  taxType: HistoricalTaxRate['taxType'],
  territoryCode: string,
  date: string // ISO date
): HistoricalTaxRate | undefined {
  const targetDate = new Date(date);
  return HISTORICAL_TAX_RATES.find(
    (rate) =>
      rate.taxType === taxType &&
      (rate.territoryCode === territoryCode ||
        (territoryCode.startsWith('FR-97') && rate.territoryCode === 'FR-DOM')) &&
      new Date(rate.validFrom) <= targetDate &&
      new Date(rate.validUntil) >= targetDate
  );
}

/**
 * Calculate rate evolution percentage between two dates
 */
export function calculateRateEvolution(
  taxType: HistoricalTaxRate['taxType'],
  territoryCode: string,
  startDate: string,
  endDate: string
): {
  startRate: number | null;
  endRate: number | null;
  evolutionAmount: number | null;
  evolutionPercentage: number | null;
} {
  const startRate = getRateAtDate(taxType, territoryCode, startDate);
  const endRate = getRateAtDate(taxType, territoryCode, endDate);

  if (!startRate || !endRate) {
    return {
      startRate: startRate?.rate ?? null,
      endRate: endRate?.rate ?? null,
      evolutionAmount: null,
      evolutionPercentage: null,
    };
  }

  const evolutionAmount = endRate.rate - startRate.rate;
  const evolutionPercentage = (evolutionAmount / startRate.rate) * 100;

  return {
    startRate: startRate.rate,
    endRate: endRate.rate,
    evolutionAmount,
    evolutionPercentage,
  };
}

/**
 * Get all rate changes for a tax type (timeline)
 */
export function getTaxTimeline(
  taxType: HistoricalTaxRate['taxType'],
  territoryCode?: string
): HistoricalTaxRate[] {
  let rates = HISTORICAL_TAX_RATES.filter((rate) => rate.taxType === taxType);

  if (territoryCode) {
    rates = rates.filter(
      (rate) =>
        rate.territoryCode === territoryCode ||
        rate.territoryCode === 'FR-ALL' ||
        (territoryCode.startsWith('FR-97') && rate.territoryCode === 'FR-DOM')
    );
  }

  return rates.sort((a, b) => new Date(a.validFrom).getTime() - new Date(b.validFrom).getTime());
}
