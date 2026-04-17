import { SEED_PRODUCTS } from '../data/seedProducts';
import { SEED_STORES } from '../data/seedStores';

export type Territory =
  | 'Guadeloupe'
  | 'Martinique'
  | 'Guyane'
  | 'La Réunion'
  | 'Mayotte'
  | 'Saint-Pierre-et-Miquelon'
  | 'Saint-Barthélemy'
  | 'Saint-Martin';

interface ProductPrice {
  storeId: string;
  price: number;
  territory: Territory;
}

interface Product {
  id?: string;
  ean?: string;
  name: string;
  prices: ProductPrice[];
}

interface Store {
  id: string;
  name: string;
  territory: Territory;
}

export interface CheapestProductResult {
  productId: string;
  productName: string;
  storeId: string;
  storeName: string;
  price: number;
  territory: Territory;
}

/** Extended product record used by StoreCheapestProductsPanel / CheapestProductsSection */
export interface CheapestProduct {
  id: string;
  name: string;
  brand?: string;
  size?: string;
  category?: string;
  price: number;
  savingsPercent?: number;
  isCheapestInTerritory?: boolean;
  observationDate: string;
  territoryAverage?: number;
  priceComparison?: string;
}

/** Aggregated cheapest-products data for a given store */
export interface CheapestByStore {
  store: {
    id: string;
    name: string;
    chain?: string;
    territory: string;
    address?: string;
    postalCode?: string;
    city?: string;
  };
  cheapestProducts: CheapestProduct[];
  lastObservation: string;
}

export function getStoreCheapestProducts(territory: Territory): CheapestProductResult[] {
  const stores = (SEED_STORES as Store[]).filter((store) => store.territory === territory);
  const products = SEED_PRODUCTS as readonly Product[];
  const results: CheapestProductResult[] = [];

  for (const store of stores) {
    let cheapest: CheapestProductResult | null = null;

    for (const product of products) {
      const priceEntry = product.prices.find(
        (price) => price.storeId === store.id && price.territory === territory
      );
      if (!priceEntry) continue;

      if (!cheapest || priceEntry.price < cheapest.price) {
        cheapest = {
          productId: product.id ?? product.ean ?? `${store.id}:${product.name}`,
          productName: product.name,
          storeId: store.id,
          storeName: store.name,
          price: priceEntry.price,
          territory,
        };
      }
    }

    if (cheapest) results.push(cheapest);
  }

  return results;
}

export function getCheapestProductsAtStore(storeId: string, limit = 10): CheapestProductResult[] {
  const store = (SEED_STORES as Store[]).find((s) => s.id === storeId);
  if (!store) return [];

  const products = SEED_PRODUCTS as readonly Product[];
  return products
    .map((product) => {
      const priceEntry = product.prices
        .filter((price) => price.storeId === storeId)
        .sort((a, b) => a.price - b.price)[0];
      if (!priceEntry) return null;
      return {
        productId: product.id ?? product.ean ?? `${storeId}:${product.name}`,
        productName: product.name,
        storeId,
        storeName: store.name,
        price: priceEntry.price,
        territory: priceEntry.territory,
      } satisfies CheapestProductResult;
    })
    .filter((v): v is CheapestProductResult => Boolean(v))
    .sort((a, b) => a.price - b.price)
    .slice(0, limit);
}

export function calculateDataReliability(products: CheapestProductResult[]): number {
  if (products.length === 0) return 0;
  const withPrice = products.filter((p) => Number.isFinite(p.price) && p.price > 0).length;
  return Math.round((withPrice / products.length) * 100);
}

/** Returns how many cheapest products are tracked at a given store */
export function getCheapestProductsCount(storeId: string): number {
  return getCheapestProductsAtStore(storeId).length;
}

/** Returns CheapestByStore aggregation for the panel, or null if store not found */
export function getCheapestProductsByStore(storeId: string): CheapestByStore | null {
  const storeData = (
    SEED_STORES as (Store & {
      chain?: string;
      address?: string;
      postalCode?: string;
      city?: string;
    })[]
  ).find((s) => s.id === storeId);
  if (!storeData) return null;

  const products = getCheapestProductsAtStore(storeId, 20);
  return {
    store: {
      id: storeData.id,
      name: storeData.name,
      chain: storeData.chain,
      territory: storeData.territory,
      address: storeData.address,
      postalCode: storeData.postalCode,
      city: storeData.city,
    },
    cheapestProducts: products.map((p) => ({
      id: p.productId,
      name: p.productName,
      price: p.price,
      observationDate: new Date().toISOString(),
    })),
    lastObservation: new Date().toISOString(),
  };
}

/** Formats an ISO observation date string into a human-readable date */
export function formatObservationDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

/** Returns a visual icon for the given price comparison label */
export function getPriceComparisonIcon(comparison?: string): string {
  if (!comparison) return '→';
  if (comparison === 'below' || comparison === 'cheaper') return '↓';
  if (comparison === 'above' || comparison === 'expensive') return '↑';
  return '→';
}

/** Returns a Tailwind CSS color class for the given price comparison label */
export function getPriceComparisonColor(comparison?: string): string {
  if (!comparison) return 'text-gray-400';
  if (comparison === 'below' || comparison === 'cheaper') return 'text-green-400';
  if (comparison === 'above' || comparison === 'expensive') return 'text-red-400';
  return 'text-gray-400';
}
