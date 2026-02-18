import { RETAILERS, SOURCES, TERRITORIES, UNITS, type PriceObservationInput } from './types';

const EAN_REGEX = /^\d{8,14}$/;

function parseCsv(input?: string): string[] {
  if (!input) return [];
  return input
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean);
}

export function parseRetailersParam(value: string | null): string[] {
  const retailers = parseCsv(value ?? undefined);
  if (retailers.length === 0) {
    return [...RETAILERS];
  }

  for (const retailer of retailers) {
    if (!RETAILERS.includes(retailer as (typeof RETAILERS)[number])) {
      throw new Error(`Invalid retailer: ${retailer}`);
    }
  }
  return retailers;
}

export function parseIncludeObs(value: string | null): boolean {
  return value === 'obs';
}

export function assertValidQuery(ean: string | null, territory: string | null): { ean: string; territory: string } {
  if (!ean || !EAN_REGEX.test(ean)) {
    throw new Error('Invalid ean');
  }

  if (!territory || !TERRITORIES.includes(territory as (typeof TERRITORIES)[number])) {
    throw new Error('Invalid territory');
  }

  return { ean, territory };
}

export async function parsePostBody(req: Request): Promise<PriceObservationInput> {
  const body = (await req.json()) as Partial<PriceObservationInput>;

  if (!body.ean || !EAN_REGEX.test(body.ean)) {
    throw new Error('Invalid ean');
  }
  if (!body.territory || !TERRITORIES.includes(body.territory)) {
    throw new Error('Invalid territory');
  }
  if (!body.retailer || !RETAILERS.includes(body.retailer)) {
    throw new Error('Invalid retailer');
  }
  if (typeof body.price !== 'number' || body.price <= 0) {
    throw new Error('Invalid price');
  }
  if (body.currency && typeof body.currency !== 'string') {
    throw new Error('Invalid currency');
  }
  if (body.unit && !UNITS.includes(body.unit)) {
    throw new Error('Invalid unit');
  }
  if (body.pricePerUnit !== undefined && (typeof body.pricePerUnit !== 'number' || body.pricePerUnit <= 0)) {
    throw new Error('Invalid pricePerUnit');
  }
  if (!body.observedAt || Number.isNaN(Date.parse(body.observedAt))) {
    throw new Error('Invalid observedAt');
  }
  if (!body.source || !SOURCES.includes(body.source)) {
    throw new Error('Invalid source');
  }
  if (body.storeRef && typeof body.storeRef !== 'string') {
    throw new Error('Invalid storeRef');
  }
  if (body.metadata && typeof body.metadata !== 'object') {
    throw new Error('Invalid metadata');
  }

  return {
    ean: body.ean,
    territory: body.territory,
    retailer: body.retailer,
    price: body.price,
    currency: body.currency ?? 'EUR',
    unit: body.unit,
    pricePerUnit: body.pricePerUnit,
    observedAt: body.observedAt,
    source: body.source,
    storeRef: body.storeRef,
    metadata: body.metadata
  };
}
