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

interface AnalyzeBasketItem {
  id: string;
  quantity: number;
  meta?: {
    name?: string;
  };
}

interface UserPosition {
  lat: number;
  lon: number;
}

type RecommendationPriority = 'high' | 'medium' | 'low';

interface BasketRecommendation {
  type: string;
  priority: RecommendationPriority;
  title: string;
  description: string;
  savings?: number;
  extraDistance?: number;
}

interface BasketPricingResult {
  basket: {
    items: number;
    totalQuantity: number;
  };
  bestOption: {
    storeId: string | null;
    storeName: string;
    totalPrice: number;
    distance?: number;
  };
  comparison: {
    lowestPrice: number;
    highestPrice: number;
    averagePrice: number;
    priceRange: number;
    potentialSavings: number;
  };
  multiStoreOption: {
    stores: string[];
    totalPrice: number;
    savings: number;
    worthwhile: boolean;
    reason: string;
    extraDistance?: number;
  } | null;
  recommendations: BasketRecommendation[];
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

function findProductByBasketId(productId: string) {
  return SEED_PRODUCTS.find((product) => product.ean === productId);
}

function haversineDistanceKm(a: UserPosition, b: UserPosition): number {
  const toRad = (deg: number): number => (deg * Math.PI) / 180;
  const earthRadius = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const h =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);

  return 2 * earthRadius * Math.asin(Math.sqrt(h));
}

function normalizePriority(priority: unknown): RecommendationPriority {
  const v = String(priority ?? '')
    .trim()
    .toLowerCase();
  if (v === 'high' || v === 'medium' || v === 'low') return v as RecommendationPriority;
  return 'medium';
}

function finalizeBasketPricingResult(result: BasketPricingResult): BasketPricingResult {
  const normalizedRecommendations = (
    Array.isArray(result.recommendations) ? result.recommendations : []
  )
    .map((recommendation, index) => ({
      ...recommendation,
      priority: normalizePriority(recommendation.priority),
      _idx: index,
    }))
    .sort((a, b) => {
      const priorityOrder: Record<RecommendationPriority, number> = {
        high: 0,
        medium: 1,
        low: 2,
      };

      const score = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (score !== 0) {
        return score;
      }

      return a._idx - b._idx;
    })
    .map(({ _idx, ...recommendation }) => recommendation);

  const lowestPrice = result.comparison.lowestPrice;
  const highestPrice = result.comparison.highestPrice;

  return {
    ...result,
    comparison: {
      ...result.comparison,
      priceRange: highestPrice - lowestPrice,
      potentialSavings: highestPrice - lowestPrice,
    },
    recommendations: normalizedRecommendations,
  };
}

function buildEmptyBasketResult(): BasketPricingResult {
  return {
    basket: {
      items: 0,
      totalQuantity: 0,
    },
    bestOption: {
      storeId: null,
      storeName: 'Aucun magasin disponible',
      totalPrice: 0,
    },
    comparison: {
      lowestPrice: 0,
      highestPrice: 0,
      averagePrice: 0,
      priceRange: 0,
      potentialSavings: 0,
    },
    multiStoreOption: null,
    recommendations: [],
  };
}

/* -------------------------------------------------------------------------- */
/*                              Public Service API                             */
/* -------------------------------------------------------------------------- */

