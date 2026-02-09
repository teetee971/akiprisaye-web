import type { TerritoryCode } from '../constants/territories';

export type ObservatoireTerritoryStat = {
  code: TerritoryCode;
  priceIndex: number;
  inflationYoY: number;
  panierMoyen: number;
  updatedAt: string;
  sampleSize: number;
};

export const OBSERVATOIRE_TERRITORY_STATS: ObservatoireTerritoryStat[] = [
  {
    code: 'gp',
    priceIndex: 113,
    inflationYoY: 4.2,
    panierMoyen: 138.4,
    updatedAt: '2025-02-01',
    sampleSize: 410,
  },
  {
    code: 'mq',
    priceIndex: 111,
    inflationYoY: 3.9,
    panierMoyen: 134.9,
    updatedAt: '2025-02-01',
    sampleSize: 392,
  },
  {
    code: 'gf',
    priceIndex: 118,
    inflationYoY: 4.8,
    panierMoyen: 149.6,
    updatedAt: '2025-02-01',
    sampleSize: 276,
  },
  {
    code: 're',
    priceIndex: 109,
    inflationYoY: 3.4,
    panierMoyen: 131.2,
    updatedAt: '2025-02-01',
    sampleSize: 512,
  },
  {
    code: 'yt',
    priceIndex: 121,
    inflationYoY: 5.1,
    panierMoyen: 156.8,
    updatedAt: '2025-02-01',
    sampleSize: 198,
  },
  {
    code: 'pf',
    priceIndex: 116,
    inflationYoY: 4.0,
    panierMoyen: 142.5,
    updatedAt: '2025-02-01',
    sampleSize: 184,
  },
  {
    code: 'nc',
    priceIndex: 114,
    inflationYoY: 3.7,
    panierMoyen: 139.8,
    updatedAt: '2025-02-01',
    sampleSize: 167,
  },
  {
    code: 'wf',
    priceIndex: 119,
    inflationYoY: 4.6,
    panierMoyen: 151.4,
    updatedAt: '2025-02-01',
    sampleSize: 92,
  },
  {
    code: 'mf',
    priceIndex: 112,
    inflationYoY: 3.8,
    panierMoyen: 136.3,
    updatedAt: '2025-02-01',
    sampleSize: 88,
  },
  {
    code: 'bl',
    priceIndex: 110,
    inflationYoY: 3.6,
    panierMoyen: 133.1,
    updatedAt: '2025-02-01',
    sampleSize: 71,
  },
  {
    code: 'pm',
    priceIndex: 117,
    inflationYoY: 4.4,
    panierMoyen: 147.2,
    updatedAt: '2025-02-01',
    sampleSize: 65,
  },
  {
    code: 'tf',
    priceIndex: 123,
    inflationYoY: 5.4,
    panierMoyen: 162.7,
    updatedAt: '2025-02-01',
    sampleSize: 42,
  },
  {
    code: 'fr',
    priceIndex: 100,
    inflationYoY: 2.6,
    panierMoyen: 121.9,
    updatedAt: '2025-02-01',
    sampleSize: 980,
  },
];

export const getTerritoryStat = (code: TerritoryCode) =>
  OBSERVATOIRE_TERRITORY_STATS.find((stat) => stat.code === code) ?? null;

export const getPriceIndexColor = (priceIndex: number) => {
  if (priceIndex >= 120) return '#dc2626';
  if (priceIndex >= 115) return '#f97316';
  if (priceIndex >= 110) return '#f59e0b';
  if (priceIndex >= 105) return '#22c55e';
  return '#16a34a';
};
