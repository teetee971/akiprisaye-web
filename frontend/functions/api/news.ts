import { handleOptions, jsonResponse, methodGuard, parseQuery } from '../_lib/http';
import { serverNewsFallback } from '../data/newsFallback';
import { RssIngester } from '../ingesters/rssIngester';
import { RappelConsoIngester } from '../ingesters/rappelConsoIngester';
import type { Ingester, NewsImpact, NewsItem, NewsTerritory, NewsType } from '../types/news';

const TERRITORIES: NewsTerritory[] = ['all', 'gp', 'mq', 'gf', 're', 'yt', 'fr'];
const TYPES: NewsType[] = ['bons_plans', 'rappels', 'reglementaire', 'indice', 'dossiers', 'press', 'partner', 'user'];
const IMPACTS: NewsImpact[] = ['fort', 'moyen', 'info'];

const normalizeType = (value: string | null): NewsType | null => {
  if (!value) return null;
  const normalized = value.trim().toLowerCase().replace(/-/g, '_');
  return TYPES.includes(normalized as NewsType) ? normalized as NewsType : null;
};

const normalizeItem = (item: NewsItem): NewsItem | null => {
  const normalizedType = normalizeType(item.type);
  if (!normalizedType) return null;
  if (!item.source_name?.trim() || !item.source_url?.trim()) return null;

  return {
    ...item,
    type: normalizedType,
    territory: TERRITORIES.includes(item.territory) ? item.territory : 'all',
    summary: item.summary?.trim() || item.title,
    impact: IMPACTS.includes(item.impact) ? item.impact : 'info',
    published_at: Number.isNaN(Date.parse(item.published_at)) ? new Date().toISOString() : new Date(item.published_at).toISOString(),
  };
};

const dedupeItems = (items: NewsItem[]): NewsItem[] => {
  const seen = new Set<string>();
  const result: NewsItem[] = [];
  for (const item of items) {
    const key = item.canonical_url?.toLowerCase() || `${item.title.toLowerCase()}|${item.published_at.slice(0, 10)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(item);
  }
  return result;
};

const applyFilters = (items: NewsItem[], query: URLSearchParams): NewsItem[] => {
  const territory = (query.get('territory') ?? 'all').toLowerCase();
  const type = normalizeType(query.get('type'));
  const impact = (query.get('impact') ?? '').toLowerCase();
  const q = (query.get('q') ?? '').trim().toLowerCase();

  return items
    .filter((item) => territory === 'all' || item.territory === territory || item.territory === 'all')
    .filter((item) => !type || item.type === type)
    .filter((item) => !impact || item.impact === impact)
    .filter((item) => {
      if (!q) return true;
      const haystack = [item.title, item.summary, ...(item.tags ?? [])].join(' ').toLowerCase();
      return haystack.includes(q);
    });
};

export const aggregateNews = async (): Promise<{ items: NewsItem[]; mode: 'live' | 'mock' | 'degraded'; sources: Record<string, string> }> => {
  const ingesters: Ingester[] = [
    new RssIngester({
      id: 'service-public-rss',
      sourceName: 'Service-Public.fr',
      feedUrl: 'https://www.service-public.fr/particuliers/actualites/rss',
      territory: 'fr',
    }),
    new RappelConsoIngester(),
  ];

  const sources: Record<string, string> = { fallback: 'embedded' };
  const liveItems: NewsItem[] = [];
  let hadFailure = false;

  for (const ingester of ingesters) {
    try {
      const items = await ingester.fetch();
      const normalized = items.map(normalizeItem).filter(Boolean) as NewsItem[];
      if (normalized.length > 0) {
        liveItems.push(...normalized);
        sources[ingester.id] = 'ok';
      } else {
        sources[ingester.id] = 'empty';
      }
    } catch (error) {
      hadFailure = true;
      sources[ingester.id] = 'error';
      console.warn(`[news] ingester_failed ${ingester.id}`, error instanceof Error ? error.message : error);
    }
  }

  const fallback = serverNewsFallback.map(normalizeItem).filter(Boolean) as NewsItem[];
  const combined = dedupeItems([...liveItems, ...fallback]).sort((a, b) => Date.parse(b.published_at) - Date.parse(a.published_at));

  const mode: 'live' | 'mock' | 'degraded' = liveItems.length > 0 ? 'live' : hadFailure ? 'degraded' : 'mock';
  return { items: combined, mode, sources };
};

export const onRequestOptions: PagesFunction = async ({ request }) => handleOptions(request, ['GET']) ?? new Response(null, { status: 204 });

export const onRequestGet: PagesFunction = async ({ request }) => {
  const optionsResponse = handleOptions(request, ['GET']);
  if (optionsResponse) return optionsResponse;

  const blocked = methodGuard(request, ['GET']);
  if (blocked) return blocked;

  const query = parseQuery(request);
  const limitRaw = Number(query.get('limit') ?? '30');
  const limit = Number.isFinite(limitRaw) ? Math.min(100, Math.max(1, limitRaw)) : 30;

  const { items, mode, sources } = await aggregateNews();
  const filtered = applyFilters(items, query).slice(0, limit);

  return jsonResponse(
    {
      items: filtered,
      mode,
      generatedAt: new Date().toISOString(),
      sources,
    },
    { request, cache: 'short' },
  );
};
