export interface GetPricesParams {
  ean: string;
  territory: 'fr' | 'gp' | 'mq';
  retailers?: Array<'carrefour' | 'leclerc' | 'intermarche' | 'superu'>;
  includeObs?: boolean;
}

export interface PriceApiResponse {
  ean: string;
  territory: string;
  retailers: string[];
  aggregates: Array<{
    retailer: string;
    last_price_cents: number | null;
    last_observed_at: string | null;
    min_price_cents: number | null;
    max_price_cents: number | null;
    median_price_cents: number | null;
    count_obs: number;
    updated_at: string;
  }>;
  observations?: Array<{
    id: string;
    retailer: string;
    price_cents: number;
    observed_at: string;
    source: string;
  }>;
}

const PRICE_API_BASE = (import.meta.env.VITE_PRICE_API_BASE ?? '').replace(/\/$/, '');

export async function getPrices({
  ean,
  territory,
  retailers = ['carrefour', 'leclerc', 'intermarche', 'superu'],
  includeObs = false
}: GetPricesParams): Promise<PriceApiResponse> {
  if (!PRICE_API_BASE) {
    throw new Error('VITE_PRICE_API_BASE is not configured');
  }

  const query = new URLSearchParams({
    ean,
    territory,
    retailers: retailers.join(',')
  });

  if (includeObs) {
    query.set('include', 'obs');
  }

  const response = await fetch(`${PRICE_API_BASE}/v1/prices?${query.toString()}`);
  if (!response.ok) {
    throw new Error(`Price API request failed: ${response.status}`);
  }

  return (await response.json()) as PriceApiResponse;
}
