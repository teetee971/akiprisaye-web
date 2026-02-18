export const PRICE_API_BASE = import.meta.env.VITE_PRICE_API_BASE || '';

export type PriceTerritory = 'fr' | 'gp' | 'mq';
export type PriceRetailer = 'carrefour' | 'leclerc' | 'intermarche' | 'superu';

export interface PriceAggregate {
  last: { price: number; currency: 'EUR'; observedAt: string } | null;
  min: number | null;
  median: number | null;
  max: number | null;
  count: number;
}

export interface PriceRetailerResult {
  retailer: PriceRetailer;
  aggregate: PriceAggregate;
}

export interface PriceApiResponse {
  ean: string;
  territory: PriceTerritory;
  retailers: PriceRetailerResult[];
  generatedAt: string;
}

export async function getPrices(
  ean: string,
  territory: PriceTerritory,
  retailers: PriceRetailer[]
): Promise<PriceApiResponse> {
  if (!PRICE_API_BASE) {
    throw new Error('VITE_PRICE_API_BASE is not configured');
  }

  const url = new URL('/v1/prices', PRICE_API_BASE);
  url.searchParams.set('ean', ean);
  url.searchParams.set('territory', territory);
  if (retailers.length) {
    url.searchParams.set('retailers', retailers.join(','));
  }

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: { Accept: 'application/json' },
  });

  if (!response.ok) {
    throw new Error(`price-api request failed (${response.status})`);
  }

  return (await response.json()) as PriceApiResponse;
}
