// src/data/taxes/index.ts
/**
 * Taxes & Real Prices Module - Unified export
 * Complete data foundation for tax analysis in French overseas territories
 */

// Core tax data
export * from './taxDefinitions';
export * from './taxRatesByTerritory';
export * from './taxSources';

// Extended features
export * from './taxExemptions';
export * from './taxHistory';
export * from './taxComparisons';
export * from './taxSimulations';

/**
 * Module metadata
 */
export const TAXES_MODULE_INFO = {
  version: '1.0.0',
  lastUpdate: '2026-01-13',
  coverage: {
    territories: 6, // Métropole + 5 DOM
    taxTypes: 9,
    rateEntries: 41,
    exemptions: 9,
    historicalRates: 13,
    internationalComparisons: 14,
    simulationScenarios: 3,
  },
  features: [
    'Tax definitions with legal framework',
    'Current tax rates by territory',
    'Official sources documentation',
    'Tax exemptions and special regimes',
    'Historical rate evolution',
    'International comparisons (EU, Caribbean)',
    'Advanced calculation functions',
    'Pedagogical simulations (read-only)',
  ],
  dataQuality: {
    sourced: true,
    dated: true,
    neutral: true,
    noInventedData: true,
    strictTypeScript: true,
  },
};

/**
 * Quick reference guide
 */
export const QUICK_START_GUIDE = {
  basicUsage: {
    getTaxDefinition: 'import { getTaxDefinition } from "@/data/taxes"',
    getTaxRate: 'import { getTaxRate } from "@/data/taxes"',
    calculateTaxes: 'import { calculateCumulativeTaxes } from "@/data/taxes"',
  },
  examples: [
    {
      description: 'Get TVA definition',
      code: `const tvaDef = getTaxDefinition('tva')`,
    },
    {
      description: 'Get Guadeloupe TVA rate',
      code: `const rate = getTaxRate('FR-971', 'tva', 'Taux normal')`,
    },
    {
      description: 'Calculate cumulative taxes',
      code: `const result = calculateCumulativeTaxes(100, 8.5, 15, 2.5)`,
    },
    {
      description: 'Get tax exemptions for a territory',
      code: `const exemptions = getExemptionsByTerritory('FR-971')`,
    },
    {
      description: 'Get historical rates for TVA',
      code: `const history = getHistoricalRates('tva')`,
    },
    {
      description: 'Compare with Caribbean region',
      code: `const comparison = compareDOMWithRegion(8.5, 'vat', 'Caribbean')`,
    },
  ],
};
