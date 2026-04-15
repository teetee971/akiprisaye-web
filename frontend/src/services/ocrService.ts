 
 
/**
 * OCR Service - Unified API
 * 
 * Uses Tesseract.js for text extraction from product images
 * 
 * DESIGN DECISION (PR G - Tech Debt Zero):
 * This service provides a minimal, clean API without caching or preprocessing.
 * Previous optimizations (image resizing, caching) were removed to simplify
 * the codebase and eliminate technical debt. If performance becomes an issue,
 * these optimizations can be re-added as a separate enhancement layer.
 * 
 * PHASE 2 ENHANCEMENT:
 * - Automatic online/offline detection
 * - Local OCR processing (WASM-based Tesseract)
 * - Works without network connection
 * - Graceful degradation
 * 
 * ⚠️ CONFORMITÉ RGPD & AI ACT UE ⚠️
 * - NO health interpretation
 * - NO nutritional analysis
 * - NO biometric processing
 * - NO facial recognition
 * - Images processed locally (client-side)
 * - Images NOT stored or transmitted to servers
 * - Images deleted immediately after text extraction
 * 
 * Base légale : Consentement explicite (RGPD Art. 6.1.a)
 */


import type Tesseract from 'tesseract.js';

/**
 * Tesseract PSM (Page Segmentation Mode) constants.
 * @see https://tesseract-ocr.github.io/tessdoc/ImproveQuality.html
 */
export const OCR_PSM = {
  /** Fully automatic page segmentation (default) */
  AUTO: 3,
  /** Single column of text of variable sizes */
  SINGLE_COLUMN: 4,
  /** Single uniform block of text (best for dense body text) */
  SINGLE_BLOCK: 6,
  /** Single text line */
  SINGLE_LINE: 7,
  /** Single word */
  SINGLE_WORD: 8,
} as const;

// Dynamic import for lazy loading (loaded only when OCR is actually used)
// This reduces initial bundle size by ~17MB
let TesseractModule: typeof Tesseract | null = null;

/**
 * Lazy load Tesseract module
 * Loads the 17MB OCR library only when needed
 * Returns the default export (Tesseract library)
 * @throws Error if the module fails to load
 */
async function loadTesseract() {
  if (!TesseractModule) {
    try {
      const module = await import('tesseract.js');
      TesseractModule = module.default || module;
    } catch (error) {
      console.error('[OCR] Failed to load Tesseract.js module:', error);
      throw new Error(
        'Impossible de charger le module OCR. Vérifiez votre connexion Internet et réessayez.'
      );
    }
  }
  return TesseractModule;
}

export const GENERIC_OCR_ERROR = 'Une erreur s\'est produite lors de l\'analyse de l\'image';
const pathPrefix = (import.meta.env.BASE_URL || '/').replace(/\/+$/, '');
const OCR_ASSET_BASE_PATH = `${pathPrefix}/ocr`;
const WORKER_PATH = `${OCR_ASSET_BASE_PATH}/worker.min.js`;
const CORE_PATH = `${OCR_ASSET_BASE_PATH}/tesseract-core.wasm`;
const LANG_PATH = OCR_ASSET_BASE_PATH;
const DEFAULT_LANG = 'fra';
// Gentle post-processing boosts to improve OCR legibility on low-light mobile captures
const CONTRAST_BOOST = 1.08;
const SATURATION_BOOST = 1.02;
// Receipt mode: stronger contrast + desaturation for black-on-white thermal paper
const RECEIPT_CONTRAST_BOOST = 1.25;
const RECEIPT_BRIGHTNESS_BOOST = 1.05;

/**
 * OCR Result structure (for compatibility with existing components)
 * - timeoutTriggered: indicates when an execution guard stopped processing
 * - fromCache: set if a cached result was reused instead of reprocessing
 * - sections: optional parsed buckets when post-processing is applied
 */
export interface OCRSections {
  ingredients?: string;
  allergens?: string;
  legalMentions?: string;
  dangerPictograms?: string[];
}

