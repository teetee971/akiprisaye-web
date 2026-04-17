/**
 * userOS.ts — User Operating System core (V7)
 *
 * Central coordination layer for all user-centric signals:
 *   profile → segment → retention score → notification priority
 *
 * All data stays in localStorage (RGPD-safe, no PII, no external calls).
 */

import { buildUserProfile, aggregateEvents, type UserProfile } from './userProfileEngine';
import { classifyUser, type UserSegment } from './userSegmentation';
import { computeRetentionScore, type RetentionInput } from './retentionEngine';
import {
  computeNotificationPriority,
  type NotificationContext,
} from './notificationPriorityEngine';
import { getEvents } from '../utils/eventTracker';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface UserState {
  profile: UserProfile;
  segment: UserSegment;
  retentionScore: number;
  notificationPriority: 'critical' | 'high' | 'medium' | 'low' | 'none';
  lastComputedAt: number;
}

// ── Cache (module-level, reset on cold start) ─────────────────────────────────

let _cache: UserState | null = null;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

// ── Core API ──────────────────────────────────────────────────────────────────

/**
 * Build (or return cached) full user state from localStorage events.
 *
 * Designed to be called at app startup and on each significant user interaction.
 */
export function getUserState(forceRefresh = false): UserState {
  if (_cache && !forceRefresh && Date.now() - _cache.lastComputedAt < CACHE_TTL_MS) {
    return _cache;
  }

  // Read events from localStorage
  const events = typeof window !== 'undefined' ? getEvents() : [];

  // Build profile
  const aggregated = aggregateEvents(
    events.map((e) => ({
      type: e.type,
      product: e.product,
      retailer: e.retailer,
      territory: e.territory as string | undefined,
      page: e.page,
      ts: e.ts,
      category: e.category as string | undefined,
    }))
  );
  const profile = buildUserProfile(aggregated);
  const segment = classifyUser(profile);

  // Compute retention score
  const retInput: RetentionInput = {
    repeatVisits: profile.repeatVisits,
    hasFavorites: profile.viewedProducts.length > 0,
    clickCount: profile.clickedProducts.length,
    lastSeenAt: profile.lastSeenAt,
    pushEngaged: false, // updated externally
  };
  const retentionScore = computeRetentionScore(retInput);

  // Compute notification priority
  const notifCtx: NotificationContext = {
    segment,
    retentionScore,
    hasFavorites: profile.viewedProducts.length > 0,
    lastSeenAt: profile.lastSeenAt,
  };
  const notificationPriority = computeNotificationPriority(notifCtx);

  _cache = { profile, segment, retentionScore, notificationPriority, lastComputedAt: Date.now() };
  return _cache;
}

/**
 * Invalidate the cached user state (call after significant events).
 */
export function invalidateUserState(): void {
  _cache = null;
}
