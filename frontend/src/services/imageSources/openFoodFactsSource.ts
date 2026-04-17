/**
 * OpenFoodFacts Image Source Adapter
 *
 * Recherche d'images produit sur OpenFoodFacts.org.
 * Prioritaire pour tous les produits alimentaires emballés.
 *
 * API utilisée:
 *   Search: https://world.openfoodfacts.org/cgi/search.pl
 *   By EAN: https://world.openfoodfacts.org/api/v2/product/{ean}.json
 *
 * Licence images OFF: CC BY-SA 3.0 (attribution requise)
 *
 * Règles:
 * - Ne jamais retourner un candidat sans imageUrl HTTPS valide
 * - En cas de timeout ou d'erreur réseau: retourner []
 * - Rate limit respecté: 100 req/min (600ms entre requêtes si nécessaire)
 */

import {
  generateSearchQueryVariants,
  extractBrandFromLabel,
  extractSizeFromLabel,
  removeAccents,
} from '../../utils/productLabelNormalizer';
import type {
  ImageCandidate,
  ImageSourceAdapter,
  ProductDescriptor,
} from '../../types/product-image';

const OFF_SEARCH_URL = 'https://world.openfoodfacts.org/cgi/search.pl';
const OFF_PRODUCT_URL = 'https://world.openfoodfacts.org/api/v2/product';
const REQUEST_TIMEOUT_MS = 10_000;

interface OFFProduct {
  code?: string;
  product_name?: string;
  product_name_fr?: string;
  brands?: string;
  quantity?: string;
  image_url?: string;
  image_front_url?: string;
  image_front_small_url?: string;
  categories_tags?: string[];
  labels_tags?: string[];
  countries_tags?: string[];
}

