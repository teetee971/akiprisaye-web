import { RETAILERS, SOURCES, TERRITORIES, UNITS, type PriceObservationInput, type Retailer, type Territory } from './types';

const EAN_REGEX = /^\d{8,14}$/;

const parseCsvParam = (value: string | null): string[] =>
  value
    ? value
        .split(',')
        .map((item) => item.trim().toLowerCase())
        .filter(Boolean)
    : [];

const isIsoDate = (value: string): boolean => {
  const date = new Date(value);
  return !Number.isNaN(date.getTime()) && date.toISOString() === value;
};

export const validateEan = (ean: string): string => {
  if (!EAN_REGEX.test(ean)) {
    throw new Error('Invalid ean: expected 8-14 digits');
  }
  return ean;
};

export const parseTerritory = (territory: string | null): Territory => {
  if (!territory || !TERRITORIES.includes(territory as Territory)) {
    throw new Error(`Invalid territory: expected one of ${TERRITORIES.join(', ')}`);
  }
  return territory as Territory;
};

export const parseRetailers = (rawRetailers: string | null): Retailer[] => {
  const retailers = parseCsvParam(rawRetailers);
  if (!retailers.length) {
    return [...RETAILERS];
  }

  const invalid = retailers.filter((retailer) => !RETAILERS.includes(retailer as Retailer));
  if (invalid.length) {
    throw new Error(`Invalid retailers: ${invalid.join(', ')}`);
  }

  return [...new Set(retailers as Retailer[])];
};

export const parseIncludeObs = (include: string | null): boolean => include === 'obs';

export const validateObservationPayload = (payload: unknown): PriceObservationInput => {
  if (typeof payload !== 'object' || payload === null) {
    throw new Error('Invalid payload: expected JSON object');
  }

  const body = payload as Record<string, unknown>;
  const ean = validateEan(String(body.ean ?? ''));
  const territory = parseTerritory(typeof body.territory === 'string' ? body.territory.toLowerCase() : null);
  const retailer = (typeof body.retailer === 'string' ? body.retailer.toLowerCase() : '') as Retailer;
  const source = typeof body.source === 'string' ? body.source.toLowerCase() : '';
  const currency = typeof body.currency === 'string' ? body.currency.toUpperCase() : 'EUR';
  const unitRaw = body.unit ? String(body.unit).toLowerCase() : undefined;
  const observedAt = typeof body.observedAt === 'string' ? body.observedAt : '';
  const price = Number(body.price);
  const perUnit = body.perUnit === undefined || body.perUnit === null ? undefined : Number(body.perUnit);

  if (!RETAILERS.includes(retailer)) {
    throw new Error(`Invalid retailer: expected one of ${RETAILERS.join(', ')}`);
  }
  if (!SOURCES.includes(source as (typeof SOURCES)[number])) {
    throw new Error(`Invalid source: expected one of ${SOURCES.join(', ')}`);
  }
  if (currency !== 'EUR') {
    throw new Error('Invalid currency: only EUR is supported');
  }
  if (!Number.isFinite(price) || price <= 0) {
    throw new Error('Invalid price: expected number > 0');
  }
  if (perUnit !== undefined && (!Number.isFinite(perUnit) || perUnit <= 0)) {
    throw new Error('Invalid perUnit: expected number > 0');
  }
  if (unitRaw && !UNITS.includes(unitRaw as (typeof UNITS)[number])) {
    throw new Error(`Invalid unit: expected one of ${UNITS.join(', ')}`);
  }
  if (!isIsoDate(observedAt)) {
    throw new Error('Invalid observedAt: expected ISO string');
  }

  return {
    ean,
    territory,
    retailer,
    price,
    currency: 'EUR',
    unit: unitRaw as (typeof UNITS)[number] | undefined,
    perUnit,
    observedAt,
    source: source as (typeof SOURCES)[number],
    storeRef: body.storeRef ? String(body.storeRef) : undefined,
    metadata: body.metadata && typeof body.metadata === 'object' ? (body.metadata as Record<string, unknown>) : undefined,
  };
};
