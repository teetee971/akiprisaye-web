/**
 * Receipt Parser Service
 *
 * Parses raw OCR text from French thermal-paper receipts into a structured object.
 * Handles ticket formats from major French retailers (Carrefour, Leclerc, Lidl, Aldi,
 * Intermarché, Casino, Monoprix, Franprix, Super U, etc.).
 *
 * Features:
 *  - Store name detection (first non-trivial header line)
 *  - Date & time extraction (DD/MM/YY or DD/MM/YYYY formats)
 *  - Line item extraction (product name + price columns)
 *  - Total, TVA amount & rate detection
 *  - Payment method classification (CB, espèces, sans contact, …)
 *  - Receipt number extraction
 *  - Price checksum verification (sum of items vs declared total)
 *
 * ⚠️  RGPD — No data leaves the browser. Purely local computation.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ReceiptLineItem {
  /** Raw product name as read by OCR */
  name: string;
  /** Unit price in euros */
  price: number;
  /** Quantity when indicated on the line (e.g. "2 x 1,49") */
  qty?: number;
  /** Unit price when quantity > 1 (price = qty × unitPrice) */
  unitPrice?: number;
}

export interface ParsedReceipt {
  /** Store / enseigne name (from header lines) */
  storeName?: string;
  /** Store address (line following store name, heuristic) */
  storeAddress?: string;
  /** Date in DD/MM/YYYY format */
  date?: string;
  /** Time in HH:MM format */
  time?: string;
  /** Detected line items */
  items: ReceiptLineItem[];
  /** Sub-total before discounts */
  subtotal?: number;
  /** TVA amount */
  tvaAmount?: number;
  /** TVA rate in % */
  tvaRate?: number;
  /** Grand total (TTC) */
  total?: number;
  /** Payment method string */
  paymentMethod?: string;
  /** Ticket/receipt number */
  receiptNumber?: string;
  /**
   * Internal integrity check:
   *  - declared: total as read from the ticket
   *  - computed: sum of all detected line item prices
   *  - matches: |declared − computed| < 0.02 €
   */
  checksum: {
    declared: number | null;
    computed: number;
    matches: boolean;
  };
}

// ---------------------------------------------------------------------------
// Regex patterns
// ---------------------------------------------------------------------------

const RE_DATE = /\b(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2,4})\b/;
const RE_TIME = /\b(\d{1,2})[h:](\d{2})(?::(\d{2}))?\b/i;
const RE_RECEIPT_NUM = /(?:ticket|reçu|n°|numéro)[^\d]*(\d{4,12})/i;

// French total patterns — most permissive first
const RE_TOTAL = /(?:total\s*(?:ttc)?|montant\s*(?:ttc|à\s*payer|dû)?|à\s*payer)\s*[:-]?\s*(\d{1,5}[.,]\d{2})\s*€?/i;
// Subtotal (HT or partial)
const RE_SUBTOTAL = /(?:sous[\s-]total|total\s*ht)\s*[:-]?\s*(\d{1,5}[.,]\d{2})\s*€?/i;

// TVA: "TVA 20% : 2,15" or "T.V.A. : 2,15" etc.
const RE_TVA_FULL = /t\.?v\.?a\.?\s*(\d{1,2}[.,]\d+)?\s*%?\s*[:-]?\s*(\d{1,5}[.,]\d{2})\s*€?/i;
const RE_TVA_RATE = /(\d{1,2}(?:[.,]\d+)?)\s*%/;

// Payment methods
const RE_PAYMENT = /\b(cb\b|carte\s*(?:bancaire|bleue|visa|mastercard)?|esp[eè]ces?|ch[eè]que|sans\s*contact|paylib|apple\s*pay|google\s*pay|lydia|paypal|virement)\b/i;

/**
 * Match a quantity × unit-price pattern: "2 x 1,49" or "3 × 0.89"
 */
const RE_QTY_UNIT = /(\d+)\s*[x×]\s*(\d{1,4}[.,]\d{2})/i;

/**
 * Line item: name (3-45 chars), then 2+ whitespace, then price.
 * Allows optional trailing € sign and quantity prefix.
 */
const RE_ITEM_LINE = /^(.{3,45}?)\s{2,}(\d{1,4}[.,]\d{2})\s*€?\s*$/;

// Patterns that indicate header / metadata lines (NOT items)
const RE_SKIP_LINE = /(?:total|tva|ticket|date|heure|caisse|opérateur|bonjour|merci|bienvenue|fidélité|points?|solde|code)/i;

// Address heuristic: contains a street number + street word
const RE_ADDRESS = /\d{1,4}\s+(?:rue|avenue|bd|boulevard|allée|place|impasse|chemin|route)/i;

