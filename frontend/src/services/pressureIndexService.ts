// src/services/pressureIndexService.ts

export interface PriceObservation {
  price: number;
  pricePerUnit?: number;
}

export interface TerritoryPressureIndex {
  territory: string;
  averagePrice: number;
  index: number;
  level: 'FAIBLE' | 'MODÉRÉE' | 'ÉLEVÉE' | 'CRITIQUE';
}

const TERRITORIES = ['guadeloupe', 'martinique', 'guyane', 'reunion'];

async function loadTerritory(territory: string): Promise<PriceObservation[]> {
  const res = await fetch(`${import.meta.env.BASE_URL}data/territories/${territory}.json`, {
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`Territory not found: ${territory}`);
  return res.json();
}

function avg(values: number[]) {
  return values.reduce((a, b) => a + b, 0) / Math.max(values.length, 1);
}

function classify(index: number): TerritoryPressureIndex['level'] {
  if (index < 95) return 'FAIBLE';
  if (index < 105) return 'MODÉRÉE';
  if (index < 120) return 'ÉLEVÉE';
  return 'CRITIQUE';
}

export async function computePressureIndex(): Promise<TerritoryPressureIndex[]> {
  const datasets = await Promise.all(
    TERRITORIES.map(t => loadTerritory(t))
  );

  const averages = datasets.map(data =>
    avg(data.map(p => p.pricePerUnit ?? p.price).filter(Boolean))
  );

  const globalAverage = avg(averages);

  return TERRITORIES.map((territory, i) => {
    const index = (averages[i] / globalAverage) * 100;
    return {
      territory,
      averagePrice: averages[i],
      index,
      level: classify(index),
    };
  });
}