/**
 * territoryOpportunityEngine.ts — Territory ranking and opportunity map (V5)
 *
 * Ranks the four DOM-TOM territories (GP, MQ, GF, RE) by their market
 * opportunity, using signals available within the system:
 *   - existing page coverage (fewer pages = bigger gap)
 *   - price data volume (more data = lower risk)
 *   - population proxy (larger territory = higher traffic ceiling)
 *   - current trafic signals (click / view counts per territory)
 */

// ── Types ─────────────────────────────────────────────────────────────────────

export type TerritoryCode = 'gp' | 'mq' | 'gf' | 're' | 'yt';

export interface TerritoryOpportunityStats {
  /** Number of existing SEO pages for this territory */
  existingPages?: number;
  /** Number of price data points available */
  dataCoverage?: number;
  /** Click count in last 30 days */
  clicks30d?: number;
  /** Conversion count in last 30 days */
  conversions30d?: number;
}

export interface TerritoryOpportunity {
  code: TerritoryCode;
  name: string;
  /** SEO gap score 0–100 (higher = more untapped) */
  seoGap: number;
  /** Overall opportunity score 0–100 */
  opportunityScore: number;
  priority: 'critical' | 'high' | 'medium' | 'low';
  /** Population proxy (relative) */
  populationWeight: number;
  /** Recommended number of new pages to create */
  targetNewPages: number;
}

// ── Static territory metadata ─────────────────────────────────────────────────

const TERRITORY_META: Record<
  TerritoryCode,
  { name: string; population: number; maxPages: number }
> = {
  gp: { name: 'Guadeloupe', population: 400_000, maxPages: 300 },
  mq: { name: 'Martinique', population: 360_000, maxPages: 300 },
  gf: { name: 'Guyane', population: 300_000, maxPages: 200 },
  re: { name: 'La Réunion', population: 900_000, maxPages: 400 },
  yt: { name: 'Mayotte', population: 320_000, maxPages: 150 },
};

const MAX_POPULATION = Math.max(...Object.values(TERRITORY_META).map((m) => m.population));

// ── Core ranker ───────────────────────────────────────────────────────────────

/**
 * Rank territories by market opportunity.
 *
 * @param statsMap  Map of territory code → TerritoryOpportunityStats
 */
export function rankTerritories(
  statsMap: Map<TerritoryCode, TerritoryOpportunityStats> = new Map()
): TerritoryOpportunity[] {
  return (
    Object.entries(TERRITORY_META) as [TerritoryCode, (typeof TERRITORY_META)[TerritoryCode]][]
  )
    .map(([code, meta]) => {
      const stats = statsMap.get(code) ?? {};
      const result = scoreTerritoryOpportunity(code, meta, stats);
      return result;
    })
    .sort((a, b) => b.opportunityScore - a.opportunityScore);
}

function scoreTerritoryOpportunity(
  code: TerritoryCode,
  meta: { name: string; population: number; maxPages: number },
  stats: TerritoryOpportunityStats
): TerritoryOpportunity {
  const existing = stats.existingPages ?? 0;
  const maxPages = meta.maxPages;
  const popWeight = meta.population / MAX_POPULATION; // 0–1

  // SEO gap: how many pages are still missing (0 = fully covered, 100 = no pages)
  const seoGap = existing >= maxPages ? 0 : Math.round((1 - existing / maxPages) * 100);

  // Data coverage: more data = higher confidence = lower risk bonus
  const dataCoverage = Math.min(100, ((stats.dataCoverage ?? 0) / 500) * 100);

  // Traffic: existing clicks are a good signal, but also reduce "gap"
  const clickSignal = Math.min(100, ((stats.clicks30d ?? 0) / 200) * 100);

  // Opportunity = big gap + high population + enough data to act on
  const opportunityScore = Math.round(
    seoGap * 0.4 + popWeight * 100 * 0.3 + dataCoverage * 0.2 + (100 - clickSignal) * 0.1 // prefer under-served traffic
  );

  const targetNewPages = Math.max(0, Math.min(maxPages, Math.round((seoGap / 100) * maxPages)));

  return {
    code,
    name: meta.name,
    seoGap,
    opportunityScore: Math.min(100, opportunityScore),
    priority: classifyTerritoryPriority(opportunityScore),
    populationWeight: popWeight,
    targetNewPages,
  };
}

function classifyTerritoryPriority(score: number): TerritoryOpportunity['priority'] {
  if (score >= 75) return 'critical';
  if (score >= 55) return 'high';
  if (score >= 35) return 'medium';
  return 'low';
}

/**
 * Build a stats map from a flat product/event list.
 * Counts existing pages and data points per territory.
 */
export function buildTerritoryStatsMap(
  items: { territory?: string; pageUrl?: string; type?: string }[]
): Map<TerritoryCode, TerritoryOpportunityStats> {
  const map = new Map<TerritoryCode, TerritoryOpportunityStats>();
  const CODES = new Set<string>(['gp', 'mq', 'gf', 're', 'yt']);

  for (const item of items) {
    const code = (item.territory ?? '').toLowerCase().trim() as TerritoryCode;
    if (!CODES.has(code)) continue;
    if (!map.has(code))
      map.set(code, { existingPages: 0, dataCoverage: 0, clicks30d: 0, conversions30d: 0 });
    const s = map.get(code)!;
    if (item.pageUrl) s.existingPages = (s.existingPages ?? 0) + 1;
    else s.dataCoverage = (s.dataCoverage ?? 0) + 1;
  }
  return map;
}
