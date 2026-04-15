/**
 * priceClickTracker.ts
 *
 * Lightweight usage analytics stored in localStorage.
 * Retailer clicks are also forwarded to Firestore anonymously
 * (no PII: only retailer, barcode, territory, price, pathname,
 * and an anonymous sessionId generated client-side).
 *
 * Tracks:
 *   - product page views (barcode + name)
 *   - retailer click-throughs from price rows
 *
 * Data is capped (max 500 entries) and aged out after 30 days
 * so it never grows unbounded.
 *
 * RGPD: no PII is collected. localStorage data never leaves the browser.
 * Firestore receives only anonymous, non-identifying analytics data.
 * Can be cleared by calling clearPriceClickData().
 */

import { safeLocalStorage } from './safeLocalStorage';
import { trackClickToFirestore } from './firestoreClickTracker';

// ── Constants ─────────────────────────────────────────────────────────────────

const KEY_VIEWS    = 'akp:price:views:v1';
const KEY_CLICKS   = 'akp:price:clicks:v1';
const MAX_ENTRIES  = 500;
const TTL_MS       = 30 * 24 * 60 * 60 * 1000; // 30 days

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ProductViewEntry {
  barcode:  string;
  name:     string;
  territory: string;
  viewedAt: number; // epoch ms
  count:    number;
}

export interface RetailerClickEntry {
  barcode:  string;
  retailer: string;
  territory: string;
  price:    number;
  clickedAt: number; // epoch ms
}

// ── Internal helpers ──────────────────────────────────────────────────────────

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = safeLocalStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T): void {
  try {
    safeLocalStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Silently fail if storage is full or unavailable
  }
}

