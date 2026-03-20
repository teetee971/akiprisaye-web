/**
 * Receipt OCR Pipeline — Service d'ingestion de tickets de caisse
 *
 * Pipeline complet:
 *  1. OCR de l'image ticket (Tesseract.js via ocrService)
 *  2. Parsing structuré (receiptParser)
 *  3. Normalisation (enseignes, produits, unités)
 *  4. Validation métier + confidence scoring
 *  5. Déduplication (checksum store+date+total)
 *  6. Persistance Firestore (graceful si db=null)
 *  7. Création d'observations de prix historisées
 *  8. Mise en file de relecture si needsReview
 *
 * Contraintes:
 * - Aucune valeur inventée: tout champ ambigu → needsReview + confidenceScore bas
 * - Texte OCR brut toujours stocké
 * - Déduplication avant insertion
 * - Compatible navigateur (crypto.randomUUID)
 *
 * Collections Firestore:
 *   receipts              – tickets ingérés
 *   receipt_images        – images sources
 *   price_observations    – observations de prix
 *   price_history_monthly – agrégats mensuels
 *   ocr_review_queue      – relecture humaine
 *
 * ⚠️ RGPD: traitement local de l'image, pas de transmission à un serveur tiers.
 */

import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { runOCR } from './ocrService';
import { parseReceipt } from './receiptParser';
import type { TerritoryCode } from '../constants/territories';
import type {
  OCRRawBlock,
  OCRSourceImage,
  OcrReviewQueueEntry,
  PriceHistorySnapshot,
  ReceiptItem,
  ReceiptOcrPipelineResult,
  ReceiptOcrPriceObservation,
  ReceiptPayment,
  ReceiptRecord,
  ReceiptStore,
  ReceiptUnit,
  ReceiptVatLine,
} from '../types/receipt';

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const DEFAULT_TERRITORY: TerritoryCode = 'gp';

/** Seuil de confiance en dessous duquel une ligne est marquée needsReview */
const REVIEW_THRESHOLD = 60;

/** Seuil de confiance global en dessous duquel le ticket entier est needsReview */
const RECEIPT_REVIEW_THRESHOLD = 50;

/** Prix maximum raisonnable pour un article (en €) */
const MAX_ITEM_PRICE = 9999;

/** Dictionnaire de normalisation des noms d'enseigne */
const STORE_NORMALIZATION: Array<{ pattern: RegExp; normalized: string; brand: string }> = [
  { pattern: /carrefour\s*market/i,    normalized: 'Carrefour Market',    brand: 'Carrefour' },
  { pattern: /carrefour\s*city/i,      normalized: 'Carrefour City',      brand: 'Carrefour' },
  { pattern: /carrefour\s*express/i,   normalized: 'Carrefour Express',   brand: 'Carrefour' },
  { pattern: /carrefour/i,             normalized: 'Carrefour',           brand: 'Carrefour' },
  { pattern: /e\.?\s*leclerc/i,        normalized: 'E.Leclerc',           brand: 'E.Leclerc' },
  { pattern: /auchan/i,                normalized: 'Auchan',              brand: 'Auchan' },
  { pattern: /casino/i,                normalized: 'Casino',              brand: 'Casino' },
  { pattern: /intermarch[eé]/i,        normalized: 'Intermarché',         brand: 'Intermarché' },
  { pattern: /super\s*u/i,             normalized: 'Super U',             brand: 'U' },
  { pattern: /hyper\s*u/i,             normalized: 'Hyper U',             brand: 'U' },
  { pattern: /u\s*express/i,           normalized: 'U Express',           brand: 'U' },
  { pattern: /leader\s*price/i,        normalized: 'Leader Price',        brand: 'Leader Price' },
  { pattern: /monoprix/i,              normalized: 'Monoprix',            brand: 'Monoprix' },
  { pattern: /franprix/i,              normalized: 'Franprix',            brand: 'Franprix' },
  { pattern: /lidl/i,                  normalized: 'Lidl',                brand: 'Lidl' },
  { pattern: /aldi/i,                  normalized: 'Aldi',                brand: 'Aldi' },
  { pattern: /match/i,                 normalized: 'Match',               brand: 'Match' },
  { pattern: /simply\s*market/i,       normalized: 'Simply Market',       brand: 'Auchan' },
  { pattern: /spar/i,                  normalized: 'Spar',                brand: 'Spar' },
  { pattern: /8\s*[àa]\s*huit/i,       normalized: '8 à Huit',           brand: 'Carrefour' },
];

