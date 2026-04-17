export type PriceApiStatus = 'OK' | 'NO_DATA' | 'PARTIAL' | 'UNAVAILABLE';

export interface PriceApiAggregate {
  territory: string;
  retailer: string;
  currency: 'EUR';
  unit: string | null;
  stats: {
    lastPrice: number | null;
    minPrice: number | null;
    maxPrice: number | null;
    medianPrice: number | null;
    count: number;
    lastObservedAt: string | null;
  };
  updatedAt: string;
}

export interface PriceApiObservation {
  id: string;
  territory: string;
  retailer: string;
  storeId: string | null;
  storeName: string | null;
  price: number;
  currency: 'EUR';
  unit: string | null;
  observedAt: string;
  source: string;
  confidence: number;
  metadata: Record<string, unknown> | null;
}

export interface PriceApiResult {
  status: PriceApiStatus;
  ean: string;
  territory?: string;
  retailers: string[];
  aggregates: PriceApiAggregate[];
  recentObservations: PriceApiObservation[];
  meta: {
    etag: string;
    updatedAt: string | null;
  };
  timestamp: string;
}

export interface GetPricesInput {
  ean: string;
  territory?: string;
  retailer?: string;
}

const EAN_REGEX = /^\d{8,14}$/;

function getBaseUrl(): string {
  const base = import.meta.env.VITE_PRICE_API_BASE as string | undefined;
  if (!base) {
    throw new Error('VITE_PRICE_API_BASE is not configured');
  }

  return base.replace(/\/$/, '');
}

function normalizeResponse(data: unknown): PriceApiResult {
  const parsed = data as Partial<PriceApiResult>;
  if (
    !parsed ||
    typeof parsed !== 'object' ||
    typeof parsed.ean !== 'string' ||
    typeof parsed.status !== 'string'
  ) {
    throw new Error('Invalid price-api response');
  }

  return {
    status: (parsed.status as PriceApiStatus) ?? 'UNAVAILABLE',
    ean: parsed.ean,
    territory: parsed.territory,
    retailers: Array.isArray(parsed.retailers) ? parsed.retailers : [],
    aggregates: Array.isArray(parsed.aggregates) ? parsed.aggregates : [],
    recentObservations: Array.isArray(parsed.recentObservations) ? parsed.recentObservations : [],
    meta: parsed.meta ?? { etag: '', updatedAt: null },
    timestamp: parsed.timestamp ?? new Date().toISOString(),
  };
}

export async function getPrices({
  ean,
  territory,
  retailer,
}: GetPricesInput): Promise<PriceApiResult> {
  if (!EAN_REGEX.test(ean)) {
    throw new Error('Invalid ean format (expected 8-14 digits)');
  }

  const base = getBaseUrl();
  const params = new URLSearchParams({ ean });
  if (territory) params.set('territory', territory);
  if (retailer) params.set('retailer', retailer);

  const response = await fetch(`${base}/v1/prices?${params.toString()}`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Price API request failed (${response.status})`);
  }

  const json = (await response.json()) as unknown;
  return normalizeResponse(json);
}
