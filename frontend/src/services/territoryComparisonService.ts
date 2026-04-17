// src/services/territoryComparisonService.ts

export interface PriceObservation {
  price: number;
  pricePerUnit?: number;
  productName?: string;
  category?: string;
}

export interface TerritoryComparisonResult {
  territoryA: string;
  territoryB: string;
  averageA: number;
  averageB: number;
  deltaValue: number;
  deltaPercent: number;
  cheaperTerritory: string;
}

async function loadTerritory(territory: string): Promise<PriceObservation[]> {
  const res = await fetch(`${import.meta.env.BASE_URL}data/territories/${territory}.json`, {
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`Territory not found: ${territory}`);
  return res.json();
}

function average(values: number[]) {
  return values.reduce((a, b) => a + b, 0) / Math.max(values.length, 1);
}

export async function compareTerritories(
  territoryA: string,
  territoryB: string
): Promise<TerritoryComparisonResult> {
  const [dataA, dataB] = await Promise.all([loadTerritory(territoryA), loadTerritory(territoryB)]);

  const pricesA = dataA.map((p) => p.pricePerUnit ?? p.price).filter(Boolean);
  const pricesB = dataB.map((p) => p.pricePerUnit ?? p.price).filter(Boolean);

  const avgA = average(pricesA);
  const avgB = average(pricesB);

  const deltaValue = avgA - avgB;
  const deltaPercent = avgB === 0 ? 0 : (deltaValue / avgB) * 100;

  return {
    territoryA,
    territoryB,
    averageA: avgA,
    averageB: avgB,
    deltaValue,
    deltaPercent,
    cheaperTerritory: avgA < avgB ? territoryA : territoryB,
  };
}
