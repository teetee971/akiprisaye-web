/**
 * seoIntentAnalyzer.ts — Search intent analysis & page recommendation engine
 * Analyzes search console metrics to surface actionable SEO opportunities.
 * No external calls. Deterministic output.
 */

// ── Types ─────────────────────────────────────────────────────────────────────

export interface SearchMetric {
  url: string;
  title: string;
  impressions: number;
  clicks: number;
  ctr: number; // decimal, e.g. 0.025 for 2.5%
  position: number; // avg position (1=best)
  pageType: 'product' | 'category' | 'comparison' | 'inflation' | 'pillar' | 'other';
}

export type IntentAction =
  | 'IMPROVE_TITLE'
  | 'DUPLICATE'
  | 'BOOST_LINKING'
  | 'ENRICH_CONTENT'
  | 'MONITOR';

export interface PageRecommendation {
  url: string;
  title: string;
  action: IntentAction;
  reason: string;
  priority: 'high' | 'medium' | 'low';
  impressions: number;
  clicks: number;
  ctr: number;
}

// ── Sample data ────────────────────────────────────────────────────────────────

export const SAMPLE_METRICS: SearchMetric[] = [
  {
    url: '/prix/coca-cola-1-5l-guadeloupe',
    title: 'Prix Coca-Cola Guadeloupe',
    impressions: 1200,
    clicks: 8,
    ctr: 0.0067,
    position: 14.2,
    pageType: 'product',
  },
  {
    url: '/comparer/carrefour-vs-leclerc-guadeloupe',
    title: 'Carrefour vs Leclerc Guadeloupe',
    impressions: 450,
    clicks: 31,
    ctr: 0.069,
    position: 5.1,
    pageType: 'comparison',
  },
  {
    url: '/inflation/alimentaire-guadeloupe-2026',
    title: 'Inflation alimentaire Guadeloupe 2026',
    impressions: 780,
    clicks: 11,
    ctr: 0.014,
    position: 8.3,
    pageType: 'inflation',
  },
  {
    url: '/guide-prix-alimentaire-dom',
    title: 'Guide prix alimentaire DOM',
    impressions: 2100,
    clicks: 94,
    ctr: 0.045,
    position: 3.8,
    pageType: 'pillar',
  },
  {
    url: '/prix/lait-entier-1l-martinique',
    title: 'Prix Lait Martinique',
    impressions: 320,
    clicks: 2,
    ctr: 0.006,
    position: 19.5,
    pageType: 'product',
  },
  {
    url: '/moins-cher/guadeloupe',
    title: 'Produits moins chers Guadeloupe',
    impressions: 890,
    clicks: 67,
    ctr: 0.075,
    position: 4.2,
    pageType: 'category',
  },
];

// ── Core logic ────────────────────────────────────────────────────────────────

function classifyMetric(
  metric: SearchMetric
): Pick<PageRecommendation, 'action' | 'reason' | 'priority'> {
  const { impressions, clicks, ctr, position } = metric;

  if (impressions > 50 && ctr < 0.015) {
    return {
      action: 'IMPROVE_TITLE',
      reason: `CTR faible (${(ctr * 100).toFixed(1)}%) malgré ${impressions} impressions — le titre n'attire pas assez les clics.`,
      priority: 'high',
    };
  }

  if (impressions > 50 && ctr > 0.03) {
    return {
      action: 'DUPLICATE',
      reason: `Excellent CTR (${(ctr * 100).toFixed(1)}%) — dupliquer la page pour d'autres territoires ou variantes produits.`,
      priority: 'high',
    };
  }

  if (clicks > 0 && clicks > impressions * 0.02) {
    return {
      action: 'BOOST_LINKING',
      reason: `Bonne conversion (${clicks} clics) — renforcer le maillage interne pour augmenter le trafic organique.`,
      priority: 'medium',
    };
  }

  if (position > 10 && impressions > 30) {
    return {
      action: 'ENRICH_CONTENT',
      reason: `Position ${position.toFixed(1)} — enrichir le contenu pour gagner les premières positions.`,
      priority: 'medium',
    };
  }

  return {
    action: 'MONITOR',
    reason: `Données insuffisantes ou performances stables — surveiller l'évolution.`,
    priority: 'low',
  };
}

/**
 * Analyze a list of search metrics and return actionable recommendations.
 */
export function analyzeMetrics(metrics: SearchMetric[]): PageRecommendation[] {
  return metrics.map((m) => {
    const classification = classifyMetric(m);
    return {
      url: m.url,
      title: m.title,
      impressions: m.impressions,
      clicks: m.clicks,
      ctr: m.ctr,
      ...classification,
    };
  });
}

/**
 * Group recommendations by their IntentAction.
 */
export function groupByAction(
  recs: PageRecommendation[]
): Record<IntentAction, PageRecommendation[]> {
  const result: Record<IntentAction, PageRecommendation[]> = {
    IMPROVE_TITLE: [],
    DUPLICATE: [],
    BOOST_LINKING: [],
    ENRICH_CONTENT: [],
    MONITOR: [],
  };
  for (const rec of recs) {
    result[rec.action].push(rec);
  }
  return result;
}

const PRIORITY_ORDER: Record<PageRecommendation['priority'], number> = {
  high: 0,
  medium: 1,
  low: 2,
};

/**
 * Return the top N opportunities sorted by priority then impressions.
 */
export function getTopOpportunities(metrics: SearchMetric[], limit = 10): PageRecommendation[] {
  return analyzeMetrics(metrics)
    .sort((a, b) => {
      const pd = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
      return pd !== 0 ? pd : b.impressions - a.impressions;
    })
    .slice(0, limit);
}

/**
 * Validate and normalize imported JSON into SearchMetric[].
 * Invalid entries are silently skipped.
 */
export function importMetricsFromJSON(raw: unknown): SearchMetric[] {
  if (!Array.isArray(raw)) return [];

  const VALID_PAGE_TYPES = new Set([
    'product',
    'category',
    'comparison',
    'inflation',
    'pillar',
    'other',
  ]);

  const results: SearchMetric[] = [];

  for (const item of raw) {
    if (typeof item !== 'object' || item === null) continue;
    const o = item as Record<string, unknown>;

    const url = typeof o['url'] === 'string' ? o['url'] : null;
    const title = typeof o['title'] === 'string' ? o['title'] : '';
    const impressions = typeof o['impressions'] === 'number' ? o['impressions'] : 0;
    const clicks = typeof o['clicks'] === 'number' ? o['clicks'] : 0;
    const ctr = typeof o['ctr'] === 'number' ? o['ctr'] : clicks / Math.max(impressions, 1);
    const position = typeof o['position'] === 'number' ? o['position'] : 0;
    const pageType = VALID_PAGE_TYPES.has(o['pageType'] as string)
      ? (o['pageType'] as SearchMetric['pageType'])
      : 'other';

    if (!url) continue;

    results.push({ url, title, impressions, clicks, ctr, position, pageType });
  }

  return results;
}

/**
 * Export recommendations to CSV string.
 */
export function exportRecommendationsToCSV(recs: PageRecommendation[]): string {
  const header = 'URL,Title,Action,Priority,Impressions,Clicks,CTR,Reason';
  const rows = recs.map((r) => {
    const esc = (s: string) => `"${s.replace(/"/g, '""')}"`;
    return [
      esc(r.url),
      esc(r.title),
      r.action,
      r.priority,
      r.impressions,
      r.clicks,
      (r.ctr * 100).toFixed(2) + '%',
      esc(r.reason),
    ].join(',');
  });
  return [header, ...rows].join('\n');
}