// Uppercase store name heuristic
const RE_STORE_NAME = /^[A-ZÀÂÉÈÊÙÎ\s&\-'.]{4,}$/;

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function parsePrice(raw: string): number {
  return parseFloat(raw.replace(',', '.'));
}

function extractStoreInfo(lines: string[]): { storeName?: string; storeAddress?: string } {
  let storeName: string | undefined;
  let storeAddress: string | undefined;

  for (let i = 0; i < Math.min(5, lines.length); i++) {
    const line = lines[i];
    if (!storeName && (RE_STORE_NAME.test(line) || line.length >= 4)) {
      storeName = line;
      continue;
    }
    if (storeName && !storeAddress && RE_ADDRESS.test(line)) {
      storeAddress = line;
      break;
    }
  }

  return { storeName, storeAddress };
}

function extractLineItems(lines: string[]): ReceiptLineItem[] {
  const items: ReceiptLineItem[] = [];

  for (const line of lines) {
    if (RE_SKIP_LINE.test(line)) continue;

    const m = RE_ITEM_LINE.exec(line);
    if (!m) continue;

    const price = parsePrice(m[2]);
    if (price <= 0 || price >= 10000) continue;

    const namePart = m[1].trim();
    const qtyMatch = RE_QTY_UNIT.exec(namePart);

    if (qtyMatch) {
      const qty = parseInt(qtyMatch[1], 10);
      const unitPrice = parsePrice(qtyMatch[2]);
      items.push({ name: namePart.replace(qtyMatch[0], '').trim(), price, qty, unitPrice });
    } else {
      items.push({ name: namePart, price });
    }
  }

  return items;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Parse a raw OCR receipt text into a structured `ParsedReceipt` object.
 *
 * @param text - Raw text as returned by runOCR() (any quality)
 * @returns Structured receipt data; fields are `undefined` when not detected.
 */
export function parseReceipt(text: string): ParsedReceipt {
  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const fullText = lines.join('\n');

  // --- Store info ---
  const { storeName, storeAddress } = extractStoreInfo(lines);

  // --- Date & time ---
  const dateMatch = RE_DATE.exec(fullText);
  let date: string | undefined;
  if (dateMatch) {
    const [, d, mo, y] = dateMatch;
    const year = y.length === 2 ? `20${y}` : y;
    date = `${d.padStart(2, '0')}/${mo.padStart(2, '0')}/${year}`;
  }
  const timeMatch = RE_TIME.exec(fullText);
  const time = timeMatch ? `${timeMatch[1]}:${timeMatch[2]}` : undefined;

  // --- Receipt number ---
  const receiptNumMatch = RE_RECEIPT_NUM.exec(fullText);
  const receiptNumber = receiptNumMatch?.[1];

  // --- Totals ---
  const totalMatch = RE_TOTAL.exec(fullText);
  const total = totalMatch ? parsePrice(totalMatch[1]) : undefined;

  const subtotalMatch = RE_SUBTOTAL.exec(fullText);
  const subtotal = subtotalMatch ? parsePrice(subtotalMatch[1]) : undefined;

  // --- TVA ---
  const tvaMatch = RE_TVA_FULL.exec(fullText);
  let tvaAmount: number | undefined;
  let tvaRate: number | undefined;
  if (tvaMatch) {
    tvaAmount = parsePrice(tvaMatch[2]);
    const rateRaw = tvaMatch[1] ?? RE_TVA_RATE.exec(tvaMatch[0])?.[1];
    if (rateRaw) tvaRate = parseFloat(rateRaw.replace(',', '.'));
  }

  // --- Payment ---
  const payMatch = RE_PAYMENT.exec(fullText);
  const paymentMethod = payMatch ? payMatch[0].trim() : undefined;

  // --- Line items ---
  const items = extractLineItems(lines);

  // --- Checksum ---
  const computed = Math.round(items.reduce((s, it) => s + it.price, 0) * 100) / 100;
  const checksum = {
    declared: total ?? null,
    computed,
    matches: total !== undefined ? Math.abs(total - computed) < 0.02 : false,
  };

  return {
    storeName,
    storeAddress,
    date,
    time,
    receiptNumber,
    items,
    subtotal,
    tvaAmount,
    tvaRate,
    total,
    paymentMethod,
    checksum,
  };
}

/**
 * Quick check: does the text look like a receipt?
 * Cheaper than running a full classifyScanText().
 */
export function looksLikeReceipt(text: string): boolean {
  const lower = text.toLowerCase();
  let hits = 0;
  if (/total\s*(ttc)?/i.test(lower)) hits++;
  if (/t\.?v\.?a\.?/i.test(lower)) hits++;
  if (/ticket|caisse/.test(lower)) hits++;
  if (/\d{1,4}[.,]\d{2}/.test(lower)) hits++;  // price-like number (€ optional)
  if (/montant|à\s*payer/.test(lower)) hits++;
  return hits >= 2;
}
