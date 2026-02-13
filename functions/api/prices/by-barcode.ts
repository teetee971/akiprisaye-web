type TerritoryCode =
  | 'fr'
  | 'gp'
  | 'mq'
  | 'gf'
  | 're'
  | 'yt'
  | 'pm'
  | 'bl'
  | 'mf';

type AggregatedStatus = 'OK' | 'NO_DATA' | 'PARTIAL' | 'UNAVAILABLE';

interface PriceObservation {
  price?: number;
  observedAt?: string;
  [key: string]: unknown;
}

interface OpenPricesByBarcodeResponse {
  status?: AggregatedStatus;
  observations?: PriceObservation[];
}

interface OffProductResponse {
  status?: number;
  data?: unknown;
}

interface PriceStats {
  min: number | null;
  max: number | null;
  median: number | null;
}

interface BundleResult {
  status: AggregatedStatus;
  product: unknown;
  observations: PriceObservation[];
  observationCount: number;
  stats: PriceStats;
  maxAgeDays: number;
  upstreamStatusHints: {
    off: number | null;
    openPrices: AggregatedStatus | null;
  };
}

interface ComparisonStats {
  franceMedian: number;
  territoryMedian: number;
  ratio: number;
  percentDifference: number;
}

function computeStats(values: number[]): PriceStats {
  if (values.length === 0) {
    return { min: null, max: null, median: null };
  }

  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  const median =
    sorted.length % 2 === 1
      ? sorted[middle]
      : (sorted[middle - 1] + sorted[middle]) / 2;

  return {
    min: sorted[0],
    max: sorted[sorted.length - 1],
    median,
  };
}

function resolveStatus(observationCount: number, openPricesStatus?: AggregatedStatus): AggregatedStatus {
  if (observationCount > 0) {
    return 'OK';
  }

  if (openPricesStatus === 'UNAVAILABLE' || openPricesStatus === 'PARTIAL') {
    return openPricesStatus;
  }

  return openPricesStatus ?? 'NO_DATA';
}

function filterRecent(observations: PriceObservation[], maxAgeDays: number): PriceObservation[] {
  const now = Date.now();
  const maxAgeMs = maxAgeDays * 24 * 60 * 60 * 1000;

  return observations.filter((observation) => {
    if (!observation.observedAt) {
      return false;
    }

    const observedAt = new Date(observation.observedAt).getTime();
    if (Number.isNaN(observedAt)) {
      return false;
    }

    return now - observedAt <= maxAgeMs;
  });
}

function normalizeMaxAgeDays(value: string | null): number {
  const parsed = Number(value ?? '90');
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return 90;
  }

  return Math.floor(parsed);
}

async function safeJson<T>(response: Response): Promise<T | null> {
  try {
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

async function buildBundle(params: {
  barcode: string;
  territory: TerritoryCode | '';
  maxAgeDays: number;
  origin: string;
}): Promise<BundleResult> {
  const { barcode, territory, maxAgeDays, origin } = params;

  const offUrl = `${origin}/api/off/product?barcode=${encodeURIComponent(barcode)}`;

  const openPricesParams = new URLSearchParams({
    barcode,
    pageSize: '30',
  });
  if (territory) {
    openPricesParams.set('territory', territory);
  }

  const openPricesUrl = `${origin}/api/open-prices/by-barcode?${openPricesParams.toString()}`;

  const [offResult, openPricesResult] = await Promise.allSettled([
    fetch(offUrl),
    fetch(openPricesUrl),
  ]);

  let offPayload: OffProductResponse | null = null;
  let openPricesPayload: OpenPricesByBarcodeResponse | null = null;

  if (offResult.status === 'fulfilled') {
    offPayload = await safeJson<OffProductResponse>(offResult.value);
  }

  if (openPricesResult.status === 'fulfilled') {
    openPricesPayload = await safeJson<OpenPricesByBarcodeResponse>(openPricesResult.value);
  }

  const rawObservations = Array.isArray(openPricesPayload?.observations)
    ? openPricesPayload.observations
    : [];

  const observations = filterRecent(rawObservations, maxAgeDays);
  const prices = observations
    .map((observation) => Number(observation.price))
    .filter((value) => Number.isFinite(value));

  return {
    status: resolveStatus(observations.length, openPricesPayload?.status),
    product: offPayload?.data ?? null,
    observations,
    observationCount: observations.length,
    stats: computeStats(prices),
    maxAgeDays,
    upstreamStatusHints: {
      off: offPayload?.status ?? null,
      openPrices: openPricesPayload?.status ?? null,
    },
  };
}

function buildComparison(target: BundleResult, france: BundleResult): ComparisonStats | null {
  if (target.stats.median == null || france.stats.median == null || france.stats.median <= 0) {
    return null;
  }

  const ratio = target.stats.median / france.stats.median;
  return {
    franceMedian: france.stats.median,
    territoryMedian: target.stats.median,
    ratio,
    percentDifference: (ratio - 1) * 100,
  };
}

export const onRequestGet: PagesFunction = async ({ request }) => {
  const requestUrl = new URL(request.url);

  const barcode = (requestUrl.searchParams.get('barcode') ?? '').trim();
  const territory = (requestUrl.searchParams.get('territory') ?? '').trim() as TerritoryCode | '';
  const maxAgeDays = normalizeMaxAgeDays(requestUrl.searchParams.get('maxAgeDays'));

  if (!barcode) {
    return new Response(JSON.stringify({ error: 'Missing barcode' }), {
      status: 400,
      headers: { 'content-type': 'application/json; charset=utf-8' },
    });
  }

  const origin = requestUrl.origin;
  const bundle = await buildBundle({ barcode, territory, maxAgeDays, origin });

  let comparison: ComparisonStats | null = null;
  if (territory && territory !== 'fr') {
    const franceBundle = await buildBundle({
      barcode,
      territory: 'fr',
      maxAgeDays,
      origin,
    });
    comparison = buildComparison(bundle, franceBundle);
  }

  return new Response(
    JSON.stringify({
      status: bundle.status,
      barcode,
      territory: territory || null,
      maxAgeDays: bundle.maxAgeDays,
      product: bundle.product,
      stats: bundle.stats,
      observationCount: bundle.observationCount,
      observations: bundle.observations,
      comparison,
    }),
    {
      status: 200,
      headers: { 'content-type': 'application/json; charset=utf-8' },
    },
  );
};