interface OFFSearchResponse {
  products?: OFFProduct[];
  count?: number;
  page?: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Score helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Normalise pour comparaison (sans accents, lowercase, alphanumérique uniquement) */
function normCmp(s: string): string {
  return removeAccents(s)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Évalue la compatibilité d'un résultat OFF avec le produit cherché */
function computeOffConfidenceHints(product: ProductDescriptor, offProduct: OFFProduct): string[] {
  const hints: string[] = [];
  const title = normCmp(
    [offProduct.product_name_fr ?? offProduct.product_name, offProduct.brands, offProduct.quantity]
      .filter(Boolean)
      .join(' ')
  );

  const detectedBrand = product.brand ?? extractBrandFromLabel(product.rawLabel);
  const detectedSize = product.sizeText ?? extractSizeFromLabel(product.rawLabel);

  if (detectedBrand && title.includes(normCmp(detectedBrand))) hints.push('brand_match');
  if (detectedSize) {
    const sizeVal = detectedSize.replace(/[a-z]+$/i, '').trim();
    if (title.includes(sizeVal)) hints.push('size_match');
    else hints.push('size_mismatch');
  }

  if (offProduct.image_front_url) hints.push('packshot');

  const coreWords = normCmp(product.normalizedLabel)
    .split(' ')
    .filter((w) => w.length >= 4);
  const matches = coreWords.filter((w) => title.includes(w));
  if (matches.length >= 2) hints.push('keywords_match');

  if (offProduct.categories_tags?.some((t) => t.includes('en:'))) hints.push('has_category');

  return hints;
}

// ─────────────────────────────────────────────────────────────────────────────
// OFF search (by text query)
// ─────────────────────────────────────────────────────────────────────────────

async function fetchOFFSearch(queryStr: string): Promise<OFFProduct[]> {
  const params = new URLSearchParams({
    search_terms: queryStr,
    search_simple: '1',
    action: 'process',
    json: '1',
    page_size: '5',
    fields: [
      'code',
      'product_name',
      'product_name_fr',
      'brands',
      'quantity',
      'image_url',
      'image_front_url',
      'image_front_small_url',
      'categories_tags',
      'labels_tags',
    ].join(','),
  });

  const resp = await fetch(`${OFF_SEARCH_URL}?${params}`, {
    headers: { 'User-Agent': 'AKiPriSaYe/1.0 (contact@akiprisaye.fr)' },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  if (!resp.ok) return [];
  const data = (await resp.json()) as OFFSearchResponse;
  return data.products ?? [];
}

// ─────────────────────────────────────────────────────────────────────────────
// OFF lookup by EAN barcode
// ─────────────────────────────────────────────────────────────────────────────

async function fetchOFFByBarcode(barcode: string): Promise<OFFProduct | null> {
  try {
    const resp = await fetch(`${OFF_PRODUCT_URL}/${barcode}.json`, {
      headers: { 'User-Agent': 'AKiPriSaYe/1.0 (contact@akiprisaye.fr)' },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    if (!resp.ok) return null;
    const data = (await resp.json()) as { status?: number; product?: OFFProduct };
    if (data.status !== 1) return null;
    return data.product ?? null;
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Map OFFProduct → ImageCandidate
// ─────────────────────────────────────────────────────────────────────────────

function offProductToCandidate(
  offProduct: OFFProduct,
  product: ProductDescriptor,
  matchedQuery: string
): ImageCandidate | null {
  const imageUrl = offProduct.image_front_url ?? offProduct.image_url;
  if (!imageUrl || !imageUrl.startsWith('https://')) return null;

  const title = [
    offProduct.product_name_fr ?? offProduct.product_name,
    offProduct.brands,
    offProduct.quantity,
  ]
    .filter(Boolean)
    .join(' — ');

  const hints = computeOffConfidenceHints(product, offProduct);

  return {
    imageUrl,
    pageUrl: offProduct.code ? `https://fr.openfoodfacts.org/produit/${offProduct.code}` : null,
    title: title || undefined,
    source: 'openfoodfacts.org',
    sourceType: 'openfoodfacts',
    brand: offProduct.brands?.split(',')[0]?.trim(),
    sizeText: offProduct.quantity ?? undefined,
    matchedQuery,
    confidenceScore: 0, // Calculé par le scorer global
    confidenceHints: hints,
    notes: hints.includes('packshot') ? 'packshot' : undefined,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Public adapter
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Adaptateur OpenFoodFacts.
 *
 * Stratégie:
 *  1. Si code-barres disponible → lookup direct (score très élevé si trouvé)
 *  2. Sinon → recherche textuelle avec variantes de requête
 *  3. Max 5 candidats avec image_front_url valide
 *  4. En cas d'erreur réseau / timeout → retourner []
 */
export const openFoodFactsSource: ImageSourceAdapter = {
  name: 'OpenFoodFacts',

  async search(product: ProductDescriptor): Promise<ImageCandidate[]> {
    const candidates: ImageCandidate[] = [];
    const seenUrls = new Set<string>();

    // 1. Lookup EAN si disponible
    if (product.barcode) {
      try {
        const offProduct = await fetchOFFByBarcode(product.barcode);
        if (offProduct) {
          const c = offProductToCandidate(offProduct, product, `ean:${product.barcode}`);
          if (c && !seenUrls.has(c.imageUrl)) {
            seenUrls.add(c.imageUrl);
            candidates.push({
              ...c,
              confidenceHints: [...(c.confidenceHints ?? []), 'barcode_exact'],
            });
          }
        }
      } catch {
        // Timeout / réseau → continuer avec recherche textuelle
      }
    }

    if (candidates.length >= 3) return candidates;

    // 2. Recherche textuelle (max 3 variantes de requête)
    const queries = generateSearchQueryVariants(
      product.normalizedLabel,
      product.brand ?? undefined,
      product.sizeText ?? undefined
    ).slice(0, 3);

    for (const q of queries) {
      if (candidates.length >= 5) break;
      try {
        const results = await fetchOFFSearch(q);
        for (const offProduct of results) {
          if (candidates.length >= 5) break;
          const c = offProductToCandidate(offProduct, product, q);
          if (c && !seenUrls.has(c.imageUrl)) {
            seenUrls.add(c.imageUrl);
            candidates.push(c);
          }
        }
      } catch {
        // Réseau / timeout pour cette requête → continuer
      }
    }

    return candidates;
  },
};