/** Dictionnaire de normalisation des catégories produit */
const CATEGORY_PATTERNS: Array<{ pattern: RegExp; category: string; subcategory?: string }> = [
  { pattern: /lait|yaourt|fromage|beurre|crème|creme/i,              category: 'Produits laitiers' },
  { pattern: /pain|baguette|brioche|viennoiserie|croissant/i,         category: 'Boulangerie' },
  { pattern: /viande|poulet|b[œoe]uf|veau|porc|jambon|sauciss/i,     category: 'Viandes et poissons' },
  { pattern: /poisson|saumon|thon|crevette|cabillaud/i,               category: 'Viandes et poissons' },
  { pattern: /fruit|pomme|banane|orange|mangue|ananas|citron/i,       category: 'Fruits et légumes' },
  { pattern: /l[eé]gume|salade|tomate|carotte|courgette|haricot/i,   category: 'Fruits et légumes' },
  { pattern: /boisson|eau|jus|sodas?|bi[eè]re|vin|champagne/i,       category: 'Boissons' },
  { pattern: /café|caf[eé]|nescaf[eé]|expresso|thé/i,                category: 'Épicerie' },
  { pattern: /biscuit|chips|chocolat|bonbon|confiserie/i,             category: 'Épicerie' },
  { pattern: /riz|pâtes|farine|sucre|sel|huile|vinaigre/i,           category: 'Épicerie' },
  { pattern: /shampooing|savon|gel|dent|hygi[eè]ne|rasoir/i,         category: 'Hygiène et beauté' },
  { pattern: /lessive|liquide|nettoyant|entretien|javel/i,           category: 'Entretien' },
  { pattern: /couche|bib[eé]ron|lait\s+b[eé]b[eé]|b[eé]b[eé]/i,    category: 'Bébé' },
];

/** Mappage des méthodes de paiement */
const PAYMENT_PATTERNS: Array<{ pattern: RegExp; method: ReceiptPayment['method'] }> = [
  { pattern: /sans\s*contact/i,                        method: 'card_contactless' },
  { pattern: /cb\b|carte\s*(?:bancaire|bleue|visa|mastercard)/i, method: 'card' },
  { pattern: /esp[eè]ces?|esp[eè]ce/i,                 method: 'cash' },
  { pattern: /ch[eè]que/i,                             method: 'cash' },
];

// ─────────────────────────────────────────────────────────────────────────────
// ID generation (browser-compatible)
// ─────────────────────────────────────────────────────────────────────────────

function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // Fallback: timestamp + random hex
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Checksum (deduplication fingerprint)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Génère une empreinte de déduplication à partir des données sûres du ticket.
 * Format: "STORE|DATE|TOTAL" normalisé en lowercase sans espaces.
 */
function buildChecksum(storeName: string, date: string, total: number): string {
  const raw = `${storeName.toLowerCase().replace(/\s+/g, '_')}|${date}|${total.toFixed(2)}`;
  return raw;
}

// ─────────────────────────────────────────────────────────────────────────────
// Normalisation helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Normalise un label produit pour matching/clé produit */
export function normalizeProductLabel(label: string): string {
  return label
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')   // Retirer accents
    .replace(/[^a-z0-9\s]/g, '')       // Retirer ponctuation
    .replace(/\s+/g, '_')              // Espaces → underscores
    .replace(/^_+|_+$/g, '')           // Trim underscores
    .slice(0, 80);                     // Max 80 chars
}

