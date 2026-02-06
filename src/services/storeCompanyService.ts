import { SEED_STORES } from '../data/seedStores';
import type { Territory } from '../types/territory';

export interface StoreCompany {
  id: string;
  name: string;
  territory: Territory;
  company?: string;
}

export interface StoreCompanyResult {
  company: string;
  stores: StoreCompany[];
  territory: Territory;
}

/**
 * Group stores by company for a given territory
 */
export function getStoresByCompany(
  territory: Territory
): StoreCompanyResult[] {
  const stores: StoreCompany[] = SEED_STORES.filter(
    (store: StoreCompany) => store.territory === territory
  );

  const companyMap: Record<string, StoreCompany[]> = {};

  for (const store of stores) {
    const companyName =
      store.company && store.company.trim().length > 0
        ? store.company
        : 'Indépendant';

    if (!companyMap[companyName]) {
      companyMap[companyName] = [];
    }

    companyMap[companyName].push(store);
  }

  return Object.entries(companyMap).map(
    ([company, companyStores]) => ({
      company,
      stores: companyStores,
      territory,
    })
  );
}