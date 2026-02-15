export type Observation = {
  id: string;
  barcode: string;
  productName: string;
  territory: string;
  storeId?: string;
  storeName: string;
  price: number;
  currency: 'EUR';
  observedAt: string;
  source: string;
  reliability: 'high' | 'medium' | 'low';
};

const mockDataset: Observation[] = [
  { id: 'obs-1', barcode: '3274080005003', productName: 'Lait demi-écrémé 1L', territory: 'gp', storeId: 'leclerc-bas-du-fort', storeName: 'E.Leclerc Bas du Fort', price: 1.48, currency: 'EUR', observedAt: '2026-02-12T10:00:00.000Z', source: 'ticket citoyen', reliability: 'high' },
  { id: 'obs-2', barcode: '3274080005003', productName: 'Lait demi-écrémé 1L', territory: 'gp', storeId: 'u-baie-mahault', storeName: 'U Baie-Mahault', price: 1.55, currency: 'EUR', observedAt: '2026-02-11T10:00:00.000Z', source: 'ticket citoyen', reliability: 'medium' },
  { id: 'obs-3', barcode: '3017620422003', productName: 'Pâte à tartiner 750g', territory: 'mq', storeId: 'carrefour-dillon', storeName: 'Carrefour Dillon', price: 5.9, currency: 'EUR', observedAt: '2026-02-12T08:00:00.000Z', source: 'relevé partenaire', reliability: 'high' },
];

let memoryStore = [...mockDataset];

export const observationDriver = {
  mode: 'mock',
  list(query: { territory?: string; barcode?: string; q?: string }) {
    return memoryStore
      .filter((obs) => !query.territory || obs.territory === query.territory)
      .filter((obs) => !query.barcode || obs.barcode === query.barcode)
      .filter((obs) => !query.q || obs.productName.toLowerCase().includes(query.q.toLowerCase()))
      .sort((a, b) => +new Date(b.observedAt) - +new Date(a.observedAt));
  },
  add(input: Observation) {
    memoryStore = [input, ...memoryStore];
    return input;
  },
};

export const computeStatus = (count: number) => {
  if (count === 0) return 'NO_DATA';
  if (count < 2) return 'PARTIAL';
  return 'OK';
};
