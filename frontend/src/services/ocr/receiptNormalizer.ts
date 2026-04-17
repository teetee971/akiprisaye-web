/**
 * Receipt Normalizer
 *
 * Converts a ParsedReceipt (from receiptParser.ts) into an array of
 * PriceObservation objects compatible with the Observatoire des prix.
 *
 * Responsibilities:
 *  - Territory detection from postal codes and store name keywords
 *  - Date conversion: DD/MM/YYYY → ISO 8601
 *  - Product category inference from label keywords
 *  - ProductId (slug) generation via toProductKey
 *  - Per-item confidence scoring
 *  - needsReview flag for ambiguous / incomplete items
 *
 * All functions are pure (no network, no localStorage).
 */

import type { ParsedReceipt, ReceiptLineItem } from '../receiptParser.js';
import type { PriceObservation, TerritoryCode } from '../../types/PriceObservation.js';
import { toProductKey } from '../../utils/productKey.js';

// ─── Territory detection ──────────────────────────────────────────────────────

const POSTAL_PREFIX_TO_TERRITORY: Record<string, TerritoryCode> = {
  '971': 'GP',
  '972': 'MQ',
  '973': 'GF',
  '974': 'RE',
  '976': 'YT',
  '975': 'PM',
  '977': 'BL',
  '978': 'MF',
};

// Keyword-based heuristics (city / island names in store name or address)
const KEYWORD_TERRITORY: Array<[RegExp, TerritoryCode]> = [
  [
    /guadeloupe|petit.?canal|morne.?[àa].?l.eau|baie.?mahault|pointe.?[àa].?pitre|basse.?terre|capesterre|sainte.?anne/i,
    'GP',
  ],
  [/martinique|fort.?de.?france|le.?lamentin|schoelcher/i, 'MQ'],
  [/guyane|cayenne|saint.?laurent/i, 'GF'],
  [/r[eé]union|saint.?denis|saint.?pierre|le.?port/i, 'RE'],
  [/mayotte|mamoudzou/i, 'YT'],
];

/**
 * Infer TerritoryCode from address or store name.
 * Falls back to `fallback` (default 'GP') when nothing is detected.
 */
export function detectTerritory(
  storeAddress?: string,
  storeName?: string,
  fallback: TerritoryCode = 'GP'
): TerritoryCode {
  const haystack = `${storeAddress ?? ''} ${storeName ?? ''}`.trim();
  if (!haystack) return fallback;

  // 1. Match DOM postal code prefix
  const pcMatch = /9[7-8]\d{3}/.exec(haystack);
  if (pcMatch) {
    const prefix = pcMatch[0].slice(0, 3);
    const code = POSTAL_PREFIX_TO_TERRITORY[prefix];
    if (code) return code;
  }

  // 2. City / island keyword
  for (const [pattern, code] of KEYWORD_TERRITORY) {
    if (pattern.test(haystack)) return code;
  }

  return fallback;
}

// ─── Date conversion ──────────────────────────────────────────────────────────

/**
 * Convert a receipt date (DD/MM/YYYY) and optional time (HH:MM) to ISO 8601.
 *
 * @example
 * toIsoDate('07/03/2026', '10:21') → '2026-03-07T10:21:00'
 */
export function toIsoDate(ddmmyyyy?: string, hhMm?: string): string {
  if (!ddmmyyyy) return new Date().toISOString();
  const parts = ddmmyyyy.split('/');
  if (parts.length !== 3) return new Date().toISOString();
  const [day, month, year] = parts;
  const datePart = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  const timePart = hhMm ? `T${hhMm}:00` : 'T00:00:00';
  return `${datePart}${timePart}`;
}

// ─── Category inference ───────────────────────────────────────────────────────

type ObsCategory = PriceObservation['productCategory'];

const CATEGORY_RULES: Array<[RegExp, ObsCategory]> = [
  [
    /\b(lait|yaourt|fromage|beurre|cr[eè]me|emmental|camembert|bleu\s+d.?auvergne|fromage\s+bleu|brie|cheddar|edam|parmesan|parmig|mozzarella|ricotta|virianna|feta)\b/i,
    'Produits laitiers',
  ],
  [
    /\b(fruits?|pommes?|poires?|oranges?|citrons?|mangues?|ananas|bananes?|fraises?|raisins?|l[eé]gumes?|carottes?|tomates?|poireaux?|oignons?|ail|brocolis?|courgettes?|aubergines?|salades?|concombres?|[eé]pinards?|choux?)\b/i,
    'Fruits et légumes',
  ],
  [
    /\b(jambon|saucisses?|saucissons?|poulets?|b[œo]eufs?|porc|veau|viande|canard|crevettes?|poissons?|thon|sardines?|maquereaux?|saumon|colin|merlu|cabillaud|cordon.bleu)\b/i,
    'Viandes et poissons',
  ],
  [
    /\b(cafe|chocolat|sucres?|farine|pates?|biscuits?|gateaux?|bonbons?|confiture|miel|huile|vinaigre|sel|poivre|lentilles?|haricots?|riz|semoule|pain|brioche|crackers?|chips)\b/i,
    'Épicerie',
  ],
  [
    /\b(eau|jus|soda|coca|pepsi|limonade|sirop|bieres?|vin|champagne|rhum|whisky|vodka|alcool|margarine)\b/i,
    'Boissons',
  ],
  [
    /\b(shampooing?|gel\s*douche|dentifrice|brosse|rasoir|parfum|deodorant|savon|lotion|maquillage|coton|hygiene|lingette)\b/i,
    'Hygiène et beauté',
  ],
  [
    /\b(lessive|javel|nettoyant|detergent|essuie.?tout|torchon|eponge|sac.?poubelle|papier.toilette|entretien)\b/i,
    'Entretien',
  ],
  [/\b(couche|bebe|lait.?maternell[e]?|biberon|linge.?bebe)\b/i, 'Bébé'],
];

