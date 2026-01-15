import type { PriceObservation, TerritoryCode } from '../types/priceObservation';

export interface TerritoryComparisonMetric {
  territory: TerritoryCode;
  averagePrice: number;
  absoluteGap: number;
  relativeGap: number;
  rank: number;
}

export interface TerritoryTimeSeriesPoint {
  date: string;
  [territory: string]: string | number | undefined;
}

const TERRITORIES: TerritoryCode[] = ['GP', 'MQ', 'GF', 'RE', 'FR'];

function normalizeDate(isoDate: string): string {
  return isoDate.split('T')[0] ?? isoDate;
}

function filterByTerritory(observations: PriceObservation[]): PriceObservation[] {
  return observations.filter((obs) => TERRITORIES.includes(obs.territory as TerritoryCode));
}

export function calculateTerritoryAverages(
  observations: PriceObservation[]
): Record<TerritoryCode, number> {
  const sums = new Map<TerritoryCode, { total: number; count: number }>();

  filterByTerritory(observations).forEach((obs) => {
    const territory = obs.territory as TerritoryCode;
    const current = sums.get(territory) ?? { total: 0, count: 0 };
    sums.set(territory, {
      total: current.total + obs.price,
      count: current.count + 1
    });
  });

  const averages: Record<TerritoryCode, number> = {} as Record<TerritoryCode, number>;
  sums.forEach((value, territory) => {
    averages[territory] = value.total / value.count;
  });

  return averages;
}

export function calculateTerritoryComparison(
  observations: PriceObservation[],
  baseTerritory: TerritoryCode = 'FR'
): TerritoryComparisonMetric[] {
  const averages = calculateTerritoryAverages(observations);
  const entries = Object.entries(averages) as Array<[TerritoryCode, number]>;

  if (entries.length === 0) {
    return [];
  }

  const baseAverage =
    averages[baseTerritory] !== undefined
      ? averages[baseTerritory]
      : Math.min(...entries.map(([, avg]) => avg));

  const ranked = entries
    .sort((a, b) => a[1] - b[1])
    .map(([territory, averagePrice], index) => ({
      territory,
      averagePrice,
      absoluteGap: averagePrice - baseAverage,
      relativeGap: baseAverage > 0 ? ((averagePrice - baseAverage) / baseAverage) * 100 : 0,
      rank: index + 1
    }));

  return ranked;
}

export function buildTerritoryTimeSeries(
  observations: PriceObservation[]
): TerritoryTimeSeriesPoint[] {
  const byDate = new Map<string, Map<TerritoryCode, { total: number; count: number }>>();

  filterByTerritory(observations).forEach((obs) => {
    const territory = obs.territory as TerritoryCode;
    const dateKey = normalizeDate(obs.observedAt);
    if (!byDate.has(dateKey)) {
      byDate.set(dateKey, new Map());
    }
    const territoryMap = byDate.get(dateKey);
    if (!territoryMap) return;
    const current = territoryMap.get(territory) ?? { total: 0, count: 0 };
    territoryMap.set(territory, {
      total: current.total + obs.price,
      count: current.count + 1
    });
  });

  const sortedDates = Array.from(byDate.keys()).sort((a, b) => (a < b ? -1 : 1));

  return sortedDates.map((date) => {
    const territoryMap = byDate.get(date);
    if (!territoryMap) {
      return { date };
    }
    const point: TerritoryTimeSeriesPoint = { date };

    TERRITORIES.forEach((territory) => {
      const entry = territoryMap.get(territory);
      if (entry) {
        point[territory] = entry.total / entry.count;
      }
    });

    return point;
  });
}
