import { findProductByEan, searchProductsByName } from '../data/seedProducts';
import type { PriceObservation, PriceSearchInput, TerritoryCode } from '../services/priceSearch/price.types';
import { normalizePriceObservation, normalizeText } from './normalize';
import type { PriceProvider, ProviderResult } from './types';

const TERRITORY_LABEL_BY_CODE: Record<TerritoryCode, string> = {
  fr: 'france',
  gp: 'guadeloupe',
  mq: 'martinique',
  gf: 'guyane',
  re: 'la reunion',
  yt: 'mayotte',
  pm: 'saint-pierre-et-miquelon',
  bl: 'saint-barthelemy',
  mf: 'saint-martin',
  wf: 'wallis-et-futuna',
  pf: 'polynesie francaise',
  nc: 'nouvelle-caledonie',
  tf: 'terres australes et antarctiques francaises',
};

type SeedPriceItem = {
  storeName?: string;
  territory?: string;
  price: number;
  currency?: string;
  ts?: string;
};

type SeedProduct = {
  ean?: string;
  name?: string;
  brand?: string;
  prices?: SeedPriceItem[];
};

const matchesTerritory = (territoryLabel: string | undefined, territoryCode?: TerritoryCode): boolean => {
  if (!territoryCode) {
    return true;
  }
  const expected = TERRITORY_LABEL_BY_CODE[territoryCode];
  if (!expected) {
    return true;
  }
  return normalizeText(territoryLabel).includes(normalizeText(expected));
};

function buildSeedObservations(product: SeedProduct, input: PriceSearchInput): PriceObservation[] {
  const prices = Array.isArray(product.prices) ? product.prices : [];

  return prices
    .filter((item) => Number.isFinite(item.price) && matchesTerritory(item.territory, input.territory))
    .map((item) =>
      normalizePriceObservation({
        source: 'open_prices',
        productName: product.name,
        brand: product.brand,
        barcode: product.ean,
        price: item.price,
        currency: 'EUR',
        unit: 'unit',
        observedAt: item.ts,
        territory: input.territory,
        metadata: {
          fallback: 'seedProducts',
          store: item.storeName ?? 'N/A',
        },
      })
    );
}

function buildResultFromSeedProduct(product: SeedProduct | null, input: PriceSearchInput): ProviderResult {
  if (!product) {
    return {
      source: 'open_prices',
      status: 'NO_DATA',
      observations: [],
      warnings: ['Aucune donnée seed trouvée pour cette recherche.'],
    };
  }

  const observations = buildSeedObservations(product, input);
  if (observations.length === 0) {
    return {
      source: 'open_prices',
      status: 'NO_DATA',
      observations: [],
      warnings: ['Aucune observation seed pour ce territoire.'],
      productName: product.name,
    };
  }

  return {
    source: 'open_prices',
    status: 'OK',
    observations,
    warnings: [],
    productName: product.name,
  };
}

export const seedProvider: PriceProvider = {
  source: 'open_prices',
  isEnabled: () => true,
  async search(input) {
    if (input.barcode) {
      const product = (findProductByEan(input.barcode) as SeedProduct | null) ?? null;
      return buildResultFromSeedProduct(product, input);
    }

    if (input.query) {
      const [match] = (searchProductsByName(input.query) as SeedProduct[]) ?? [];
      return buildResultFromSeedProduct(match ?? null, input);
    }

    return {
      source: 'open_prices',
      status: 'NO_DATA',
      observations: [],
      warnings: ['Recherche seed ignorée: entrée vide.'],
    };
  },
};
