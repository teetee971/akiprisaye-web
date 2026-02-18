import { SEED_PRODUCTS } from '../data/seedProducts';
import { SEED_STORES } from '../data/seedStores';
import type { Territory } from '../types/territory';

type PriceComparison = 'lower' | 'equal' | 'higher';

type SeedPrice = {
  storeId?: string;
  price?: number;
  territory?: string;
  ts?: string;
};

type SeedProduct = {
  ean?: string;
  name?: string;
  brand?: string;
  size?: string;
  category?: string;
  prices?: SeedPrice[];
};

type SeedStore = {
  id?: string;
  territory?: Territory;
};

export interface CheapestProduct {
  id: string;
  name: string;
  brand: string;
  size: string;
  category: string;
  price: number;
  observationDate: string;
  territoryAverage?: number;
  priceComparison: PriceComparison;
  savingsPercent?: number;
  isCheapestInTerritory: boolean;
}

function normalizeTerritory(value: string | undefined): Territory | undefined {
  if (!value) return undefined;
  const normalized = value.toLowerCase();
  if (normalized.includes('guadeloupe')) return 'gp';
  if (normalized.includes('martinique')) return 'mq';
  if (normalized.includes('guyane')) return 'gf';
  if (normalized.includes('réunion') || normalized.includes('reunion')) return 're';
  if (normalized.includes('mayotte')) return 'yt';
  return undefined;
}

function toComparison(price: number, average?: number): PriceComparison {
  if (typeof average !== 'number' || !Number.isFinite(average)) {
    return 'equal';
  }

  const diff = price - average;
  if (Math.abs(diff) < 0.01) return 'equal';
  return diff < 0 ? 'lower' : 'higher';
}

export function getCheapestProductsAtStore(storeId: string, limit = 10): CheapestProduct[] {
  const products = SEED_PRODUCTS as SeedProduct[];
  const stores = SEED_STORES as SeedStore[];
  const store = stores.find((entry) => entry.id === storeId);
  const storeTerritory = store?.territory;

  const result = products
    .map((product) => {
      const prices = product.prices ?? [];
      const currentStorePrice = prices.find((price) => price.storeId === storeId && typeof price.price === 'number');
      if (!currentStorePrice || typeof currentStorePrice.price !== 'number') {
        return null;
      }

      const territoryPrices = prices
        .filter((price) => typeof price.price === 'number')
        .filter((price) => {
          if (!storeTerritory) return true;
          return normalizeTerritory(price.territory) === storeTerritory;
        })
        .map((price) => price.price as number);

      const territoryAverage = territoryPrices.length > 0
        ? territoryPrices.reduce((sum, value) => sum + value, 0) / territoryPrices.length
        : undefined;
      const territoryMin = territoryPrices.length > 0 ? Math.min(...territoryPrices) : currentStorePrice.price;
      const savingsPercent = territoryAverage && territoryAverage > 0
        ? Number((((territoryAverage - currentStorePrice.price) / territoryAverage) * 100).toFixed(1))
        : undefined;

      return {
        id: product.ean ?? product.name ?? 'inconnu',
        name: product.name ?? 'Produit',
        brand: product.brand ?? 'Marque',
        size: product.size ?? 'n/d',
        category: product.category ?? 'divers',
        price: currentStorePrice.price,
        observationDate: currentStorePrice.ts ?? new Date().toISOString(),
        territoryAverage,
        priceComparison: toComparison(currentStorePrice.price, territoryAverage),
        savingsPercent,
        isCheapestInTerritory: Math.abs(currentStorePrice.price - territoryMin) < 0.01,
      } as CheapestProduct;
    })
    .filter((entry): entry is CheapestProduct => Boolean(entry))
    .sort((a, b) => a.price - b.price)
    .slice(0, limit);

  return result;
}

export function getPriceComparisonIcon(comparison: PriceComparison): string {
  if (comparison === 'lower') return '↓';
  if (comparison === 'higher') return '↑';
  return '=';
}

export function getPriceComparisonColor(comparison: PriceComparison): string {
  if (comparison === 'lower') return 'text-green-400';
  if (comparison === 'higher') return 'text-amber-400';
  return 'text-blue-400';
}

export function formatObservationDate(dateISO: string): string {
  const date = new Date(dateISO);
  if (Number.isNaN(date.getTime())) {
    return 'date inconnue';
  }

  return date.toLocaleDateString('fr-FR');
}

export function calculateDataReliability(observationsCount: number): 'high' | 'medium' | 'low' {
  if (observationsCount >= 20) return 'high';
  if (observationsCount >= 8) return 'medium';
  return 'low';
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
  const stores = (SEED_STORES as Array<{ id?: string; name?: string; territory?: Territory }>).filter(
    (store) => store.territory === territory
  );

  const products = SEED_PRODUCTS as Array<{ ean?: string; name?: string; prices?: SeedPrice[] }>;

  const results: CheapestProductResult[] = [];

  for (const store of stores) {
    if (!store.id || !store.name) continue;
    let cheapest: CheapestProductResult | null = null;

    for (const product of products) {
      const priceEntry = product.prices?.find(
        (price) => price.storeId === store.id && normalizeTerritory(price.territory) === territory && typeof price.price === 'number'
      );

      if (!priceEntry || typeof priceEntry.price !== 'number') {
        continue;
      }

      if (!cheapest || priceEntry.price < cheapest.price) {
        cheapest = {
          productId: product.ean ?? product.name ?? 'unknown',
          productName: product.name ?? 'Produit',
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