export interface OCRResult {
  success: boolean;
  rawText: string;
  confidence: number;
  processingTime: number;
  wordCount?: number;
  lineCount?: number;
  timeoutTriggered?: boolean;
  fromCache?: boolean;
  sections?: OCRSections;
  error?: string;
  errorCode?: 'ASSET_MISSING' | 'TIMEOUT' | 'PROCESSING_ERROR';
}


type OCRWorkerLike = Pick<Tesseract.Worker, 'setParameters' | 'recognize' | 'terminate'>;

const OCR_LOAD_ERROR_MESSAGE =
  'Le module OCR n’a pas pu se charger correctement en production. Les fichiers linguistiques sont peut-être indisponibles.';
class AssetLoadError extends Error {
  status: number;
  assetLabel: string;
  constructor(message: string, status: number, assetLabel: string) {
    super(message);
    this.name = 'AssetLoadError';
    this.status = status;
    this.assetLabel = assetLabel;
  }
}

/**
 * Check if running in offline mode
 */
function isOffline(): boolean {
  return !navigator.onLine;
}

function normalizeConfidence(confidence: unknown): number {
  if (typeof confidence === 'number') {
    return confidence;
  }

  if (import.meta.env.DEV) {
    console.warn('OCR confidence missing, defaulting to 0');
  }

  return 0;
}

async function ensureAssetAvailable(url: string, label: string): Promise<void> {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    if (!response.ok) {
      throw new AssetLoadError(`Asset ${label} unavailable (${response.status})`, response.status, label);
    }
  } catch (error) {
    console.error(`[OCR] Asset check failed for ${label}:`, error);
    throw error;
  }
}

function isAssetLoadError(error: unknown): boolean {
  if (error instanceof AssetLoadError) {
    return true;
  }
  if ((error as { status?: number })?.status === 404) {
    return true;
  }
  // Treat network/CORS fetch failures as asset load errors so the user sees
  // a meaningful "files unavailable" message rather than the generic OCR error.
  if (error instanceof TypeError) {
    const msg = String((error as Error).message ?? '');
    if (
      msg.includes('Failed to fetch') ||
      msg.includes('NetworkError') ||
      msg.includes('Load failed')
    ) {
      return true;
    }
  }
  return false;
}

/**
 * Apply a 3×3 sharpening convolution kernel to improve character edge definition.
 * Kernel: [[ 0,-1, 0],[-1, 5,-1],[ 0,-1, 0]] (Laplacian sharpening)
 * This significantly improves OCR accuracy on blurry or low-resolution images.
 */
function applySharpenKernel(imageData: ImageData): ImageData {
  const { data, width, height } = imageData;
  const output = new Uint8ClampedArray(data.length);
  const kernel = [0, -1, 0, -1, 5, -1, 0, -1, 0];

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let r = 0, g = 0, b = 0;
      for (let ky = -1; ky <= 1; ky++) {
        for (let kx = -1; kx <= 1; kx++) {
          const px = Math.min(width - 1, Math.max(0, x + kx));
          const py = Math.min(height - 1, Math.max(0, y + ky));
          const idx = (py * width + px) * 4;
          const kIdx = (ky + 1) * 3 + (kx + 1);
          r += data[idx] * kernel[kIdx];
          g += data[idx + 1] * kernel[kIdx];
          b += data[idx + 2] * kernel[kIdx];
        }
      }
      const outIdx = (y * width + x) * 4;
      output[outIdx] = Math.min(255, Math.max(0, r));
      output[outIdx + 1] = Math.min(255, Math.max(0, g));
      output[outIdx + 2] = Math.min(255, Math.max(0, b));
      output[outIdx + 3] = data[outIdx + 3]; // preserve alpha
    }
  }

  return new ImageData(output, width, height);
}

