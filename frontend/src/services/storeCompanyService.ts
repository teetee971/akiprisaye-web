import { SEED_STORES } from '../data/seedStores';
import { getCompanyById } from './companyRegistryService';
import type { Company } from '../types/company';

export type Territory =
  | 'Guadeloupe'
  | 'Martinique'
  | 'Guyane'
  | 'La Réunion'
  | 'Mayotte'
  | 'Saint-Pierre-et-Miquelon'
  | 'Saint-Barthélemy'
  | 'Saint-Martin';

export interface StoreCompany {
  id: string;
  name: string;
  territory: Territory;
  company?: string;
}

export type StoreWithCompany = StoreCompany & {
  chain?: string;
  city?: string;
  address?: string;
  postalCode?: string;
  phone?: string;
  openingHours?: string;
  services?: string[];
  coordinates?: { lat: number; lon: number };
  companyId?: string;
  companyData?: Company | null;
  company?: Company | string;
  isCompanyActive?: boolean;
};

export interface StoreCompanyResult {
  company: string;
  stores: StoreCompany[];
  territory: Territory;
}

export function getStoresByCompany(territory: Territory): StoreCompanyResult[] {
  const stores = (SEED_STORES as StoreCompany[]).filter((store) => store.territory === territory);
  const companyMap: Record<string, StoreCompany[]> = {};

  for (const store of stores) {
    const companyName = store.company && store.company.trim().length > 0 ? store.company : 'Indépendant';
    if (!companyMap[companyName]) {
      companyMap[companyName] = [];
    }
    companyMap[companyName].push(store);
  }

  return Object.entries(companyMap).map(([company, companyStores]) => ({
    company,
    stores: companyStores,
    territory,
  }));
}

export function getStoreWithCompany(storeId: string): StoreWithCompany | null {
  const store = (SEED_STORES as StoreWithCompany[]).find((s) => s.id === storeId);
  if (!store) return null;

  const companyData = store.companyId ? getCompanyById(store.companyId) : null;
  return {
    ...store,
    company: companyData ?? store.company,
    companyData,
    isCompanyActive: companyData ? companyData.activityStatus === 'ACTIVE' : undefined,
  };
}
