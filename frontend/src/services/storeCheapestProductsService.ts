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

export function getStoreCheapestProducts(territory: Territory): CheapestProductResult[] {
  const stores = (SEED_STORES as Store[]).filter((store) => store.territory === territory);
  const products = SEED_PRODUCTS as readonly Product[];
  const results: CheapestProductResult[] = [];

  for (const store of stores) {
    let cheapest: CheapestProductResult | null = null;

    for (const product of products) {
      const priceEntry = product.prices.find((price) => price.storeId === store.id && price.territory === territory);
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