async function preprocessImage(
  imageUrl: string,
  maxWidth = 1600,
  receiptMode = false,
): Promise<{ blob: Blob; width: number; height: number; originalSize: number; processedSize: number }> {
  const response = await fetch(imageUrl);
  if (!response.ok) {
    throw new AssetLoadError(`Image fetch failed (${response.status})`, response.status, 'image');
  }

  const originalBlob = await response.blob();
  let bitmap: ImageBitmap;

  try {
    // Try to honor EXIF orientation when supported
    bitmap = await createImageBitmap(originalBlob, { imageOrientation: 'from-image' } as ImageBitmapOptions);
  } catch {
    const fallbackImg = document.createElement('img');
    const url = URL.createObjectURL(originalBlob);
    fallbackImg.src = url;
    await fallbackImg.decode();
    bitmap = await createImageBitmap(fallbackImg);
    URL.revokeObjectURL(url);
  }

  let { width, height } = bitmap;
  if (width > maxWidth) {
    const scale = maxWidth / width;
    width = Math.round(width * scale);
    height = Math.round(height * scale);
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Canvas context not available');
  }

  if (receiptMode) {
    // Receipt mode: thermal paper is black text on white — boost contrast + brightness,
    // desaturate to pure grayscale. A sharpen pass is applied via a convolution kernel.
    ctx.filter = `grayscale(1) contrast(${RECEIPT_CONTRAST_BOOST}) brightness(${RECEIPT_BRIGHTNESS_BOOST})`;
    try {
      ctx.drawImage(bitmap, 0, 0, width, height);
    } finally {
      ctx.filter = 'none';
    }

    // Sharpen kernel (3×3 unsharp mask approximation) for crisper character edges
    const imageData = ctx.getImageData(0, 0, width, height);
    const sharpened = applySharpenKernel(imageData);
    ctx.putImageData(sharpened, 0, 0);
  } else {
    ctx.filter = `contrast(${CONTRAST_BOOST}) saturate(${SATURATION_BOOST})`;
    try {
      ctx.drawImage(bitmap, 0, 0, width, height);
    } finally {
      ctx.filter = 'none';
    }
  }

  const processedBlob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to create PNG blob'));
        }
      },
      'image/png',
      0.95,
    );
  });

  return {
    blob: processedBlob,
    width,
    height,
    originalSize: originalBlob.size,
    processedSize: processedBlob.size,
  };
}

interface RunOCROptions {
  timeout?: number;
  /**
   * Receipt mode — enables stronger contrast/brightness preprocessing and
   * single-column page segmentation (PSM 4), optimal for thermal paper receipts.
   */
  receiptMode?: boolean;
  /**
   * Tesseract PSM override. Use OCR_PSM constants.
   * Defaults to OCR_PSM.AUTO (3) for generic images, OCR_PSM.SINGLE_COLUMN (4) for receipts.
   */
  psm?: number;
}

/**
 * OCR plein texte unifié
 * - Sans whitelist chiffres
 * - Espaces inter-mots préservés
 * - Français par défaut
 * - Works offline (local WASM processing)
 * - receiptMode: activates sharpen preprocessing + single-column PSM
 * 
 * @param imageUrl - URL or path to image
 * @param language - ISO language code (defaults to 'fra')
 * @param options - OCR options (timeout, receiptMode, psm)
 * @returns Extracted text with wordCount and lineCount
 */
