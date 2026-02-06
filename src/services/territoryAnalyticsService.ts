// src/services/territoryAnalyticsService.ts

export interface PriceObservation {
  price: number;
  productName?: string;
  brand?: string;
  store?: string;
  category?: string;
  pricePerUnit?: number;
}

export interface TerritoryAnalytics {
  averagePrice: number;
  inflationIndex: number;
  topIncreases: PriceObservation[];
  topDecreases: PriceObservation[];
  cheapestStores: { store: string; avgPrice: number }[];
  mostExpensiveStores: { store: string; avgPrice: number }[];
}

const cache = new Map<string, TerritoryAnalytics>();

async function loadTerritoryData(territory: string): Promise<PriceObservation[]> {
  const res = await fetch(`/data/territories/${territory}.json`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Territory data not found: ${territory}`);
  return res.json();
}

function average(values: number[]) {
  return values.reduce((a, b) => a + b, 0) / Math.max(values.length, 1);
}

export async function getTerritoryAnalytics(
  territory: string
): Promise<TerritoryAnalytics> {
  if (cache.has(territory)) {
    return cache.get(territory)!;
  }

  const data = await loadTerritoryData(territory);

  const prices = data.map(p => p.pricePerUnit ?? p.price).filter(Boolean);
  const avgPrice = average(prices);

  const inflationIndex = Math.min(
    100,
    Math.round((avgPrice / 10) * 100)
  );

  const sorted = [...data].sort(
    (a, b) => (b.pricePerUnit ?? b.price) - (a.pricePerUnit ?? a.price)
  );

  const topIncreases = sorted.slice(0, 5);
  const topDecreases = sorted.slice(-5).reverse();

  const storeMap: Record<string, number[]> = {};
  data.forEach(p => {
    if (!p.store) return;
    if (!storeMap[p.store]) storeMap[p.store] = [];
    storeMap[p.store].push(p.pricePerUnit ?? p.price);
  });

  const storeStats = Object.entries(storeMap).map(([store, values]) => ({
    store,
    avgPrice: average(values),
  }));

  const cheapestStores = [...storeStats]
    .sort((a, b) => a.avgPrice - b.avgPrice)
    .slice(0, 3);

  const mostExpensiveStores = [...storeStats]
    .sort((a, b) => b.avgPrice - a.avgPrice)
    .slice(0, 3);

  const result: TerritoryAnalytics = {
    averagePrice: avgPrice,
    inflationIndex,
    topIncreases,
    topDecreases,
    cheapestStores,
    mostExpensiveStores,
  };

  cache.set(territory, result);
  return result;
}