/**
 * Product Image Resolver
 *
 * Service de résolution d'images produit pour les libellés extraits d'un ticket OCR.
 *
 * Pipeline par produit:
 *  1. Vérifier si image primaire déjà stockée (éviter re-recherche)
 *  2. Détecter si produit ambigu → file de revue directe
 *  3. Générer variantes de requête via productLabelNormalizer
 *  4. Rechercher sur OpenFoodFacts (ou adaptateur configurable)
 *  5. Scorer via productImageScoring
 *  6. Sélectionner la meilleure image selon les seuils
 *  7. Attacher en Firestore (ou skip si db=null)
 *  8. Mettre en file de revue les cas douteux
 *
 * Toutes les fonctions d'accès HTTP passent par l'adaptateur `searchImages`.
 * Pour les tests: injecter un adaptateur stub (voir ImageSearchAdapter).
 *
 * Collections Firestore:
 *   product_images           – image retenue par productKey
 *   product_image_candidates – tous les candidats (audit)
 *   image_review_queue       – file de revue manuelle
 */

import {
  collection,
  addDoc,
  getDocs,
  doc,
  getDoc,
  query,
  where,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

import {
  generateSearchQueryVariants,
  normalizeToProductKey,
  isAmbiguousProduct,
  extractBrandFromLabel,
  extractSizeFromLabel,
} from '../utils/productLabelNormalizer';

import {
  scoreAllCandidates,
  chooseBestCandidate,
  THRESHOLD_AUTO,
  THRESHOLD_REVIEW,
  type ScoringCandidate,
  type ScoringInput,
} from '../utils/productImageScoring';

import type {
  ImageReviewQueueEntry,
  ImageSearchInput,
  ImageSourceType,
  ProductImageAsset,
  ProductImageCandidate,
  ProductSearchImageResult,
  EnrichedProductRecord,
} from '../types/productImage';

// ─────────────────────────────────────────────────────────────────────────────
// Image Search Adapter (extensible)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Adaptateur de recherche d'images.
 * Permet de remplacer OpenFoodFacts par n'importe quelle source.
 */
export type ImageSearchAdapter = (query: string) => Promise<ProductImageCandidate[]>;

/** OpenFoodFacts Search API */
const OFF_SEARCH_URL = 'https://world.openfoodfacts.org/cgi/search.pl';

/** Max candidats conservés par produit */
const MAX_CANDIDATES = 5;
const MAX_REVIEW_CANDIDATES = 3;

// ─────────────────────────────────────────────────────────────────────────────
// OpenFoodFacts adapter (default)
// ─────────────────────────────────────────────────────────────────────────────

interface OFFProduct {
  product_name?: string;
  brands?: string;
  quantity?: string;
  image_url?: string;
  image_front_url?: string;
  categories_tags?: string[];
}

interface OFFSearchResponse {
  products?: OFFProduct[];
}

/**
 * Adaptateur OpenFoodFacts.
 * Retourne des candidats avec URL réelle (jamais inventée).
 * En cas d'erreur réseau / timeout: retourne [].
 */
export async function searchProductImagesOffAdapter(
  queryStr: string
): Promise<ProductImageCandidate[]> {
  const candidates: ProductImageCandidate[] = [];
  try {
    const params = new URLSearchParams({
      search_terms: queryStr,
      search_simple: '1',
      action: 'process',
      json: '1',
      page_size: '5',
      fields: 'product_name,brands,quantity,image_url,image_front_url,categories_tags',
    });

    const resp = await fetch(`${OFF_SEARCH_URL}?${params}`, {
      headers: { 'User-Agent': 'AKiPriSaYe/1.0 (contact@akiprisaye.fr)' },
      signal: AbortSignal.timeout(8000),
    });

    if (!resp.ok) return [];

    const data = (await resp.json()) as OFFSearchResponse;

    for (const p of data.products ?? []) {
      const imageUrl = p.image_front_url ?? p.image_url;
      if (!imageUrl || !imageUrl.startsWith('https://')) continue;

      candidates.push({
        url: imageUrl,
        source: 'openfoodfacts.org',
        sourceType: 'openfoodfacts',
        title: [p.product_name, p.brands, p.quantity].filter(Boolean).join(' — '),
        matchedQuery: queryStr,
        confidenceScore: 0,
        notes: 'packshot',
      });
    }
  } catch {
    // Réseau indisponible / timeout → tableau vide, sans plantage
  }
  return candidates;
}

// ─────────────────────────────────────────────────────────────────────────────
// Firestore helpers
// ─────────────────────────────────────────────────────────────────────────────

function sanitize(obj: unknown): unknown {
  if (obj === null || obj === undefined) return null;
  if (Array.isArray(obj)) return obj.map(sanitize);
  if (typeof obj === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
      if (v !== undefined) out[k] = sanitize(v);
    }
    return out;
  }
  return obj;
}

function genId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