function prune<T extends { viewedAt?: number; clickedAt?: number }>(
  entries: T[],
): T[] {
  const cutoff = Date.now() - TTL_MS;
  return entries
    .filter((e) => (e.viewedAt ?? e.clickedAt ?? 0) > cutoff)
    .slice(-MAX_ENTRIES);
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Record a product page view.
 * If the barcode was already viewed in this session, increments the counter.
 */
export function trackProductView(
  barcode: string,
  name: string,
  territory: string,
): void {
  const views = readJson<ProductViewEntry[]>(KEY_VIEWS, []);
  const existing = views.find(
    (v) => v.barcode === barcode && v.territory === territory,
  );

  if (existing) {
    existing.count    += 1;
    existing.viewedAt  = Date.now();
  } else {
    views.push({ barcode, name, territory, viewedAt: Date.now(), count: 1 });
  }

  writeJson(KEY_VIEWS, prune(views));
}

/**
 * Record a retailer link click from the price comparison table.
 * Appends a new entry even when the same retailer was already clicked.
 */
export function trackRetailerClick(
  barcode: string,
  retailer: string,
  territory: string,
  price: number,
): void {
  const clicks = readJson<RetailerClickEntry[]>(KEY_CLICKS, []);
  clicks.push({ barcode, retailer, territory, price, clickedAt: Date.now() });
  writeJson(KEY_CLICKS, prune(clicks));

  // Firestore (fire-and-forget)
  try {
    const normalizedTerritory = territory.trim();
    if (!normalizedTerritory) {
      return;
    }

    const normalizedBarcode = barcode.trim();
    const pageUrl =
      typeof window !== 'undefined' && window.location.pathname
        ? window.location.pathname
        : undefined;

    trackClickToFirestore({
      retailer,
      territory: normalizedTerritory,
      price,
      ...(normalizedBarcode ? { barcode: normalizedBarcode } : {}),
      ...(pageUrl ? { pageUrl } : {}),
    });
  } catch {
    // Silently ignore — localStorage is the primary store
  }
}

/**
 * Return product view history, most-viewed first.
 * Useful for a "recently viewed" or "trending" UI block.
 */
export function getTopViewedProducts(limit = 10): ProductViewEntry[] {
  const views = readJson<ProductViewEntry[]>(KEY_VIEWS, []);
  return prune(views)
    .sort((a, b) => b.count - a.count || b.viewedAt - a.viewedAt)
    .slice(0, limit);
}

/**
 * Return recent retailer clicks, newest first.
 */
export function getRecentRetailerClicks(limit = 20): RetailerClickEntry[] {
  const clicks = readJson<RetailerClickEntry[]>(KEY_CLICKS, []);
  return prune(clicks)
    .sort((a, b) => b.clickedAt - a.clickedAt)
    .slice(0, limit);
}

/**
 * Wipe all tracking data — call on user logout or RGPD erasure request.
 */
export function clearPriceClickData(): void {
  safeLocalStorage.removeItem(KEY_VIEWS);
  safeLocalStorage.removeItem(KEY_CLICKS);
}

// ── Revenue & Conversion Tracking ─────────────────────────────────────────────

/**
 * Average estimated commission rate per click (affiliate programs typically 1-5%)
 * This is a conservative estimate for DOM-TOM supermarket affiliates
 */
const AVG_COMMISSION_RATE = 0.02; // 2%

/**
 * Conversion stats for analytics and revenue estimation
 */
export interface ConversionStats {
  totalViews: number;
  totalClicks: number;
  clickThroughRate: number; // CTR as decimal (e.g., 0.05 = 5%)
  estimatedRevenue: number; // EUR
  topProducts: Array<{
    barcode: string;
    name: string;
    views: number;
    clicks: number;
    ctr: number;
    estimatedRevenue: number;
  }>;
  topRetailers: Array<{
    retailer: string;
    clicks: number;
    avgPrice: number;
    estimatedRevenue: number;
  }>;
  periodDays: number;
}

/**
 * Calculate conversion stats and estimated revenue
 * @param periodDays - Number of days to analyze (default: 30)
 */
export function getConversionStats(periodDays = 30): ConversionStats {
  const views = readJson<ProductViewEntry[]>(KEY_VIEWS, []);
  const clicks = readJson<RetailerClickEntry[]>(KEY_CLICKS, []);
  
  const cutoff = Date.now() - (periodDays * 24 * 60 * 60 * 1000);
  
  // Filter to period
  const periodViews = views.filter((v) => v.viewedAt > cutoff);
  const periodClicks = clicks.filter((c) => c.clickedAt > cutoff);
  
  // Total counts
  const totalViews = periodViews.reduce((sum, v) => sum + v.count, 0);
  const totalClicks = periodClicks.length;
  
  // CTR
  const clickThroughRate = totalViews > 0 ? totalClicks / totalViews : 0;
  
  // Estimated revenue (clicks × average cart value × commission rate)
  // Average cart value estimated from click prices
  const avgClickPrice = periodClicks.length > 0
    ? periodClicks.reduce((sum, c) => sum + c.price, 0) / periodClicks.length
    : 0;
  const estimatedRevenue = totalClicks * avgClickPrice * AVG_COMMISSION_RATE;
  
  // Top products by views with their conversion data
  const productStats = new Map<string, {
    barcode: string;
    name: string;
    views: number;
    clicks: number;
  }>();
  
  for (const view of periodViews) {
    const key = view.barcode;
    const existing = productStats.get(key) || {
      barcode: view.barcode,
      name: view.name,
      views: 0,
      clicks: 0,
    };
    existing.views += view.count;
    productStats.set(key, existing);
  }
  
  for (const click of periodClicks) {
    const existing = productStats.get(click.barcode);
    if (existing) {
      existing.clicks += 1;
    }
  }
  
  const topProducts = Array.from(productStats.values())
    .map((p) => ({
      ...p,
      ctr: p.views > 0 ? p.clicks / p.views : 0,
      estimatedRevenue: p.clicks * avgClickPrice * AVG_COMMISSION_RATE,
    }))
    .sort((a, b) => b.views - a.views)
    .slice(0, 10);
  
  // Top retailers by clicks
  const retailerStats = new Map<string, {
    retailer: string;
    clicks: number;
    totalPrice: number;
  }>();
  
  for (const click of periodClicks) {
    const existing = retailerStats.get(click.retailer) || {
      retailer: click.retailer,
      clicks: 0,
      totalPrice: 0,
    };
    existing.clicks += 1;
    existing.totalPrice += click.price;
    retailerStats.set(click.retailer, existing);
  }
  
  const topRetailers = Array.from(retailerStats.values())
    .map((r) => ({
      retailer: r.retailer,
      clicks: r.clicks,
      avgPrice: r.totalPrice / r.clicks,
      estimatedRevenue: r.clicks * (r.totalPrice / r.clicks) * AVG_COMMISSION_RATE,
    }))
    .sort((a, b) => b.clicks - a.clicks)
    .slice(0, 10);
  
  return {
    totalViews,
    totalClicks,
    clickThroughRate,
    estimatedRevenue,
    topProducts,
    topRetailers,
    periodDays,
  };
}

/**
 * Get daily stats for the past N days
 * Useful for charts and trend analysis
 */
export interface DailyStats {
  date: string; // YYYY-MM-DD
  views: number;
  clicks: number;
  estimatedRevenue: number;
}

export function getDailyStats(days = 30): DailyStats[] {
  const views = readJson<ProductViewEntry[]>(KEY_VIEWS, []);
  const clicks = readJson<RetailerClickEntry[]>(KEY_CLICKS, []);
  
  const result: DailyStats[] = [];
  const now = Date.now();
  
  for (let i = days - 1; i >= 0; i--) {
    const dayStart = new Date(now - i * 24 * 60 * 60 * 1000);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
    
    const dayViews = views
      .filter((v) => v.viewedAt >= dayStart.getTime() && v.viewedAt < dayEnd.getTime())
      .reduce((sum, v) => sum + v.count, 0);
    
    const dayClicks = clicks.filter(
      (c) => c.clickedAt >= dayStart.getTime() && c.clickedAt < dayEnd.getTime(),
    );
    
    const avgPrice = dayClicks.length > 0
      ? dayClicks.reduce((sum, c) => sum + c.price, 0) / dayClicks.length
      : 0;
    
    result.push({
      date: dayStart.toISOString().split('T')[0],
      views: dayViews,
      clicks: dayClicks.length,
      estimatedRevenue: dayClicks.length * avgPrice * AVG_COMMISSION_RATE,
    });
  }
  
  return result;
}

/**
 * Get trending products (highest view growth)
 * Compares recent period to previous period
 */
export function getTrendingProducts(limit = 5): Array<{
  barcode: string;
  name: string;
  recentViews: number;
  previousViews: number;
  growth: number; // percentage
}> {
  const views = readJson<ProductViewEntry[]>(KEY_VIEWS, []);
  const now = Date.now();
  const recentCutoff = now - 7 * 24 * 60 * 60 * 1000; // Last 7 days
  const previousCutoff = now - 14 * 24 * 60 * 60 * 1000; // Previous 7 days
  
  const productGrowth = new Map<string, {
    barcode: string;
    name: string;
    recentViews: number;
    previousViews: number;
  }>();
  
  for (const view of views) {
    const existing = productGrowth.get(view.barcode) || {
      barcode: view.barcode,
      name: view.name,
      recentViews: 0,
      previousViews: 0,
    };
    
    if (view.viewedAt >= recentCutoff) {
      existing.recentViews += view.count;
    } else if (view.viewedAt >= previousCutoff) {
      existing.previousViews += view.count;
    }
    
    productGrowth.set(view.barcode, existing);
  }
  
  return Array.from(productGrowth.values())
    .map((p) => ({
      ...p,
      growth: p.previousViews > 0
        ? ((p.recentViews - p.previousViews) / p.previousViews) * 100
        : p.recentViews > 0 ? 100 : 0,
    }))
    .filter((p) => p.recentViews > 0)
    .sort((a, b) => b.growth - a.growth)
    .slice(0, limit);
}

// ── SEO Product Tracking ───────────────────────────────────────────────────────

const KEY_SEO_PRODUCTS = 'akp:seo:products:v1';
const MAX_SEO_ENTRIES  = 200;

export interface SEOProductEntry {
  productSlug:  string;
  territory:    string;
  pageType:     string;
  views:        number;
  lastViewedAt: number;
}

function pruneSEOProducts(entries: SEOProductEntry[]): SEOProductEntry[] {
  const cutoff = Date.now() - TTL_MS;
  return entries
    .filter((e) => e.lastViewedAt > cutoff)
    .sort((a, b) => b.views - a.views)
    .slice(0, MAX_SEO_ENTRIES);
}

/**
 * Track a view of a long-tail SEO product page.
 */
export function trackSEOProductView(
  productSlug: string,
  territory: string,
  pageType: string,
): void {
  const entries = readJson<SEOProductEntry[]>(KEY_SEO_PRODUCTS, []);
  const existing = entries.find(
    (e) => e.productSlug === productSlug && e.territory === territory && e.pageType === pageType,
  );

  if (existing) {
    existing.views       += 1;
    existing.lastViewedAt = Date.now();
  } else {
    entries.push({ productSlug, territory, pageType, views: 1, lastViewedAt: Date.now() });
  }

  writeJson(KEY_SEO_PRODUCTS, pruneSEOProducts(entries));
}

/**
 * Return top viewed SEO product pages, sorted by views descending.
 */
export function getTopSEOProducts(limit = 10): SEOProductEntry[] {
  const entries = readJson<SEOProductEntry[]>(KEY_SEO_PRODUCTS, []);
  return pruneSEOProducts(entries).slice(0, limit);
}