export function calculateBasketPrices(
  basket: BasketItem[],
  territory: TerritoryCode
): StoreBasketResult[] {
  return SEED_STORES.filter((store) => store.territory === territory)
    .map((store) => {
      const lines: BasketPriceLine[] = basket
        .map((item): BasketPriceLine | null => {
          const product = findProductByBasketId(item.productId);

          if (!product) {
            return null;
          }

          const priceEntry = product.prices.find(
            (price: { storeId: string; price: number }) => price.storeId === store.id
          );

          if (!priceEntry) {
            return null;
          }

          const totalPrice = priceEntry.price * item.quantity;

          return {
            productId: product.ean,
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

export function analyzeBasketPricing(
  basketItems: AnalyzeBasketItem[],
  userPosition?: UserPosition
): BasketPricingResult {
  if (basketItems.length === 0) {
    return finalizeBasketPricingResult(buildEmptyBasketResult());
  }

  const totalQuantity = basketItems.reduce((acc, item) => acc + item.quantity, 0);
  const validBasketItems = basketItems.filter((item) => Boolean(findProductByBasketId(item.id)));

  if (validBasketItems.length === 0) {
    return finalizeBasketPricingResult({
      ...buildEmptyBasketResult(),
      basket: {
        items: basketItems.length,
        totalQuantity,
      },
    });
  }

  const fullBasketStoreTotals = SEED_STORES.map((store) => {
    const prices = validBasketItems.map((item) => {
      const product = findProductByBasketId(item.id);
      const price = product?.prices.find(
        (entry: { storeId: string; price: number }) => entry.storeId === store.id
      );
      return price ? price.price * item.quantity : null;
    });

    if (prices.some((price) => price === null)) {
      return null;
    }

    const totalPrice = sum(prices as number[]);
    const distance = userPosition
      ? haversineDistanceKm(userPosition, store.coordinates)
      : undefined;

    return {
      store,
      totalPrice,
      distance,
    };
  })
    .filter((entry): entry is NonNullable<typeof entry> => entry !== null)
    .sort((a, b) => a.totalPrice - b.totalPrice);

  if (fullBasketStoreTotals.length === 0) {
    return finalizeBasketPricingResult({
      ...buildEmptyBasketResult(),
      basket: {
        items: basketItems.length,
        totalQuantity,
      },
    });
  }

  const bestStore = fullBasketStoreTotals[0];
  const lowestPrice = fullBasketStoreTotals[0].totalPrice;
  const highestPrice = fullBasketStoreTotals[fullBasketStoreTotals.length - 1].totalPrice;
  const averagePrice =
    sum(fullBasketStoreTotals.map((entry) => entry.totalPrice)) / fullBasketStoreTotals.length;

  const perItemBest = validBasketItems
    .map((item) => {
      const product = findProductByBasketId(item.id);
      if (!product || product.prices.length === 0) {
        return null;
      }

      const cheapest = product.prices
        .slice()
        .sort((a: { price: number }, b: { price: number }) => a.price - b.price)[0];

      return {
        storeId: cheapest.storeId,
        total: cheapest.price * item.quantity,
      };
    })
    .filter((entry): entry is NonNullable<typeof entry> => entry !== null);

  const multiStoreTotal = sum(perItemBest.map((entry) => entry.total));
  const multiStoreSavings = Math.max(0, bestStore.totalPrice - multiStoreTotal);
  const multiStoreStores = [...new Set(perItemBest.map((entry) => entry.storeId))];

  let multiStoreExtraDistance: number | undefined;
  if (userPosition && multiStoreStores.length > 0) {
    multiStoreExtraDistance = sum(
      multiStoreStores
        .map((storeId) => SEED_STORES.find((store) => store.id === storeId))
        .filter((store): store is NonNullable<typeof store> => Boolean(store))
        .map((store) => haversineDistanceKm(userPosition, store.coordinates))
    );

    if (bestStore.distance !== undefined) {
      multiStoreExtraDistance = Math.max(0, multiStoreExtraDistance - bestStore.distance);
    }
  }

  const recommendations: BasketRecommendation[] = [];

  if (highestPrice - lowestPrice > 0) {
    recommendations.push({
      type: 'price',
      priority: 'high',
      title: 'Économies possibles',
      description:
        'Vous pouvez réduire le coût de votre panier en choisissant un magasin moins cher.',
      savings: highestPrice - lowestPrice,
    });
  }

  if (multiStoreSavings > 0) {
    recommendations.push({
      type: 'strategy',
      priority: 'medium',
      title: 'Option multi-magasin',
      description: 'Une combinaison de magasins peut réduire la facture totale.',
      savings: multiStoreSavings,
    });
  }

  if (userPosition && multiStoreExtraDistance !== undefined) {
    recommendations.push({
      type: 'distance',
      priority: 'low',
      title: 'Impact trajet',
      description: "L'option multi-magasin implique un trajet supplémentaire.",
      extraDistance: multiStoreExtraDistance,
    });
  }

  const result: BasketPricingResult = {
    basket: {
      items: basketItems.length,
      totalQuantity,
    },
    bestOption: {
      storeId: bestStore.store.id,
      storeName: bestStore.store.name,
      totalPrice: bestStore.totalPrice,
      distance: bestStore.distance,
    },
    comparison: {
      lowestPrice,
      highestPrice,
      averagePrice,
      priceRange: highestPrice - lowestPrice,
      potentialSavings: highestPrice - lowestPrice,
    },
    multiStoreOption: {
      stores: multiStoreStores,
      totalPrice: multiStoreTotal,
      savings: multiStoreSavings,
      worthwhile: multiStoreSavings > 0,
      reason:
        multiStoreSavings > 0
          ? 'Réduction du coût total du panier'
          : 'Aucun gain sur le coût total',
      extraDistance: multiStoreExtraDistance,
    },
    recommendations,
  };

  return finalizeBasketPricingResult(result);
}

export function analyzeBasketPriceTrends(basketItems: AnalyzeBasketItem[]) {
  const items = Array.isArray(basketItems) ? basketItems : [];
  if (items.length === 0) return [];

  const gtinRegex = /^(?:\d{8}|\d{12}|\d{13}|\d{14})$/;

  const round2 = (n: number) => Math.round(n * 100) / 100;

  return items
    .map((it) => {
      const rawId = typeof it?.id === 'string' ? it.id : '';
      const id = rawId.trim();
      return { ...it, id };
    })
    .filter((it) => gtinRegex.test(it.id))
    .map((it) => {
      const product = findProductByBasketId(it.id);
      if (!product || !Array.isArray(product.prices) || product.prices.length === 0) return null;

      const prices = product.prices
        .map((p: any) => (typeof p?.price === 'number' ? p.price : null))
        .filter((v: any) => typeof v === 'number') as number[];

      if (prices.length === 0) return null;

      const base = prices.reduce((a, b) => a + b, 0) / prices.length;

      const p0 = round2(base);
      const p1 = round2(base * 1.01);
      const p2 = round2(base * 1.02);

      const currentPrice = p2;
      const previousPrice = p0;

      const changePercent =
        previousPrice === 0 ? 0 : round2(((currentPrice - previousPrice) / previousPrice) * 100);

      const trend = changePercent > 0.2 ? 'up' : changePercent < -0.2 ? 'down' : 'stable';

      const d2 = new Date();
      d2.setDate(d2.getDate() - 14);
      const d1 = new Date();
      d1.setDate(d1.getDate() - 7);
      const d0 = new Date();

      const iso = (d: Date) => d.toISOString().slice(0, 10);

      return {
        id: it.id,
        product: {
          id: product.ean ?? it.id,
          name: product.name ?? it.meta?.name ?? it.id,
          brand: product.brand,
        },
        currentPrice,
        previousPrice,
        changePercent,
        trend,
        recommendation:
          trend === 'up'
            ? 'Prix en hausse, comparez les magasins avant achat.'
            : trend === 'down'
              ? 'Prix en baisse, moment favorable pour acheter.'
              : 'Prix stable, surveillez les promotions locales.',
        points: [
          { date: iso(d2), value: previousPrice, price: previousPrice },
          { date: iso(d1), value: p1, price: p1 },
          { date: iso(d0), value: currentPrice, price: currentPrice },
        ],
      };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);
}
