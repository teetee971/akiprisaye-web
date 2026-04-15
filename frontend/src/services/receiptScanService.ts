/**
 * Receipt Scan Service - v1.0.0
 * 
 * Service de numérisation et d'analyse de tickets de caisse
 * pour l'observatoire citoyen des prix A KI PRI SA YÉ
 * 
 * CONTRAINTES INSTITUTIONNELLES (NON NÉGOCIABLES):
 * - Lecture seule - pas de recommandations d'achat
 * - Données d'intérêt général uniquement
 * - Aucune promesse d'exhaustivité
 * - RGPD strict: traitement local, aucune conservation sans consentement
 * - Transparence totale sur la méthodologie
 * - Mobile-first
 * 
 * FONCTIONNALITÉS:
 * 1. OCR local via Tesseract.js (déjà implémenté dans ocrService.ts)
 * 2. Parsing intelligent des lignes de ticket
 * 3. Résolution produits avec validation utilisateur
 * 4. Comparaison territoriale des prix
 * 5. Restitution transparente avec disclaimers
 */

import { runOCR } from './ocrService';
import type { OCRResult } from './ocrService';
import { findProductByEan, searchProductsByName } from '../data/seedProducts';

/**
 * Structure d'une ligne de ticket détectée
 */
export interface ReceiptLine {
  /**
   * Texte brut extrait par OCR
   */
  rawText: string;
  
  /**
   * Label produit normalisé
   */
  normalizedLabel: string;
  
  /**
   * Prix unitaire (en €)
   */
  price?: number;
  
  /**
   * Quantité
   */
  quantity?: number;
  
  /**
   * Score de confiance (0-100)
   */
  confidence: number;
  
  /**
   * Type de ligne détecté
   */
  type: 'product' | 'total' | 'tax' | 'payment' | 'unknown';
  
  /**
   * Nécessite validation utilisateur?
   */
  needsValidation: boolean;

  /**
   * EAN de la fiche produit correspondante dans le catalogue (null si non trouvé)
   */
  productMatchId?: string | null;
}

/**
 * Résultat d'analyse de ticket
 */
export interface ReceiptAnalysisResult {
  /**
   * Enseigne détectée (si trouvée)
   */
  storeName?: string;
  
  /**
   * Date du ticket (si trouvée)
   */
  date?: string;
  
  /**
   * Lignes produits détectées
   */
  productLines: ReceiptLine[];
  
  /**
   * Lignes non reconnues (listées explicitement)
   */
  unrecognizedLines: string[];
  
  /**
   * Nombre total de produits reconnus
   */
  totalProductsRecognized: number;
  
  /**
   * Taux de reconnaissance (%)
   */
  recognitionRate: number;
  
  /**
   * Montant total analysé (somme des prix reconnus)
   */
  totalAmount: number;
  
  /**
   * Texte OCR brut complet
   */
  rawOcrText: string;
  
  /**
   * Score de confiance global
   */
  overallConfidence: number;
  
  /**
   * Territoire détecté (si disponible)
   */
  territory?: string;
}

/**
 * Constants for receipt parsing
 */
const MAX_REASONABLE_PRICE = 10000; // Maximum price in euros for validation
const MAX_REASONABLE_QUANTITY = 100; // Maximum quantity for validation

/**
 * Motifs courants pour détecter les enseignes
 */
const STORE_PATTERNS = [
  { pattern: /CARREFOUR[\s]*MARKET/i, name: 'Carrefour Market' },
  { pattern: /CARREFOUR/i, name: 'Carrefour' },
  { pattern: /E[.\s]*LECLERC/i, name: 'E.Leclerc' },
  { pattern: /AUCHAN/i, name: 'Auchan' },
  { pattern: /CASINO/i, name: 'Casino' },
  { pattern: /INTERMARCHE/i, name: 'Intermarché' },
  { pattern: /SUPER[\s]*U/i, name: 'Super U' },
  { pattern: /HYPER[\s]*U/i, name: 'Hyper U' },
  { pattern: /LEADER[\s]*PRICE/i, name: 'Leader Price' },
  { pattern: /MONOPRIX/i, name: 'Monoprix' },
  { pattern: /FRANPRIX/i, name: 'Franprix' },
  { pattern: /MATCH/i, name: 'Match' },
];

/**
 * Motifs de lignes à ignorer (totaux, TVA, paiements)
 */
const IGNORE_PATTERNS = [
  /^TOTAL/i,
  /^SOUS[\s-]*TOTAL/i,
  /^TVA/i,
  /^CARTE[\s]*BANCAIRE/i,
  /^ESPECES/i,
  /^CHEQUE/i,
  /^RENDU/i,
  /^MONNAIE/i,
  /^CB/i,
  /^MASTERCARD/i,
  /^VISA/i,
  /^PAIEMENT/i,
  /^\*+$/,
  /^-+$/,
  /^=+$/,
  /^MERCI/i,
  /^BONNE[\s]*JOURNEE/i,
  /^AU[\s]*REVOIR/i,
  /^A[\s]*BIENTOT/i,
];

