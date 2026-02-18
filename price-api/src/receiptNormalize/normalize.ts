import type { SanitizedReceipt } from '../pii/redact';

const RETAILER_MAP: Record<string, string> = {
  carrefour: 'carrefour',
  'e.leclerc': 'leclerc',
  leclerc: 'leclerc',
  intermarche: 'intermarché',
  intermarché: 'intermarché',
  'intermarché': 'intermarché',
  'super u': 'superu',
  superu: 'superu',
};

export interface NormalizedReceiptItem {
  lineIndex: number;
  productLabel: string;
  quantity?: number;
  unitPriceCents?: number;
  lineTotalCents?: number;
  ean?: string;
  brand?: string;
  category?: string;
  confidence: number;
}

export interface NormalizedReceipt {
  retailer?: string;
  storeName?: string;
  observedAt?: string;
  totals: {
    totalCents?: number;
    taxCents?: number;
    subtotalCents?: number;
  };
  items: NormalizedReceiptItem[];
  piiRedaction: Record<string, number>;
  confidence: number;
}

const toCents = (value?: number): number | undefined => (typeof value === 'number' ? Math.round(value * 100) : undefined);

export function normalizeReceipt(input: SanitizedReceipt): NormalizedReceipt {
  const normalizedRetailer = input.retailer ? RETAILER_MAP[input.retailer.trim().toLowerCase()] ?? input.retailer.trim() : undefined;
  const normalizedStore = input.storeName?.trim() || undefined;
  const observedAt = input.observedAt ? new Date(input.observedAt).toISOString() : undefined;

  const items = input.items.map((item) => ({
    lineIndex: item.lineIndex,
    productLabel: item.productLabel.trim(),
    quantity: item.quantity,
    unitPriceCents: toCents(item.unitPrice),
    lineTotalCents: toCents(item.lineTotal),
    ean: item.ean,
    brand: item.brand?.trim(),
    category: item.category?.trim(),
    confidence: item.confidence,
  }));

  const confidence = items.length
    ? items.reduce((sum, line) => sum + line.confidence, 0) / items.length
    : input.confidence;

  return {
    retailer: normalizedRetailer,
    storeName: normalizedStore,
    observedAt,
    totals: {
      totalCents: toCents(input.totals.total),
      taxCents: toCents(input.totals.tax),
      subtotalCents: toCents(input.totals.subtotal),
    },
    items,
    piiRedaction: input.piiRedaction,
    confidence,
  };
}
