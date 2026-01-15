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

// Dynamic import for lazy loading (loaded only when OCR is actually used)
// This reduces initial bundle size by ~17MB
let TesseractModule: any = null;

/**
 * Lazy load Tesseract module
 * Loads the 17MB OCR library only when needed
 * Returns the default export (Tesseract library)
 * @throws Error if the module fails to load
 */
async function loadTesseract() {
  if (!TesseractModule) {
    try {
      console.log('[OCR] Loading Tesseract.js module (~17MB download)...');
      const module = await import('tesseract.js');
      TesseractModule = module.default || module;
      console.log('[OCR] Tesseract.js loaded successfully');
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
const OCR_ASSET_BASE_PATH = '/ocr';
const WORKER_PATH = `${OCR_ASSET_BASE_PATH}/worker.min.js`;
const CORE_PATH = `${OCR_ASSET_BASE_PATH}/tesseract-core.wasm`;
const LANG_PATH = OCR_ASSET_BASE_PATH;
const DEFAULT_LANG = 'fra';
// Gentle post-processing boosts to improve OCR legibility on low-light mobile captures
const CONTRAST_BOOST = 1.08;
const SATURATION_BOOST = 1.02;

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
  timeoutTriggered?: boolean;
  fromCache?: boolean;
  sections?: OCRSections;
  error?: string;
  errorCode?: 'ASSET_MISSING' | 'TIMEOUT' | 'PROCESSING_ERROR';
}

const OCR_LOAD_ERROR_MESSAGE =
  'Le module OCR n’a pas pu se charger correctement en production. Les fichiers linguistiques sont peut-être indisponibles.';
const KNOWN_ASSET_LABELS = new Set(['worker', 'core', 'language']);

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
    console.log(`[OCR] ${label} asset check`, url, response.status);
    if (!response.ok) {
      const error = new Error(`Asset ${label} unavailable (${response.status})`);
      (error as any).status = response.status;
      (error as any).assetLabel = label;
      throw error;
    }
  } catch (error) {
    console.error(`[OCR] Asset check failed for ${label}:`, error);
    throw error;
  }
}

function isAssetLoadError(error: unknown): boolean {
  const status = (error as { status?: number })?.status;
  const assetLabel = (error as { assetLabel?: string })?.assetLabel;
  if (assetLabel && KNOWN_ASSET_LABELS.has(assetLabel)) {
    return true;
  }
  return status === 404;
}

async function preprocessImage(
  imageUrl: string,
  maxWidth = 1600
): Promise<{ blob: Blob; width: number; height: number; originalSize: number; processedSize: number }> {
  const response = await fetch(imageUrl);
  if (!response.ok) {
    const error = new Error(`Image fetch failed (${response.status})`);
    (error as any).status = response.status;
    throw error;
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

  ctx.filter = `contrast(${CONTRAST_BOOST}) saturate(${SATURATION_BOOST})`;
  try {
    ctx.drawImage(bitmap, 0, 0, width, height);
  } finally {
    ctx.filter = 'none';
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

  console.log('[OCR] Image preprocessing', {
    originalSizeKB: Math.round(originalBlob.size / 1024),
    processedSizeKB: Math.round(processedBlob.size / 1024),
    canvasWidth: width,
    canvasHeight: height,
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
}

/**
 * OCR plein texte unifié
 * - Sans whitelist chiffres
 * - Espaces inter-mots préservés
 * - Français par défaut
 * - Works offline (local WASM processing)
 * 
 * @param imageUrl - URL or path to image
 * @param language - ISO language code (defaults to 'fra')
 * @param options - OCR options (timeout, etc.)
 * @returns Extracted text
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
  let timeoutId: number | undefined;
  
  // Log mode for debugging
  console.log(`OCR mode: ${offline ? 'OFFLINE (local WASM)' : 'ONLINE'}`);
  console.log('[OCR] Asset paths', { WORKER_PATH, CORE_PATH, LANG_PATH, lang: effectiveLang });

  // Lazy load Tesseract module (17MB) - only loads when OCR is actually used
  const Tesseract = await loadTesseract();

  await ensureAssetAvailable(WORKER_PATH, 'worker');
  await ensureAssetAvailable(CORE_PATH, 'core');
  await ensureAssetAvailable(`${LANG_PATH}/${effectiveLang}.traineddata.gz`, 'language');

  const preprocessed = await preprocessImage(imageUrl);
  const worker = await Tesseract.createWorker({
    workerPath: WORKER_PATH,
    corePath: CORE_PATH,
    langPath: LANG_PATH,
    gzip: true,
    logger: (m) => console.debug('[OCR]', m),
  });

  let timeoutTriggered = false;

  try {
    // Tesseract.js runs entirely in the browser via WASM
    // No server calls - works offline by default
    await worker.loadLanguage(effectiveLang);
    await worker.initialize(effectiveLang);

    await worker.setParameters({
      preserve_interword_spaces: '1',
    });

    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = window.setTimeout(() => {
        timeoutTriggered = true;
        reject(new Error('OCR_TIMEOUT'));
      }, timeoutMs);
    });

    const recognitionPromise = (async () => {
      const { data } = await worker.recognize(preprocessed.blob);
      return { text: data.text, confidence: data.confidence };
    })();

    const { text, confidence } = await Promise.race([recognitionPromise, timeoutPromise]);
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
    }

    const normalizedConfidence = normalizeConfidence(confidence);

    return {
      success: true,
      rawText: text,
      confidence: normalizedConfidence,
      processingTime: performance.now() - startedAt,
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
            ? 'Erreur OCR hors ligne. Vérifiez que l\'image est valide.'
            : `Erreur OCR (langue ${effectiveLang}). Veuillez réessayer ou recharger la page.`;

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
    await worker.terminate();
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
