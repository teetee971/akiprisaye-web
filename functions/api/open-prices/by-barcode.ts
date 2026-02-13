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

type PriceSourceId = 'open_food_facts' | 'open_prices' | 'data_gouv';

type PriceObservation = {
  source: PriceSourceId;
  productName?: string;
  brand?: string;
  barcode?: string;
  price: number;
  currency: 'EUR';
  unit?: 'unit' | 'kg' | 'l';
  observedAt?: string;
  territory?: TerritoryCode;
  metadata?: Record<string, string>;
};

interface OpenPricesResultRow {
  id?: number | string;
  price?: number | string;
  currency?: string;
  date?: string;
  created?: string;
  updated?: string;
  price_per?: string;
  proof_id?: number | string;
  location_id?: number | string;
  location_osm_id?: number | string;
  location_osm_type?: string;
  price_is_discounted?: boolean;
  proof_file_path?: string;
}

interface OpenPricesResponse {
  results?: OpenPricesResultRow[];
}

function mapPricePerToUnit(pricePer: string | null | undefined): PriceObservation['unit'] {
  if (!pricePer) {
    return undefined;
  }

  const normalized = pricePer.toUpperCase();
  if (normalized.includes('KILOGRAM') || normalized === 'KG') {
    return 'kg';
  }
  if (normalized.includes('LITER') || normalized.includes('LITRE') || normalized === 'L') {
    return 'l';
  }
  if (normalized.includes('UNIT')) {
    return 'unit';
  }
  return undefined;
}

export const onRequestGet: PagesFunction = async ({ request }) => {
  const url = new URL(request.url);

  const barcode = (url.searchParams.get('barcode') ?? '').trim();
  const territory = (url.searchParams.get('territory') ?? '').trim() as TerritoryCode | '';
  const pageSize = Math.min(100, Math.max(1, Number(url.searchParams.get('pageSize') ?? '30')));

  if (!barcode) {
    return new Response(JSON.stringify({ error: 'Missing barcode' }), {
      status: 400,
      headers: { 'content-type': 'application/json; charset=utf-8' },
    });
  }

  const upstreamBase = 'https://prices.openfoodfacts.org';
  const upstreamUrl =
    `${upstreamBase}/api/v1/prices?` +
    new URLSearchParams({
      product_code: barcode,
      page_size: String(pageSize),
      ordering: '-date',
    }).toString();

  const cache = caches.default;
  const cacheKey = new Request(upstreamUrl, { method: 'GET' });

  let response = await cache.match(cacheKey);
  if (!response) {
    response = await fetch(upstreamUrl, {
      headers: {
        'User-Agent': 'A-KI-PRI-SA-YE (contact: support@yourdomain.tld)',
        Accept: 'application/json',
      },
    });

    if (response.ok) {
      const cached = new Response(response.body, response);
      cached.headers.set('Cache-Control', 'public, max-age=300');
      await cache.put(cacheKey, cached.clone());
      response = cached;
    }
  }

  if (!response.ok) {
    return new Response(
      JSON.stringify({
        status: response.status >= 500 ? 'UNAVAILABLE' : 'PARTIAL',
        barcode,
        observations: [],
        upstream: { status: response.status, url: upstreamUrl },
      }),
      {
        status: 200,
        headers: { 'content-type': 'application/json; charset=utf-8' },
      },
    );
  }

  const data = (await response.json()) as OpenPricesResponse | OpenPricesResultRow[];
  const rows = Array.isArray(data)
    ? data
    : Array.isArray(data.results)
      ? data.results
      : [];

  const observations: PriceObservation[] = rows
    .map((row) => {
      const price = Number(row.price);
      const currency = String(row.currency ?? '').toUpperCase();
      if (!Number.isFinite(price) || currency !== 'EUR') {
        return null;
      }

      const metadata: Record<string, string> = {};
      if (row.id != null) metadata.openPricesId = String(row.id);
      if (row.proof_id != null) metadata.proofId = String(row.proof_id);
      if (row.location_id != null) metadata.locationId = String(row.location_id);
      if (row.location_osm_id != null) metadata.locationOsmId = String(row.location_osm_id);
      if (row.location_osm_type != null) metadata.locationOsmType = String(row.location_osm_type);
      if (row.price_is_discounted != null) metadata.discounted = String(row.price_is_discounted);

      if (row.proof_file_path) {
        metadata.proofImageUrl = `${upstreamBase}/img/${row.proof_file_path.replace(/^\/+/, '')}`;
      }

      return {
        source: 'open_prices' as const,
        barcode,
        price,
        currency: 'EUR' as const,
        unit: mapPricePerToUnit(row.price_per),
        observedAt: row.date ?? row.created ?? row.updated,
        territory: territory || undefined,
        metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
      };
    })
    .filter((value): value is PriceObservation => value !== null);

  return new Response(
    JSON.stringify({
      status: observations.length > 0 ? 'OK' : 'NO_DATA',
      barcode,
      observations,
      upstream: { url: upstreamUrl },
    }),
    {
      status: 200,
      headers: { 'content-type': 'application/json; charset=utf-8' },
    },
  );
};
