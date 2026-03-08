/**
 * Receipt Import Types
 *
 * Shared TypeScript types for the receipt OCR import pipeline.
 * Used by: receiptImportService, route handler, scripts.
 */

// ─── Territory ────────────────────────────────────────────────────────────────
export type TerritoryCode = 'gp' | 'mq' | 'gf' | 're' | 'yt' | 'pm' | 'bl' | 'mf' | 'fr';

// ─── Store ────────────────────────────────────────────────────────────────────
export interface StoreInput {
  normalizedName: string;
  rawName?: string;
  brand?: string;
  company?: string;
  siret?: string;
  phone?: string;
  address?: string;
  postalCode?: string;
  city?: string;
  territory: TerritoryCode;
}

// ─── Receipt ──────────────────────────────────────────────────────────────────
export interface ReceiptInput {
  receiptDate: string;           // ISO date "YYYY-MM-DD"
  receiptTime?: string;          // "HH:MM:SS"
  currency?: string;
  itemsCount?: number;
  linesCount?: number;
  subtotalHt?: number;
  totalTtc: number;
  paymentMethod?: string;
  rawOcrText?: string;
  confidenceScore?: number;      // 0–1
  needsReview?: boolean;
}

// ─── VAT Line ─────────────────────────────────────────────────────────────────
export interface VatLineInput {
  rate: number;
  baseHt?: number;
  amount: number;
  totalTtc?: number;
}

// ─── Receipt Item ─────────────────────────────────────────────────────────────
export interface ReceiptItemInput {
  lineIndex: number;
  rawLabel: string;
  normalizedLabel?: string;
  /** Clé produit explicite fournie par le caller (override auto-génération) */
  productKey?: string;
  brand?: string | null;
  category?: string | null;
  subcategory?: string | null;
  quantity?: number;
  unit?: string | null;
  /** Poids en kg (ex: 0.675 pour 675g) */
  weightKg?: number | null;
  packageSizeValue?: number | null;
  packageSizeUnit?: string | null;
  unitPrice?: number | null;
  totalPrice: number;
  vatRate?: number | null;
  barcode?: string | null;
  confidenceScore?: number;      // 0–1
  needsReview?: boolean;
  reviewNote?: string;
  notes?: string;
  /** Texte de grammage brut (ex: "300g", "75cl") — utilisé si packageSize absent */
  sizeText?: string;
}

// ─── OCR Block ────────────────────────────────────────────────────────────────
export interface OcrBlock {
  text: string;
  confidenceScore?: number;
  bbox?: { x: number; y: number; width: number; height: number };
  page?: number;
}

// ─── Import Payload (POST body) ───────────────────────────────────────────────
export interface ImportReceiptPayload {
  store: StoreInput;
  receipt: ReceiptInput;
  items: ReceiptItemInput[];
  vatLines?: VatLineInput[];
  rawOcrText?: string;
  rawOcrBlocks?: OcrBlock[];
}

// ─── Import Result ────────────────────────────────────────────────────────────
export interface ImportReceiptResult {
  success: boolean;
  receiptId?: string;
  storeId?: string;
  createdProducts: number;
  updatedProducts: number;
  createdObservations: number;
  createdHistoryMonthly: number;
  createdHistoryYearly: number;
  createdAlertEvents: number;
  reviewItems: number;
  warnings: string[];
  error?: string;
}

// ─── Price Observation ────────────────────────────────────────────────────────
export interface PriceObservationInput {
  source: string;
  receiptId: string;
  receiptItemId?: string;
  productId?: string;
  territory: TerritoryCode;
  storeId?: string;
  storeLabel: string;
  observedAt: Date;
  productLabel: string;
  normalizedLabel: string;
  category?: string | null;
  brand?: string | null;
  barcode?: string | null;
  quantity?: number | null;
  unit?: string | null;
  packageSizeValue?: number | null;
  packageSizeUnit?: string | null;
  price: number;
  currency: string;
  confidenceScore: number;
  needsReview: boolean;
}

// ─── Price Alert Event ────────────────────────────────────────────────────────
export type AlertEventType = 'new_low' | 'significant_drop' | 'significant_rise';

export interface PriceAlertEventInput {
  productId: string;
  territory: TerritoryCode;
  observedAt: Date;
  currentPrice: number;
  previousPrice?: number;
  eventType: AlertEventType;
  payloadJson?: Record<string, unknown>;
}

// ─── Review Queue ─────────────────────────────────────────────────────────────
export type ReviewEntityType =
  | 'receipt'
  | 'receipt_item'
  | 'product'
  | 'product_image';

export interface ReviewQueueEntryInput {
  entityType: ReviewEntityType;
  entityId: string;
  reason: string;
  payloadJson?: Record<string, unknown>;
}

// ─── Batch Import ─────────────────────────────────────────────────────────────

export interface BatchReceiptEntry {
  store: {
    storeKey?: string;
    storeLabel?: string;
    normalizedName?: string;
    brand?: string;
    company?: string;
    siret?: string;
    phone?: string;
    address?: string;
    postalCode?: string;
    city?: string;
    territory?: string;
  };
  receiptMeta?: {
    ticketNumber?: string;
    observedAt?: string;
    receiptDate?: string;
    date?: string;
    receiptTime?: string;
    time?: string;
    currency?: string;
    itemsCount?: number;
    totalTtc?: number;
    total?: number;
    paymentMethod?: string;
    needsReview?: boolean;
  };
  receipt?: ReceiptInput;
  items: ReceiptItemInput[];
  rawOcrText?: string;
}

export interface BatchImportPayload {
  importBatch: {
    batchId?: string;
    territory?: TerritoryCode;
    sourceType?: string;
    currency?: string;
    schemaVersion?: string;
    receipts: BatchReceiptEntry[];
  };
}

export interface BatchImportResult {
  batchId?: string;
  totalReceipts: number;
  successCount: number;
  failCount: number;
  results: Array<{ index: number; result: ImportReceiptResult }>;
  warnings: string[];
}
