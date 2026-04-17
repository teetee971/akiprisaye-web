/**
 * marketDominationOS.ts — Market Domination Operating System (V5 core)
 *
 * Central decision engine for market-position arbitration.
 *
 * Decides:
 *   - which territories to attack
 *   - which keyword families to produce content for
 *   - which retailer-vs-retailer comparisons to publish
 *   - which SEO pages to prioritise for creation
 *
 * Domination score formula (weights sum to 1.00):
 *   dominationScore =
 *     seoGap              × 0.30  (untapped search volume)
 *     revenuePotential    × 0.25  (cash value of traffic)
 *     lowCompetition      × 0.20  (SERP weakness = easy wins)
 *     territoryPriority   × 0.15  (strategic territory value)
 *     retailerStrategic   × 0.10  (value of retailer coverage)
 */

// ── Types ─────────────────────────────────────────────────────────────────────

export interface DominationStats {
  /** SEO gap score 0–100: how much untapped search volume exists */
  seoGap?: number;
  /** Revenue potential score 0–100 */
  revenuePotential?: number;
  /** Competition weakness 0–100 (100 = no competition, easy to rank) */
  lowCompetition?: number;
  /** Territory priority score 0–100 */
  territoryPriority?: number;
  /** Retailer strategic value 0–100 */
  retailerStrategicValue?: number;
}

export interface DominationEntity {
  id: string;
  label: string;
  type: 'territory' | 'keyword' | 'retailer-battle' | 'page';
  [key: string]: unknown;
}

export interface ScoredDominationEntity extends DominationEntity {
  dominationScore: number;
  priority: 'critical' | 'high' | 'medium' | 'low';
}

// ── Weights ───────────────────────────────────────────────────────────────────

const W_SEO_GAP = 0.3;
const W_REVENUE = 0.25;
const W_COMPETITION = 0.2;
const W_TERRITORY = 0.15;
const W_RETAILER = 0.1;

// ── Core scoring ──────────────────────────────────────────────────────────────

/**
 * Compute the market domination score for an entity.
 *
 * All inputs are 0–100. Output is capped at 100.
 */
export function computeDominationScore(entity: DominationEntity, stats: DominationStats): number {
  void entity; // id/label used for identification only
  const raw =
    (stats.seoGap ?? 0) * W_SEO_GAP +
    (stats.revenuePotential ?? 0) * W_REVENUE +
    (stats.lowCompetition ?? 0) * W_COMPETITION +
    (stats.territoryPriority ?? 0) * W_TERRITORY +
    (stats.retailerStrategicValue ?? 0) * W_RETAILER;

  return Math.min(100, Math.max(0, Math.round(raw)));
}

/**
 * Classify a domination score into an action priority.
 *
 *   critical ≥ 80 → act this week
 *   high     ≥ 60 → act this month
 *   medium   ≥ 40 → backlog with target date
 *   low       < 40 → monitor only
 */
export function classifyDominationPriority(score: number): ScoredDominationEntity['priority'] {
  if (score >= 80) return 'critical';
  if (score >= 60) return 'high';
  if (score >= 40) return 'medium';
  return 'low';
}

/**
 * Score and rank a list of domination entities.
 */
export function rankDominationEntities(
  entities: DominationEntity[],
  statsMap: Map<string, DominationStats>
): ScoredDominationEntity[] {
  return entities
    .map((e) => {
      const stats = statsMap.get(e.id) ?? {};
      const score = computeDominationScore(e, stats);
      return { ...e, dominationScore: score, priority: classifyDominationPriority(score) };
    })
    .sort((a, b) => b.dominationScore - a.dominationScore);
}
