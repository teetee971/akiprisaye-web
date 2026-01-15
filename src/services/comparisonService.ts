/**
 * src/services/comparisonService.ts
 *
 * Fonctions pures pour comparaison entre enseignes à partir des observations du catalogue.
 *
 * - group by store
 * - pick latest observation per store (par date)
 * - sort by price asc
 */

export type Observation = { date: string; price: number; store: string };
export type LatestByStore = { store: string; price: number; date: string };
export type ComparisonResult = {
  list: LatestByStore[]; // trié par price asc
  best?: LatestByStore | null;
};

export function computeComparison(observations: Observation[]): ComparisonResult {
  if (!observations || observations.length === 0) {
    return { list: [], best: null };
  }

  const map = new Map<string, LatestByStore>();
  for (const o of observations) {
    const existing = map.get(o.store);
    if (!existing) {
      map.set(o.store, { store: o.store, price: o.price, date: o.date });
    } else {
      if (new Date(o.date).getTime() > new Date(existing.date).getTime()) {
        map.set(o.store, { store: o.store, price: o.price, date: o.date });
      }
    }
  }

  const list = Array.from(map.values()).sort((a, b) => a.price - b.price);
  const best = list.length ? list[0] : null;
  return { list, best };
}

export default { computeComparison };
