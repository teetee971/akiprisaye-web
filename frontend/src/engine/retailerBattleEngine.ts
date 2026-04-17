/**
 * retailerBattleEngine.ts — Retailer battle prioritisation (V5)
 *
 * Ranks retailer-vs-retailer comparison pairs by strategic value.
 *
 * A "battle" page (e.g. /comparer/carrefour-vs-leclerc-guadeloupe) generates
 * high-intent organic traffic because users are actively deciding where to shop.
 *
 * Ranking signals:
 *   - combined retailer traffic share (higher → more users care)
 *   - price gap between the two retailers (wider → more value for reader)
 *   - existing page coverage (fewer pages = bigger SEO gap)
 *   - territory strategic value (more populous = more clicks)
 */

// ── Types ─────────────────────────────────────────────────────────────────────

export interface RetailerBattle {
  retailer1: string;
  retailer2: string;
  territory: string;
  /** Battle importance score 0–100 */
  score: number;
  priority: 'critical' | 'high' | 'medium' | 'low';
  /** Suggested target URL slug */
  slug: string;
  /** Whether a comparison page for this pair+territory already exists */
  hasPage: boolean;
}

export interface BattleStats {
  /** Combined click share of both retailers, 0–100 */
  combinedTrafficShare?: number;
  /** Average price gap between the two retailers in EUR */
  avgPriceGap?: number;
  /** Whether a page already exists for this battle */
  hasExistingPage?: boolean;
  /** Territory strategic score 0–100 */
  territoryScore?: number;
}

// ── Static retailer data ──────────────────────────────────────────────────────

/** Market share proxy by territory (higher = more strategic) */
const RETAILER_WEIGHT: Record<string, number> = {
  carrefour: 90,
  leclerc: 85,
  'super-u': 70,
  'leader-price': 60,
  intermarch: 55,
  'geant-casino': 50,
};

const TERRITORY_SCORE: Record<string, number> = {
  gp: 80,
  mq: 75,
  re: 90,
  gf: 65,
  yt: 55,
};

const DEFAULT_RETAILERS = ['carrefour', 'leclerc', 'super-u', 'leader-price', 'intermarch'];

const DEFAULT_TERRITORIES = ['gp', 'mq', 're', 'gf'];

// ── Slug helper ───────────────────────────────────────────────────────────────

const TERRITORY_SLUGS: Record<string, string> = {
  gp: 'guadeloupe',
  mq: 'martinique',
  re: 'la-reunion',
  gf: 'guyane',
  yt: 'mayotte',
};

function battleSlug(r1: string, r2: string, territory: string): string {
  const terrSlug = TERRITORY_SLUGS[territory] ?? territory;
  return `comparer/${r1}-vs-${r2}-${terrSlug}`;
}

// ── Core scorer ───────────────────────────────────────────────────────────────

/**
 * Score a single retailer battle.
 *
 * score =
 *   combinedTrafficShare × 0.35
 *   priceGapScore        × 0.30
 *   (100 - existing)     × 0.20  (gap = opportunity)
 *   territoryScore       × 0.15
 */
export function scoreBattle(
  r1: string,
  r2: string,
  territory: string,
  stats: BattleStats = {}
): number {
  const w1 = RETAILER_WEIGHT[r1] ?? 50;
  const w2 = RETAILER_WEIGHT[r2] ?? 50;
  const combinedTraffic = stats.combinedTrafficShare ?? Math.round((w1 + w2) / 2);
  const priceGapScore = Math.min(100, ((stats.avgPriceGap ?? 0.3) / 2) * 100);
  const pageGap = stats.hasExistingPage ? 0 : 100;
  const terrScore = stats.territoryScore ?? TERRITORY_SCORE[territory] ?? 60;

  return Math.min(
    100,
    Math.max(
      0,
      Math.round(combinedTraffic * 0.35 + priceGapScore * 0.3 + pageGap * 0.2 + terrScore * 0.15)
    )
  );
}

function classifyBattlePriority(score: number): RetailerBattle['priority'] {
  if (score >= 80) return 'critical';
  if (score >= 60) return 'high';
  if (score >= 40) return 'medium';
  return 'low';
}

// ── Battle generator ──────────────────────────────────────────────────────────

/**
 * Generate and rank all retailer battles for given retailers and territories.
 *
 * @param retailers    Retailer slug list (default: top 5)
 * @param territories  Territory code list (default: 4 main territories)
 * @param statsMap     Optional stats map: `${r1}|${r2}|${territory}` → BattleStats
 * @param existingSlugs  Set of slug strings that already have pages
 */
export function generateRetailerBattles(
  retailers: string[] = DEFAULT_RETAILERS,
  territories: string[] = DEFAULT_TERRITORIES,
  statsMap: Map<string, BattleStats> = new Map(),
  existingSlugs: Set<string> = new Set()
): RetailerBattle[] {
  const battles: RetailerBattle[] = [];

  for (const territory of territories) {
    for (let i = 0; i < retailers.length; i++) {
      for (let j = i + 1; j < retailers.length; j++) {
        const r1 = retailers[i];
        const r2 = retailers[j];
        const slug = battleSlug(r1, r2, territory);
        const key = `${r1}|${r2}|${territory}`;

        const stats = statsMap.get(key) ?? {};
        const hasPage = existingSlugs.has(slug);
        const score = scoreBattle(r1, r2, territory, { ...stats, hasExistingPage: hasPage });

        battles.push({
          retailer1: r1,
          retailer2: r2,
          territory,
          score,
          priority: classifyBattlePriority(score),
          slug,
          hasPage,
        });
      }
    }
  }

  // Sort by score desc, then deterministically by slug
  return battles.sort((a, b) => b.score - a.score || a.slug.localeCompare(b.slug));
}

/**
 * Return only battles that do not yet have a page (SEO gap).
 */
export function getMissingBattlePages(battles: RetailerBattle[]): RetailerBattle[] {
  return battles.filter((b) => !b.hasPage);
}
