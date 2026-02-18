import type { TerritoryCode } from '../services/priceSearch/price.types';

export type RetailerId = 'carrefour' | 'leclerc' | 'intermarche' | 'superu';

export interface LocalPriceOverride {
  ean: string;
  territory: TerritoryCode;
  retailer: RetailerId;
  price: number | null;
  currency: 'EUR';
  unit?: 'unit' | 'l' | 'kg';
  observedAt?: string;
  sourceNote?: string;
}

export const PRICE_OVERRIDES: LocalPriceOverride[] = [
  {
    ean: '3560070894222',
    territory: 'fr',
    retailer: 'carrefour',
    price: null,
    currency: 'EUR',
    unit: 'unit',
    sourceNote: 'Prix non renseigné (catalogue interne à compléter).',
  },
  {
    ean: '3560070894222',
    territory: 'fr',
    retailer: 'leclerc',
    price: null,
    currency: 'EUR',
    unit: 'unit',
    sourceNote: 'Prix non renseigné (catalogue interne à compléter).',
  },
  {
    ean: '3560070894222',
    territory: 'fr',
    retailer: 'intermarche',
    price: null,
    currency: 'EUR',
    unit: 'unit',
    sourceNote: 'Prix non renseigné (catalogue interne à compléter).',
  },
  {
    ean: '3560070894222',
    territory: 'fr',
    retailer: 'superu',
    price: null,
    currency: 'EUR',
    unit: 'unit',
    sourceNote: 'Prix non renseigné (catalogue interne à compléter).',
  },
  {
    ean: '3560070894222',
    territory: 'gp',
    retailer: 'carrefour',
    price: null,
    currency: 'EUR',
    unit: 'unit',
    sourceNote: 'Prix non renseigné (catalogue interne à compléter).',
  },
  {
    ean: '3560070894222',
    territory: 'gp',
    retailer: 'leclerc',
    price: null,
    currency: 'EUR',
    unit: 'unit',
    sourceNote: 'Prix non renseigné (catalogue interne à compléter).',
  },
  {
    ean: '3560070894222',
    territory: 'gp',
    retailer: 'intermarche',
    price: null,
    currency: 'EUR',
    unit: 'unit',
    sourceNote: 'Prix non renseigné (catalogue interne à compléter).',
  },
  {
    ean: '3560070894222',
    territory: 'gp',
    retailer: 'superu',
    price: null,
    currency: 'EUR',
    unit: 'unit',
    sourceNote: 'Prix non renseigné (catalogue interne à compléter).',
  },
  {
    ean: '3560070894222',
    territory: 'mq',
    retailer: 'carrefour',
    price: null,
    currency: 'EUR',
    unit: 'unit',
    sourceNote: 'Prix non renseigné (catalogue interne à compléter).',
  },
  {
    ean: '3560070894222',
    territory: 'mq',
    retailer: 'leclerc',
    price: null,
    currency: 'EUR',
    unit: 'unit',
    sourceNote: 'Prix non renseigné (catalogue interne à compléter).',
  },
  {
    ean: '3560070894222',
    territory: 'mq',
    retailer: 'intermarche',
    price: null,
    currency: 'EUR',
    unit: 'unit',
    sourceNote: 'Prix non renseigné (catalogue interne à compléter).',
  },
  {
    ean: '3560070894222',
    territory: 'mq',
    retailer: 'superu',
    price: null,
    currency: 'EUR',
    unit: 'unit',
    sourceNote: 'Prix non renseigné (catalogue interne à compléter).',
  },
];

export function findLocalPriceOverrides(
  ean: string,
  territory: TerritoryCode,
  retailer?: RetailerId
): LocalPriceOverride[] {
  return PRICE_OVERRIDES.filter((entry) => {
    if (entry.ean !== ean || entry.territory !== territory) {
      return false;
    }

    if (retailer && entry.retailer !== retailer) {
      return false;
    }

    return true;
  });
}