/**
 * Infer the product category from its label.
 * Strips combining diacritics before matching so that word-boundary assertions
 * work correctly for accented words (e.g. "Café" → "Cafe").
 * Returns 'Autres' when no rule matches.
 */
export function detectCategory(label: string): ObsCategory {
  // Strip combining diacritical marks so \b works on accented word endings
  const ascii = label.normalize('NFD').replace(/[̀-ͯ]/g, '');
  for (const [pattern, category] of CATEGORY_RULES) {
    if (pattern.test(ascii)) return category;
  }
  return 'Autres';
}

// ─── Label normalization ──────────────────────────────────────────────────────

/** Abbreviation expansions found on DOM thermal tickets */
const ABBREVIATIONS: Array<[RegExp, string]> = [
  [/\bSCE\b/gi, 'sauce'],
  [/\bRAPP?[.\s]/gi, 'râpé '],
  [/\bPAST[.\s]/gi, 'pasteurisé '],
  [/\b1\/2\s*ECRE?M?E?\b/gi, 'demi-écrémé'],
  [/\bPXM\b/gi, ''], // internal POS code
  [/\bLS\b/gi, ''], // internal lot code
  [/\bUC\d+\b/gi, ''], // unit code
  [/\bPQC\b/gi, ''], // internal batch code
];

/**
 * Lightly normalise an OCR-extracted product label:
 *  - expand known abbreviations
 *  - collapse redundant whitespace
 *  - trim
 */
export function normalizeLabel(raw: string): string {
  let s = raw.trim();
  for (const [pat, rep] of ABBREVIATIONS) {
    s = s.replace(pat, rep);
  }
  return s.replace(/\s{2,}/g, ' ').trim();
}

// ─── Confidence scoring ───────────────────────────────────────────────────────

/** Labels that are inherently ambiguous on DOM tickets */
const AMBIGUOUS_PATTERNS = [
  /\bnoix\b/i,
  /\bvirianna\b/i,
  /\bcanard\b.*\bcomplet\b/i,
  // Known POS internal codes that appear at the start of a label
  /^\s*(?:PDN|PXM|PQC|UX\d+|UC\d+|LS)\s/i,
];

/**
 * Compute a 0–1 confidence score for a parsed receipt item.
 *
 * Factors:
 *  + label length ≥ 8 chars
 *  + price in realistic range
 *  + receipt checksum passes
 *  − ambiguous label
 *  − very short or numeric-only label
 */
export function computeConfidenceScore(item: ReceiptLineItem, parsed: ParsedReceipt): number {
  let score = 0.8;

  if (item.name.length >= 8) score += 0.05;
  if (item.price > 0 && item.price < 200) score += 0.05;
  if (parsed.checksum.matches) score += 0.05;

  if (AMBIGUOUS_PATTERNS.some((p) => p.test(item.name))) score -= 0.15;
  if (item.name.length < 5 || /^\d+$/.test(item.name.trim())) score -= 0.2;

  return Math.max(0, Math.min(1, Math.round(score * 100) / 100));
}

// ─── Public API ───────────────────────────────────────────────────────────────

export interface ReceiptNormalizerOptions {
  /** Override the territory detection (useful when store info is missing) */
  territory?: TerritoryCode;
}

/**
 * Convert a ParsedReceipt into an array of PriceObservation.
 *
 * Items with price ≤ 0 or a name shorter than 3 chars are silently dropped.
 *
 * @param receipt - Structured receipt from parseReceipt()
 * @param opts    - Optional overrides
 */
export function normalizeReceipt(
  receipt: ParsedReceipt,
  opts?: ReceiptNormalizerOptions
): PriceObservation[] {
  const territory = opts?.territory ?? detectTerritory(receipt.storeAddress, receipt.storeName);

  const observedAt = toIsoDate(receipt.date, receipt.time);
  const storeLabel = receipt.storeName ?? 'Enseigne inconnue';

  return receipt.items
    .filter((item) => item.name.trim().length >= 3 && item.price > 0)
    .map((item) => {
      const label = normalizeLabel(item.name);
      const productId = toProductKey(label);
      const category = detectCategory(label);

      const obs: PriceObservation = {
        productId,
        productLabel: label,
        territory,
        price: item.price,
        observedAt,
        storeLabel,
        productCategory: category,
        currency: 'EUR',
        sourceType: 'citizen',
      };
      return obs;
    });
}
