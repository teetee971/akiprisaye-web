import type {
  NormalizedPriceObservation,
  PriceInterval,
  PriceSearchInput,
  PriceSearchStatus,
  TerritoryCode,
} from './priceSearch/price.types';
import { formatPriceLabel, normalizePriceValue } from './priceSearch/priceNormalizer';
import { computePriceInterval } from './priceSearch/priceInterval';

type LocalPriceObservation = {
  id: string;
  productName: string;
  brand?: string;
  barcode?: string;
  category?: string;
  price: number;
  currency: 'EUR';
  unit?: 'unit' | 'kg' | 'l';
  quantity?: number;
  territory: TerritoryCode;
  observedAt: string;
  store?: string;
};

const LOCAL_PRICE_DATA: LocalPriceObservation[] = [
  // Données locales simulées (échantillon DOM + métropole pour la comparaison)
  {
    id: 'rice-fr-1',
    productName: 'Riz long grain',
    brand: 'Sélection',
    barcode: '3560071234567',
    category: 'epicerie',
    price: 2.45,
    currency: 'EUR',
    unit: 'kg',
    quantity: 1,
    territory: 'fr',
    observedAt: '2026-01-15',
    store: 'Supermarché A',
  },
  {
    id: 'rice-gp-1',
    productName: 'Riz long grain',
    brand: 'Sélection',
    barcode: '3560071234567',
    category: 'epicerie',
    price: 3.15,
    currency: 'EUR',
    unit: 'kg',
    quantity: 1,
    territory: 'gp',
    observedAt: '2026-01-16',
    store: 'Supermarché B',
  },
  {
    id: 'milk-fr-1',
    productName: 'Lait demi-écrémé',
    brand: 'Lactéa',
    barcode: '3125476543210',
    category: 'lait',
    price: 1.12,
    currency: 'EUR',
    unit: 'l',
    quantity: 1,
    territory: 'fr',
    observedAt: '2026-01-14',
    store: 'Supermarché A',
  },
  {
    id: 'milk-mq-1',
    productName: 'Lait demi-écrémé',
    brand: 'Lactéa',
    barcode: '3125476543210',
    category: 'lait',
    price: 1.68,
    currency: 'EUR',
    unit: 'l',
    quantity: 1,
    territory: 'mq',
    observedAt: '2026-01-15',
    store: 'Supermarché C',
  },
  {
    id: 'coffee-fr-1',
    productName: 'Café moulu classique',
    brand: 'Caféline',
    barcode: '3210987654321',
    category: 'boisson',
    price: 3.4,
    currency: 'EUR',
    unit: 'unit',
    quantity: 1,
    territory: 'fr',
    observedAt: '2026-01-12',
    store: 'Supermarché D',
  },
  {
    id: 'coffee-re-1',
    productName: 'Café moulu classique',
    brand: 'Caféline',
    barcode: '3210987654321',
    category: 'boisson',
    price: 4.1,
    currency: 'EUR',
    unit: 'unit',
    quantity: 1,
    territory: 're',
    observedAt: '2026-01-13',
    store: 'Supermarché E',
  },
  {
    id: 'detergent-fr-1',
    productName: 'Lessive liquide',
    brand: 'NetPlus',
    barcode: '4006381333931',
    category: 'entretien',
    price: 6.2,
    currency: 'EUR',
    unit: 'l',
    quantity: 1.5,
    territory: 'fr',
    observedAt: '2026-01-11',
    store: 'Supermarché D',
  },
  {
    id: 'detergent-gf-1',
    productName: 'Lessive liquide',
    brand: 'NetPlus',
    barcode: '4006381333931',
    category: 'entretien',
    price: 7.9,
    currency: 'EUR',
    unit: 'l',
    quantity: 1.5,
    territory: 'gf',
    observedAt: '2026-01-12',
    store: 'Supermarché F',
  },
];

const normalizeText = (value: string): string => value.trim().toLowerCase();

const matchesText = (source: string | undefined, query: string): boolean => {
  if (!source) return false;
  return normalizeText(source).includes(normalizeText(query));
};

const normalizeObservation = (observation: LocalPriceObservation): NormalizedPriceObservation => {
  const normalizedPrice = normalizePriceValue(observation.price);
  const quantity = observation.quantity;
  const pricePerUnit =
    quantity && Number.isFinite(quantity) && quantity > 0
      ? normalizePriceValue(normalizedPrice / quantity)
      : undefined;
  const normalizedLabel = pricePerUnit
    ? formatPriceLabel(pricePerUnit, observation.unit)
    : formatPriceLabel(normalizedPrice, observation.unit);

  const metadata = observation.store ? { store: observation.store } : undefined;

  return {
    source: 'data_gouv',
    productName: observation.productName,
    brand: observation.brand,
    barcode: observation.barcode,
    price: normalizedPrice,
    currency: 'EUR',
    unit: observation.unit,
    observedAt: observation.observedAt,
    territory: observation.territory,
    metadata,
    pricePerUnit,
    normalizedLabel,
  };
};

const filterByInput = (
  observations: LocalPriceObservation[],
  input: PriceSearchInput
): LocalPriceObservation[] => {
  return observations.filter((observation) => {
    if (input.territory && observation.territory !== input.territory) {
      return false;
    }
    if (input.barcode && observation.barcode !== input.barcode) {
      return false;
    }
    if (input.brand && !matchesText(observation.brand, input.brand)) {
      return false;
    }
    if (input.category && !matchesText(observation.category, input.category)) {
      return false;
    }
    if (input.query) {
      const query = input.query;
      return (
        matchesText(observation.productName, query) ||
        matchesText(observation.brand, query)
      );
    }
    return true;
  });
};

export async function comparePrices(
  input: PriceSearchInput
): Promise<{
  status: PriceSearchStatus;
  interval: PriceInterval | null;
  items: NormalizedPriceObservation[];
}> {
  const filtered = filterByInput(LOCAL_PRICE_DATA, input);
  const items = filtered.map(normalizeObservation);

  if (items.length === 0) {
    return {
      status: 'NO_DATA',
      interval: null,
      items,
    };
  }

  return {
    status: 'OK',
    interval: computePriceInterval(items),
    items,
  };
}
