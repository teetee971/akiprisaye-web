/**
 * product-image.ts — Types canoniques pour l'enrichissement image produit
 *
 * Types pour:
 * - Le pipeline de résolution d'images (source, candidat, résultat)
 * - Le format d'export JSON (import base + review queue)
 * - Le record enrichi produit (champs image sur un produit)
 *
 * Seuils de confiance:
 *   >= 80 → matched auto (pas de revue)
 *   60-79 → matched avec needsReview = true
 *   < 60  → reject → review queue
 */

// ─────────────────────────────────────────────────────────────────────────────
// Source types
// ─────────────────────────────────────────────────────────────────────────────

export type ImageSourceType = 'openfoodfacts' | 'retailer' | 'official' | 'manual' | 'other';

// ─────────────────────────────────────────────────────────────────────────────
// Candidate returned by a source adapter
// ─────────────────────────────────────────────────────────────────────────────

/** Candidat image retourné par un adaptateur source */
export interface ImageCandidate {
  /** URL de l'image (https, réelle, jamais inventée) */
  imageUrl: string;
  /** URL de la page produit (si disponible) */
  pageUrl?: string | null;
  /** Titre / libellé produit selon la source */
  title?: string;
  /** Source lisible (ex: "openfoodfacts.org", "drive.leclerc.fr") */
  source: string;
  /** Type de source */
  sourceType: ImageSourceType;
  /** Marque selon la source */
  brand?: string;
  /** Grammage selon la source */
  sizeText?: string;
  /** Requête qui a produit ce candidat */
  matchedQuery: string;
  /** Score de confiance calculé (0–100) */
  confidenceScore: number;
  /** Indices de qualité (ex: ["packshot", "fond blanc"]) */
  confidenceHints?: string[];
  /** Notes libres (ex: "logo seul", "lifestyle") */
  notes?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Resolved image (chosen from candidates)
// ─────────────────────────────────────────────────────────────────────────────

/** Image retenue pour un produit */
export interface ResolvedProductImage {
  imageUrl: string;
  thumbnailUrl?: string | null;
  pageUrl?: string | null;
  source: string;
  sourceType: ImageSourceType;
  confidenceScore: number;
  isPrimary: boolean;
  needsReview: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Resolution result (one per product)
// ─────────────────────────────────────────────────────────────────────────────

export type ResolutionStatus = 'matched' | 'ambiguous' | 'not_found';

/** Résultat de résolution d'image pour un produit */
export interface ImageResolutionResult {
  productKey: string;
  rawLabel: string;
  normalizedLabel: string;
  brand?: string | null;
  category?: string | null;
  sizeText?: string | null;
  image: ResolvedProductImage | null;
  candidates: ImageCandidate[];
  status: ResolutionStatus;
  needsReview: boolean;
  reviewReason?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Export formats (JSON output files)
// ─────────────────────────────────────────────────────────────────────────────

export interface TicketMetadata {
  storeName: string;
  storeId?: string;
  ticketId?: string;
  ticketDate?: string;
  territory?: string;
}

/** Item dans le fichier product-image-import.json */
export interface ProductImageImportItem {
  productKey: string;
  rawLabel: string;
  normalizedLabel: string;
  brand: string | null;
  category: string | null;
  sizeText: string | null;
  image: ResolvedProductImage | null;
  status: ResolutionStatus;
}

/** Fichier product-image-import.json */
export interface ProductImageImportFile {
  generatedAt: string;
  sourceTicket: TicketMetadata;
  items: ProductImageImportItem[];
}

/** Item dans le fichier product-image-review-queue.json */
export interface ReviewQueueItem {
  productKey: string;
  rawLabel: string;
  normalizedLabel: string;
  reason: 'ambiguous' | 'not_found' | 'low_confidence';
  reviewNote: string | null;
  topCandidates: Array<{
    imageUrl: string;
    pageUrl: string | null;
    source: string;
    sourceType: string;
    matchedQuery: string;
    confidenceScore: number;
    notes: string | null;
  }>;
}

/** Fichier product-image-review-queue.json */
export interface ReviewQueueFile {
  generatedAt: string;
  items: ReviewQueueItem[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Enriched product record (fields to add to product in DB)
// ─────────────────────────────────────────────────────────────────────────────

/** Champs image à ajouter/mettre à jour sur un enregistrement produit en base */
export interface ProductImageEnrichment {
  productKey: string;
  displayName: string;
  rawLabel: string;
  normalizedLabel: string;
  brand?: string | null;
  category?: string | null;
  packageSize?: string | null;
  primaryImageUrl?: string | null;
  imageSource?: string | null;
  imageSourceType?: ImageSourceType | null;
  imageConfidenceScore?: number;
  imageNeedsReview?: boolean;
  updatedAt: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Source adapter interface
// ─────────────────────────────────────────────────────────────────────────────

/** Descripteur produit passé à chaque adaptateur source */
export interface ProductDescriptor {
  rawLabel: string;
  normalizedLabel: string;
  brand?: string | null;
  category?: string | null;
  sizeText?: string | null;
  barcode?: string | null;
}

/** Interface commune à tous les adaptateurs image */
export interface ImageSourceAdapter {
  /** Nom lisible de la source */
  name: string;
  /** Recherche des candidats pour un produit */
  search(product: ProductDescriptor): Promise<ImageCandidate[]>;
}
