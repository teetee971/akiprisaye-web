/**
 * Product Image Resolver — Service de résolution d'images produit
 *
 * Pour chaque libellé produit extrait d'un ticket OCR:
 *  1. Générer des variantes de requête de recherche
 *  2. Interroger OpenFoodFacts (source ouverte, alimentaire)
 *  3. Scorer les candidats (matching marque, grammage, catégorie, source)
 *  4. Sélectionner la meilleure image selon les seuils de confiance
 *  5. Attacher l'image au productKey en base
 *  6. Mettre en file de revue manuelle les cas douteux
 *
 * Sources prioritaires:
 *  1. Images officielles marque (si URL connue)
 *  2. OpenFoodFacts (images libres, alimentaire uniquement)
 *  3. Fallback → file de revue manuelle
 *
 * Contraintes:
 * - Aucune URL inventée — tout candidat doit provenir d'une source réelle
 * - Score < 60 → ne pas attacher automatiquement
 * - Score 60-79 → attacher + needsReview = true
 * - Score >= 80 → auto-attach
 * - Conserver max 5 candidats par produit (3 pour la file de revue)
 *
 * ⚠️ RGPD: aucune image personnelle, uniquement images packaging produit.
 */

import {
  collection,
  addDoc,
  getDoc,
  getDocs,
  doc,
  query,
  where,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
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
// Constants
// ─────────────────────────────────────────────────────────────────────────────

/** OpenFoodFacts Search API */
const OFF_SEARCH_URL = 'https://world.openfoodfacts.org/cgi/search.pl';

/** Max candidats conservés par produit */
const MAX_CANDIDATES = 5;

/** Max candidats dans la file de revue */
const MAX_REVIEW_CANDIDATES = 3;

/** Seuil auto-attach */
const THRESHOLD_AUTO = 80;

/** Seuil attach avec needsReview */
const THRESHOLD_REVIEW = 60;

/**
 * Marques reconnues dont les images officielles sont stables.
 * Clé = pattern regex, valeur = nom normalisé + domaine officiel.
 */
const KNOWN_BRANDS: Array<{ pattern: RegExp; name: string; domain: string }> = [
  { pattern: /\bcoca[\s-]*cola\b/i,    name: 'Coca-Cola',     domain: 'coca-cola.fr' },
  { pattern: /\bdamoiseau\b/i,         name: 'Damoiseau',     domain: 'damoiseau.com' },
  { pattern: /\bpepsi\b/i,             name: 'Pepsi',         domain: 'pepsi.fr' },
  { pattern: /\bnestl[eé]\b/i,         name: 'Nestlé',        domain: 'nestle.fr' },
  { pattern: /\bdanone\b/i,            name: 'Danone',        domain: 'danone.fr' },
  { pattern: /\byoplait\b/i,           name: 'Yoplait',       domain: 'yoplait.fr' },
  { pattern: /\bpom['\s]potes?\b/i,    name: 'Pom\'Potes',    domain: 'pompotes.fr' },
  { pattern: /\bpanzani\b/i,           name: 'Panzani',       domain: 'panzani.fr' },
  { pattern: /\blusucre\b/i,           name: 'Lusurcre',      domain: 'lesucre.com' },
  { pattern: /\bmaille\b/i,            name: 'Maille',        domain: 'maille.com' },
  { pattern: /\bheinz\b/i,             name: 'Heinz',         domain: 'heinz.fr' },
  { pattern: /\bkraft\b/i,             name: 'Kraft',         domain: 'kraftheinz.com' },
  { pattern: /\bknorr\b/i,             name: 'Knorr',         domain: 'knorr.fr' },
  { pattern: /\bmaggi\b/i,             name: 'Maggi',         domain: 'maggi.fr' },
  { pattern: /\bb[oa]n\s*mamam\b/i,    name: 'Bonne Maman',   domain: 'bonnemaman.fr' },
  { pattern: /\blangers\b/i,           name: 'Langer\'s',     domain: 'langers.com' },
];

/**
 * Produits ambigus devant toujours passer en revue manuelle.
 * Ces libellés sont trop génériques ou peu connus pour une association auto.
 */
const AMBIGUOUS_PATTERNS: RegExp[] = [
  /sucre\s+b[âa]tonnets/i,
  /museau\s+de\s+b[œoe]uf/i,
  /saucisson\s+ail/i,
  /fromage\s+pasteuris[eé]\s+noix/i,
  /parmigiano\s+r[âa]p[eé]/i,
  /emmental\s+r[âa]p[eé]/i,
  /hitcoko/i,
];

// ─────────────────────────────────────────────────────────────────────────────
// ID generation (browser-compatible)
// ─────────────────────────────────────────────────────────────────────────────

function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Firestore sanitization
// ─────────────────────────────────────────────────────────────────────────────

function sanitizeForFirestore(obj: unknown): unknown {
  if (obj === null || obj === undefined) return null;
  if (Array.isArray(obj)) return obj.map(sanitizeForFirestore);
  if (typeof obj === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
      if (v !== undefined) {
        out[k] = sanitizeForFirestore(v);
      }
    }
    return out;
  }
  return obj;
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. Query normalization
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Supprime les accents d'une chaîne (pour les requêtes ASCII-only).
 */
function removeAccents(str: string): string {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

/**
 * Extrait le grammage/volume d'un libellé produit.
 * Ex: "LAIT 1L" → "1L", "CHIPS 300G" → "300g"
 */
function extractSizeFromLabel(label: string): string | undefined {
  const m = label.match(/\b(\d+(?:[.,]\d+)?)\s*(kg|g|l|ml|cl|oz)\b/i);
  if (!m) return undefined;
  return `${m[1]}${m[2].toLowerCase()}`;
}

/**
 * Extrait la marque d'un libellé produit via le dictionnaire des marques connues.
 */
function extractBrandFromLabel(label: string): string | undefined {
  for (const { pattern, name } of KNOWN_BRANDS) {
    if (pattern.test(label)) return name;
  }
  // Détecter le marqueur d'enseigne U (marque propre)
  if (/\bU\s+(?:Bio|Express|Casino)?|\bU\b(?:\s+\d)/i.test(label)) return 'U';
  return undefined;
}

/**
 * Génère plusieurs variantes de requête de recherche pour un produit.
 *
 * Stratégie:
 * - Variante 1: libellé original complet
 * - Variante 2: libellé sans accents
 * - Variante 3: marque en tête + mots-clés + grammage
 * - Variante 4: "site officiel" + marque + libellé court
 * - Variante 5: libellé court (sans grammage ni marque)
 *
 * @param label  - Libellé produit (brut ou normalisé)
 * @param brand  - Marque si déjà connue
 * @param size   - Grammage/volume si déjà extrait
 */
export function normalizeImageSearchQuery(
  label: string,
  brand?: string,
  size?: string,
): string[] {
  const queries = new Set<string>();

  const cleanLabel = label.trim();
  const detectedBrand = brand ?? extractBrandFromLabel(cleanLabel);
  const detectedSize = size ?? extractSizeFromLabel(cleanLabel);

  // Variante 1: libellé complet
  queries.add(cleanLabel);

  // Variante 2: sans accents
  const noAccents = removeAccents(cleanLabel);
  if (noAccents !== cleanLabel) queries.add(noAccents);

  // Variante 3: marque en tête + libellé simplifié + grammage
  if (detectedBrand) {
    const withBrand = detectedSize
      ? `${detectedBrand} ${cleanLabel.replace(new RegExp(detectedBrand, 'i'), '').trim()} ${detectedSize}`
      : `${detectedBrand} ${cleanLabel.replace(new RegExp(detectedBrand, 'i'), '').trim()}`;
    queries.add(withBrand.replace(/\s+/g, ' ').trim());
  }

  // Variante 4: "site officiel" + marque + libellé court (sans grammage)
  if (detectedBrand) {
    const shortLabel = cleanLabel
      .replace(new RegExp(detectedBrand, 'i'), '')
      .replace(/\b\d+(?:[.,]\d+)?\s*(?:kg|g|l|ml|cl|oz)\b/i, '')
      .replace(/\s+/g, ' ')
      .trim();
    queries.add(`site officiel ${detectedBrand} ${shortLabel}`.trim());
  }

  // Variante 5: libellé sans grammage ni marque
  let shortQuery = cleanLabel
    .replace(/\b\d+(?:[.,]\d+)?\s*(?:kg|g|l|ml|cl|oz)\b/i, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (detectedBrand) {
    shortQuery = shortQuery.replace(new RegExp(detectedBrand, 'i'), '').replace(/\s+/g, ' ').trim();
  }
  if (shortQuery.length >= 3 && shortQuery !== cleanLabel) {
    queries.add(shortQuery);
  }

  return [...queries].filter((q) => q.length >= 3).slice(0, 5);
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. OpenFoodFacts image search
// ─────────────────────────────────────────────────────────────────────────────

/** Shape minimale de la réponse OFF Search */
interface OFFSearchProduct {
  product_name?: string;
  brands?: string;
  quantity?: string;
  image_url?: string;
  image_front_url?: string;
  image_thumb_url?: string;
  categories_tags?: string[];
  code?: string;
}

interface OFFSearchResponse {
  products?: OFFSearchProduct[];
  count?: number;
}

/**
 * Interroge l'API OpenFoodFacts pour une requête produit.
 * Retourne des candidats avec URL et métadonnées.
 *
 * Si l'API est indisponible ou renvoie une erreur, retourne [] sans planter.
 *
 * @param query - Terme de recherche
 */
export async function searchProductImages(
  query: string,
): Promise<ProductImageCandidate[]> {
  const candidates: ProductImageCandidate[] = [];

  try {
    const params = new URLSearchParams({
      search_terms: query,
      search_simple: '1',
      action: 'process',
      json: '1',
      page_size: '5',
      fields: 'product_name,brands,quantity,image_url,image_front_url,image_thumb_url,categories_tags,code',
    });

    const response = await fetch(`${OFF_SEARCH_URL}?${params.toString()}`, {
      method: 'GET',
      headers: { 'User-Agent': 'AKiPriSaYe/1.0 (akiprisaye@contact.fr)' },
      signal: AbortSignal.timeout(8000),
    });

    if (!response.ok) return [];

    const data = (await response.json()) as OFFSearchResponse;

    for (const product of data.products ?? []) {
      const imageUrl = product.image_front_url ?? product.image_url;
      if (!imageUrl) continue;

      const candidate: ProductImageCandidate = {
        url: imageUrl,
        source: 'openfoodfacts.org',
        sourceType: 'openfoodfacts',
        title: [product.product_name, product.brands, product.quantity]
          .filter(Boolean)
          .join(' — '),
        matchedQuery: query,
        confidenceScore: 0,  // Calculé par scoreImageCandidate
        notes: 'packshot',
      };

      candidates.push(candidate);
    }
  } catch {
    // Erreur réseau / timeout → retourner [] sans propager
  }

  return candidates;
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. Confidence scoring
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Calcule le score de confiance (0–100) d'un candidat image pour un produit.
 *
 * Critères positifs:
 * +35 — marque match exact dans le titre de l'image
 * +25 — grammage/volume match
 * +15 — libellé principal match (>= 2 mots communs)
 * +10 — catégorie cohérente
 * +10 — source officielle (official / retailer)
 * +5  — image packshot (indiqué dans notes)
 *
 * Malus:
 * -30 — image manifestement non-produit (logo, lifestyle, etc.)
 * -20 — logo seul
 * -15 — grammage incompatible (grammage différent et explicite)
 * -15 — résultat trop générique (titre < 3 mots)
 */
export function scoreImageCandidate(
  input: Pick<ImageSearchInput, 'rawLabel' | 'brand' | 'size' | 'category'>,
  candidate: ProductImageCandidate,
): number {
  let score = 0;
  const titleLower = (candidate.title ?? '').toLowerCase();
  const labelLower = input.rawLabel.toLowerCase();
  const detectedBrand = input.brand ?? extractBrandFromLabel(input.rawLabel);
  const detectedSize = input.size ?? extractSizeFromLabel(input.rawLabel);

  // +35 marque match
  if (detectedBrand && titleLower.includes(detectedBrand.toLowerCase())) {
    score += 35;
  }

  // +25 grammage match
  if (detectedSize) {
    const sizeNoUnit = detectedSize.replace(/[a-z]+$/i, '').trim();
    if (titleLower.includes(sizeNoUnit)) {
      score += 25;
    } else if (detectedSize && titleLower.includes(detectedSize.toLowerCase())) {
      score += 25;
    }
  }

  // +15 libellé principal match (>= 2 mots clés communs, longueur >= 3 chars)
  const keywords = labelLower
    .replace(/\b\d+(?:[.,]\d+)?\s*(?:kg|g|l|ml|cl|oz)\b/gi, '')
    .split(/\s+/)
    .filter((w) => w.length >= 3);
  const titleWords = titleLower.split(/\s+/);
  const commonWords = keywords.filter((kw) => titleWords.some((tw) => tw.includes(kw)));
  if (commonWords.length >= 2) score += 15;
  else if (commonWords.length === 1) score += 7;

  // +10 catégorie cohérente
  if (input.category && titleLower.includes(input.category.toLowerCase().split(/\s/)[0])) {
    score += 10;
  }

  // +10 source officielle
  if (candidate.sourceType === 'official' || candidate.sourceType === 'retailer') {
    score += 10;
  }

  // +5 packshot
  if (candidate.notes?.includes('packshot')) {
    score += 5;
  }

  // Malus: logo seul
  if (candidate.notes?.includes('logo')) score -= 20;

  // Malus: lifestyle / non-produit
  if (candidate.notes?.includes('lifestyle') || candidate.notes?.includes('non-produit')) {
    score -= 30;
  }

  // Malus: titre trop générique (< 3 mots)
  if (titleWords.length < 3) score -= 15;

  // Malus: grammage explicite différent dans le titre
  if (detectedSize) {
    const sizeValue = detectedSize.replace(/[a-z]+$/i, '').trim();
    const titleSizeMatch = titleLower.match(/\b(\d+(?:[.,]\d+)?)\s*(?:kg|g|l|ml|cl|oz)\b/i);
    if (titleSizeMatch && titleSizeMatch[1] !== sizeValue) {
      score -= 15;
    }
  }

  return Math.max(0, Math.min(100, Math.round(score)));
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. Sélection du meilleur candidat
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Choisit le meilleur candidat selon les seuils de confiance.
 *
 * @param input      - Descripteur produit
 * @param candidates - Liste des candidats scorés
 * @returns Meilleure image, ou null si aucun candidat ne dépasse le seuil
 */
export function chooseBestImage(
  input: Pick<ImageSearchInput, 'rawLabel' | 'brand' | 'size' | 'category' | 'productKey'>,
  candidates: ProductImageCandidate[],
): ProductImageAsset | null {
  // Scorer tous les candidats
  const scored = candidates
    .map((c) => ({
      candidate: c,
      score: scoreImageCandidate(input, c),
    }))
    .sort((a, b) => b.score - a.score);

  const best = scored[0];
  if (!best || best.score < THRESHOLD_REVIEW) return null;

  const now = new Date().toISOString();
  const needsReview = best.score < THRESHOLD_AUTO;

  return {
    id: generateId(),
    productKey: input.productKey,
    imageUrl: best.candidate.url,
    source: best.candidate.source,
    sourceType: best.candidate.sourceType,
    confidenceScore: best.score,
    isPrimary: true,
    needsReview,
    createdAt: now,
    updatedAt: now,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. Persistance Firestore
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Attache une image à un productKey en Firestore (collection product_images).
 * Skippé silencieusement si db=null.
 */
export async function attachImageToProduct(
  productKey: string,
  image: ProductImageAsset,
): Promise<void> {
  if (!db) return;

  try {
    await addDoc(
      collection(db, 'product_images'),
      sanitizeForFirestore({
        ...image,
        productKey,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }) as Record<string, unknown>,
    );
  } catch (err) {
    console.error('[ProductImageResolver] attachImageToProduct failed:', err);
  }
}

/**
 * Ajoute les candidats d'un produit dans la file de revue manuelle.
 */
export async function enqueueImageReview(
  productKey: string,
  rawLabel: string,
  candidates: ProductImageCandidate[],
  reasons: string[],
  receiptId?: string,
): Promise<void> {
  if (!db) return;

  const entry: ImageReviewQueueEntry = {
    id: generateId(),
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
      sanitizeForFirestore({ ...entry, createdAt: serverTimestamp() }) as Record<string, unknown>,
    );
  } catch (err) {
    console.error('[ProductImageResolver] enqueueImageReview failed:', err);
  }
}

/**
 * Persiste les candidats bruts pour audit (collection product_image_candidates).
 */
async function persistCandidates(
  productKey: string,
  candidates: ProductImageCandidate[],
): Promise<void> {
  if (!db || candidates.length === 0) return;

  try {
    for (const candidate of candidates.slice(0, MAX_CANDIDATES)) {
      await addDoc(
        collection(db, 'product_image_candidates'),
        sanitizeForFirestore({
          ...candidate,
          productKey,
          createdAt: serverTimestamp(),
        }) as Record<string, unknown>,
      );
    }
  } catch (err) {
    console.error('[ProductImageResolver] persistCandidates failed:', err);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. Vérification image existante
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Retourne l'image primaire existante pour un productKey, si disponible.
 * Évite de re-chercher une image déjà résolue avec un bon score.
 */
async function getExistingPrimaryImage(
  productKey: string,
): Promise<ProductImageAsset | null> {
  if (!db) return null;

  try {
    const q = query(
      collection(db, 'product_images'),
      where('productKey', '==', productKey),
      where('isPrimary', '==', true),
    );
    const snap = await getDocs(q);
    if (snap.empty) return null;

    const data = snap.docs[0].data() as Omit<ProductImageAsset, 'id'>;
    return { ...data, id: snap.docs[0].id };
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. Résolution complète pour un produit
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Détecte si un libellé correspond à un produit ambigu (revue manuelle forcée).
 */
export function isAmbiguousProduct(label: string): boolean {
  return AMBIGUOUS_PATTERNS.some((p) => p.test(label));
}

/**
 * Résout l'image pour un seul produit (libellé + métadonnées).
 *
 * Étapes:
 *  1. Vérifier si image primaire déjà existante (éviter doublons)
 *  2. Vérifier si produit ambigu → file de revue directe
 *  3. Générer variantes de requête
 *  4. Rechercher sur OpenFoodFacts
 *  5. Scorer les candidats
 *  6. Sélectionner la meilleure image
 *  7. Attacher ou mettre en file selon score
 */
export async function resolveImageForProduct(
  input: ImageSearchInput,
): Promise<ProductSearchImageResult> {
  const result: ProductSearchImageResult = {
    productKey: input.productKey,
    rawLabel: input.rawLabel,
    normalizedLabel: input.normalizedLabel,
    candidates: [],
    needsReview: false,
    status: 'not_found',
  };

  // Étape 1: image déjà existante (réutiliser)
  const existing = await getExistingPrimaryImage(input.productKey);
  if (existing && existing.confidenceScore >= THRESHOLD_REVIEW) {
    return {
      ...result,
      chosenImage: existing,
      status: 'matched',
      needsReview: existing.needsReview,
    };
  }

  // Étape 2: produit ambigu → file de revue directe sans recherche auto
  if (isAmbiguousProduct(input.rawLabel)) {
    await enqueueImageReview(
      input.productKey,
      input.rawLabel,
      [],
      ['Produit ambigu — validation manuelle requise'],
      input.receiptId,
    );
    return {
      ...result,
      chosenImage: null,
      status: 'ambiguous',
      needsReview: true,
    };
  }

  // Étape 3: générer les variantes de requête
  const queries = normalizeImageSearchQuery(input.rawLabel, input.brand, input.size);

  // Étape 4: rechercher les candidats sur OFF
  const allCandidates: ProductImageCandidate[] = [];
  for (const q of queries.slice(0, 3)) {  // Max 3 requêtes pour éviter rate-limit
    const found = await searchProductImages(q);
    allCandidates.push(...found);
    if (allCandidates.length >= MAX_CANDIDATES) break;
  }

  // Étape 5: scorer les candidats
  const scoredCandidates = allCandidates
    .map((c) => ({
      ...c,
      confidenceScore: scoreImageCandidate(input, c),
    }))
    .sort((a, b) => b.confidenceScore - a.confidenceScore)
    .slice(0, MAX_CANDIDATES);

  result.candidates = scoredCandidates;

  // Persister les candidats pour audit
  await persistCandidates(input.productKey, scoredCandidates);

  if (scoredCandidates.length === 0) {
    // Aucun candidat trouvé → file de revue
    await enqueueImageReview(
      input.productKey,
      input.rawLabel,
      [],
      ['Aucune image trouvée sur OpenFoodFacts'],
      input.receiptId,
    );
    return { ...result, chosenImage: null, status: 'not_found', needsReview: true };
  }

  // Étape 6: sélectionner la meilleure image
  const bestImage = chooseBestImage(input, scoredCandidates);

  if (!bestImage) {
    // Score insuffisant → file de revue
    const reasons = [
      `Score maximum insuffisant (${scoredCandidates[0]?.confidenceScore ?? 0}/100 < ${THRESHOLD_REVIEW})`,
    ];
    if (scoredCandidates.length > 1) {
      reasons.push(`${scoredCandidates.length} candidats similaires — sélection manuelle recommandée`);
    }
    await enqueueImageReview(input.productKey, input.rawLabel, scoredCandidates, reasons, input.receiptId);
    return {
      ...result,
      chosenImage: null,
      status: scoredCandidates.length > 0 ? 'ambiguous' : 'not_found',
      needsReview: true,
    };
  }

  // Étape 7: attacher l'image
  await attachImageToProduct(input.productKey, bestImage);

  // Si score entre THRESHOLD_REVIEW et THRESHOLD_AUTO → aussi en file de revue
  if (bestImage.needsReview) {
    await enqueueImageReview(
      input.productKey,
      input.rawLabel,
      scoredCandidates,
      [`Score ${bestImage.confidenceScore}/100 — validation recommandée`],
      input.receiptId,
    );
  }

  return {
    ...result,
    chosenImage: bestImage,
    candidates: scoredCandidates,
    status: 'matched',
    needsReview: bestImage.needsReview,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 8. Hydratation du ticket complet
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Enrichit tous les produits d'un ticket en images.
 *
 * - Charge le ticket depuis Firestore (collection receipts)
 * - Pour chaque item, lance resolveImageForProduct()
 * - Retourne le rapport complet
 *
 * Si receiptRecord est fourni directement (sans passer par Firestore),
 * il est utilisé tel quel (utile pour les tests et l'intégration pipeline).
 *
 * @param receiptId     - ID Firestore du ticket
 * @param receiptRecord - Ticket en mémoire (optionnel, évite un aller-retour Firestore)
 */
export async function hydrateMissingProductImagesFromTicket(
  receiptId: string,
  receiptRecord?: {
    items: Array<{
      rawLabel: string;
      normalizedLabel?: string;
      productBrand?: string;
      packageSizeValue?: number;
      packageSizeUnit?: string;
      category?: string;
      barcode?: string | null;
    }>;
  },
): Promise<ProductSearchImageResult[]> {
  let items = receiptRecord?.items;

  // Charger depuis Firestore si non fourni
  if (!items && db) {
    try {
      const docSnap = await getDoc(doc(db, 'receipts', receiptId));
      if (docSnap.exists()) {
        const data = docSnap.data() as { items?: typeof items };
        items = data.items ?? [];
      }
    } catch (err) {
      console.error('[ProductImageResolver] Failed to load receipt from Firestore:', err);
      return [];
    }
  }

  if (!items || items.length === 0) return [];

  const results: ProductSearchImageResult[] = [];

  for (const item of items) {
    // Construire le productKey
    const normalizedLabel = item.normalizedLabel ?? normalizeProductLabelForKey(item.rawLabel);
    const productKey = normalizedLabel;

    const size = item.packageSizeValue !== undefined && item.packageSizeUnit
      ? `${item.packageSizeValue}${item.packageSizeUnit}`
      : extractSizeFromLabel(item.rawLabel);

    const input: ImageSearchInput = {
      rawLabel: item.rawLabel,
      normalizedLabel,
      brand: item.productBrand ?? extractBrandFromLabel(item.rawLabel),
      size,
      category: item.category,
      barcode: item.barcode ?? undefined,
      productKey,
      receiptId,
    };

    const result = await resolveImageForProduct(input);
    results.push(result);
  }

  return results;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers exportés
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Normalise un libellé produit en clé de produit (identifiant stable).
 * Extrait de receiptOcrPipeline pour éviter la dépendance circulaire.
 */
export function normalizeProductLabelForKey(label: string): string {
  return label
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 80);
}

/**
 * Génère un rapport de résolution image pour un lot de produits.
 * Utile pour le script d'enrichissement des produits du ticket U Express.
 */
export async function buildImageResolutionReport(results: ProductSearchImageResult[]): Promise<{
  autoMatched: ProductSearchImageResult[];
  ambiguous: ProductSearchImageResult[];
  notFound: ProductSearchImageResult[];
  summary: {
    total: number;
    autoMatched: number;
    ambiguous: number;
    notFound: number;
    reviewRequired: number;
  };
}> {
  const autoMatched = results.filter((r) => r.status === 'matched' && !r.needsReview);
  const ambiguous = results.filter((r) => r.status === 'ambiguous' || (r.status === 'matched' && r.needsReview));
  const notFound = results.filter((r) => r.status === 'not_found');

  return {
    autoMatched,
    ambiguous,
    notFound,
    summary: {
      total: results.length,
      autoMatched: autoMatched.length,
      ambiguous: ambiguous.length,
      notFound: notFound.length,
      reviewRequired: results.filter((r) => r.needsReview).length,
    },
  };
}

export {
  extractBrandFromLabel,
  extractSizeFromLabel,
  THRESHOLD_AUTO,
  THRESHOLD_REVIEW,
  type EnrichedProductRecord,
};
