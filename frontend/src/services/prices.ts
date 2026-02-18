import { SEED_PRODUCTS } from '../data/seedProducts';
import { SEED_STORES } from '../data/seedStores';
import type { ProductOffer, ProductPriceStats, Store } from '../types/store';
import type { Territory } from '../types/territory';

type SeedPrice = {
  storeId?: string;
  storeName?: string;
  territory?: string;
  city?: string;
  price?: number;
  currency?: string;
  ts?: string;
};

type SeedProduct = {
  ean?: string;
  prices?: SeedPrice[];
};

type SeedStore = {
  id?: string;
  name?: string;
  chain?: string;
  companyId?: string;
  territory?: Territory;
  address?: string;
  city?: string;
  postalCode?: string;
  coordinates?: { lat?: number; lon?: number };
  phone?: string;
  openingHours?: string;
  services?: string[];
};

function toStore(seedStore: SeedStore): Store | null {
  if (!seedStore.id || !seedStore.name) {
    return null;
  }

  return {
    id: seedStore.id,
    name: seedStore.name,
    brand: seedStore.chain,
    groupId: seedStore.companyId,
    territory: seedStore.territory,
    address: seedStore.address,
    city: seedStore.city,
    postalCode: seedStore.postalCode,
    location: (() => {
      const lat = seedStore.coordinates?.lat;
      const lon = seedStore.coordinates?.lon;
      return typeof lat === 'number' && typeof lon === 'number' ? { lat, lng: lon } : undefined;
    })(),
    phone: seedStore.phone,
    openingHours: seedStore.openingHours,
    tags: seedStore.services,
    updatedAt: undefined,
  };
}

function asTerritory(value: string | undefined): Territory | undefined {
  if (!value) {
    return undefined;
  }

  const normalized = value.trim().toLowerCase();
  if (normalized.includes('guadeloupe')) return 'gp';
  if (normalized.includes('martinique')) return 'mq';
  if (normalized.includes('guyane')) return 'gf';
  if (normalized.includes('réunion') || normalized.includes('reunion')) return 're';
  if (normalized.includes('mayotte')) return 'yt';
  if (normalized.includes('france')) return 'fr';

  return undefined;
}

export function computePriceStats(offers: ProductOffer[]): ProductPriceStats | null {
  if (offers.length === 0) {
    return null;
  }

  const sorted = [...offers].map((offer) => offer.price).sort((a, b) => a - b);
  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  const middle = Math.floor(sorted.length / 2);
  const median = sorted.length % 2 === 0
    ? (sorted[middle - 1] + sorted[middle]) / 2
    : sorted[middle];

  return {
    min,
    max,
    median,
    observations: offers.length,
  };
}

export async function getOffersForProduct(params: {
  barcode: string;
  territory?: Territory;
}): Promise<ProductOffer[]> {
  const seedProducts = SEED_PRODUCTS as SeedProduct[];
  const product = seedProducts.find((entry) => entry.ean === params.barcode);
  if (!product?.prices) {
    return [];
  }

  const offers = product.prices
    .filter((price) => typeof price.price === 'number')
    .map((price) => {
      return {
        barcode: params.barcode,
        price: price.price as number,
        observedAt: price.ts,
        currency: price.currency ?? 'EUR',
        reliability: 'medium' as const,
        storeId: price.storeId,
        storeName: price.storeName,
        territory: asTerritory(price.territory),
        city: price.city,
      };
    })
    .filter((offer) => !params.territory || offer.territory === params.territory)
    .sort((a, b) => a.price - b.price);

  return offers;
}

export async function getStore(storeId: string): Promise<Store | null> {
  const seedStores = SEED_STORES as SeedStore[];
  const seedStore = seedStores.find((store) => store.id === storeId);
  if (!seedStore) {
    return null;
  }

  return toStore(seedStore);
}
