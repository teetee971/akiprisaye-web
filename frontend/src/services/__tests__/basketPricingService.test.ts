import { describe, it, expect } from 'vitest';
import { calculateBasketPrices } from '../basketPricingService';

vi.mock('../../data/seedStores', () => ({
  SEED_STORES: [
    {
      id: 'store-a',
      name: 'Store A',
      territory: 'GP',
    },
    {
      id: 'store-b',
      name: 'Store B',
      territory: 'GP',
    },
    {
      id: 'store-fr',
      name: 'Store FR',
      territory: 'FR',
    },
  ],
}));

vi.mock('../../data/seedProducts', () => ({
  SEED_PRODUCTS: [
    {
      id: 'prod-1',
      prices: [
        { storeId: 'store-a', price: 2.5 },
        { storeId: 'store-b', price: 3.0 },
      ],
    },
    {
      id: 'prod-2',
      prices: [
        { storeId: 'store-a', price: 1.0 },
        { storeId: 'store-b', price: 1.8 },
      ],
    },
  ],
}));

describe('basketPricingService.calculateBasketPrices', () => {
  it('returns only stores for the requested territory', () => {
    const basket = [{ productId: 'prod-1', quantity: 1 }];

    const results = calculateBasketPrices(basket, 'GP');

    expect(results).toHaveLength(2);
    expect(results.every((s) => s.territory === 'GP')).toBe(true);
  });

  it('computes line totals and basket totals per store', () => {
    const basket = [
      { productId: 'prod-1', quantity: 2 },
      { productId: 'prod-2', quantity: 3 },
    ];

    const results = calculateBasketPrices(basket, 'GP');
    const storeA = results.find((s) => s.storeId === 'store-a');

    expect(storeA).toBeDefined();
    expect(storeA?.lines).toEqual([
      { productId: 'prod-1', unitPrice: 2.5, quantity: 2, totalPrice: 5.0 },
      { productId: 'prod-2', unitPrice: 1.0, quantity: 3, totalPrice: 3.0 },
    ]);
    expect(storeA?.total).toBe(8.0);
  });

  it('sorts stores by ascending total price', () => {
    const basket = [{ productId: 'prod-1', quantity: 1 }];

    const results = calculateBasketPrices(basket, 'GP');

    expect(results.map((r) => r.storeId)).toEqual(['store-a', 'store-b']);
    expect(results[0].total).toBeLessThanOrEqual(results[1].total);
  });

  it('ignores unknown products and missing store prices', () => {
    const basket = [
      { productId: 'unknown', quantity: 2 },
      { productId: 'prod-2', quantity: 1 },
    ];

    const results = calculateBasketPrices(basket, 'GP');

    expect(results[0].lines).toEqual([
      { productId: 'prod-2', unitPrice: 1.0, quantity: 1, totalPrice: 1.0 },
    ]);
    expect(results[1].lines).toEqual([
      { productId: 'prod-2', unitPrice: 1.8, quantity: 1, totalPrice: 1.8 },
    ]);
  });
});
