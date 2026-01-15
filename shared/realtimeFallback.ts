export type RealtimeFallbackItem = {
  productId: string;
  productLabel: string;
  territory: string;
  price: number;
  currency?: string;
  source?: string;
};

const BASE_FALLBACK: RealtimeFallbackItem[] = [
  {
    productId: 'riz-1kg',
    productLabel: 'Riz blanc 1kg',
    territory: 'Guadeloupe',
    price: 2.45,
    currency: 'EUR',
    source: 'fallback-local',
  },
  {
    productId: 'lait-uht-1l',
    productLabel: 'Lait demi-écrémé UHT 1L',
    territory: 'Guadeloupe',
    price: 1.44,
    currency: 'EUR',
    source: 'fallback-local',
  },
  {
    productId: 'yaourt-nature-4x125g',
    productLabel: 'Yaourt nature 4x125g',
    territory: 'Guadeloupe',
    price: 1.92,
    currency: 'EUR',
    source: 'fallback-local',
  },
];

export function buildRealtimeFallback(timestamp = new Date().toISOString()) {
  return BASE_FALLBACK.map((item) => ({
    ...item,
    currency: item.currency ?? 'EUR',
    source: item.source ?? 'fallback-local',
    observedAt: timestamp,
  }));
}
