export type ScanHubType =
  | 'receipt'
  | 'product'
  | 'shelf_label'
  | 'nutrition'
  | 'ingredients'
  | 'barcode'
  | 'legal'
  | 'promotion'
  | 'unknown';

export interface ScanHubClassification {
  type: ScanHubType;
  confidence: number;
  signals: string[];
  matches: Record<string, number>;
}

/** Structured data extracted from a receipt OCR text */
export interface ReceiptData {
  storeName?: string;
  date?: string;
  time?: string;
  items: Array<{ name: string; price: number }>;
  total?: number;
  tvaAmount?: number;
  tvaRate?: number;
  paymentMethod?: string;
  priceChecksum: { declared: number | null; computed: number; matches: boolean };
}

const TYPE_KEYWORDS: Record<ScanHubType, RegExp[]> = {
  receipt: [
    /ticket\s*(de\s*caisse)?/i,
    /caisse/i,
    /t\.?v\.?a\.?/i,
    /ttc/i,
    /ht\b/i,
    /total\s*(ttc|ht)?/i,
    /montant\s*(ttc|ht|d[ûu])?/i,
    /à\s*payer/i,
    /règlement|rendu\s*monnaie/i,
    /cb|carte\s*(bancaire|bleue)/i,
    /esp[eè]ces?/i,
    /avoir/i,
    /n°\s*ticket|ticket\s*n°/i,
    /sous[\s-]total/i,
    /remise|fidélité/i,
  ],
  product: [/marque/i, /poids\s*net/i, /contient/i, /origine/i, /lot\s*n?°?/i, /dlc|dluo/i],
  shelf_label: [
    /€\/kg/i,
    /€\/l/i,
    /prix\s*(au\s*)?(kg|litre|unit[ée])/i,
    /rayon/i,
    /promo/i,
    /lot\s*de/i,
    /gondole/i,
  ],
  nutrition: [
    /valeurs?\s*nutritionnelles?/i,
    /nutrition\s*facts?/i,
    /pour\s*100\s*(g|ml)/i,
    /kcal/i,
    /kj/i,
    /matières?\s*grasses?|lipides?/i,
    /glucides?|sucres?/i,
    /protéines?/i,
    /fibres?\s*alimentaires?/i,
    /\bsel\b/i,
    /acides?\s*gras/i,
  ],
  ingredients: [
    /ingr[ée]dients?\s*:/i,
    /allerg[èe]nes?\s*:/i,
    /peut\s*contenir/i,
    /additifs?/i,
    /conservateurs?/i,
    /colorants?/i,
  ],
  barcode: [/\b\d{8,14}\b/],
  legal: [
    /mention\s*l[ée]gale/i,
    /service\s*consommateurs/i,
    /ne\s*pas\s*jeter/i,
    /recyclage/i,
    /point\s*vert/i,
  ],
  promotion: [
    /promo/i,
    /offre\s*(sp[ée]ciale|du\s*moment)?/i,
    /remise/i,
    /r[ée]duction/i,
    /2\+1/i,
    /gratuit/i,
    /économisez/i,
  ],
  unknown: [],
};

const TYPE_LABELS: Record<ScanHubType, string> = {
  receipt: 'Ticket de caisse',
  product: 'Produit / emballage',
  shelf_label: 'Étiquette de gondole',
  nutrition: 'Tableau nutritionnel',
  ingredients: "Liste d'ingrédients",
  barcode: 'Code-barres / QR',
  legal: 'Mention légale',
  promotion: 'Texte promotionnel',
  unknown: 'Type non identifié',
};

export function getScanHubTypeLabel(type: ScanHubType): string {
  return TYPE_LABELS[type] ?? TYPE_LABELS.unknown;
}

function countMatches(text: string, patterns: RegExp[]): number {
  return patterns.reduce((count, pattern) => (pattern.test(text) ? count + 1 : count), 0);
}

export function classifyScanText(text: string): ScanHubClassification {
  const normalized = text.toLowerCase();
  const matches: Record<string, number> = {};
  const signals: string[] = [];

  let bestType: ScanHubType = 'unknown';
  let bestScore = 0;

  for (const type of Object.keys(TYPE_KEYWORDS) as ScanHubType[]) {
    const score = countMatches(normalized, TYPE_KEYWORDS[type]);
    matches[type] = score;
    if (score > bestScore) {
      bestScore = score;
      bestType = type;
    }
  }

  // Tiebreaker: receipt wins over generic "product" when monetary amounts are present
  if (bestType === 'product' && matches.receipt > 0) {
    bestType = 'receipt';
    bestScore = matches.receipt;
  }

  if (bestType === 'unknown' && normalized.length > 120) {
    bestType = 'product';
  }

  if (matches.receipt > 0) signals.push('Mention "ticket/caisse/TVA" détectée');
  if (matches.ingredients > 0) signals.push('Mots-clés ingrédients/allergènes');
  if (matches.nutrition > 0) signals.push('Mots-clés nutritionnels');
  if (matches.shelf_label > 0) signals.push('Prix unitaire / étiquette de rayon');
  if (matches.barcode > 0) signals.push('Séquence numérique type code-barres');
  if (matches.promotion > 0) signals.push('Mention promotionnelle');
  if (matches.legal > 0) signals.push('Mentions légales');

  // Confidence: score-based with length bonus, capped at 98
  const lengthBonus = Math.min(15, Math.round(normalized.length / 50));
  const confidence = Math.min(98, Math.max(35, bestScore * 18 + lengthBonus));

  return {
    type: bestType,
    confidence,
    signals,
    matches,
  };
}

