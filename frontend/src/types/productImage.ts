/**
 * Product Image — Domain Types
 *
 * Modèle de données pour le module de recherche, rapprochement et stockage
 * d'images produit à partir des libellés extraits d'un ticket OCR.
 *
 * Collections Firestore:
 *   product_images           – image retenue (primaire ou secondaire) par productKey
 *   product_image_candidates – candidats trouvés pour relecture/audit
 *   image_review_queue       – file de revue manuelle des cas douteux
 *
 * Règles impératives:
 * - Aucune URL inventée: tout candidat doit avoir une source traçable
 * - confidenceScore < 60 → ne pas attacher automatiquement
 * - confidenceScore 60-79 → attacher mais needsReview = true
 * - confidenceScore >= 80 → auto-attach
 * - Conserver toujours les 3 meilleurs candidats pour audit
 */

// ─────────────────────────────────────────────────────────────────────────────
// Source type
// ─────────────────────────────────────────────────────────────────────────────

/** Type de source de l'image */
export type ImageSourceType = 'official' | 'retailer' | 'openfoodfacts' | 'other';

// ─────────────────────────────────────────────────────────────────────────────
// ProductImageCandidate
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Un candidat image pour un produit, retourné par une source de recherche.
 * N'est jamais créé sans URL et source réelles.
 */
export interface ProductImageCandidate {
  /** URL de l'image (absolute, https) */
  url: string;
  /** Source humaine (ex: "openfoodfacts", "leclerc.fr", "damoiseau.fr") */
  source: string;
  /** Type de source */
  sourceType: ImageSourceType;
  /** Titre / libellé du produit selon la source */
  title?: string;
  /** Requête de recherche ayant permis de trouver ce candidat */
  matchedQuery: string;
  /** Score de confiance 0–100 (composé selon les règles de matching) */
  confidenceScore: number;
  /** Largeur en pixels (si connue) */
  width?: number;
  /** Hauteur en pixels (si connue) */
  height?: number;
  /** Hash perceptuel (pour déduplication, optionnel) */
  hash?: string;
  /** Notes (ex: "logo only", "lifestyle photo", "packshot") */
  notes?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// ProductImageAsset
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Image produit retenue et stockée en base.
 * Une par productKey (isPrimary=true), éventuellement plusieurs (alternatives).
 */
export interface ProductImageAsset {
  /** Identifiant unique */
  id: string;
  /** Clé produit normalisée (ex: "lait_uht_demi_ecreme_u_bio_1l") */
  productKey: string;
  /** Territoire concerné (optionnel — certaines images sont transversales) */
  territory?: string;
  /** URL de l'image principale */
  imageUrl: string;
  /** URL miniature */
  thumbnailUrl?: string;
  /** Source humaine */
  source: string;
  /** Type de source */
  sourceType: ImageSourceType;
  /** Score de confiance 0–100 */
  confidenceScore: number;
  /** Image primaire du produit */
  isPrimary: boolean;
  /** Nécessite validation humaine */
  needsReview: boolean;
  /** ISO 8601 */
  createdAt: string;
  /** ISO 8601 */
  updatedAt: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// ProductSearchImageResult
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Résultat de la recherche d'image pour un produit donné.
 */
export interface ProductSearchImageResult {
  /** Clé produit normalisée */
  productKey: string;
  /** Libellé brut OCR */
  rawLabel: string;
  /** Libellé normalisé */
  normalizedLabel: string;
  /** Meilleure image sélectionnée (null si aucune image fiable) */
  chosenImage?: ProductImageAsset | null;
  /** Tous les candidats trouvés (max 5 conservés) */
  candidates: ProductImageCandidate[];
  /** Nécessite validation humaine */
  needsReview: boolean;
  /** Statut de la résolution */
  status: 'matched' | 'ambiguous' | 'not_found';
}

// ─────────────────────────────────────────────────────────────────────────────
// ImageReviewQueueEntry
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Entrée dans la file de revue manuelle des images produit.
 */
export interface ImageReviewQueueEntry {
  /** Identifiant unique */
  id: string;
  /** Clé produit concernée */
  productKey: string;
  /** Libellé produit brut */
  rawLabel: string;
  /** Meilleurs candidats conservés pour revue (max 3) */
  candidates: ProductImageCandidate[];
  /** Raisons de la mise en revue */
  reasons: string[];
  /** Statut */
  status: 'pending' | 'in_review' | 'approved' | 'rejected';
  /** Ticket d'origine (si applicable) */
  receiptId?: string;
  /** ISO 8601 */
  createdAt: string;
  /** ISO 8601 */
  reviewedAt?: string;
  /** UID du relecteur */
  reviewedBy?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// EnrichedProductRecord
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Enrichissement du modèle produit avec les données image.
 * Complète (n'override pas) le Product de types/product.ts.
 */
export interface EnrichedProductRecord {
  /** Clé produit normalisée (primaire) */
  productKey: string;
  /** Nom d'affichage */
  displayName: string;
  /** Marque */
  brand?: string;
  /** Catégorie */
  category?: string;
  /** Taille (valeur numérique) */
  packageSizeValue?: number;
  /** Unité taille */
  packageSizeUnit?: string;
  /** URL image primaire */
  primaryImageUrl?: string;
  /** Score de confiance de l'image */
  imageConfidenceScore?: number;
  /** Image à valider manuellement */
  imageNeedsReview?: boolean;
  /** Source de l'image */
  imageSource?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// ImageSearchInput (descripteur produit pour la recherche)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Descripteur d'entrée pour la résolution d'image d'un produit.
 */
export interface ImageSearchInput {
  /** Libellé brut OCR */
  rawLabel: string;
  /** Libellé normalisé */
  normalizedLabel: string;
  /** Marque détectée (optionnel) */
  brand?: string;
  /** Grammage/volume (ex: "300g", "1L") */
  size?: string;
  /** Catégorie */
  category?: string;
  /** Code-barres EAN (si disponible) */
  barcode?: string;
  /** Clé produit normalisée */
  productKey: string;
  /** Ticket d'origine */
  receiptId?: string;
  /** Territoire (ex: "GP", "MQ") */
  territory?: string;
}
