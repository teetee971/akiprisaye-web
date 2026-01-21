import type { PriceObservation, TerritoryCode } from '../../../types/PriceObservation';
import type { RawProviderPrice } from '../price.types';
import type { PriceSourceId } from '../priceSearch.types';
import { formatPriceLabel, normalizePriceValue } from '../priceNormalizer';
import { normalizeTerritoryCode } from '../normalizeTerritoryCode';

const getString = (value: unknown): string | undefined =>
  typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;

const getNumber = (value: unknown): number | undefined =>
  typeof value === 'number' && Number.isFinite(value) ? value : undefined;

const getUnit = (value: unknown): PriceObservation['unit'] | undefined => {
  if (value === 'kg' || value === 'l' || value === 'unit') return value;
  if (typeof value === 'string') {
    const normalized = value.toLowerCase();
    if (normalized === 'kg' || normalized === 'l') return normalized as PriceObservation['unit'];
  }
  return undefined;
};

const getCurrency = (value: unknown): PriceObservation['currency'] => {
  const currency = typeof value === 'string' ? value.toUpperCase() : 'EUR';
  return currency === 'EUR' ? 'EUR' : 'EUR';
};

const buildId = (label: string, source: PriceSourceId, territory: TerritoryCode): string => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `${label}-${source}-${territory}-${Date.now()}`.replace(/\s+/g, '-');
};

export function normalizePriceObservation(
  raw: RawProviderPrice,
  context: {
    territory: TerritoryCode;
    source: PriceSourceId;
    fallbackLabel?: string;
    barcode?: string;
  }
): PriceObservation | null {
  if (!raw || typeof raw !== 'object') return null;
  const rawRecord = raw as Record<string, unknown>;
  const price = getNumber(rawRecord.price ?? rawRecord.value ?? rawRecord.prix);
  if (price === undefined) return null;

  const rawTerritory = getString(rawRecord.territory);
  const territory = rawTerritory && /^[a-z]{2}$/i.test(rawTerritory)
    ? normalizeTerritoryCode(rawTerritory)
    : context.territory;
  const productLabel =
    getString(rawRecord.product_name) ??
    getString(rawRecord.label) ??
    getString(rawRecord.name) ??
    context.fallbackLabel ??
    'Produit inconnu';

  const barcode = getString(rawRecord.barcode) ?? context.barcode;
  const productId = barcode ?? `${productLabel}-${context.source}`;
  const observedAt =
    getString(rawRecord.observed_at) ??
    getString(rawRecord.observedAt) ??
    new Date().toISOString();

  const unit = getUnit(rawRecord.unit);
  const currency = getCurrency(rawRecord.currency);
  const normalizedPrice = normalizePriceValue(price);
  const pricePerUnit = unit && unit !== 'unit' ? normalizedPrice : undefined;

  const confidenceScore =
    getNumber(rawRecord.confidenceScore) ?? getNumber(rawRecord.confidence) ?? undefined;

  return {
    id: buildId(productLabel, context.source, territory),
    productId,
    productLabel,
    territory,
    price: normalizedPrice,
    observedAt,
    storeLabel: getString(rawRecord.store) ?? getString(rawRecord.retailer),
    currency,
    sourceType: 'open_data',
    source: context.source,
    unit,
    pricePerUnit,
    normalizedLabel: formatPriceLabel(normalizedPrice, unit),
    barcode,
    brand: getString(rawRecord.brand),
    confidenceScore,
  };
}
