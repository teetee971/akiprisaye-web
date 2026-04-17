/**
 * Retailer Search Source Adapter
 *
 * Recherche d'images produit sur les sites d'enseignes de grande distribution.
 * Le web scraping est désormais autorisé — les connecteurs sont actifs et
 * utilisent le proxy Cloudflare /api/retailer-search pour contourner les
 * restrictions CORS côté navigateur.
 *
 * Enseignes supportées:
 *  1. U / Courses U (coursesu.com)
 *  2. Carrefour (carrefour.fr)
 *  3. E.Leclerc (e.leclerc)
 *  4. Casino (casino.fr)
 *
 * ─── FORMAT CANDIDAT ──────────────────────────────────────────────────────
 *
 * {
 *   imageUrl: "https://...",        ← URL image produit (https)
 *   pageUrl: "https://...",         ← URL fiche produit
 *   title: "...",                   ← libellé produit sur le site
 *   source: "coursesu.com",
 *   sourceType: "retailer",
 *   brand: "U",
 *   sizeText: "300g",
 *   matchedQuery: "...",
 *   confidenceScore: 0,
 *   confidenceHints: ["brand_match", "packshot"],
 *   notes: "packshot"
 * }
 */

import type {
  ImageCandidate,
  ImageSourceAdapter,
  ProductDescriptor,
} from '../../types/product-image';

// ─────────────────────────────────────────────────────────────────────────────
// Proxy base URL — same origin in production, empty string uses relative URL
// ─────────────────────────────────────────────────────────────────────────────

const PROXY_BASE = (import.meta.env.VITE_PRICE_API_BASE ?? '').replace(/\/$/, '');
const PROXY_TIMEOUT_MS = 6000;

// ─────────────────────────────────────────────────────────────────────────────
// Retailer connector type
// ─────────────────────────────────────────────────────────────────────────────

