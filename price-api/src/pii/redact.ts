import type { RawReceipt } from '../receiptOcr';

const EMAIL_REGEX = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const PHONE_REGEX = /(?:\+33|0)[1-9](?:[ .-]?\d{2}){4}/g;
const CARD_REGEX = /\b(?:\d[ -]*?){13,19}\b/g;
const IBAN_REGEX = /\b[A-Z]{2}\d{2}[A-Z0-9]{11,30}\b/gi;
const ADDRESS_HINT_REGEX = /\b(?:rue|avenue|av\.|boulevard|bd\.|impasse|chemin|residence|résidence)\b/gi;
const LOYALTY_HINT_REGEX = /\b(?:fid[eé]lit[eé]|carte client|n[°o]\s*client|qr\s*code|barcode)\b/gi;

export interface SanitizedReceiptItem {
  lineIndex: number;
  productLabel: string;
  quantity?: number;
  unitPrice?: number;
  lineTotal?: number;
  ean?: string;
  brand?: string;
  category?: string;
  confidence: number;
}

export interface SanitizedReceipt {
  retailer?: string;
  storeName?: string;
  observedAt?: string;
  totals: {
    total?: number;
    tax?: number;
    subtotal?: number;
  };
  items: SanitizedReceiptItem[];
  piiRedaction: Record<string, number>;
  confidence: number;
}

function scrubPII(input: string, counters: Record<string, number>): string {
  let value = input;
  const rules: [RegExp, string][] = [
    [EMAIL_REGEX, 'email'],
    [PHONE_REGEX, 'phone'],
    [CARD_REGEX, 'card'],
    [IBAN_REGEX, 'iban'],
    [ADDRESS_HINT_REGEX, 'address'],
    [LOYALTY_HINT_REGEX, 'loyalty'],
  ];

  for (const [regex, key] of rules) {
    const matches = value.match(regex);
    if (matches && matches.length > 0) {
      counters[key] = (counters[key] ?? 0) + matches.length;
      value = value.replace(regex, '');
    }
  }

  return value.replace(/\s{2,}/g, ' ').trim();
}

function looksLikePersonName(value: string): boolean {
  return /\b(?:mr|mme|m\.|madame|monsieur)\b/i.test(value);
}

export function redactReceipt(raw: RawReceipt): SanitizedReceipt {
  const piiRedaction: Record<string, number> = {};

  const retailerRaw = raw.merchantCandidates[0] ?? '';
  const storeRaw = raw.storeCandidates[0] ?? '';
  const retailer = scrubPII(retailerRaw, piiRedaction);
  const storeName = scrubPII(storeRaw, piiRedaction);

  const items: SanitizedReceiptItem[] = [];
  raw.lines.forEach((line, index) => {
    const scrubbed = scrubPII(line.label, piiRedaction);
    if (!scrubbed || looksLikePersonName(scrubbed)) {
      piiRedaction.name = (piiRedaction.name ?? 0) + 1;
      return;
    }

    items.push({
      lineIndex: index,
      productLabel: scrubbed,
      quantity: line.quantity,
      unitPrice: line.unitPrice,
      lineTotal: line.lineTotal,
      ean: line.ean,
      brand: line.brand,
      category: line.category,
      confidence: line.confidence ?? raw.confidence,
    });
  });

  return {
    retailer: retailer || undefined,
    storeName: storeName || undefined,
    observedAt: raw.dateCandidates[0],
    totals: raw.totals,
    items,
    piiRedaction,
    confidence: raw.confidence,
  };
}