/**
 * Détecter le nom de l'enseigne dans le texte OCR
 */
function detectStoreName(ocrText: string): string | undefined {
  const lines = ocrText.split('\n').slice(0, 10); // Chercher dans les 10 premières lignes
  
  for (const line of lines) {
    for (const { pattern, name } of STORE_PATTERNS) {
      if (pattern.test(line)) {
        return name;
      }
    }
  }
  
  return undefined;
}

/**
 * Détecter la date du ticket (format DD/MM/YYYY ou DD-MM-YYYY)
 * Valide les ranges de jour (01-31) et mois (01-12)
 */
function detectReceiptDate(ocrText: string): string | undefined {
  // Chercher DD/MM/YYYY ou DD-MM-YYYY
  const dateMatch = ocrText.match(/(\d{2})[/-](\d{2})[/-](\d{4})/);
  if (dateMatch) {
    const day = parseInt(dateMatch[1], 10);
    const month = parseInt(dateMatch[2], 10);
    const year = parseInt(dateMatch[3], 10);
    
    // Valider ranges
    if (day < 1 || day > 31 || month < 1 || month > 12) {
      return undefined;
    }
    
    // Convertir en format ISO YYYY-MM-DD
    return `${year}-${dateMatch[2]}-${dateMatch[1]}`;
  }
  
  return undefined;
}

/**
 * Parser une ligne de ticket pour extraire prix et quantité
 * 
 * Formats courants:
 * - "PRODUIT NAME 2.45€" ou "PRODUIT NAME 2.45 EUR"
 * - "PRODUIT NAME 2x 1.22€" (quantité + prix unitaire)
 * - "2 PRODUIT NAME 2.45€"
 */
function parseReceiptLine(line: string): {
  label: string;
  price?: number;
  quantity?: number;
  confidence: number;
} {
  const trimmed = line.trim();
  
  // Ignorer lignes vides ou trop courtes
  if (!trimmed || trimmed.length < 3) {
    return { label: trimmed, confidence: 0 };
  }
  
  // Ignorer lignes à ignorer
  for (const pattern of IGNORE_PATTERNS) {
    if (pattern.test(trimmed)) {
      return { label: trimmed, confidence: 0 };
    }
  }
  
  // Extraire prix (format: 12.34€ ou 12.34 EUR ou 12,34€)
  // Require at least one currency indicator
  const priceMatch = trimmed.match(/(\d+[.,]\d{2})\s*(?:€|EUR)/);
  const price = priceMatch ? parseFloat(priceMatch[1].replace(',', '.')) : undefined;
  
  // Extraire quantité (format: 2x, 3X au milieu, ou début de ligne "2 " suivi de lettres majuscules consécutives)
  const qtyMatch = trimmed.match(/(?:^|\s)(\d+)[xX]\s/) || 
                   (trimmed.match(/^(\d+)\s+[A-Z]{2,}/) ? trimmed.match(/^(\d+)\s+[A-Z]{2,}/) : null);
  const quantity = qtyMatch ? parseInt(qtyMatch[1], 10) : undefined;
  
  // Extraire label (retirer prix et quantité)
  let label = trimmed;
  if (priceMatch) {
    label = label.replace(priceMatch[0], '').trim();
  }
  if (qtyMatch) {
    label = label.replace(qtyMatch[0], '').trim();
  }
  
  // Calculer confiance
  let confidence = 0;
  if (label.length >= 3) confidence += 30;
  if (price !== undefined && price > 0 && price < MAX_REASONABLE_PRICE) confidence += 50;
  if (quantity !== undefined && quantity > 0 && quantity < MAX_REASONABLE_QUANTITY) confidence += 20;
  
  return {
    label,
    price,
    quantity,
    confidence: Math.min(100, confidence),
  };
}

/**
 * Classifier le type de ligne détectée
 */
function classifyLineType(line: string): ReceiptLine['type'] {
  const upper = line.toUpperCase();
  
  // Totaux
  if (/^TOTAL|^SOUS-TOTAL/.test(upper)) return 'total';
  
  // TVA
  if (/^TVA/.test(upper)) return 'tax';
  
  // Paiements
  if (/CARTE|ESPECES|CHEQUE|RENDU|VISA|MASTERCARD|CB/.test(upper)) return 'payment';
  
  // Si contient un prix valide, probablement un produit
  if (/\d+[.,]\d{2}\s*€?/.test(line)) return 'product';
  
  return 'unknown';
}

/**
 * Analyser un ticket de caisse à partir du texte OCR
 */