/**
 * Extract all price values from text.
 * Handles French formats: 1,99 / 1.99 / 1,99 € / 12 €
 */
export function extractPrices(text: string): number[] {
  const priceRegex = /\b(\d{1,4}(?:[.,]\d{2})?)\s*€?\b/g;
  const results: number[] = [];
  for (const match of text.matchAll(priceRegex)) {
    const raw = match[1].replace(',', '.');
    const value = parseFloat(raw);
    if (!Number.isNaN(value) && value > 0 && value < 10000) {
      // Exclude bare integers > 100 without € symbol (likely years or quantities)
      if (Number.isInteger(value) && value > 100 && !match[0].includes('€')) continue;
      results.push(value);
    }
  }
  return results;
}

export function extractAdditives(text: string): string[] {
  const additiveRegex = /\bE\s?\d{3,4}[a-i]?\b/gi;
  const matches = [...text.matchAll(additiveRegex)];
  return Array.from(new Set(matches.map((match) => match[0].toUpperCase().replace(/\s/g, ''))));
}

export function estimateNovaIndex(additivesCount: number): string {
  if (additivesCount === 0) return 'NOVA 1 (peu ou pas transformé)';
  if (additivesCount <= 2) return 'NOVA 2-3 (transformé)';
  return 'NOVA 4 (ultra-transformé)';
}

export function estimateNutriScore(text: string): string {
  const match = text.match(/nutri[-\s]?score\s*:?\s*([a-e])/i);
  if (match?.[1]) {
    return `Nutri-Score ${match[1].toUpperCase()}`;
  }
  return 'Nutri-Score : non déterminé';
}

// ---------------------------------------------------------------------------
// Receipt structured extraction
// ---------------------------------------------------------------------------

const STORE_HEADER_LINES = 3;

const DATE_REGEX = /\b(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2,4})\b/;
const TIME_REGEX = /\b(\d{1,2})[h:](\d{2})(?::(\d{2}))?\b/i;
const TOTAL_REGEX =
  /(?:total\s*(?:ttc)?|montant\s*(?:ttc|à\s*payer|dû)?|à\s*payer)\s*[:-]?\s*(\d{1,4}[.,]\d{2})/i;
const TVA_LINE_REGEX = /t\.?v\.?a\.?\s*(?:\d{1,2}[.,]\d*\s*%\s*)?[:-]?\s*(\d{1,4}[.,]\d{2})/i;
const TVA_RATE_REGEX = /(\d{1,2}[.,]\d*)\s*%/;
const PAYMENT_REGEX =
  /\b(cb|carte\s*(bancaire|bleue)?|esp[eè]ces?|ch[eè]que|sans\s*contact|paylib|apple\s*pay|google\s*pay)\b/i;
const ITEM_LINE_REGEX = /^(.{3,40}?)\s{2,}(\d{1,4}[.,]\d{2})\s*€?\s*$/;

/**
 * Extract structured data from a raw OCR receipt text.
 * Works with French thermal-paper ticket formats.
 * Returns store name, date/time, line items, total, TVA, payment method,
 * and a price checksum to verify OCR accuracy.
 */
export function extractReceiptData(text: string): ReceiptData {
  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  // Store name: first non-trivial line at the top
  let storeName: string | undefined;
  for (let i = 0; i < Math.min(STORE_HEADER_LINES, lines.length); i++) {
    const line = lines[i];
    if (line.length >= 4) {
      storeName = line;
      break;
    }
  }

  const fullText = lines.join('\n');

  // Date & time
  const dateMatch = DATE_REGEX.exec(fullText);
  let date: string | undefined;
  if (dateMatch) {
    const [, d, m, y] = dateMatch;
    const year = y.length === 2 ? `20${y}` : y;
    date = `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${year}`;
  }
  const timeMatch = TIME_REGEX.exec(fullText);
  const time = timeMatch ? `${timeMatch[1]}:${timeMatch[2]}` : undefined;

  // Total
  const totalMatch = TOTAL_REGEX.exec(fullText);
  const total = totalMatch ? parseFloat(totalMatch[1].replace(',', '.')) : undefined;

  // TVA
  const tvaLineMatch = TVA_LINE_REGEX.exec(fullText);
  let tvaAmount: number | undefined;
  let tvaRate: number | undefined;
  if (tvaLineMatch) {
    tvaAmount = parseFloat(tvaLineMatch[1].replace(',', '.'));
    const rateMatch = TVA_RATE_REGEX.exec(tvaLineMatch[0]);
    if (rateMatch) tvaRate = parseFloat(rateMatch[1].replace(',', '.'));
  }

  // Payment method
  const paymentMatch = PAYMENT_REGEX.exec(fullText);
  const paymentMethod = paymentMatch ? paymentMatch[0].trim() : undefined;

  // Line items: lines matching "product name ... price" pattern
  const items: ReceiptData['items'] = [];
  for (const line of lines) {
    const m = ITEM_LINE_REGEX.exec(line);
    if (m) {
      const price = parseFloat(m[2].replace(',', '.'));
      if (price > 0) {
        items.push({ name: m[1].trim(), price });
      }
    }
  }

  // Price checksum verification
  const computed = Math.round(items.reduce((s, it) => s + it.price, 0) * 100) / 100;
  const priceChecksum = {
    declared: total ?? null,
    computed,
    matches: total !== undefined ? Math.abs(total - computed) < 0.02 : false,
  };

  return {
    storeName,
    date,
    time,
    items,
    total,
    tvaAmount,
    tvaRate,
    paymentMethod,
    priceChecksum,
  };
}
