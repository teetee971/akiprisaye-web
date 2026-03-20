import type { PriceObservation } from '../services/priceSearch/price.types';

export const normalizeText = (value?: string): string =>
  (value ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim();

const normalizeUnit = (value: PriceObservation['unit']): PriceObservation['unit'] => {
  if (value === 'kg' || value === 'l') {
    return value;
  }
  return 'unit';
};

export function normalizePriceObservation(observation: PriceObservation): PriceObservation {
  return {
    ...observation,
    productName: observation.productName?.trim(),
    brand: observation.brand?.trim(),
    barcode: observation.barcode?.trim(),
    price: Number.isFinite(observation.price) ? Number(observation.price) : 0,
    currency: 'EUR',
    unit: normalizeUnit(observation.unit),
  };
}