interface RetailerConnector {
  name: string;
  domain: string;
  /** Marques ou catégories couverts par ce connecteur */
  covers: RegExp[];
  /** True si le connecteur est implémenté et actif */
  active: boolean;
  /**
   * Recherche un produit sur le site de l'enseigne via le proxy Cloudflare.
   * Retourner [] si indisponible ou hors périmètre.
   */
  fetch(product: ProductDescriptor): Promise<ImageCandidate[]>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared proxy fetch helper
// ─────────────────────────────────────────────────────────────────────────────

type RetailerSearchResult = {
  status: 'OK' | 'NO_DATA' | 'UNAVAILABLE';
  retailer: string;
  results: Array<{
    title: string;
    imageUrl?: string;
    pageUrl?: string;
    brand?: string;
    price?: number;
    sizeText?: string;
  }>;
};

async function fetchFromProxy(
  retailer: string,
  product: ProductDescriptor
): Promise<ImageCandidate[]> {
  const query = product.barcode ?? product.normalizedLabel ?? '';
  if (!query) return [];

  const params = new URLSearchParams({
    retailer,
    q: query,
    pageSize: '6',
  });

  const url = `${PROXY_BASE}/api/retailer-search?${params.toString()}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), PROXY_TIMEOUT_MS);

  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) return [];

    const payload = (await response.json()) as RetailerSearchResult;
    if (payload.status !== 'OK' || !Array.isArray(payload.results)) return [];

    return payload.results
      .filter((r) => r.title)
      .map(
        (r): ImageCandidate => ({
          imageUrl: r.imageUrl ?? '',
          pageUrl: r.pageUrl,
          title: r.title,
          source: retailer,
          sourceType: 'retailer',
          brand: r.brand,
          sizeText: r.sizeText,
          matchedQuery: query,
          confidenceScore: r.imageUrl ? 60 : 30,
          confidenceHints: [
            ...(r.imageUrl ? ['packshot'] : []),
            ...(r.brand ? ['brand_match'] : []),
          ],
          notes: r.imageUrl ? 'packshot' : undefined,
        })
      )
      .filter((c) => c.imageUrl && /^https?:\/\//i.test(c.imageUrl));
  } catch {
    return [];
  } finally {
    clearTimeout(timeoutId);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Connector: Courses U / coursesu.com
// ─────────────────────────────────────────────────────────────────────────────

const coursesUConnector: RetailerConnector = {
  name: 'Courses U',
  domain: 'coursesu.com',
  covers: [/\bU\b/i, /\bU\s+bio\b/i, /\bU\s+Express\b/i, /\bSuper\s*U\b/i, /\bHyper\s*U\b/i],
  active: true,

  async fetch(product: ProductDescriptor): Promise<ImageCandidate[]> {
    return fetchFromProxy('coursesu', product);
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Connector: Carrefour
// ─────────────────────────────────────────────────────────────────────────────

const carrefourConnector: RetailerConnector = {
  name: 'Carrefour',
  domain: 'carrefour.fr',
  covers: [/\bcarrefour\b/i],
  active: true,

  async fetch(product: ProductDescriptor): Promise<ImageCandidate[]> {
    return fetchFromProxy('carrefour', product);
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Connector: E.Leclerc
// ─────────────────────────────────────────────────────────────────────────────

const leclercConnector: RetailerConnector = {
  name: 'E.Leclerc',
  domain: 'e.leclerc',
  covers: [/\bleclerc\b/i],
  active: true,

  async fetch(product: ProductDescriptor): Promise<ImageCandidate[]> {
    return fetchFromProxy('leclerc', product);
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Connector: Casino / Monoprix
// ─────────────────────────────────────────────────────────────────────────────

const casinoConnector: RetailerConnector = {
  name: 'Casino',
  domain: 'casino.fr',
  covers: [/\bcasino\b/i, /\bmonoprix\b/i],
  active: true,

  async fetch(product: ProductDescriptor): Promise<ImageCandidate[]> {
    return fetchFromProxy('casino', product);
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Connector: Intermarché
// ─────────────────────────────────────────────────────────────────────────────

const intermarcheConnector: RetailerConnector = {
  name: 'Intermarché',
  domain: 'intermarche.com',
  covers: [/\bintermarch[eé]\b/i, /\bintermarch\b/i],
  active: true,

  async fetch(product: ProductDescriptor): Promise<ImageCandidate[]> {
    return fetchFromProxy('intermarche', product);
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Connector: Leader Price
// ─────────────────────────────────────────────────────────────────────────────

const leaderPriceConnector: RetailerConnector = {
  name: 'Leader Price',
  domain: 'leaderprice.fr',
  covers: [/\bleader\s*price\b/i],
  active: true,

  async fetch(product: ProductDescriptor): Promise<ImageCandidate[]> {
    return fetchFromProxy('leaderprice', product);
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Registered connectors (in priority order)
// ─────────────────────────────────────────────────────────────────────────────

const RETAILER_CONNECTORS: RetailerConnector[] = [
  coursesUConnector,
  intermarcheConnector,
  leaderPriceConnector,
  carrefourConnector,
  leclercConnector,
  casinoConnector,
];

// ─────────────────────────────────────────────────────────────────────────────
// Public adapter
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Adaptateur multi-enseignes.
 *
 * Appelle tous les connecteurs actifs, agrège les candidats.
 * Les connecteurs inactifs retournent [] sans erreur.
 */
export const retailerSearchSource: ImageSourceAdapter = {
  name: 'RetailerSearch',

  async search(product: ProductDescriptor): Promise<ImageCandidate[]> {
    const candidates: ImageCandidate[] = [];
    const seenUrls = new Set<string>();

    for (const connector of RETAILER_CONNECTORS) {
      if (!connector.active) continue;

      try {
        const found = await connector.fetch(product);
        for (const c of found) {
          if (!seenUrls.has(c.imageUrl)) {
            seenUrls.add(c.imageUrl);
            candidates.push(c);
          }
        }
      } catch (err) {
        console.warn(`[RetailerSearchSource] ${connector.name} failed:`, err);
      }

      if (candidates.length >= 5) break;
    }

    return candidates;
  },
};

/** Liste des connecteurs disponibles avec leur statut d'activation */
export function getRetailerConnectorStatus(): Array<{
  name: string;
  domain: string;
  active: boolean;
}> {
  return RETAILER_CONNECTORS.map(({ name, domain, active }) => ({ name, domain, active }));
}
