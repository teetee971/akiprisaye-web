/**
 * photoOcrExtractor.ts
 *
 * Runs Tesseract OCR on a data-URL image and extracts structured fields
 * (prices, store name, date, product names) using the existing receiptParser.
 *
 * Designed for the citizen price-reporting flow:
 *  - Input: JPEG data-URL from camera/gallery
 *  - Output: OcrExtracted with raw text + parsed fields
 *  - All processing is local (no server call)
 */

import { runOCR } from './ocrService';
import { parseReceipt } from './receiptParser';
import type { OcrExtracted } from '../types/localProduct';

/**
 * Convert a data-URL to a Blob URL for Tesseract (which expects a URL or Blob).
 */
function dataUrlToBlob(dataUrl: string): string {
  return dataUrl; // Tesseract.js accepts data-URLs directly via recognize()
}

/**
 * Extract price candidates (>0, <10000) from a block of text.
 */
function extractPrices(text: string): number[] {
  const matches = text.matchAll(/(\d{1,4}[.,]\d{2})\s*€?/g);
  const prices: number[] = [];
  for (const m of matches) {
    const val = parseFloat(m[1].replace(',', '.'));
    if (!isNaN(val) && val > 0 && val < 10000) {
      prices.push(val);
    }
  }
  // Deduplicate
  return [...new Set(prices)].sort((a, b) => a - b);
}

/** DOM supermarket names used for normalization */
const STORE_PATTERNS: Array<[RegExp, string]> = [
  [/carrefour\s*market/i, 'Carrefour Market'],
  [/carrefour\s*city/i, 'Carrefour City'],
  [/carrefour/i, 'Carrefour'],
  [/e\.?\s*leclerc/i, 'E.Leclerc'],
  [/leclerc/i, 'E.Leclerc'],
  [/leader\s*price/i, 'Leader Price'],
  [/intermarche/i, 'Intermarché'],
  [/intermarch/i, 'Intermarché'],
  [/super\s*u/i, 'Super U'],
  [/hyper\s*u/i, 'Hyper U'],
  [/\bu\b/i, 'Super U'],
  [/monoprix/i, 'Monoprix'],
  [/casino/i, 'Casino'],
  [/aldi/i, 'Aldi'],
  [/lidl/i, 'Lidl'],
  [/auchan/i, 'Auchan'],
  [/score/i, 'Score'],
  [/ecomax/i, 'Ecomax'],
  [/cora/i, 'Cora'],
  [/lolo/i, 'Lolo'],
];

function extractStore(text: string): string | undefined {
  for (const [pattern, name] of STORE_PATTERNS) {
    if (pattern.test(text)) return name;
  }
  return undefined;
}

/**
 * Run OCR on a data-URL image and return structured OcrExtracted fields.
 *
 * @param dataUrl  JPEG data-URL (already resized, ≤80 KB recommended)
 * @param timeoutMs  Max OCR time in ms (default 20 s)
 */
export async function extractFromPhoto(dataUrl: string, timeoutMs = 20000): Promise<OcrExtracted> {
  const result = await runOCR(dataUrlToBlob(dataUrl), 'fra', {
    timeout: timeoutMs,
    receiptMode: true,
  });

  if (!result.success || !result.rawText) {
    return {
      rawText: result.rawText ?? '',
      confidence: result.confidence ?? 0,
    };
  }

  const rawText = result.rawText;

  // Use existing receiptParser for structured extraction
  const parsed = parseReceipt(rawText);

  // Prices: from line items + total
  const itemPrices = parsed.items.map((it) => it.price).filter((p) => p > 0);
  const allPrices = extractPrices(rawText);
  const detectedPrices =
    itemPrices.length > 0 ? itemPrices : allPrices.length > 0 ? allPrices : undefined;

  // Store
  const detectedStore = parsed.storeName ?? extractStore(rawText);

  // Date
  const detectedDate = parsed.date ? parseDDMMYYYY(parsed.date) : extractIsoDate(rawText);

  // Product names from line items
  const detectedProducts = parsed.items
    .map((it) => it.name)
    .filter((n) => n && n.length >= 3)
    .slice(0, 10);

  return {
    rawText,
    confidence: result.confidence,
    detectedPrices,
    detectedStore,
    detectedDate,
    detectedProducts: detectedProducts.length > 0 ? detectedProducts : undefined,
  };
}

/** Convert "DD/MM/YYYY" → "YYYY-MM-DD" */
function parseDDMMYYYY(s: string): string | undefined {
  const m = s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return undefined;
  return `${m[3]}-${m[2]}-${m[1]}`;
}

/** Extract ISO-like date from free text */
function extractIsoDate(text: string): string | undefined {
  const m = text.match(/(\d{4})[/-](\d{2})[/-](\d{2})/);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  const m2 = text.match(/(\d{2})[/.-](\d{2})[/.-](\d{4})/);
  if (m2) return `${m2[3]}-${m2[2]}-${m2[1]}`;
  return undefined;
}