export async function runOCR(
  imageUrl: string,
  language = DEFAULT_LANG,
  options?: RunOCROptions,
): Promise<OCRResult> {
  const offline = isOffline();
  const startedAt = performance.now();
  const effectiveLang = language || DEFAULT_LANG;
  const timeoutMs = Math.max(5000, options?.timeout ?? 30000);
  const receiptMode = options?.receiptMode ?? false;
  const psmMode = options?.psm ?? (receiptMode ? OCR_PSM.SINGLE_COLUMN : OCR_PSM.AUTO);
  let timeoutId: number | undefined;
  let worker: OCRWorkerLike | null = null;
  
  // Log mode for debugging
  if (import.meta.env.DEV) {
    console.log(`OCR mode: ${offline ? 'OFFLINE (local WASM)' : 'ONLINE'} receiptMode=${receiptMode} psm=${psmMode}`);
    console.log('[OCR] Asset paths', { WORKER_PATH, CORE_PATH, LANG_PATH, lang: effectiveLang });
  }

  let timeoutTriggered = false;

  try {
    // Lazy load Tesseract module (17MB) - only loads when OCR is actually used
    const Tesseract = await loadTesseract();

    await ensureAssetAvailable(WORKER_PATH, 'worker');
    await ensureAssetAvailable(CORE_PATH, 'core');
    await ensureAssetAvailable(`${LANG_PATH}/${effectiveLang}.traineddata.gz`, 'language');

    const preprocessed = await preprocessImage(imageUrl, 1600, receiptMode);
    // Pass language directly to createWorker (tesseract.js v7 API)
    worker = await Tesseract.createWorker(effectiveLang, undefined, {
      workerPath: WORKER_PATH,
      corePath: CORE_PATH,
      langPath: LANG_PATH,
      gzip: true,
      ...(import.meta.env.DEV ? { logger: (m: Tesseract.LoggerMessage) => console.debug('[OCR]', m) } : {}),
    }) as OCRWorkerLike;

    // Tesseract.js runs entirely in the browser via WASM
    // No server calls - works offline by default
    await worker.setParameters({
      preserve_interword_spaces: '1',
      tessedit_pageseg_mode: String(psmMode) as Tesseract.PSM,
    });

    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = window.setTimeout(() => {
        timeoutTriggered = true;
        reject(new Error('OCR_TIMEOUT'));
      }, timeoutMs);
    });

    const recognitionPromise = (async () => {
      const { data } = await worker.recognize(preprocessed.blob);
      return { text: data.text as string, confidence: data.confidence as number };
    })();

    const { text, confidence } = await Promise.race([recognitionPromise, timeoutPromise]);
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
    }

    const normalizedConfidence = normalizeConfidence(confidence);
    const lines = text.split('\n').filter((l: string) => l.trim().length > 0);
    const words = text.split(/\s+/).filter((w: string) => w.length > 0);

    return {
      success: true,
      rawText: text,
      confidence: normalizedConfidence,
      processingTime: performance.now() - startedAt,
      wordCount: words.length,
      lineCount: lines.length,
      timeoutTriggered,
    };
  } catch (error) {
    console.error('OCR processing failed:', error, (error as Error)?.stack);
    const isTimeout = (error as Error)?.message === 'OCR_TIMEOUT';
    const isAssetError = isAssetLoadError(error);
    if (isTimeout) {
      timeoutTriggered = true;
    }
    const message =
      isAssetError
        ? OCR_LOAD_ERROR_MESSAGE
        : isTimeout
          ? 'Délai dépassé, réessayez avec une image plus nette'
          : offline
            ? 'Analyse impossible hors ligne. Reconnectez-vous à Internet puis réessayez.'
            : 'L\'analyse du ticket a échoué. Essayez avec une image plus nette ou, si le problème persiste, réduisez le nombre de photos analysées à la fois.';

    return {
      success: false,
      rawText: '',
      confidence: 0,
      processingTime: performance.now() - startedAt,
      error: message,
      timeoutTriggered,
      errorCode: isAssetError ? 'ASSET_MISSING' : isTimeout ? 'TIMEOUT' : 'PROCESSING_ERROR',
    };
  } finally {
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
    }
    if (worker) {
      await worker.terminate();
    }
  }
}

/**
 * Check if OCR is available
 * Tesseract.js should always be available in modern browsers
 */
export async function isOCRAvailable(): Promise<boolean> {
  try {
    // Check if WebAssembly is supported (required for Tesseract.js)
    return typeof WebAssembly !== 'undefined';
  } catch {
    return false;
  }
}
