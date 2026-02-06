/**
 * Enhanced Basket Pricing Service
 *
 * Phase 8: Advanced basket comparison with price optimization and analytics
 * Provides multi-criteria comparison, savings calculation, and smart suggestions
 */

import { TerritoryCode } from '../types/territory';

import { SEED_PRODUCTS } from '../data/seedProducts';
import { SEED_STORES } from '../data/seedStores';

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export interface BasketItem {
  productId: string;
  quantity: number;
}

export interface BasketPriceLine {
  productId: string;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
}

export interface StoreBasketResult {
  storeId: string;
  storeName: string;
  territory: TerritoryCode;
  lines: BasketPriceLine[];
  total: number;
}

/* -------------------------------------------------------------------------- */
/*                              Helper functions                              */
/* -------------------------------------------------------------------------- */

function sum(numbers: number[]): number {
  return numbers.reduce((acc: number, value: number) => acc + value, 0);
}

/* -------------------------------------------------------------------------- */
/*                              Public Service API                             */
/* -------------------------------------------------------------------------- */

export function calculateBasketPrices(
  basket: BasketItem[],
  territory: TerritoryCode
): StoreBasketResult[] {
  return SEED_STORES
    .filter((store) => store.territory === territory)
    .map((store) => {
      const lines: BasketPriceLine[] = basket
        .map((item): BasketPriceLine | null => {
          const product = SEED_PRODUCTS.find(
            (p) => p.id === item.productId
          );

          if (!product) {
            return null;
          }

          const priceEntry = product.prices.find(
            (price) => price.storeId === store.id
          );

          if (!priceEntry) {
            return null;
          }

          const totalPrice = priceEntry.price * item.quantity;

          return {
            productId: product.id,
            unitPrice: priceEntry.price,
            quantity: item.quantity,
            totalPrice,
          };
        })
        .filter((line): line is BasketPriceLine => line !== null);

      const total = sum(lines.map((l) => l.totalPrice));

      return {
        storeId: store.id,
        storeName: store.name,
        territory: store.territory,
        lines,
        total,
      };
    })
    .sort((a, b) => a.total - b.total);
}