async function getExistingPrimaryImage(productKey: string): Promise<ProductImageAsset | null> {
  if (!db) return null;
  try {
    const snap = await getDocs(
      query(
        collection(db, 'product_images'),
        where('productKey', '==', productKey),
        where('isPrimary', '==', true)
      )
    );
    if (snap.empty) return null;
    return { ...(snap.docs[0].data() as Omit<ProductImageAsset, 'id'>), id: snap.docs[0].id };
  } catch {
    return null;
  }
}

/** Persiste une image produit retenue */
export async function attachImageToProduct(
  productKey: string,
  image: ProductImageAsset
): Promise<void> {
  if (!db) return;
  try {
    await addDoc(
      collection(db, 'product_images'),
      sanitize({
        ...image,
        productKey,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }) as Record<string, unknown>
    );
  } catch (err) {
    console.error('[ProductImageResolver] attachImageToProduct:', err);
  }
}

/** Ajoute les candidats dans la file de revue manuelle */
export async function enqueueImageReview(
  productKey: string,
  rawLabel: string,
  candidates: ProductImageCandidate[],
  reasons: string[],
  receiptId?: string
): Promise<void> {
  if (!db) return;
  const entry: ImageReviewQueueEntry = {
    id: genId(),
    productKey,
    rawLabel,
    candidates: candidates.slice(0, MAX_REVIEW_CANDIDATES),
    reasons,
    status: 'pending',
    receiptId,
    createdAt: new Date().toISOString(),
  };
  try {
    await addDoc(
      collection(db, 'image_review_queue'),
      sanitize({ ...entry, createdAt: serverTimestamp() }) as Record<string, unknown>
    );
  } catch (err) {
    console.error('[ProductImageResolver] enqueueImageReview:', err);
  }
}