export function analyzeReceiptText(ocrResult: OCRResult): ReceiptAnalysisResult {
  const lines = ocrResult.rawText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  
  const storeName = detectStoreName(ocrResult.rawText);
  const date = detectReceiptDate(ocrResult.rawText);
  
  const productLines: ReceiptLine[] = [];
  const unrecognizedLines: string[] = [];
  // Cache per-call: avoid calling searchProductsByName multiple times for the same label
  const labelCache = new Map<string, string | null>();

  for (const line of lines) {
    const parsed = parseReceiptLine(line);
    const lineType = classifyLineType(line);
    
    // Ne garder que les lignes produits
    if (lineType === 'product' && parsed.confidence > 30) {
      // Résoudre la fiche produit : EAN en priorité, sinon recherche par nom.
      // Seuil : libellé ≥ 4 caractères ET au moins 2 termes (évite les faux positifs
      // sur des labels courts/bruités comme "LT 1" ou "X2").
      let productMatchId: string | null = null;
      const labelTerms = parsed.label.trim().split(/\s+/).filter(Boolean);
      if (parsed.label.length >= 4 && labelTerms.length >= 2) {
        const cached = labelCache.get(parsed.label);
        if (cached !== undefined) {
          productMatchId = cached;
        } else {
          const nameMatches = searchProductsByName(parsed.label) as Array<{ ean?: string }>;
          productMatchId = (nameMatches.length > 0 && nameMatches[0].ean) ? nameMatches[0].ean : null;
          labelCache.set(parsed.label, productMatchId);
        }
      }
      productLines.push({
        rawText: line,
        normalizedLabel: parsed.label,
        price: parsed.price,
        quantity: parsed.quantity,
        confidence: parsed.confidence,
        type: lineType,
        needsValidation: parsed.confidence < 80, // Validation si confiance < 80%
        productMatchId,
      });
    } else if (lineType !== 'total' && lineType !== 'tax' && lineType !== 'payment') {
      // Lister les lignes non reconnues (sauf totaux/TVA/paiements)
      if (line.length > 3 && !IGNORE_PATTERNS.some(p => p.test(line))) {
        unrecognizedLines.push(line);
      }
    }
  }
  
  // Calculer statistiques
  const totalProductsRecognized = productLines.length;
  const totalLinesProcessed = lines.length;
  const recognitionRate = totalLinesProcessed > 0 
    ? Math.round((totalProductsRecognized / totalLinesProcessed) * 100)
    : 0;
  
  const totalAmount = productLines.reduce((sum, line) => {
    if (line.price && line.quantity) {
      return sum + (line.price * line.quantity);
    } else if (line.price) {
      return sum + line.price;
    }
    return sum;
  }, 0);
  
  const overallConfidence = productLines.length > 0
    ? Math.round(productLines.reduce((sum, l) => sum + l.confidence, 0) / productLines.length)
    : 0;
  
  return {
    storeName,
    date,
    productLines,
    unrecognizedLines,
    totalProductsRecognized,
    recognitionRate,
    totalAmount,
    rawOcrText: ocrResult.rawText,
    overallConfidence,
  };
}

/**
 * Scanner un ticket de caisse complet
 * 
 * @param imageUrl - URL ou blob de l'image du ticket
 * @param options - Options OCR
 * @returns Résultat d'analyse complet
 */
export async function scanReceipt(
  imageUrl: string,
  options?: { timeout?: number; language?: string }
): Promise<{
  success: boolean;
  analysis?: ReceiptAnalysisResult;
  error?: string;
  ocrResult: OCRResult;
}> {
  try {
    // Étape 1: OCR local (Tesseract.js)
    const ocrResult = await runOCR(
      imageUrl,
      options?.language || 'fra',
      { timeout: options?.timeout || 30000 }
    );
    
    // Si OCR échoue
    if (!ocrResult.success) {
      return {
        success: false,
        error: ocrResult.error || 'Échec de l\'analyse OCR du ticket',
        ocrResult,
      };
    }
    
    // Étape 2: Parser et analyser le texte
    const analysis = analyzeReceiptText(ocrResult);
    
    return {
      success: true,
      analysis,
      ocrResult,
    };
  } catch (error) {
    console.error('Receipt scanning failed:', error);
    return {
      success: false,
      error: 'Une erreur est survenue lors de l\'analyse du ticket',
      ocrResult: {
        success: false,
        rawText: '',
        confidence: 0,
        processingTime: 0,
        error: String(error),
      },
    };
  }
}

/**
 * Normaliser un label produit pour matching
 * (retire espaces multiples, met en minuscules, retire caractères spéciaux)
 */
export function normalizeProductLabel(label: string): string {
  return label
    .toLowerCase()
    .replace(/[^\w\s]/g, '') // Retirer ponctuation
    .replace(/\s+/g, ' ')    // Normaliser espaces
    .trim();
}
