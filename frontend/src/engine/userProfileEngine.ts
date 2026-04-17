/**
 * userProfileEngine.ts — Behavioural user profile builder (V3)
 *
 * Constructs a lightweight, RGPD-compliant user profile from the event log
 * produced by eventTracker.ts.  All data stays in localStorage — no PII,
 * no external calls.
 *
 * Usage:
 *   const events  = getEvents();   // from eventTracker
 *   const raw     = aggregateEvents(events);
 *   const profile = buildUserProfile(raw);
 */

// ── Types ─────────────────────────────────────────────────────────────────────

export type TerritoryCode = 'gp' | 'mq' | 'gf' | 're';

export interface UserProfile {
  /** Last observed territory (ISO code) */
  territory?: TerritoryCode;
  /** Products viewed in this session history */
  viewedProducts: string[];
  /** Retailers clicked at least once */
  clickedRetailers: string[];
  /** Products that received at least one affiliate click */
  clickedProducts: string[];
  /** Average number of events per session (rough depth proxy) */
  avgSessionDepth: number;
  /** Number of distinct calendar days with activity */
  repeatVisits: number;
  /** Product categories inferred from view history */
  favoriteCategories: string[];
  /** Timestamp of the most recent event (ms) */
  lastSeenAt: number;
}

export interface AggregatedEvents {
  lastTerritory?: TerritoryCode;
  views?: string[];
  retailers?: string[];
  products?: string[];
  avgDepth?: number;
  repeatVisits?: number;
  categories?: string[];
  lastSeenAt?: number;
}

// ── Event aggregator ──────────────────────────────────────────────────────────

/**
 * Reduce a flat event array (from eventTracker) into the AggregatedEvents
 * shape expected by buildUserProfile.
 *
 * @param events  Raw TrackedEvent[] from eventTracker.getEvents()
 */
export function aggregateEvents(
  events: {
    type: string;
    product?: string;
    retailer?: string;
    territory?: string;
    page?: string;
    ts: number;
    [k: string]: unknown;
  }[]
): AggregatedEvents {
  const views = new Set<string>();
  const retailers = new Set<string>();
  const products = new Set<string>();
  const categories = new Set<string>();
  const days = new Set<string>();
  let lastTerritory: TerritoryCode | undefined;
  let lastSeenAt = 0;

  for (const e of events) {
    if (e.ts > lastSeenAt) lastSeenAt = e.ts;

    // Day-level deduplication for repeat-visit count
    days.add(new Date(e.ts).toISOString().slice(0, 10));

    if (e.territory) lastTerritory = e.territory as TerritoryCode;

    if ((e.type === 'view' || e.type === 'deal_view' || e.type === 'page_view') && e.product) {
      views.add(e.product);
    }
    if (
      (e.type === 'affiliate_click' || e.type === 'conversion' || e.type === 'click') &&
      e.retailer
    ) {
      retailers.add(e.retailer);
    }
    if (
      (e.type === 'affiliate_click' || e.type === 'conversion' || e.type === 'click') &&
      e.product
    ) {
      products.add(e.product);
    }
    if (e.category) categories.add(String(e.category));
  }

  // Estimate session depth: total events / distinct days
  const avgDepth = days.size > 0 ? Math.round(events.length / days.size) : events.length;

  return {
    lastTerritory,
    views: [...views],
    retailers: [...retailers],
    products: [...products],
    avgDepth,
    repeatVisits: days.size,
    categories: [...categories],
    lastSeenAt,
  };
}

// ── Profile builder ───────────────────────────────────────────────────────────

/**
 * Build a UserProfile from pre-aggregated event data.
 *
 * @param events  AggregatedEvents (output of aggregateEvents)
 */
export function buildUserProfile(events: AggregatedEvents): UserProfile {
  return {
    territory: events.lastTerritory,
    viewedProducts: dedup(events.views ?? []),
    clickedRetailers: dedup(events.retailers ?? []),
    clickedProducts: dedup(events.products ?? []),
    avgSessionDepth: events.avgDepth ?? 0,
    repeatVisits: events.repeatVisits ?? 0,
    favoriteCategories: dedup(events.categories ?? []),
    lastSeenAt: events.lastSeenAt ?? 0,
  };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function dedup<T>(arr: T[]): T[] {
  return [...new Set(arr)];
}