async function persistCandidates(
  productKey: string,
  candidates: ProductImageCandidate[]
): Promise<void> {
  if (!db || candidates.length === 0) return;
  try {
    for (const c of candidates.slice(0, MAX_CANDIDATES)) {
      await addDoc(
        collection(db, 'product_image_candidates'),
        sanitize({ ...c, productKey, createdAt: serverTimestamp() }) as Record<string, unknown>
      );
    }
  } catch {
    // best-effort
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Core: resolve one product
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Résout l'image pour un seul produit.
 *
 * @param input   - Descripteur produit
 * @param adapter - Adaptateur de recherche (default: OFF). Injecter un stub pour les tests.
 */
export async function resolveImageForProduct(
  input: ImageSearchInput,
  adapter: ImageSearchAdapter = searchProductImagesOffAdapter
): Promise<ProductSearchImageResult> {
  const base: ProductSearchImageResult = {
    productKey: input.productKey,
    rawLabel: input.rawLabel,
    normalizedLabel: input.normalizedLabel,
    candidates: [],
    needsReview: false,
    status: 'not_found',
  };

  // 1. Image primaire déjà existante
  const existing = await getExistingPrimaryImage(input.productKey);
  if (existing && existing.confidenceScore >= THRESHOLD_REVIEW) {
    return { ...base, chosenImage: existing, status: 'matched', needsReview: existing.needsReview };
  }

  // 2. Produit ambigu → revue directe
  if (isAmbiguousProduct(input.rawLabel)) {
    await enqueueImageReview(
      input.productKey,
      input.rawLabel,
      [],
      ['Produit ambigu — validation manuelle requise'],
      input.receiptId
    );
    return { ...base, chosenImage: null, status: 'ambiguous', needsReview: true };
  }

  // 3. Générer requêtes
  const queries = generateSearchQueryVariants(
    input.rawLabel,
    input.brand ?? undefined,
    input.size ?? undefined
  );

  // 4. Rechercher (max 3 requêtes pour limiter la charge)
  const allCandidates: ProductImageCandidate[] = [];
  for (const q of queries.slice(0, 3)) {
    const found = await adapter(q);
    allCandidates.push(...found);
    if (allCandidates.length >= MAX_CANDIDATES) break;
  }

  // 5. Scorer
  const scoringInput: ScoringInput = {
    rawLabel: input.rawLabel,
    normalizedLabel: input.normalizedLabel,
    brand: input.brand,
    size: input.size,
    category: input.category,
  };

  const scoringCandidates: ScoringCandidate[] = allCandidates.map((c) => ({
    url: c.url,
    source: c.source,
    sourceType: c.sourceType as ImageSourceType,
    title: c.title,
    matchedQuery: c.matchedQuery,
    notes: c.notes,
  }));

  const scored = scoreAllCandidates(scoringInput, scoringCandidates);
  const enrichedCandidates: ProductImageCandidate[] = scored.slice(0, MAX_CANDIDATES).map((s) => ({
    url: s.url,
    source: s.source,
    sourceType: s.sourceType,
    title: s.title,
    matchedQuery: s.matchedQuery,
    confidenceScore: s.confidenceScore,
    notes: s.notes,
  }));

  await persistCandidates(input.productKey, enrichedCandidates);

  // 6. Sélection
  const best = chooseBestCandidate(scoringInput, scoringCandidates);

  if (!best) {
    await enqueueImageReview(
      input.productKey,
      input.rawLabel,
      enrichedCandidates,
      [`Score max: ${scored[0]?.confidenceScore ?? 0}/100 < ${THRESHOLD_REVIEW}`],
      input.receiptId
    );
    return {
      ...base,
      candidates: enrichedCandidates,
      chosenImage: null,
      status: enrichedCandidates.length > 0 ? 'ambiguous' : 'not_found',
      needsReview: true,
    };
  }

  const now = new Date().toISOString();
  const chosen: ProductImageAsset = {
    id: genId(),
    productKey: input.productKey,
    territory: input.territory,
    imageUrl: best.candidate.url,
    source: best.candidate.source,
    sourceType: best.candidate.sourceType,
    confidenceScore: best.candidate.confidenceScore,
    isPrimary: true,
    needsReview: best.needsReview,
    createdAt: now,
    updatedAt: now,
  };

  await attachImageToProduct(input.productKey, chosen);

  if (best.needsReview) {
    await enqueueImageReview(
      input.productKey,
      input.rawLabel,
      enrichedCandidates,
      [`Score ${best.candidate.confidenceScore}/100 — validation recommandée`],
      input.receiptId
    );
  }

  return {
    ...base,
    chosenImage: chosen,
    candidates: enrichedCandidates,
    status: 'matched',
    needsReview: best.needsReview,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Ticket hydration
// ─────────────────────────────────────────────────────────────────────────────

type TicketItem = {
  rawLabel: string;
  normalizedLabel?: string;
  productBrand?: string;
  packageSizeValue?: number;
  packageSizeUnit?: string;
  category?: string;
  barcode?: string | null;
};

/**
 * Résout les images pour tous les produits d'un ticket.
 *
 * @param receiptId     - ID Firestore du ticket
 * @param receiptRecord - Ticket en mémoire (optionnel, évite un aller-retour Firestore)
 * @param adapter       - Adaptateur de recherche (injecter stub pour les tests)
 */
export async function hydrateMissingProductImagesFromTicket(
  receiptId: string,
  receiptRecord?: { items: TicketItem[] },
  adapter: ImageSearchAdapter = searchProductImagesOffAdapter
): Promise<ProductSearchImageResult[]> {
  let items = receiptRecord?.items;

  if (!items && db) {
    try {
      const snap = await getDoc(doc(db, 'receipts', receiptId));
      if (snap.exists()) {
        items = (snap.data() as { items?: TicketItem[] }).items ?? [];
      }
    } catch (err) {
      console.error('[ProductImageResolver] hydrate: load receipt failed:', err);
      return [];
    }
  }

  if (!items?.length) return [];

  const results: ProductSearchImageResult[] = [];
  for (const item of items) {
    const normalizedLabel = item.normalizedLabel ?? item.rawLabel;
    const productKey = normalizeToProductKey(normalizedLabel);
    const size =
      item.packageSizeValue !== undefined && item.packageSizeUnit
        ? `${item.packageSizeValue}${item.packageSizeUnit}`
        : extractSizeFromLabel(item.rawLabel);

    const imageInput: ImageSearchInput = {
      rawLabel: item.rawLabel,
      normalizedLabel,
      brand: item.productBrand ?? extractBrandFromLabel(item.rawLabel),
      size,
      category: item.category,
      barcode: item.barcode ?? undefined,
      productKey,
      receiptId,
    };

    results.push(await resolveImageForProduct(imageInput, adapter));
  }
  return results;
}

// ─────────────────────────────────────────────────────────────────────────────
// Report builder
// ─────────────────────────────────────────────────────────────────────────────

export interface ImageResolutionReport {
  autoMatched: ProductSearchImageResult[];
  reviewRequired: ProductSearchImageResult[];
  notFound: ProductSearchImageResult[];
  summary: {
    total: number;
    autoMatched: number;
    reviewRequired: number;
    notFound: number;
  };
}

export function buildImageResolutionReport(
  results: ProductSearchImageResult[]
): ImageResolutionReport {
  const autoMatched = results.filter((r) => r.status === 'matched' && !r.needsReview);
  const reviewRequired = results.filter((r) => r.needsReview || r.status === 'ambiguous');
  const notFound = results.filter((r) => r.status === 'not_found');
  return {
    autoMatched,
    reviewRequired,
    notFound,
    summary: {
      total: results.length,
      autoMatched: autoMatched.length,
      reviewRequired: reviewRequired.length,
      notFound: notFound.length,
    },
  };
}

// Re-exports from utilities (single import point for consumers)
export {
  generateSearchQueryVariants,
  normalizeToProductKey,
  isAmbiguousProduct,
  extractBrandFromLabel,
  extractSizeFromLabel,
  THRESHOLD_AUTO,
  THRESHOLD_REVIEW,
  type EnrichedProductRecord,
};

export { scoreAllCandidates, chooseBestCandidate };
