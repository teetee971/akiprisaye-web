/**
 * revenueTracker.ts
 *
 * Tracks individual retailer price clicks for revenue analysis.
 * Data is stored in localStorage only (RGPD-safe, no external transmission).
 * Used by revenueEngine.ts to score products by revenue potential.
 *
 * Compatible with the existing conversionTracker / priceClickTracker pattern:
 *   - 30-day TTL, capped at MAX_EVENTS entries
 *   - No PII: only page URL, product name, retailer, and price
 */

const STORAGE_KEY = 'akp:revenue:v1';
const MAX_EVENTS = 500;
const TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

// ── Types ─────────────────────────────────────────────────────────────────────

export interface RevenueEvent {
  /** Page where the click originated (e.g. '/landing', '/produit/coca-cola') */
  url: string;
  /** Canonical product name or id (e.g. 'Coca-Cola 1.5L') */
  product: string;
  /** Canonical retailer name (e.g. 'E.Leclerc') */
  retailer: string;
  /** Price observed at click time, in euros */
  price: number;
  /** Unix timestamp in milliseconds */
  clickedAt: number;
}

// ── Internal helpers ──────────────────────────────────────────────────────────

function readEvents(): RevenueEvent[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const cutoff = Date.now() - TTL_MS;
    return (parsed as RevenueEvent[]).filter(
      (e) => typeof e.clickedAt === 'number' && e.clickedAt > cutoff
    );
  } catch {
    return [];
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Record a retailer price click.
 * Call this whenever the user clicks an affiliate / retailer price link.
 *
 * @example
 * trackRevenueClick({ url: '/landing', product: 'Coca-Cola 1.5L', retailer: 'E.Leclerc', price: 2.49 });
 */
export function trackRevenueClick(event: Omit<RevenueEvent, 'clickedAt'>): void {
  try {
    const events = readEvents();
    events.push({ ...event, clickedAt: Date.now() });

    // Keep only the most recent MAX_EVENTS entries
    const capped = events.length > MAX_EVENTS ? events.slice(events.length - MAX_EVENTS) : events;

    localStorage.setItem(STORAGE_KEY, JSON.stringify(capped));
  } catch {
    // Silently ignore (private mode, storage quota exceeded, etc.)
  }
}

/**
 * Return all non-expired revenue click events (TTL: 30 days).
 */
export function getRevenueEvents(): RevenueEvent[] {
  return readEvents();
}

/**
 * Clear all stored revenue events (e.g. for testing or RGPD erasure).
 */
export function clearRevenueEvents(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
