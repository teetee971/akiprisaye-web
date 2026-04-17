/**
 * eventTracker.ts — Unified event tracking utility.
 *
 * Single entry point for all behavioural events:
 *   trackEvent('click',      { productId })
 *   trackEvent('view',       { productId, page })
 *   trackEvent('conversion', { productId, retailer, price })
 *   trackEvent('share',      { productId, channel })
 *   trackEvent('page_view',  { page })
 *   trackEvent('deal_view',  { product })
 *   trackEvent('affiliate_click', { product, retailer })
 *   trackEvent('feedback_open',   {})
 *
 * Storage: localStorage only (RGPD-safe, no external calls).
 * Capped at MAX_EVENTS entries; oldest events are evicted first.
 *
 * Export: call exportEvents() to retrieve all events as a JSON string
 * suitable for seeding the learning engine or the boost engine.
 */

// ── Constants ─────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'akp:events:v1';
const MAX_EVENTS = 1_000;
const TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

// ── Types ─────────────────────────────────────────────────────────────────────

export type EventType =
  | 'click'
  | 'view'
  | 'conversion'
  | 'share'
  | 'page_view'
  | 'deal_view'
  | 'affiliate_click'
  | 'feedback_open';

export interface TrackedEvent {
  type: EventType;
  /** Product name or id, if applicable */
  product?: string;
  /** Page path, if applicable */
  page?: string;
  /** Retailer name, if applicable */
  retailer?: string;
  /** Price in EUR, if applicable */
  price?: number;
  /** Social channel (whatsapp / facebook / tiktok), for 'share' events */
  channel?: string;
  /** Arbitrary additional payload */
  [key: string]: unknown;
  /** Unix timestamp (ms) — auto-set by trackEvent */
  ts: number;
}

// ── Storage helpers ───────────────────────────────────────────────────────────

function read(): TrackedEvent[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const cutoff = Date.now() - TTL_MS;
    return (parsed as TrackedEvent[]).filter((e) => typeof e.ts === 'number' && e.ts > cutoff);
  } catch {
    return [];
  }
}

function write(events: TrackedEvent[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
  } catch {
    // Quota exceeded — evict oldest half and retry
    try {
      const half = events.slice(Math.floor(events.length / 2));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(half));
    } catch {
      // Storage unavailable — silent no-op
    }
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Record a behavioural event.
 *
 * @param type     Event category (see EventType)
 * @param payload  Additional context (product, retailer, price, etc.)
 */
export function trackEvent(type: EventType, payload: Omit<TrackedEvent, 'type' | 'ts'> = {}): void {
  if (typeof window === 'undefined') return; // SSR guard

  const events = read();
  events.push({ ...payload, type, ts: Date.now() });

  // Evict oldest when over cap
  const trimmed = events.length > MAX_EVENTS ? events.slice(events.length - MAX_EVENTS) : events;

  write(trimmed);
}

/**
 * Return all stored events as a plain array (for learning engine seeding).
 */
export function getEvents(): TrackedEvent[] {
  if (typeof window === 'undefined') return [];
  return read();
}

/**
 * Return the event list serialised as JSON (for periodic export / boost engine).
 */
export function exportEvents(): string {
  return JSON.stringify(getEvents());
}

/**
 * Clear all stored events (RGPD erasure or test teardown).
 */
export function clearEvents(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // silent
  }
}

/**
 * Count events of a given type (useful for KPI widgets).
 */
export function countEvents(type: EventType): number {
  return getEvents().filter((e) => e.type === type).length;
}
