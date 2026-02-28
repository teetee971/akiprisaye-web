// src/services/territoryComparisonService.ts

export type TerritoryLike = string | null | undefined;
export type TerritoryScope = Set<string>;

export interface TerritoryPriceObservation {
  territory?: TerritoryLike;
  price?: number;
  pricePerUnit?: number;
  observedAt?: string;
  date?: string;
}

export interface TerritoryAverageMap {
  [territory: string]: number;
}

export interface TerritoryComparisonRow {
  territory: string;
  averagePrice: number;
  absoluteGap: number;
  relativeGap: number;
  rank: number;
}

export const DEFAULT_TERRITORY_SCOPE: TerritoryScope = new Set([
  'FR',
  'GP',
  'MQ',
  'GF',
  'RE',
  'YT',
]);

function avg(values: number[]): number {
  if (!values.length) return 0;
  let sum = 0;
  for (const v of values) sum += v;
  return sum / values.length;
}

export function normalizeTerritory(t: TerritoryLike): string | null {
  if (typeof t !== 'string') return null;
  const s = t.trim().toUpperCase();
  return s ? s : null;
}

function normalizeDate(obs: TerritoryPriceObservation): string | null {
  if (typeof obs.date === 'string' && obs.date.trim()) return obs.date.trim();
  if (typeof obs.observedAt === 'string' && obs.observedAt.trim()) {
    return obs.observedAt.trim().slice(0, 10);
  }
  return null;
}

function pickValue(obs: TerritoryPriceObservation): number | null {
  const v = typeof obs.pricePerUnit === 'number' ? obs.pricePerUnit : obs.price;
  if (typeof v !== 'number' || Number.isNaN(v)) return null;
  return v;
}

export function calculateTerritoryAverages(
  observations: TerritoryPriceObservation[],
  scope?: TerritoryScope
): TerritoryAverageMap {
  const effectiveScope = scope ?? DEFAULT_TERRITORY_SCOPE;
  const byTerr: Map<string, number[]> = new Map();

  for (const o of observations) {
    const terr = normalizeTerritory(o.territory);
    if (!terr) continue;
    if (!effectiveScope.has(terr)) continue;

    const v = pickValue(o);
    if (v === null) continue;

    if (!byTerr.has(terr)) byTerr.set(terr, []);
    byTerr.get(terr)!.push(v);
  }

  const out: TerritoryAverageMap = {};
  for (const [terr, values] of byTerr.entries()) {
    out[terr] = avg(values);
  }

  return out;
}

export function calculateTerritoryComparison(
  observations: TerritoryPriceObservation[],
  baseTerritory: string = 'FR',
  scope?: TerritoryScope
): TerritoryComparisonRow[] {
  const effectiveScope = scope ?? DEFAULT_TERRITORY_SCOPE;

  const averages = calculateTerritoryAverages(observations, effectiveScope);
  const territories = Object.keys(averages);

  if (!territories.length) return [];

  territories.sort((a, b) => averages[a] - averages[b]);

  const normalizedBase = normalizeTerritory(baseTerritory);
  const effectiveBase =
    normalizedBase && averages[normalizedBase] !== undefined
      ? normalizedBase
      : territories[0];

  const baseAvg = averages[effectiveBase];

  return territories.map((territory, index) => {
    const averagePrice = averages[territory];
    const absoluteGap = averagePrice - baseAvg;
    const relativeGap = baseAvg === 0 ? 0 : (absoluteGap / baseAvg) * 100;

    return {
      territory,
      averagePrice,
      absoluteGap,
      relativeGap,
      rank: index + 1,
    };
  });
}

export function buildTerritoryTimeSeries(
  observations: TerritoryPriceObservation[],
  scope?: TerritoryScope
): Array<Record<string, any>> {
  const effectiveScope = scope ?? DEFAULT_TERRITORY_SCOPE;

  const byDate: Map<string, Map<string, number[]>> = new Map();

  for (const o of observations) {
    const date = normalizeDate(o);
    if (!date) continue;

    const terr = normalizeTerritory(o.territory);
    if (!terr) continue;
    if (!effectiveScope.has(terr)) continue;

    const v = pickValue(o);
    if (v === null) continue;

    if (!byDate.has(date)) byDate.set(date, new Map());
    const terrMap = byDate.get(date)!;

    if (!terrMap.has(terr)) terrMap.set(terr, []);
    terrMap.get(terr)!.push(v);
  }

  const dates = Array.from(byDate.keys()).sort();

  return dates.map((date) => {
    const terrMap = byDate.get(date)!;
    const row: Record<string, any> = { date };

    for (const [terr, values] of terrMap.entries()) {
      row[terr] = avg(values);
    }

    return row;
  });
}