/** Détecter la catégorie d'un produit à partir de son libellé */
function detectCategory(label: string): string | undefined {
  for (const { pattern, category } of CATEGORY_PATTERNS) {
    if (pattern.test(label)) return category;
  }
  return undefined;
}

/** Normaliser le nom de l'enseigne */
function normalizeStoreName(rawName: string | undefined): {
  normalizedName: string;
  brand?: string;
} {
  if (!rawName) return { normalizedName: 'Enseigne inconnue' };

  for (const { pattern, normalized, brand } of STORE_NORMALIZATION) {
    if (pattern.test(rawName)) return { normalizedName: normalized, brand };
  }

  // Enseigne non reconnue: conserver le nom brut nettoyé
  const cleaned = rawName.trim().replace(/\s+/g, ' ');
  return { normalizedName: cleaned };
}

/** Extraire la méthode de paiement */
function extractPaymentMethod(paymentStr: string | undefined): ReceiptPayment['method'] {
  if (!paymentStr) return 'unknown';

  for (const { pattern, method } of PAYMENT_PATTERNS) {
    if (pattern.test(paymentStr)) return method;
  }
  return 'unknown';
}

/** Convertir date DD/MM/YYYY → ISO 8601 YYYY-MM-DD */
function toISODate(ddmmyyyy: string | undefined): string | undefined {
  if (!ddmmyyyy) return undefined;
  const m = ddmmyyyy.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!m) return undefined;
  const [, d, mo, y] = m;
  return `${y}-${mo.padStart(2, '0')}-${d.padStart(2, '0')}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. OCR
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Exécute l'OCR sur une ou plusieurs images.
 * Concatène les résultats si plusieurs images (multi-page).
 *
 * @param images - URLs de blob, data URLs ou chemins locaux
 * @returns Texte brut concaténé et blocs OCR
 */
export async function runOcrOnReceipt(
  images: string[],
): Promise<{ rawText: string; blocks: OCRRawBlock[] }> {
  const parts: string[] = [];
  const allBlocks: OCRRawBlock[] = [];

  for (const imageSource of images) {
    const result = await runOCR(imageSource, 'fra', { timeout: 30_000, receiptMode: true });

    if (result.success && result.rawText) {
      parts.push(result.rawText);

      // Construire un bloc synthétique depuis le résultat global
      // (Tesseract.js v4+ expose les mots individuels mais runOCR ne les remonte pas)
      const block: OCRRawBlock = {
        text: result.rawText,
        confidenceScore: result.confidence ?? undefined,
        page: allBlocks.length,
      };
      allBlocks.push(block);
    }
  }

  return {
    rawText: parts.join('\n'),
    blocks: allBlocks,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. Parsing
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Transforme le texte OCR brut en ReceiptRecord partiel (avant normalisation).
 *
 * @param rawText   - Texte OCR brut complet
 * @param blocks    - Blocs OCR détaillés
 * @param territory - Territoire du ticket (défaut: 'gp')
 */
export function parseReceiptFromOcr(
  rawText: string,
  blocks: OCRRawBlock[],
  territory: TerritoryCode = DEFAULT_TERRITORY,
): Omit<ReceiptRecord, 'id' | 'createdAt' | 'updatedAt' | 'checksum'> {
  const parsed = parseReceipt(rawText);

  const isoDate = toISODate(parsed.date);

  // Lignes produits
  const items: ReceiptItem[] = (parsed.items ?? []).map((item, idx) => {
    const price = item.price;
    const qty = item.qty ?? 1;
    const priceValid = typeof price === 'number' && price > 0 && price < MAX_ITEM_PRICE;

    // Score de confiance par ligne
    let score = 0;
    if (item.name && item.name.length >= 3) score += 35;
    if (priceValid)                          score += 45;
    if (item.qty !== undefined)              score += 10;
    if (item.unitPrice !== undefined)        score += 10;

    const needsReview = score < REVIEW_THRESHOLD || !priceValid;

    return {
      lineIndex: idx,
      rawLabel: item.name,
      normalizedLabel: undefined,             // Rempli par normalizeReceipt
      quantity: qty,
      unit: undefined,
      totalPrice: priceValid ? Math.round(price * 100) / 100 : 0,
      unitPrice: item.unitPrice ?? null,
      vatRate: null,
      barcode: null,
      productMatchId: null,
      confidenceScore: Math.min(100, score),
      needsReview,
      notes: needsReview ? 'Vérification requise — confiance insuffisante' : undefined,
    } satisfies ReceiptItem;
  });

  // Lignes TVA
  const vatLines: ReceiptVatLine[] = [];
  if (parsed.tvaAmount !== undefined) {
    vatLines.push({
      rate: parsed.tvaRate ?? 0,
      amount: parsed.tvaAmount,
      totalTtc: parsed.total,
    });
  }

  // Score global basé sur les données détectées
  const detectedFields = [
    parsed.storeName,
    parsed.date,
    parsed.total,
    items.length > 0 ? true : undefined,
  ].filter(Boolean).length;

  const globalOcrConf = blocks.length > 0
    ? blocks.reduce((s, b) => s + (b.confidenceScore ?? 0), 0) / blocks.length
    : 0;

  const confidenceScore = Math.round(
    globalOcrConf * 0.5 + (detectedFields / 4) * 50,
  );

  const needsReview =
    confidenceScore < RECEIPT_REVIEW_THRESHOLD ||
    !isoDate ||
    parsed.total === undefined ||
    items.some((it) => it.needsReview);

  const { normalizedName, brand } = normalizeStoreName(parsed.storeName);

  const store: ReceiptStore = {
    rawName: parsed.storeName,
    normalizedName,
    brand,
    address: parsed.storeAddress,
    territory,
  };

  return {
    source: 'ocr_ticket',
    territory,
    store,
    receiptDate: isoDate ?? new Date().toISOString().slice(0, 10),
    receiptTime: parsed.time,
    currency: 'EUR',
    itemsCount: items.length,
    linesCount: rawText.split('\n').filter((l) => l.trim().length > 0).length,
    subtotalHt: parsed.subtotal,
    totalTtc: parsed.total ?? 0,
    vatLines,
    payment: parsed.paymentMethod
      ? {
          method: extractPaymentMethod(parsed.paymentMethod),
        }
      : undefined,
    items,
    rawOcrText: rawText,
    rawOcrBlocks: blocks,
    confidenceScore,
    needsReview,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. Normalisation
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Normalise les libellés produits, catégories et unités d'un ReceiptRecord.
 * Complète les champs laissés undefined par parseReceiptFromOcr.
 */
export function normalizeReceipt(
  receipt: Omit<ReceiptRecord, 'id' | 'createdAt' | 'updatedAt' | 'checksum'>,
): Omit<ReceiptRecord, 'id' | 'createdAt' | 'updatedAt' | 'checksum'> {
  const normalizedItems: ReceiptItem[] = receipt.items.map((item) => {
    const normalizedLabel = normalizeProductLabel(item.rawLabel);
    const category = detectCategory(item.rawLabel);

    // Détecter l'unité depuis le libellé (ex: "LAIT 1L", "RIZ 500G")
    const unitMatch = item.rawLabel.match(/\b(\d+(?:[.,]\d+)?)\s*(kg|g|l|ml|cl|unit)\b/i);
    let unit: ReceiptUnit | undefined;
    let packageSizeValue: number | undefined;
    let packageSizeUnit: ReceiptUnit | undefined;

    if (unitMatch) {
      const rawUnit = unitMatch[2].toLowerCase();
      const sizeVal = parseFloat(unitMatch[1].replace(',', '.'));

      if (rawUnit === 'kg')  { packageSizeValue = sizeVal;        packageSizeUnit = 'kg';   unit = 'kg'; }
      else if (rawUnit === 'g')   { packageSizeValue = sizeVal / 1000; packageSizeUnit = 'g';    unit = 'kg'; }
      else if (rawUnit === 'l')   { packageSizeValue = sizeVal;        packageSizeUnit = 'l';    unit = 'l';  }
      else if (rawUnit === 'ml')  { packageSizeValue = sizeVal / 1000; packageSizeUnit = 'ml';   unit = 'l';  }
      else if (rawUnit === 'cl')  { packageSizeValue = sizeVal / 100;  packageSizeUnit = 'ml';   unit = 'l';  }
    }

    return {
      ...item,
      normalizedLabel,
      category,
      unit: item.unit ?? unit,
      packageSizeValue,
      packageSizeUnit,
    };
  });

  return {
    ...receipt,
    items: normalizedItems,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. Validation
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Applique les règles métier de validation et complète needsReview + notes.
 *
 * Règles:
 * - Total TTC > 0
 * - Date valide (non future de plus de 7 jours)
 * - Chaque ligne produit a un prix > 0
 * - Checksum interne (somme items ≈ total)
 */
export function validateReceipt(
  receipt: Omit<ReceiptRecord, 'id' | 'createdAt' | 'updatedAt'>,
): Omit<ReceiptRecord, 'id' | 'createdAt' | 'updatedAt'> {
  const issues: string[] = [];

  // Validation du total
  if (!receipt.totalTtc || receipt.totalTtc <= 0) {
    issues.push('Total TTC manquant ou invalide');
  }

  // Validation de la date
  if (receipt.receiptDate) {
    const receiptMs = new Date(receipt.receiptDate).getTime();
    const nowMs = Date.now();
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
    if (receiptMs > nowMs + sevenDaysMs) {
      issues.push('Date du ticket dans le futur — suspecte');
    }
    if (isNaN(receiptMs)) {
      issues.push('Date du ticket invalide');
    }
  } else {
    issues.push('Date du ticket absente');
  }

  // Validation checksum interne
  if (receipt.totalTtc && receipt.items.length > 0) {
    const computedSum = receipt.items.reduce((s, it) => s + it.totalPrice, 0);
    const rounded = Math.round(computedSum * 100) / 100;
    const diff = Math.abs(rounded - receipt.totalTtc);

    if (diff > 0.10) {
      issues.push(`Somme des articles (${rounded.toFixed(2)}€) ≠ total déclaré (${receipt.totalTtc.toFixed(2)}€)`);
    }
  }

  // Valider les lignes produits
  const validatedItems = receipt.items.map((item) => {
    const itemIssues: string[] = [];

    if (item.totalPrice <= 0) {
      itemIssues.push('Prix invalide ou nul');
    }
    if (!item.rawLabel || item.rawLabel.trim().length < 2) {
      itemIssues.push('Libellé produit trop court');
    }
    if (item.totalPrice > MAX_ITEM_PRICE) {
      itemIssues.push('Prix anormalement élevé');
    }

    const needsReview = item.needsReview || itemIssues.length > 0;
    const notes = [item.notes, ...itemIssues].filter(Boolean).join('; ') || undefined;

    return { ...item, needsReview, notes };
  });

  const globalNeedsReview = receipt.needsReview || issues.length > 0;

  return {
    ...receipt,
    checksum: buildChecksum(
      receipt.store.normalizedName,
      receipt.receiptDate,
      receipt.totalTtc,
    ),
    items: validatedItems,
    needsReview: globalNeedsReview,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. Persistance Firestore
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Vérifie si un ticket avec le même checksum existe déjà.
 */
async function isDuplicate(checksum: string): Promise<boolean> {
  if (!db || !checksum) return false;

  try {
    const q = query(
      collection(db, 'receipts'),
      where('checksum', '==', checksum),
    );
    const snap = await getDocs(q);
    return !snap.empty;
  } catch {
    return false;
  }
}

/**
 * Persiste une image source du ticket.
 */
async function persistReceiptImage(image: OCRSourceImage): Promise<void> {
  if (!db) return;
  try {
    await addDoc(collection(db, 'receipt_images'), {
      ...image,
      createdAt: serverTimestamp(),
    });
  } catch (err) {
    console.error('[ReceiptPipeline] Failed to persist receipt image:', err);
  }
}

/**
 * Persiste le ticket et ses lignes dans Firestore.
 * Gère la collection 'receipts'.
 *
 * @returns ID Firestore du document créé, ou undefined si db=null
 */
export async function persistReceipt(receipt: ReceiptRecord): Promise<string | undefined> {
  if (!db) {
    console.warn('[ReceiptPipeline] Firebase db non disponible — persistance ignorée');
    return undefined;
  }

  try {
    // Sérialiser en objet plain (Firestore ne gère pas undefined)
    const docData = sanitizeForFirestore({
      ...receipt,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    const docRef = await addDoc(collection(db, 'receipts'), docData);
    return docRef.id;
  } catch (err) {
    console.error('[ReceiptPipeline] Failed to persist receipt:', err);
    throw err;
  }
}

/**
 * Supprime les champs undefined pour la compatibilité Firestore.
 */
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
// 6. Observations de prix
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Crée et persiste les observations de prix depuis un ticket ingéré.
 * Une observation par ligne produit.
 *
 * @param receipt - Ticket validé et persisté
 * @returns Observations créées
 */
export async function createPriceObservationsFromReceipt(
  receipt: ReceiptRecord,
): Promise<ReceiptOcrPriceObservation[]> {
  const now = new Date().toISOString();
  const observations: ReceiptOcrPriceObservation[] = [];

  for (const item of receipt.items) {
    // Ne pas créer d'observation pour des lignes avec prix nul ou invalide
    if (!item.totalPrice || item.totalPrice <= 0) continue;

    const obs: ReceiptOcrPriceObservation = {
      id: generateId(),
      source: 'receipt_ocr',
      receiptId: receipt.id,
      territory: receipt.territory,
      storeLabel: receipt.store.normalizedName,
      observedAt: receipt.receiptDate
        ? `${receipt.receiptDate}T${receipt.receiptTime ?? '00:00'}:00.000Z`
        : now,
      productLabel: item.rawLabel,
      normalizedLabel: item.normalizedLabel ?? normalizeProductLabel(item.rawLabel),
      category: item.category,
      brand: item.productBrand,
      barcode: item.barcode ?? null,
      quantity: item.quantity,
      unit: item.unit,
      packageSizeValue: item.packageSizeValue,
      packageSizeUnit: item.packageSizeUnit,
      price: item.totalPrice,
      currency: 'EUR',
      confidenceScore: item.confidenceScore,
      needsReview: item.needsReview,
    };

    observations.push(obs);

    // Persister dans Firestore si disponible
    if (db) {
      try {
        await addDoc(
          collection(db, 'price_observations'),
          sanitizeForFirestore({
            ...obs,
            createdAt: serverTimestamp(),
          }) as Record<string, unknown>,
        );
      } catch (err) {
        console.error('[ReceiptPipeline] Failed to persist price observation:', err);
      }
    }
  }

  return observations;
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. File de relecture humaine
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Ajoute un ticket dans la file de relecture humaine si needsReview=true.
 */
async function queueForReview(receipt: ReceiptRecord): Promise<void> {
  if (!db) return;

  const reasons: string[] = [];
  if (receipt.confidenceScore < RECEIPT_REVIEW_THRESHOLD) {
    reasons.push(`Confiance globale faible (${receipt.confidenceScore}/100)`);
  }
  if (!receipt.receiptDate) reasons.push('Date absente');
  if (!receipt.totalTtc)    reasons.push('Total TTC absent');
  const itemsNeedingReview = receipt.items.filter((it) => it.needsReview).length;
  if (itemsNeedingReview > 0) {
    reasons.push(`${itemsNeedingReview} ligne(s) produit nécessitent vérification`);
  }

  const entry: OcrReviewQueueEntry = {
    id: generateId(),
    receiptId: receipt.id,
    reasons,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };

  try {
    await addDoc(
      collection(db, 'ocr_review_queue'),
      sanitizeForFirestore({ ...entry, createdAt: serverTimestamp() }) as Record<string, unknown>,
    );
  } catch (err) {
    console.error('[ReceiptPipeline] Failed to queue receipt for review:', err);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Public API — Pipeline principal
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Pipeline d'ingestion complet pour une ou plusieurs images de ticket.
 *
 * Étapes:
 *  1. OCR (Tesseract.js)
 *  2. Parsing structuré
 *  3. Normalisation
 *  4. Validation
 *  5. Déduplication
 *  6. Persistance Firestore
 *  7. Création observations de prix
 *  8. File de relecture si needsReview
 *
 * @param images     - URLs d'images (blob, data-URL, chemin)
 * @param territory  - Territoire du ticket (défaut: 'gp')
 * @param imagesMeta - Métadonnées optionnelles des images sources
 */
export async function ingestReceiptImages(
  images: Array<File | string>,
  territory: TerritoryCode = DEFAULT_TERRITORY,
  imagesMeta?: Array<Partial<OCRSourceImage>>,
): Promise<ReceiptOcrPipelineResult> {
  try {
    // Résoudre les File en object URLs
    const imageSources: string[] = await Promise.all(
      images.map((img) => {
        if (typeof img === 'string') return Promise.resolve(img);
        return Promise.resolve(URL.createObjectURL(img));
      }),
    );

    // ── Étape 1: OCR ──────────────────────────────────────────────────────────
    const { rawText, blocks } = await runOcrOnReceipt(imageSources);

    if (!rawText || rawText.trim().length === 0) {
      return {
        success: false,
        error: 'OCR n\'a extrait aucun texte de l\'image fournie',
      };
    }

    // ── Étape 2: Parsing ──────────────────────────────────────────────────────
    const parsed = parseReceiptFromOcr(rawText, blocks, territory);

    // ── Étape 3: Normalisation ────────────────────────────────────────────────
    const normalized = normalizeReceipt(parsed);

    // ── Étape 4: Validation ───────────────────────────────────────────────────
    const validated = validateReceipt(normalized);

    // ── Étape 5: Déduplication ────────────────────────────────────────────────
    const checksum = validated.checksum ?? '';
    if (checksum) {
      const alreadyIngested = await isDuplicate(checksum);
      if (alreadyIngested) {
        return {
          success: true,
          duplicate: true,
          receipt: {
            ...validated,
            id: 'duplicate',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        };
      }
    }

    // Finaliser le ReceiptRecord avec un ID
    const now = new Date().toISOString();
    const receipt: ReceiptRecord = {
      ...validated,
      id: generateId(),
      createdAt: now,
      updatedAt: now,
    };

    // ── Étape 6: Persistance ──────────────────────────────────────────────────
    const firestoreId = await persistReceipt(receipt);
    if (firestoreId) {
      receipt.id = firestoreId;
    }

    // Persister les images sources si metadata fournie
    if (imagesMeta) {
      for (let i = 0; i < imagesMeta.length; i++) {
        const meta = imagesMeta[i];
        const imgRecord: OCRSourceImage = {
          id: generateId(),
          receiptId: receipt.id,
          path: meta?.path ?? imageSources[i] ?? '',
          mimeType: meta?.mimeType ?? 'image/jpeg',
          width: meta?.width,
          height: meta?.height,
          createdAt: now,
        };
        await persistReceiptImage(imgRecord);
      }
    }

    // ── Étape 7: Observations de prix ─────────────────────────────────────────
    const priceObservations = await createPriceObservationsFromReceipt(receipt);

    // ── Étape 8: File de relecture ────────────────────────────────────────────
    if (receipt.needsReview) {
      await queueForReview(receipt);
    }

    return {
      success: true,
      receipt,
      priceObservations,
      queuedForReview: receipt.needsReview,
    };
  } catch (err) {
    console.error('[ReceiptPipeline] ingestReceiptImages failed:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Erreur inconnue du pipeline d\'ingestion',
    };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Exports utilitaires supplémentaires
// ─────────────────────────────────────────────────────────────────────────────

export { buildChecksum, detectCategory, normalizeStoreName, extractPaymentMethod };
export type { PriceHistorySnapshot };
