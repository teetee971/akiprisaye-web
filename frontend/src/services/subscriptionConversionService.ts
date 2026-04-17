/**
 * subscriptionConversionService.ts
 * Manages promo codes, affiliate tracking, and subscription conversion analytics.
 * All data stored locally (GDPR-compliant, no external calls).
 */

export interface PromoCode {
  code: string;
  discountPct: number;
  label: string;
  expiresAt: string | null; // ISO date string or null = no expiry
  maxUses: number | null;
  uses: number;
}

export interface AffiliateRef {
  ref: string;
  label: string;
  commissionPct: number;
}

export interface ConversionEvent {
  type: 'pricing_view' | 'subscribe_start' | 'subscribe_complete' | 'promo_applied';
  plan?: string;
  promoCode?: string;
  affiliateRef?: string;
  timestamp: number;
}

// ─── Promo codes catalogue ──────────────────────────────────────────────────

const PROMO_CODES: PromoCode[] = [
  {
    code: 'WELCOME50',
    discountPct: 50,
    label: 'Offre de bienvenue -50%',
    expiresAt: null,
    maxUses: null,
    uses: 0,
  },
  {
    code: 'DOM30',
    discountPct: 30,
    label: 'Remise résidents DOM',
    expiresAt: null,
    maxUses: null,
    uses: 0,
  },
  {
    code: 'PARRAINAGE',
    discountPct: 100,
    label: '1 mois offert (parrainage)',
    expiresAt: null,
    maxUses: null,
    uses: 0,
  },
  {
    code: 'CITOYEN20',
    discountPct: 20,
    label: 'Code citoyen -20%',
    expiresAt: null,
    maxUses: null,
    uses: 0,
  },
];

// ─── Affiliate refs catalogue ────────────────────────────────────────────────

const AFFILIATE_REFS: AffiliateRef[] = [
  { ref: 'akiprisaye', label: 'Akiprisaye Interne', commissionPct: 0 },
  { ref: 'blog', label: 'Blog DOM', commissionPct: 10 },
  { ref: 'radio', label: 'Radio Caraïbes', commissionPct: 10 },
  { ref: 'partner', label: 'Partenaire générique', commissionPct: 10 },
];

const STORAGE_KEY = 'akip_conversion';

// ─── Local storage helpers ────────────────────────────────────────────────────

function loadEvents(): ConversionEvent[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as ConversionEvent[]) : [];
  } catch {
    return [];
  }
}

function saveEvent(event: ConversionEvent): void {
  try {
    const events = loadEvents();
    events.push(event);
    // Keep max 200 events
    const trimmed = events.slice(-200);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch {
    // localStorage might be unavailable in some environments
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Validate a promo code and return discount percentage (0 if invalid).
 */
export function validatePromoCode(code: string): PromoCode | null {
  const upper = code.trim().toUpperCase();
  const promo = PROMO_CODES.find((p) => p.code === upper);
  if (!promo) return null;

  if (promo.expiresAt && new Date(promo.expiresAt) < new Date()) return null;
  if (promo.maxUses !== null && promo.uses >= promo.maxUses) return null;

  return promo;
}

/**
 * Apply a promo to a price and return discounted amount.
 */
export function applyPromoDiscount(basePrice: number, discountPct: number): number {
  return Math.max(0, basePrice * (1 - discountPct / 100));
}

/**
 * Get all available promo codes (for display purposes).
 */
export function getAvailablePromos(): PromoCode[] {
  return PROMO_CODES.filter((p) => {
    if (p.expiresAt && new Date(p.expiresAt) < new Date()) return false;
    if (p.maxUses !== null && p.uses >= p.maxUses) return false;
    return true;
  });
}

/**
 * Get affiliate ref metadata, if known.
 */
export function getAffiliateRef(ref: string): AffiliateRef | null {
  return AFFILIATE_REFS.find((a) => a.ref === ref) ?? null;
}

/**
 * Generate a shareable affiliate link.
 */
export function generateAffiliateLink(plan: string, ref: string): string {
  const base =
    typeof window !== 'undefined' ? window.location.origin : 'https://akiprisaye-web.pages.dev';
  const basePath = import.meta.env.BASE_URL ?? '/';
  return `${base}${basePath}subscribe?plan=${plan}&ref=${encodeURIComponent(ref)}`;
}

/**
 * Track a conversion event (pricing view, subscribe start, complete, promo applied).
 */
export function trackConversion(event: Omit<ConversionEvent, 'timestamp'>): void {
  saveEvent({ ...event, timestamp: Date.now() });
}

/**
 * Get conversion analytics across all stored sessions (persisted in localStorage).
 */
export function getConversionAnalytics(): {
  totalEvents: number;
  pricingViews: number;
  subscribeStarts: number;
  subscribeCompletes: number;
  promoApplications: number;
  conversionRate: number;
} {
  const events = loadEvents();
  const pricingViews = events.filter((e) => e.type === 'pricing_view').length;
  const subscribeStarts = events.filter((e) => e.type === 'subscribe_start').length;
  const subscribeCompletes = events.filter((e) => e.type === 'subscribe_complete').length;
  const promoApplications = events.filter((e) => e.type === 'promo_applied').length;

  const conversionRate = pricingViews > 0 ? subscribeCompletes / pricingViews : 0;

  return {
    totalEvents: events.length,
    pricingViews,
    subscribeStarts,
    subscribeCompletes,
    promoApplications,
    conversionRate,
  };
}
