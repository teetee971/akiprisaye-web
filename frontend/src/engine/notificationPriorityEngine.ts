/**
 * notificationPriorityEngine.ts — Push notification priority engine (V7)
 *
 * Decides whether and how urgently to send a push notification to a user,
 * based on their segment, retention score, and deal relevance.
 *
 * Priority buckets:
 *   critical → send immediately (viral deal + loyal user)
 *   high     → send next batch (good deal + engaged user)
 *   medium   → send in daily digest
 *   low      → send only if no recent notification
 *   none     → do not send (cold user or low-value deal)
 */

import type { UserSegment } from './userSegmentation';

// ── Types ─────────────────────────────────────────────────────────────────────

export type NotificationPriority = 'critical' | 'high' | 'medium' | 'low' | 'none';

export interface NotificationContext {
  segment: UserSegment;
  retentionScore: number;
  hasFavorites: boolean;
  lastSeenAt: number;
  /** Deal delta in EUR — optional context for push triggering */
  dealDelta?: number;
  /** Whether this product is in the user's favorites */
  isFavoriteDeal?: boolean;
}

export interface NotificationDecision {
  priority: NotificationPriority;
  shouldSend: boolean;
  /** Delay before sending (ms) — 0 = immediate */
  delayMs: number;
  reason: string;
}

// ── Priority matrix ───────────────────────────────────────────────────────────

const SEGMENT_BASE_PRIORITY: Record<UserSegment, number> = {
  'chasseur-promos': 80,
  comparateur: 65,
  'fidele-enseigne': 70,
  'panier-frequent': 85,
  'visiteur-froid': 30,
};

// ── Core engine ───────────────────────────────────────────────────────────────

/**
 * Compute notification priority for a user.
 *
 * Rules (applied in order):
 *   1. visiteur-froid → never send (spam risk)
 *   2. retention < 20 → none
 *   3. isFavoriteDeal → boost +20
 *   4. dealDelta > 0.50 → boost +15
 *   5. Compute final priority from combined score
 */
export function computeNotificationPriority(ctx: NotificationContext): NotificationPriority {
  return buildDecision(ctx).priority;
}

/**
 * Build a full notification decision with priority, send flag, delay, and reason.
 */
export function buildDecision(ctx: NotificationContext): NotificationDecision {
  // Rule 1: never spam cold visitors
  if (ctx.segment === 'visiteur-froid' || ctx.retentionScore < 20) {
    return {
      priority: 'none',
      shouldSend: false,
      delayMs: 0,
      reason: 'utilisateur froid — pas de push',
    };
  }

  // Build score from segment + retention + deal signals
  const base = SEGMENT_BASE_PRIORITY[ctx.segment] ?? 50;
  const retBonus = Math.round((ctx.retentionScore / 100) * 20); // up to +20
  const favBonus = ctx.isFavoriteDeal ? 20 : 0;
  const deltaBonus = (ctx.dealDelta ?? 0) >= 0.5 ? 15 : (ctx.dealDelta ?? 0) >= 0.25 ? 8 : 0;

  const combined = Math.min(100, base + retBonus + favBonus + deltaBonus);

  const priority = classifyPriority(combined);
  const shouldSend = priority !== 'none';
  const delayMs =
    priority === 'critical'
      ? 0
      : priority === 'high'
        ? 30_000
        : priority === 'medium'
          ? 3_600_000
          : 86_400_000;

  const reason = [
    `segment=${ctx.segment}`,
    `retention=${ctx.retentionScore}`,
    ctx.isFavoriteDeal ? 'favori' : null,
    ctx.dealDelta ? `delta=${ctx.dealDelta.toFixed(2)}€` : null,
  ]
    .filter(Boolean)
    .join(', ');

  return { priority, shouldSend, delayMs, reason };
}

function classifyPriority(score: number): NotificationPriority {
  if (score >= 85) return 'critical';
  if (score >= 70) return 'high';
  if (score >= 50) return 'medium';
  if (score >= 35) return 'low';
  return 'none';
}
