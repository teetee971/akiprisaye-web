import { promosDataset } from '../data/promos';
import type { Promo, TerritoryCode } from '../types/market';

export type PromoSort = 'discountDesc' | 'endDateAsc';

export interface GetPromosParams {
  territory: TerritoryCode;
  storeId?: string;
  mode?: Promo['mode'];
}

export function sortPromos(promos: Promo[], sort: PromoSort): Promo[] {
  const next = [...promos];

  if (sort === 'discountDesc') {
    return next.sort((a, b) => (b.discountPct ?? 0) - (a.discountPct ?? 0));
  }

  return next.sort((a, b) => {
    const aTime = a.validTo ? new Date(a.validTo).getTime() : Number.POSITIVE_INFINITY;
    const bTime = b.validTo ? new Date(b.validTo).getTime() : Number.POSITIVE_INFINITY;
    return aTime - bTime;
  });
}

export function getPromos({ territory, storeId, mode }: GetPromosParams): Promo[] {
  return promosDataset.filter((promo) => {
    if (promo.territory !== territory) return false;
    if (storeId && promo.storeId !== storeId) return false;
    if (mode && promo.mode !== mode) return false;
    return true;
  });
}
