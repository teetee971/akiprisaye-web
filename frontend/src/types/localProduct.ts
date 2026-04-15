export interface LocalProductItem {
  barcode: string;
  title: string;
  brand?: string;
  imageUrl?: string;
  territory?: string;
  lastPrice?: number;
  median?: number;
  lastSeenAt: string;
}

/** OCR-extracted fields from a single proof photo */
export interface OcrExtracted {
  /** Raw OCR text from the photo */
  rawText: string;
  /** OCR confidence score 0-100 */
  confidence: number;
  /** Detected price(s) */
  detectedPrices?: number[];
  /** Best detected store name */
  detectedStore?: string;
  /** Detected date */
  detectedDate?: string;
  /** Detected product names */
  detectedProducts?: string[];
}

export interface LocalPriceReport {
  id: string;
  barcode: string;
  territory: string;
  source: 'user_report';
  price: number;
  currency: 'EUR';
  unit?: 'unit' | 'kg' | 'l';
  store?: string;
  city?: string;
  observedAt: string;
  createdAt: string;
  note?: string;
  /** JPEG data-URIs captured as photo proofs (resized ≤80 KB each, up to 5) */
  proofPhotos?: string[];
  /** OCR data extracted from each photo in proofPhotos (parallel array) */
  ocrData?: OcrExtracted[];
  /** @deprecated use proofPhotos[0] instead */
  proofPhoto?: string;
  /** Promotional price flag (set by OCR pipeline) */
  isPromo?: boolean;
}
