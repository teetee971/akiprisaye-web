/**
 * retentionEngine.ts — User retention scoring (V7)
 *
 * Computes a deterministic retention score 0–100 based on behavioural signals.
 *
 * Formula:
 *   retentionScore =
 *     repeatVisits  × 0.35   (most reliable loyalty signal)
 *     hasFavorites  × 0.25   (explicit intent signal)
 *     clickCount    × 0.20   (engagement depth)
 *     recency       × 0.15   (freshness of last visit)
 *     pushEngaged   × 0.05   (notification opt-in)
 *
 * Score tiers:
 *   loyal    ≥ 70 — user will return organically
 *   engaged  ≥ 45 — user needs gentle nurturing
 *   at-risk  ≥ 20 — user needs strong re-engagement
 *   cold      < 20 — likely not returning without push
 */

// ── Types ─────────────────────────────────────────────────────────────────────

export interface RetentionInput {
  /** Number of distinct calendar days with activity */
  repeatVisits: number;
  /** Whether the user has any saved favorites */
  hasFavorites: boolean;
  /** Total number of product clicks */
  clickCount: number;
  /** Timestamp of last event (ms) */
  lastSeenAt: number;
  /** Whether the user has interacted with a push notification */
  pushEngaged: boolean;
}

export type RetentionTier = 'loyal' | 'engaged' | 'at-risk' | 'cold';

export interface RetentionResult {
  score: number;
  tier: RetentionTier;
}

// ── Normalisation caps ────────────────────────────────────────────────────────

const MAX_VISITS = 30; // 30 days = full score
const MAX_CLICKS = 50; // 50 clicks = full score
const MAX_RECENCY_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

// ── Core scoring ──────────────────────────────────────────────────────────────

/**
 * Compute the retention score for a user.
 *
 * @param input  Aggregated user signals
 */
export function computeRetentionScore(input: RetentionInput): number {
  const visitScore = Math.min(100, (input.repeatVisits / MAX_VISITS) * 100);
  const favoriteScore = input.hasFavorites ? 100 : 0;
  const clickScore = Math.min(100, (input.clickCount / MAX_CLICKS) * 100);

  const ageMs = Date.now() - (input.lastSeenAt || 0);
  const recencyScore = input.lastSeenAt
    ? Math.max(0, Math.round((1 - ageMs / MAX_RECENCY_MS) * 100))
    : 0;

  const pushScore = input.pushEngaged ? 100 : 0;

  const raw =
    visitScore * 0.35 +
    favoriteScore * 0.25 +
    clickScore * 0.2 +
    recencyScore * 0.15 +
    pushScore * 0.05;

  return Math.min(100, Math.max(0, Math.round(raw)));
}

/**
 * Classify a retention score into a tier.
 */
export function classifyRetentionTier(score: number): RetentionTier {
  if (score >= 70) return 'loyal';
  if (score >= 45) return 'engaged';
  if (score >= 20) return 'at-risk';
  return 'cold';
}

/**
 * Compute score and tier together.
 */
export function getRetentionResult(input: RetentionInput): RetentionResult {
  const score = computeRetentionScore(input);
  return { score, tier: classifyRetentionTier(score) };
}
