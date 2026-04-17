/**
 * opportunityEngine.ts — Untapped opportunity finder (V4)
 *
 * Identifies products that have high monetisation potential
 * but are currently under-promoted (low clicks, few pages, no content).
 *
 * These are the next growth levers — good delta, good price,
 * but invisible because no content has been created yet.
 */

// ── Types ─────────────────────────────────────────────────────────────────────

export interface OpportunityCandidate {
  name: string;
  delta?: number;
  clicks?: number;
  revenueOSScore?: number;
  pageCount?: number;
  contentCount?: number;
  territory?: string;
  bestPrice?: number;
  bestRetailer?: string;
  [key: string]: unknown;
}

export interface UntappedOpportunity extends OpportunityCandidate {
  opportunityScore: number;
  reason: string;
}

// ── Thresholds ────────────────────────────────────────────────────────────────

const MIN_DELTA = 0.2; // minimum price spread to be interesting
const MAX_CLICKS = 5; // must have low organic traffic
const MIN_REVENUE_OS_SCORE = 50; // must have some underlying revenue potential

// ── Core finder ───────────────────────────────────────────────────────────────

/**
 * Find products with strong potential but low current visibility.
 *
 * Selection criteria:
 *   - delta > MIN_DELTA           → real price spread worth promoting
 *   - clicks < MAX_CLICKS         → barely discovered yet
 *   - revenueOSScore > MIN_SCORE  → underlying business signal is good
 *
 * @param products  Full scored product list
 */
export function findUntappedOpportunities(products: OpportunityCandidate[]): UntappedOpportunity[] {
  return products
    .filter(
      (p) =>
        (p.delta ?? 0) > MIN_DELTA &&
        (p.clicks ?? 0) < MAX_CLICKS &&
        (p.revenueOSScore ?? 0) > MIN_REVENUE_OS_SCORE
    )
    .map((p) => {
      const score = computeOpportunityScore(p);
      const reason = buildReason(p);
      return { ...p, opportunityScore: score, reason };
    })
    .sort((a, b) => b.opportunityScore - a.opportunityScore);
}

/**
 * Compute an opportunity priority score.
 *
 *   score = delta×40 + revenueOSScore×0.40 + (MAX_CLICKS - clicks)×20
 *
 * Products with the biggest spread, best revenue potential, and
 * fewest clicks receive the highest priority.
 */
export function computeOpportunityScore(p: OpportunityCandidate): number {
  const deltaScore = Math.min(100, ((p.delta ?? 0) / 5) * 100);
  const revenueScore = Math.min(100, p.revenueOSScore ?? 0);
  // Invert click count: 0 clicks = 100, MAX_CLICKS clicks = 0
  const clickGap = Math.max(0, MAX_CLICKS - (p.clicks ?? 0));
  const clickScore = (clickGap / MAX_CLICKS) * 100;

  return Math.min(
    100,
    Math.max(0, Math.round(deltaScore * 0.4 + revenueScore * 0.4 + clickScore * 0.2))
  );
}

/**
 * Generate a human-readable reason why this product is an opportunity.
 */
export function buildReason(p: OpportunityCandidate): string {
  const parts: string[] = [];
  if ((p.delta ?? 0) > 0.5) parts.push(`écart de prix élevé (${(p.delta ?? 0).toFixed(2)} €)`);
  if ((p.clicks ?? 0) === 0) parts.push('aucun clic enregistré — contenu à créer');
  else if ((p.clicks ?? 0) < 3) parts.push('très peu de visibilité');
  if ((p.revenueOSScore ?? 0) > 70) parts.push('fort potentiel revenu');
  if (!p.pageCount || p.pageCount < 2) parts.push('peu de pages SEO');
  return parts.length > 0 ? parts.join(' · ') : 'potentiel sous-exploité';
}

/**
 * Return the top N untapped opportunities.
 *
 * @param products  Full scored product list
 * @param limit     Max results (default 20)
 */
export function getTopOpportunities(
  products: OpportunityCandidate[],
  limit = 20
): UntappedOpportunity[] {
  return findUntappedOpportunities(products).slice(0, limit);
}
