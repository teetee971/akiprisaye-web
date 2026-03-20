/**
 * retailerLinks.ts
 *
 * Maps canonical retailer names to their public e-commerce / store-locator URLs.
 * Used by ProductPage to add affiliate-ready "Voir chez X" links in price rows.
 *
 * URLs use the DOM-COM / French Antilles landing page where one exists,
 * falling back to the main site.
 *
 * Call buildRetailerUrl() to get a UTM-enriched URL ready for an <a href>.
 * When no URL is known the function returns null so the UI can degrade gracefully.
 *
 * Affiliation readiness:
 *   The campaign `'comparateur-prix'` is injected as utm_campaign.
 *   When BOOKING_CONFIG.affiliateEnabled is set to true and affiliateRef is
 *   configured, a `ref` param is appended automatically via buildBookingUrl().
 */

import { buildBookingUrl } from './bookingLinks';

// ── Canonical retailer → URL map ──────────────────────────────────────────────
// Key must match the output of normalizeRetailer() in compare.service.ts.

const RETAILER_URLS: Record<string, string> = {
  'Carrefour':        'https://www.carrefour.fr/',
  'Carrefour Market': 'https://www.carrefour.fr/',
  'Leader Price':     'https://www.leaderprice.fr/',
  'Super U':          'https://www.courses.super-u.fr/',
  'E.Leclerc':        'https://www.e.leclerc/',
  'Intermarché':      'https://www.intermarche.com/',
  'Match':            'https://www.match.fr/',
  'Simply Market':    'https://www.auchan.fr/',  // Simply Market → Auchan
  'Casino':           'https://www.supercasino.fr/',
  'Aldi':             'https://www.aldi.fr/',
  'Lidl':             'https://www.lidl.fr/',
  'Spar':             'https://www.spar.fr/',
  'Écomax':           'https://www.ecomax.fr/',
};

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Return the base website URL for a given retailer name, or null if unknown.
 * Accepts the canonical name (as produced by normalizeRetailer).
 */
export function getRetailerBaseUrl(retailer: string): string | null {
  return RETAILER_URLS[retailer] ?? null;
}

/**
 * Return a UTM-enriched URL for a retailer, ready for an <a href>.
 *
 * @param retailer  Canonical retailer name (e.g. "Carrefour", "E.Leclerc")
 * @param barcode   Optional product barcode — can be used for deep-linking
 *                  when the retailer supports barcode search in their URL.
 * @returns         UTM URL string, or null when the retailer has no known URL.
 */
export function buildRetailerUrl(
  retailer: string,
  barcode?: string,
): string | null {
  const base = getRetailerBaseUrl(retailer);
  if (!base) return null;

  // For retailers that support barcode search, append the search query.
  // Currently only Carrefour supports a clean `?q={barcode}` param.
  const deepLink = buildDeepLink(retailer, base, barcode);

  return buildBookingUrl(deepLink, 'comparateur-prix', 'prix-comparateur');
}

/** Build retailer-specific deep link when the retailer supports it. */
function buildDeepLink(
  retailer: string,
  base: string,
  barcode: string | undefined,
): string {
  if (!barcode) return base;

  const encoded = encodeURIComponent(barcode);

  if (retailer === 'Carrefour' || retailer === 'Carrefour Market') {
    return `https://www.carrefour.fr/recherche?q=${encoded}`;
  }
  if (retailer === 'E.Leclerc') {
    return `https://www.e.leclerc/search?q=${encoded}`;
  }
  if (retailer === 'Intermarché') {
    return `https://www.intermarche.com/nos-produits/recherche?term=${encoded}`;
  }

  // Default — no deep link for this retailer
  return base;
}

/**
 * List of retailer names for which a URL is known.
 * Useful for tests and for filtering UI elements.
 */
export function knownRetailers(): string[] {
  return Object.keys(RETAILER_URLS);
}
