import { SEED_PRODUCTS } from '../data/seedProducts';
import { SEED_STORES } from '../data/seedStores';
import type { Territory } from '../types/territory';

interface ProductPrice {
  storeId: string;
  price: number;
  territory: Territory;
}

interface Product {
  id: string;
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

/**
 * Return the cheapest product for each store in a given territory
 */
export function getStoreCheapestProducts(
  territory: Territory
): CheapestProductResult[] {
  const stores: Store[] = SEED_STORES.filter(
    (store: Store) => store.territory === territory
  );

  const products = SEED_PRODUCTS as readonly Product[];

  const results: CheapestProductResult[] = [];

  for (const store of stores) {
    let cheapest: CheapestProductResult | null = null;

    for (const product of products) {
      const priceEntry = product.prices.find(
        (price: ProductPrice) =>
          price.storeId === store.id &&
          price.territory === territory
      );

      if (!priceEntry) {
        continue;
      }

      if (!cheapest || priceEntry.price < cheapest.price) {
        cheapest = {
          productId: product.id,
          productName: product.name,
          storeId: store.id,
          storeName: store.name,
          price: priceEntry.price,
          territory,
        };
      }
    }

    if (cheapest) {
      results.push(cheapest);
    }
  }

  return results;
}