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
  Carrefour: 'https://www.carrefour.fr/',
  'Carrefour Market': 'https://www.carrefour.fr/',
  'Leader Price': 'https://www.leaderprice.fr/',
  'Super U': 'https://www.coursesu.com/',
  'E.Leclerc': 'https://www.e.leclerc/',
  Intermarché: 'https://www.intermarche.com/',
  Match: 'https://www.match.fr/',
  'Simply Market': 'https://www.auchan.fr/', // Simply Market → Auchan
  Casino: 'https://www.supercasino.fr/',
  Aldi: 'https://www.aldi.fr/',
  Lidl: 'https://www.lidl.fr/',
  Spar: 'https://www.spar.fr/',
  Écomax: 'https://www.ecomax.fr/',
  // ── DOM-TOM retailers ──────────────────────────────────────────────────────
  'Super U / Hyper U': 'https://www.coursesu.com/',
  Cora: 'https://www.cora.fr/',
  'Score Réunion': 'https://www.score.re/',
  'Auchan Réunion': 'https://www.auchan.fr/',
  'Monoprix Martinique': 'https://www.monoprix.fr/',
  'E.Leclerc Drive DOM (123.click)': 'https://www.123.click/',
  // ── Métropole aliases used by scrapers ─────────────────────────────────────
  'E.Leclerc (métropole)': 'https://www.e.leclerc/',
  'Intermarché (métropole)': 'https://www.intermarche.com/',
  'Super U (métropole)': 'https://www.coursesu.com/',
  'Carrefour (métropole)': 'https://www.carrefour.fr/',
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
export function buildRetailerUrl(retailer: string, barcode?: string): string | null {
  const base = getRetailerBaseUrl(retailer);
  if (!base) return null;

  // For retailers that support barcode search, append the search query.
  // Currently only Carrefour supports a clean `?q={barcode}` param.
  const deepLink = buildDeepLink(retailer, base, barcode);

  return buildBookingUrl(deepLink, 'comparateur-prix', 'prix-comparateur');
}

/** Build retailer-specific deep link when the retailer supports it. */
function buildDeepLink(retailer: string, base: string, barcode: string | undefined): string {
  if (!barcode) return base;

  const encoded = encodeURIComponent(barcode);

  if (retailer === 'Carrefour' || retailer === 'Carrefour Market') {
    return `https://www.carrefour.fr/recherche?q=${encoded}`;
  }
  if (retailer === 'E.Leclerc') {
    return `https://www.e.leclerc/recherche?q=${encoded}`;
  }
  if (retailer === 'Intermarché' || retailer === 'Intermarché (métropole)') {
    return `https://www.intermarche.com/nos-produits/recherche?term=${encoded}`;
  }
  if (retailer === 'Score Réunion') {
    return `https://www.score.re/catalogsearch/result/?q=${encoded}`;
  }
  if (retailer === 'Auchan Réunion') {
    return `https://www.auchan.fr/recherche?q=${encoded}`;
  }
  if (retailer === 'Monoprix Martinique') {
    return `https://www.monoprix.fr/recherche?q=${encoded}`;
  }
  if (retailer === 'Cora') {
    return `https://www.cora.fr/courses/recherche?q=${encoded}`;
  }
  if (retailer === 'Super U / Hyper U' || retailer === 'Super U (métropole)') {
    return `https://www.coursesu.com/recherche?q=${encoded}`;
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

// ── Allowed retailer hostnames ────────────────────────────────────────────────
// Exact hostnames (or suffix-matched) that are considered valid retailer URLs.
// Any generated URL whose hostname is NOT in this set is rejected and replaced
// with the internal /comparateur route, preventing wrong-domain redirects.

const ALLOWED_RETAILER_HOSTNAMES: readonly string[] = [
  'carrefour.fr',
  'carrefour.com',
  'e.leclerc',
  'coursesu.com',
  'leaderprice.fr',
  'intermarche.com',
  'match.fr',
  'auchan.fr',
  'supercasino.fr',
  'aldi.fr',
  'lidl.fr',
  'spar.fr',
  'ecomax.fr',
  'score.re',
  '123.click',
  'monoprix.fr',
  'cora.fr',
];

/**
 * Validate that a retailer URL points to a known, expected retailer domain.
 *
 * Prevents wrong-domain redirects (e.g. an unexpected cached or malformed URL
 * landing on an unrelated site) by checking the URL hostname against an
 * allowlist of known retailer domains.
 *
 * @param url  Any string URL — typically the output of buildRetailerUrl().
 * @returns    The original URL when the hostname is safe, or '/comparateur'
 *             as a fallback when the URL is null / unparseable / off-allowlist.
 *
 * @example
 * safeRetailerUrl('https://www.e.leclerc/?utm_source=...')  // → unchanged
 * safeRetailerUrl('https://www.example.com/...')            // → '/comparateur'
 * safeRetailerUrl(null)                                     // → '/comparateur'
 */
export function safeRetailerUrl(url: string | null | undefined): string {
  if (!url) return '/comparateur';
  try {
    const { hostname } = new URL(url);
    const safe = ALLOWED_RETAILER_HOSTNAMES.some(
      (domain) => hostname === domain || hostname.endsWith(`.${domain}`)
    );
    return safe ? url : '/comparateur';
  } catch {
    return '/comparateur';
  }
}

/**
 * Boolean guard — returns `true` only when the URL hostname is on the
 * retailer allowlist.  Use this for conditional rendering (e.g. show/hide
 * an affiliate button):
 *
 * @example
 * const url = buildRetailerUrl(retailer, barcode);
 * if (!isValidRetailerUrl(url)) return null;          // abort render
 *
 * @example
 * {isValidRetailerUrl(url) && <a href={url}>Voir le prix</a>}
 */
export function isValidRetailerUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  try {
    const { hostname } = new URL(url);
    return ALLOWED_RETAILER_HOSTNAMES.some(
      (domain) => hostname === domain || hostname.endsWith(`.${domain}`)
    );
  } catch {
    return false;
  }
}

// ── Retailer status utility ───────────────────────────────────────────────────

export interface RetailerStatus {
  name: string;
  url: string | null;
  hasLink: boolean;
}

/**
 * Return all known retailers with their URL and link status.
 * Retailers with a valid link are sorted first.
 * Useful for dashboard listing of all configured enseignes.
 */
export function getAllRetailersWithStatus(): RetailerStatus[] {
  const all = [
    ...Object.keys(RETAILER_URLS),
    // Enseignes without a URL yet configured
    'Grossistes',
  ];
  return [...new Set(all)]
    .map((name) => {
      const url = buildRetailerUrl(name);
      return { name, url, hasLink: isValidRetailerUrl(url) };
    })
    .sort((a, b) => Number(b.hasLink) - Number(a.hasLink));
}
