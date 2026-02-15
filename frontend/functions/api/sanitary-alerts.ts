import { errorResponse, handleOptions, jsonResponse, parseQuery } from '../_lib/http';
import { normalizeRappelConsoAlert } from '../../src/services/sanitaryAlertsNormalizer';
import type { SanitaryAlert, TerritoryCode } from '../../src/types/alerts';

const SOURCE_URL = 'https://data.economie.gouv.fr/api/explore/v2.1/catalog/datasets/rappelconso0/records';
const ALLOWED_TERRITORIES: TerritoryCode[] = ['fr', 'gp', 'mq', 'gf', 're', 'yt', 'pm', 'bl', 'mf'];
const API_TIMEOUT_MS = 8_000;
const EDGE_TTL_SECONDS = 1_200;

const fallbackAlerts: SanitaryAlert[] = [
  {
    id: 'fallback-gp-1',
    territory: 'gp',
    territories: ['gp'],
    severity: 'important',
    riskLevel: 'important',
    status: 'active',
    title: 'Rappel local (mode dégradé)',
    productName: 'Produit temporaire',
    brand: 'A KI PRI SA YÉ',
    category: 'épicerie',
    publishedAt: new Date().toISOString(),
    sourceName: 'Fallback local',
    sourceUrl: 'https://rappel.conso.gouv.fr',
  },
];

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchWithTimeoutAndRetry(url: string, retries = 1): Promise<Response> {
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

    try {
      const response = await fetch(url, {
        headers: { Accept: 'application/json' },
        signal: controller.signal,
      });
      clearTimeout(timeout);
      if (response.ok) return response;
      throw new Error(`upstream_${response.status}`);
    } catch (error) {
      clearTimeout(timeout);
      if (attempt >= retries) throw error;
      await wait(300 * (attempt + 1));
    }
  }
  throw new Error('unreachable');
}

function buildUpstreamUrl(query: URLSearchParams): string {
  const limit = Math.min(Number(query.get('limit') ?? '50') || 50, 100);
  const cursor = query.get('cursor') ?? '';
  const q = query.get('q')?.trim();

  const params = new URLSearchParams({
    limit: String(limit),
  });
  if (cursor) params.set('offset', cursor);
  if (q) params.set('q', q);

  return `${SOURCE_URL}?${params.toString()}`;
}

function filterAlerts(alerts: SanitaryAlert[], query: URLSearchParams): SanitaryAlert[] {
  const territory = (query.get('territory') ?? '').toLowerCase() as TerritoryCode;
  const category = (query.get('category') ?? '').toLowerCase();
  const severity = (query.get('severity') ?? '').toLowerCase();
  const activeOnly = (query.get('activeOnly') ?? 'false').toLowerCase() === 'true';
  const id = query.get('id');

  return alerts
    .filter((alert) => !id || alert.id === id)
    .filter((alert) => !territory || !ALLOWED_TERRITORIES.includes(territory) || alert.territories?.includes(territory) || alert.territory === territory)
    .filter((alert) => !category || alert.category?.toLowerCase() === category)
    .filter((alert) => !severity || alert.severity === severity)
    .filter((alert) => !activeOnly || alert.status === 'active');
}

export const onRequestOptions: PagesFunction = async ({ request }) => handleOptions(request, ['GET']) ?? new Response(null, { status: 204 });

export const onRequestGet: PagesFunction = async ({ request }) => {
  const query = parseQuery(request);
  const cache = caches.default;
  const cacheKey = new Request(request.url, { method: 'GET' });
  const cached = await cache.match(cacheKey);
  if (cached) return cached;

  try {
    const upstreamUrl = buildUpstreamUrl(query);
    const upstreamResponse = await fetchWithTimeoutAndRetry(upstreamUrl, 1);
    const upstreamPayload = await upstreamResponse.json() as { results?: Array<Record<string, unknown>>; total_count?: number; next_offset?: string | null };
    const normalized = (upstreamPayload.results ?? []).map((raw) => normalizeRappelConsoAlert(raw));
    const filtered = filterAlerts(normalized, query);

    const payload = {
      alerts: filtered,
      nextCursor: upstreamPayload.next_offset ?? undefined,
      metadata: {
        source: 'rappelconso' as const,
        fetchedAt: new Date().toISOString(),
        total: upstreamPayload.total_count ?? filtered.length,
      },
    };

    const response = jsonResponse(payload, {
      request,
      headers: { 'Cache-Control': `public, max-age=${EDGE_TTL_SECONDS}` },
    });
    await cache.put(cacheKey, response.clone());
    return response;
  } catch {
    const fallback = filterAlerts(fallbackAlerts, query);
    return jsonResponse({
      alerts: fallback,
      metadata: {
        source: 'fallback' as const,
        fetchedAt: new Date().toISOString(),
        total: fallback.length,
      },
    }, { request });
  }
};
