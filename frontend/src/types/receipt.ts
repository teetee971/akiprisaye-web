/**
 * Receipt OCR Pipeline — Domain Types
 *
 * Modèle de données complet pour le module d'ingestion de tickets de caisse.
 *
 * Conventions:
 * - TerritoryCode: toujours en minuscules (source: constants/territories.ts)
 * - confidenceScore: 0–100 (0 = inconnu, 100 = certain)
 * - needsReview: true si une valeur est ambiguë ou non confirmée par OCR
 * - Aucune valeur inventée: tout champ ambigu → needsReview = true
 *
 * Collections Firestore:
 *   receipts                  – document maître par ticket
 *   receipt_items             – sous-collection ou champ imbriqué
 *   receipt_images            – images sources (path + metadata)
 *   price_observations        – observations de prix historisées
 *   price_history_monthly     – agrégats mensuels par produit/territoire
 *   price_history_yearly      – agrégats annuels par produit/territoire
 *   price_alert_rules         – règles d'alerte prix utilisateur
 *   price_alert_events        – déclenchements d'alertes
 *   ocr_review_queue          – tickets à relecture humaine
 */

import type { TerritoryCode } from '../constants/territories';

// ── Re-export for consumers who only import from this module ──────────────────
export type { TerritoryCode };

// ─────────────────────────────────────────────────────────────────────────────
// OCR Source Image
// ─────────────────────────────────────────────────────────────────────────────

