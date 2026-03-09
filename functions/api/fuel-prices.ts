/**
 * Cloudflare Pages Function — Live fuel prices proxy
 *
 * Proxies the official French government API:
 * https://data.economie.gouv.fr (prix-carburants-en-france-flux-instantane-v2)
 *
 * Supports all DOM-TOM territories:
 *   GP=971, MQ=972, GF=973, RE=974, PM=975, YT=976, BL=977, MF=978
 *
 * GET /api/fuel-prices?territory=GP[&fuelType=SP95][&limit=200]
 */

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const REQUEST_TIMEOUT_MS = 12_000;
const CACHE_TTL_SECONDS = 1_800; // 30 minutes

const GOV_API_BASE =
  'https://data.economie.gouv.fr/api/explore/v2.1/catalog/datasets/prix-des-carburants-en-france-flux-instantane-v2/records';

/** Department code for each territory */
const TERRITORY_TO_DEPT: Record<string, string> = {
  GP: '971', // Guadeloupe
  MQ: '972', // Martinique
  GF: '973', // Guyane française
  RE: '974', // La Réunion
  PM: '975', // Saint-Pierre-et-Miquelon
  YT: '976', // Mayotte
  BL: '977', // Saint-Barthélemy
  MF: '978', // Saint-Martin
};

interface GovStation {
  id?: string;
  ville?: string;
  adresse?: string;
  cp?: string;
  geom?: { lon?: number; lat?: number };
  enseignes?: string;
  brand?: string;
  gazole_prix?: number | null;
  gazole_maj?: string | null;
  sp95_prix?: number | null;
  sp95_maj?: string | null;
  sp98_prix?: number | null;
  sp98_maj?: string | null;
  e10_prix?: number | null;
  e10_maj?: string | null;
  e85_prix?: number | null;
  e85_maj?: string | null;
  gplc_prix?: number | null;
  gplc_maj?: string | null;
}

interface FuelPricePoint {
  id: string;
  station: {
    id: string;
    name: string;
    address: string;
    city: string;
    territory: string;
    location?: { lat: number; lng: number };
    brand?: string;
  };
  fuelType: string;
  pricePerLiter: number;
  currency: 'EUR';
  observationDate: string;
  source: {
    type: 'official_api';
    url: string;
    observedAt: string;
    reliability: 'high';
  };
  isPriceCapPlafonne: boolean;
  territory: string;
  lastUpdate?: string;
}

function withTimeout(ms: number): AbortController {
  const ctrl = new AbortController();
  setTimeout(() => ctrl.abort(), ms);
  return ctrl;
}

function jsonResponse(payload: unknown, status = 200, extraHeaders?: Record<string, string>): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      ...CORS_HEADERS,
      ...(extraHeaders ?? {}),
    },
  });
}

