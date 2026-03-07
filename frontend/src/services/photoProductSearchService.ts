/**
 * Photo Product Search Service
 *
 * Identifies a product from a photo:
 *   1. Extracts a barcode from the image (BarcodeDetector API → ZXing → OCR)
 *   2. Fetches product details from Open Food Facts
 *   3. Fetches crowdsourced prices from Open Prices (prices.openfoodfacts.org)
 *
 * All data comes from real, open public APIs — no mock data.
 */

import { BrowserMultiFormatReader } from '@zxing/browser';
import { fetchOffProductDetails, type OffProductUiModel } from './openFoodFacts';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface PriceListing {
  price: number;
  currency: string;
  date: string;
  locationName?: string;
  locationCity?: string;
  locationCountry?: string;
  locationOsmId?: number;
  proofId?: number;
}

export interface PhotoSearchResult {
  /** Detected barcode (null if no barcode found) */
  barcode: string | null;
  /** Detection method used */
  detectionMethod: 'barcode_detector' | 'zxing' | 'ocr' | 'none';
  /** Product details from Open Food Facts */
  product: OffProductUiModel | null;
  /** Crowdsourced prices from Open Prices */
  prices: PriceListing[];
  /** Best (lowest) observed price */
  bestPrice: number | null;
  /** Latest observed price */
  latestPrice: number | null;
  error?: string;
}

// ─── BarcodeDetector Web API ──────────────────────────────────────────────────
// Use a module-scoped accessor to avoid conflicting with any global declaration.

type PhotoBarcodeFormat = 'ean_13' | 'ean_8' | 'upc_a' | 'upc_e' | 'code_128' | 'qr_code';

interface PhotoBarcodeResult {
  rawValue: string;
  format: PhotoBarcodeFormat;
}

interface PhotoBarcodeDetector {
  // Web standard: accepts any image source (img, canvas, video, blob…)
   
  detect(source: any): Promise<PhotoBarcodeResult[]>;
}

interface PhotoBarcodeDetectorCtor {
  new (options?: { formats?: PhotoBarcodeFormat[] }): PhotoBarcodeDetector;
}

function getNativeBarcodeDetector(): PhotoBarcodeDetectorCtor | undefined {
  if (typeof window === 'undefined') return undefined;
   
  return (window as any).BarcodeDetector as PhotoBarcodeDetectorCtor | undefined;
}

const OPEN_PRICES_API = 'https://prices.openfoodfacts.org/api/v1';
const OPEN_PRICES_TIMEOUT_MS = 8000;
const BARCODE_FORMATS: PhotoBarcodeFormat[] = ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'qr_code'];

// ─── Barcode extraction ───────────────────────────────────────────────────────

async function tryNativeBarcodeDetector(imgEl: HTMLImageElement): Promise<string | null> {
  const Ctor = getNativeBarcodeDetector();
  if (!Ctor) return null;
  try {
    const detector = new Ctor({ formats: BARCODE_FORMATS });
    const results = await detector.detect(imgEl);
    return results[0]?.rawValue?.trim() || null;
  } catch {
    return null;
  }
}

async function tryZxingFromUrl(objectUrl: string): Promise<string | null> {
  try {
    const reader = new BrowserMultiFormatReader();
    const result = await reader.decodeFromImageUrl(objectUrl);
    return result.getText()?.trim() || null;
  } catch {
    return null;
  }
}

function loadImageElement(objectUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = objectUrl;
  });
}

/**
 * Extract a barcode from an image File.
 * Tries native BarcodeDetector first, then ZXing.
 */
export async function extractBarcodeFromImage(
  file: File,
): Promise<{ barcode: string | null; method: PhotoSearchResult['detectionMethod'] }> {
  const objectUrl = URL.createObjectURL(file);
  try {
    const imgEl = await loadImageElement(objectUrl);

    const native = await tryNativeBarcodeDetector(imgEl);
    if (native) return { barcode: native, method: 'barcode_detector' };

    const zxing = await tryZxingFromUrl(objectUrl);
    if (zxing) return { barcode: zxing, method: 'zxing' };

    return { barcode: null, method: 'none' };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

// ─── Price fetching ───────────────────────────────────────────────────────────

interface OpenPricesItem {
  price?: unknown;
  currency?: unknown;
  date?: unknown;
  location_name?: unknown;
  location_city?: unknown;
  location_country?: unknown;
  location_osm_id?: unknown;
  proof_id?: unknown;
}

interface OpenPricesResponse {
  items?: OpenPricesItem[];
}

function safeNum(v: unknown): number | undefined {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string') {
    const n = parseFloat(v);
    return Number.isFinite(n) ? n : undefined;
  }
  return undefined;
}

function safeStr(v: unknown): string | undefined {
  return typeof v === 'string' && v.trim().length > 0 ? v.trim() : undefined;
}

/**
 * Fetch crowdsourced price listings from Open Prices API.
 * Returns [] on any error (non-blocking).
 */
export async function fetchProductPrices(ean: string): Promise<PriceListing[]> {
  const controller = new AbortController();
  const tid = window.setTimeout(() => controller.abort(), OPEN_PRICES_TIMEOUT_MS);

  try {
    const url = `${OPEN_PRICES_API}/prices?product_code=${encodeURIComponent(ean)}&size=20&order_by=-date`;
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) return [];

    const data = (await res.json()) as OpenPricesResponse;
    if (!Array.isArray(data.items)) return [];

    return data.items
      .map((item): PriceListing | null => {
        const price = safeNum(item.price);
        if (price === undefined) return null;
        return {
          price,
          currency: safeStr(item.currency) ?? 'EUR',
          date: safeStr(item.date) ?? '',
          locationName: safeStr(item.location_name),
          locationCity: safeStr(item.location_city),
          locationCountry: safeStr(item.location_country),
          locationOsmId: safeNum(item.location_osm_id),
          proofId: safeNum(item.proof_id),
        };
      })
      .filter((x): x is PriceListing => x !== null);
  } catch {
    return [];
  } finally {
    window.clearTimeout(tid);
  }
}

// ─── Main orchestrator ────────────────────────────────────────────────────────

/**
 * Full pipeline: photo → barcode → product details + prices.
 */
export async function searchProductFromPhoto(file: File): Promise<PhotoSearchResult> {
  const { barcode, method } = await extractBarcodeFromImage(file);

  if (!barcode) {
    return {
      barcode: null,
      detectionMethod: 'none',
      product: null,
      prices: [],
      bestPrice: null,
      latestPrice: null,
      error:
        'Aucun code-barres détecté dans cette photo. Assurez-vous que le code-barres est bien visible et net.',
    };
  }

  const [productResult, prices] = await Promise.all([
    fetchOffProductDetails(barcode),
    fetchProductPrices(barcode),
  ]);

  const product = productResult.status === 'OK' && productResult.ui ? productResult.ui : null;

  const numericPrices = prices.map((p) => p.price).filter((p) => p > 0);
  const bestPrice = numericPrices.length > 0 ? Math.min(...numericPrices) : null;
  const latestPrice = prices[0]?.price ?? null;

  return {
    barcode,
    detectionMethod: method,
    product,
    prices,
    bestPrice,
    latestPrice,
    ...(productResult.status !== 'OK' && productResult.status !== 'NOT_FOUND'
      ? { error: 'Produit non trouvé sur Open Food Facts.' }
      : {}),
  };
}