/** Métadonnées d'une image source du ticket */
export interface OCRSourceImage {
  /** Identifiant unique */
  id: string;
  /** Ticket associé */
  receiptId: string;
  /** Chemin de stockage (ex: Firebase Storage, local blob URL) */
  path: string;
  /** Type MIME (image/jpeg, image/png, image/webp…) */
  mimeType: string;
  /** Largeur en pixels */
  width?: number;
  /** Hauteur en pixels */
  height?: number;
  /** ISO 8601 */
  createdAt: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// OCR Raw Block
// ─────────────────────────────────────────────────────────────────────────────

/** Bloc texte brut retourné par le moteur OCR */
export interface OCRRawBlock {
  /** Texte du bloc */
  text: string;
  /** Score de confiance OCR pour ce bloc (0–100) */
  confidenceScore?: number;
  /** Boîte englobante en pixels */
  bbox?: { x: number; y: number; width: number; height: number };
  /** Numéro de page (multi-page) */
  page?: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Receipt Store (Enseigne)
// ─────────────────────────────────────────────────────────────────────────────

/** Informations sur l'enseigne du ticket */
export interface ReceiptStore {
  /** Nom brut tel qu'il apparaît sur le ticket */
  rawName?: string;
  /** Nom normalisé (ex: "Carrefour Market") */
  normalizedName: string;
  /** Marque de l'enseigne (ex: "Carrefour") */
  brand?: string;
  /** Société mère (ex: "Carrefour SA") */
  company?: string;
  /** SIRET si présent sur le ticket */
  siret?: string;
  /** Téléphone */
  phone?: string;
  /** Adresse complète */
  address?: string;
  /** Code postal */
  postalCode?: string;
  /** Ville */
  city?: string;
  /** Territoire */
  territory: TerritoryCode;
}

// ─────────────────────────────────────────────────────────────────────────────
// Receipt Payment
// ─────────────────────────────────────────────────────────────────────────────

/** Mode de paiement détecté sur le ticket */
export interface ReceiptPayment {
  /** Méthode de paiement */
  method?: 'card' | 'card_contactless' | 'cash' | 'mixed' | 'unknown';
  /** Montant réglé */
  amountPaid?: number;
  /** Monnaie rendue */
  cashReturned?: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Receipt VAT Line
// ─────────────────────────────────────────────────────────────────────────────

/** Ligne TVA détectée sur le ticket */
export interface ReceiptVatLine {
  /** Taux en % (ex: 5.5, 20) */
  rate: number;
  /** Base HT */
  baseHt?: number;
  /** Montant TVA */
  amount: number;
  /** Total TTC correspondant */
  totalTtc?: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Receipt Item (ligne produit)
// ─────────────────────────────────────────────────────────────────────────────

/** Unité de mesure ou de conditionnement */
export type ReceiptUnit = 'kg' | 'g' | 'l' | 'ml' | 'unit';

/** Une ligne produit extraite du ticket */
export interface ReceiptItem {
  /** Index de la ligne dans le ticket (0-based) */
  lineIndex: number;
  /** Libellé brut OCR */
  rawLabel: string;
  /** Libellé normalisé pour matching/historisation */
  normalizedLabel?: string;
  /** Marque du produit */
  productBrand?: string;
  /** Catégorie alimentaire ou non alimentaire */
  category?: string;
  /** Sous-catégorie */
  subcategory?: string;
  /** Quantité achetée */
  quantity?: number;
  /** Unité de la quantité achetée */
  unit?: ReceiptUnit;
  /** Taille du conditionnement (ex: 0.5 pour 500ml) */
  packageSizeValue?: number;
  /** Unité du conditionnement */
  packageSizeUnit?: ReceiptUnit;
  /** Prix unitaire (null si non déterminé) */
  unitPrice?: number | null;
  /** Prix total de la ligne (toujours présent) */
  totalPrice: number;
  /** Taux TVA appliqué (null si non déterminé) */
  vatRate?: number | null;
  /** Code-barres EAN/UPC (null si absent) */
  barcode?: string | null;
  /** Identifiant produit normalisé (référence catalogue interne) */
  productMatchId?: string | null;
  /** Score de confiance 0–100 */
  confidenceScore: number;
  /** Nécessite relecture humaine */
  needsReview: boolean;
  /** Notes libres (ex: "prix illisible", "quantité ambiguë") */
  notes?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Receipt Record (document maître)
// ─────────────────────────────────────────────────────────────────────────────

/** Document maître représentant un ticket de caisse ingéré */
export interface ReceiptRecord {
  /** Identifiant unique */
  id: string;
  /** Source toujours 'ocr_ticket' pour ce pipeline */
  source: 'ocr_ticket';
  /** Territoire */
  territory: TerritoryCode;
  /** Enseigne */
  store: ReceiptStore;
  /** Date du ticket (ISO 8601, ex: "2025-03-15") */
  receiptDate: string;
  /** Heure du ticket (HH:MM) */
  receiptTime?: string;
  /** Devise */
  currency: 'EUR';
  /** Nombre de produits distincts */
  itemsCount?: number;
  /** Nombre total de lignes du ticket */
  linesCount?: number;
  /** Sous-total HT */
  subtotalHt?: number;
  /** Total TTC (requis) */
  totalTtc: number;
  /** Lignes TVA */
  vatLines: ReceiptVatLine[];
  /** Paiement */
  payment?: ReceiptPayment;
  /** Lignes produits */
  items: ReceiptItem[];
  /** Texte OCR brut complet */
  rawOcrText: string;
  /** Blocs OCR détaillés */
  rawOcrBlocks?: OCRRawBlock[];
  /** Empreinte de déduplication (hash store+date+total) */
  checksum?: string;
  /** Score de confiance global 0–100 */
  confidenceScore: number;
  /** Nécessite relecture humaine */
  needsReview: boolean;
  /** ISO 8601 */
  createdAt: string;
  /** ISO 8601 */
  updatedAt: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Price Observation (historisation)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Observation de prix générée depuis un ticket OCR.
 * Une observation par ligne produit, par ticket.
 */
export interface ReceiptOcrPriceObservation {
  /** Identifiant unique */
  id: string;
  /** Source du pipeline OCR ticket */
  source: 'receipt_ocr';
  /** Ticket d'origine */
  receiptId: string;
  /** Territoire */
  territory: TerritoryCode;
  /** Identifiant Firestore de l'enseigne (si résolu) */
  storeId?: string;
  /** Nom normalisé de l'enseigne */
  storeLabel: string;
  /** Date de l'observation (ISO 8601) */
  observedAt: string;
  /** Libellé produit brut (OCR) */
  productLabel: string;
  /** Libellé normalisé */
  normalizedLabel: string;
  /** Catégorie */
  category?: string;
  /** Marque */
  brand?: string;
  /** Code-barres */
  barcode?: string | null;
  /** EAN de la fiche produit du catalogue correspondante (null si non trouvé) */
  productMatchId?: string | null;
  /** Quantité */
  quantity?: number;
  /** Unité */
  unit?: string;
  /** Taille conditionnement */
  packageSizeValue?: number;
  /** Unité conditionnement */
  packageSizeUnit?: string;
  /** Prix observé (TTC) */
  price: number;
  /** Devise */
  currency: 'EUR';
  /** Score de confiance 0–100 */
  confidenceScore: number;
  /** Nécessite relecture humaine */
  needsReview: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Price History Snapshot (agrégats temporels)
// ─────────────────────────────────────────────────────────────────────────────

/** Agrégat mensuel ou annuel pour un produit sur un territoire */
export interface PriceHistorySnapshot {
  /** Identifiant unique */
  id: string;
  /** Clé produit normalisée (ex: "lait_demi_ecreme_1l") */
  productKey: string;
  /** Territoire */
  territory: TerritoryCode;
  /** Année (ex: 2025) */
  year: number;
  /** Mois (1–12, ou 0 pour snapshot annuel) */
  month: number;
  /** Prix moyen observé */
  avgPrice: number;
  /** Prix minimum observé */
  minPrice: number;
  /** Prix maximum observé */
  maxPrice: number;
  /** Nombre d'observations agrégées */
  observationsCount: number;
  /** Catégorie */
  category?: string;
  /** ISO 8601 */
  updatedAt: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Price Alert Rule
// ─────────────────────────────────────────────────────────────────────────────

/** Règle d'alerte prix configurée par un utilisateur */
export interface PriceAlertRule {
  /** Identifiant unique */
  id: string;
  /** Utilisateur propriétaire */
  userId: string;
  /** Territoire concerné */
  territory: TerritoryCode;
  /** Clé produit ciblée (optionnel) */
  productKey?: string;
  /** Catégorie ciblée (optionnel) */
  category?: string;
  /** Type de seuil */
  thresholdType: 'below_price' | 'price_drop_percent' | 'new_low';
  /** Valeur du seuil (prix en € ou % de baisse) */
  thresholdValue: number;
  /** Canaux de notification */
  notificationChannels: Array<'push' | 'email' | 'in_app'>;
  /** Règle active */
  isActive: boolean;
  /** ISO 8601 */
  createdAt: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// OCR Review Queue Entry
// ─────────────────────────────────────────────────────────────────────────────

/** Entrée dans la file de relecture humaine */
export interface OcrReviewQueueEntry {
  /** Identifiant unique */
  id: string;
  /** Ticket à relire */
  receiptId: string;
  /** Raisons de la mise en file */
  reasons: string[];
  /** Statut de relecture */
  status: 'pending' | 'in_review' | 'approved' | 'rejected';
  /** ISO 8601 */
  createdAt: string;
  /** ISO 8601 */
  reviewedAt?: string;
  /** Uid du relecteur */
  reviewedBy?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Pipeline Result
// ─────────────────────────────────────────────────────────────────────────────

/** Résultat final du pipeline d'ingestion */
export interface ReceiptOcrPipelineResult {
  /** Succès global */
  success: boolean;
  /** Ticket ingéré */
  receipt?: ReceiptRecord;
  /** Observations de prix créées */
  priceObservations?: ReceiptOcrPriceObservation[];
  /** Ticket dupliqué (déjà ingéré) */
  duplicate?: boolean;
  /** Ticket mis en file de relecture */
  queuedForReview?: boolean;
  /** Erreur si success=false */
  error?: string;
}