/** Fetch one page from the government API */
async function fetchPage(dept: string, offset: number, limit: number, signal: AbortSignal): Promise<{ results: GovStation[]; total_count: number }> {
  const params = new URLSearchParams({
    where: `code_departement="${dept}"`,
    limit: String(limit),
    offset: String(offset),
  });
  const url = `${GOV_API_BASE}?${params.toString()}`;
  const res = await fetch(url, {
    signal,
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) throw new Error(`Gov API error ${res.status}`);
  const json = await res.json() as unknown;
  if (
    typeof json !== 'object' || json === null ||
    !Array.isArray((json as Record<string, unknown>).results)
  ) {
    throw new Error('Unexpected response shape from government API');
  }
  return json as { results: GovStation[]; total_count: number };
}

/** Fetch all stations for a department (paginated) */
async function fetchAllStations(dept: string, signal: AbortSignal): Promise<GovStation[]> {
  const PAGE = 100;
  const first = await fetchPage(dept, 0, PAGE, signal);
  const total = first.total_count ?? 0;
  const all: GovStation[] = [...first.results];

  const remaining = Math.max(0, total - all.length);
  const pages = Math.ceil(remaining / PAGE);
  const extra = await Promise.all(
    Array.from({ length: pages }, (_, i) =>
      fetchPage(dept, (i + 1) * PAGE, PAGE, signal).then((r) => r.results),
    ),
  );
  for (const chunk of extra) all.push(...chunk);
  return all;
}

/** Convert raw gov station into FuelPricePoint[] */
function transformStation(raw: GovStation, territory: string): FuelPricePoint[] {
  // Build a deterministic ID from station attributes so caching is stable
  const idSource = raw.id
    ?? `${raw.adresse ?? ''}-${raw.cp ?? ''}-${raw.ville ?? ''}`.replace(/\s+/g, '-').toLowerCase();
  const stationId = `gov-${territory.toLowerCase()}-${idSource}`;
  const brand = raw.enseignes ?? raw.brand ?? 'Station-service';
  const station = {
    id: stationId,
    name: brand + (raw.ville ? ` - ${raw.ville}` : ''),
    address: raw.adresse ?? '',
    city: raw.ville ?? '',
    territory,
    location:
      raw.geom?.lat != null && raw.geom?.lon != null
        ? { lat: raw.geom.lat, lng: raw.geom.lon }
        : undefined,
    brand,
  };

  const SOURCE_URL = 'https://data.economie.gouv.fr';
  const fuels: Array<{ type: string; prix: number | null | undefined; maj: string | null | undefined }> = [
    { type: 'DIESEL', prix: raw.gazole_prix, maj: raw.gazole_maj },
    { type: 'SP95', prix: raw.sp95_prix, maj: raw.sp95_maj },
    { type: 'SP98', prix: raw.sp98_prix, maj: raw.sp98_maj },
    { type: 'E10', prix: raw.e10_prix, maj: raw.e10_maj },
    { type: 'E85', prix: raw.e85_prix, maj: raw.e85_maj },
    { type: 'GPL', prix: raw.gplc_prix, maj: raw.gplc_maj },
  ];

  const points: FuelPricePoint[] = [];
  for (const f of fuels) {
    if (f.prix == null || isNaN(Number(f.prix)) || Number(f.prix) <= 0) continue;
    const observedAt = f.maj ?? new Date().toISOString();
    points.push({
      id: `${stationId}-${f.type}`,
      station,
      fuelType: f.type,
      pricePerLiter: Number(f.prix),
      currency: 'EUR',
      observationDate: observedAt,
      source: { type: 'official_api', url: SOURCE_URL, observedAt, reliability: 'high' },
      // Price caps (prix plafonnés) apply in GP/MQ/GF/RE/YT but can only be determined
      // by comparing against the monthly prefectoral decree. Left false here; the frontend
      // EnqueteCarburants page explains the cap mechanism in detail.
      isPriceCapPlafonne: false,
      territory,
      lastUpdate: observedAt,
    });
  }
  return points;
}

export const onRequestOptions: PagesFunction = async () =>
  new Response(null, { status: 204, headers: CORS_HEADERS });

export const onRequestGet: PagesFunction = async ({ request }) => {
  const url = new URL(request.url);
  const territory = (url.searchParams.get('territory') ?? 'GP').toUpperCase();

  const dept = TERRITORY_TO_DEPT[territory];
  if (!dept) {
    return jsonResponse(
      { error: `Territoire non supporté: ${territory}. Codes valides: ${Object.keys(TERRITORY_TO_DEPT).join(', ')}` },
      400,
    );
  }

  // Check cache
  const cache = caches.default;
  const cacheKey = new Request(`${url.origin}/api/fuel-prices?territory=${territory}`);
  const cached = await cache.match(cacheKey);
  if (cached) {
    // Re-add CORS headers in case the cached response was stored without them
    const headers = new Headers(cached.headers);
    Object.entries(CORS_HEADERS).forEach(([k, v]) => headers.set(k, v));
    return new Response(cached.body, { status: cached.status, headers });
  }

  const ctrl = withTimeout(REQUEST_TIMEOUT_MS);
  try {
    const rawStations = await fetchAllStations(dept, ctrl.signal);
    const fuelPrices: FuelPricePoint[] = [];
    for (const s of rawStations) fuelPrices.push(...transformStation(s, territory));

    const payload = {
      territory,
      department: dept,
      totalStations: rawStations.length,
      totalPricePoints: fuelPrices.length,
      fetchedAt: new Date().toISOString(),
      source: 'data.economie.gouv.fr — prix-carburants-en-france-flux-instantane-v2',
      fuelPrices,
    };

    const cacheable = new Response(JSON.stringify(payload), {
      status: 200,
      headers: {
        'content-type': 'application/json; charset=utf-8',
        'Cache-Control': `public, max-age=${CACHE_TTL_SECONDS}`,
        ...CORS_HEADERS,
      },
    });
    await cache.put(cacheKey, cacheable.clone());
    return cacheable;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return jsonResponse({ error: 'Erreur lors de la récupération des prix carburants', detail: message }, 502);
  }
};
