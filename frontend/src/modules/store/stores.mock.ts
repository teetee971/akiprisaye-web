import type { Store } from './types';

export const storesMock: Store[] = [
  {
    id: 'gp-leclerc-bas-du-fort',
    name: 'E.Leclerc Bas du Fort',
    brand: 'E.Leclerc',
    territory: 'gp',
    address: 'Bas du Fort',
    city: 'Le Gosier',
    postalCode: '97190',
    lat: 16.2148,
    lon: -61.5111,
    services: { inStore: true, drive: true, delivery: false },
  },
  {
    id: 'gp-u-baie-mahault',
    name: 'U Baie-Mahault',
    brand: 'Système U',
    territory: 'gp',
    address: 'Zone de Jarry',
    city: 'Baie-Mahault',
    postalCode: '97122',
    lat: 16.2425,
    lon: -61.5881,
    services: { inStore: true, drive: true, delivery: true },
  },
  {
    id: 'gp-super-u-sainte-anne',
    name: 'Super U Sainte-Anne',
    brand: 'Système U',
    territory: 'gp',
    city: 'Sainte-Anne',
    postalCode: '97180',
    lat: 16.2256,
    lon: -61.3862,
    services: { inStore: true, drive: false, delivery: false },
  },
  {
    id: 'gp-carrefour-destinrelles',
    name: 'Carrefour Destrellan',
    brand: 'Carrefour',
    territory: 'gp',
    city: 'Baie-Mahault',
    postalCode: '97122',
    lat: 16.2668,
    lon: -61.5849,
    services: { inStore: true, drive: true, delivery: true },
  },
];

// TODO(api): remplacer la source mock par une source API/KV (Cloudflare Functions)
// export interface StoreProvider { listStores(territory?: string): Promise<Store[]> }
