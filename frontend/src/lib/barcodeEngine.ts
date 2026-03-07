import { BrowserMultiFormatReader } from '@zxing/browser';

/**
 * All barcode formats supported by the engine.
 * Includes formats from both the native BarcodeDetector API and ZXing.
 */
export type BarcodeFormatType =
  | 'ean_13'
  | 'ean_8'
  | 'upc_a'
  | 'upc_e'
  | 'code_128'
  | 'code_39'
  | 'code_93'
  | 'codabar'
  | 'itf'
  | 'qr_code'
  | 'data_matrix'
  | 'pdf417'
  | 'aztec'
  | 'unknown';

export interface ScanDebugPayload {
  engine: 'barcode_detector' | 'zxing';
  framesProcessed: number;
  lastDetectedAt: number | null;
  lastFormat: BarcodeFormatType | null;
  videoWidth: number;
  videoHeight: number;
  readyState: number;
  error?: string;
}

export interface ScanController {
  stop: () => void;
}

/** Full scan result with format metadata */
export interface BarcodeResult {
  value: string;
  format: BarcodeFormatType;
  timestamp: number;
}

interface BarcodeDetectorEntry {
  rawValue?: string;
  format?: string;
}

interface BarcodeDetectorLike {
  detect: (source: HTMLVideoElement) => Promise<BarcodeDetectorEntry[]>;
}

declare global {
  interface Window {
    NativeBarcodeDetector?: new (options?: { formats?: string[] }) => BarcodeDetectorLike;
  }
}

/**
 * Extended list of supported formats — covers 1D (retail/logistics), 2D (QR/DataMatrix/PDF417)
 * and postal/specialty codes for comprehensive real-world coverage.
 */
const SUPPORTED_FORMATS: string[] = [
  'ean_13',
  'ean_8',
  'upc_a',
  'upc_e',
  'code_128',
  'code_39',
  'code_93',
  'codabar',
  'itf',
  'qr_code',
  'data_matrix',
  'pdf417',
  'aztec',
];

/** Deduplication window in ms — ignore the same code if re-detected within this window */
const DEDUP_WINDOW_MS = 600;

function normalizeFormat(raw: string | undefined): BarcodeFormatType {
  if (!raw) return 'unknown';
  const lower = raw.toLowerCase().replace(/[-\s]/g, '_');
  const known: BarcodeFormatType[] = [
    'ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39', 'code_93',
    'codabar', 'itf', 'qr_code', 'data_matrix', 'pdf417', 'aztec',
  ];
  return (known as string[]).includes(lower) ? (lower as BarcodeFormatType) : 'unknown';
}

export async function startScan(
  videoEl: HTMLVideoElement,
  onResult: (code: string) => void,
  onDebug?: (debug: ScanDebugPayload) => void,
  onScanResult?: (result: BarcodeResult) => void,
): Promise<ScanController> {
  /** Per-code last-seen timestamp for deduplication */
  const lastSeenAt = new Map<string, number>();

  function shouldEmit(value: string): boolean {
    const now = Date.now();
    const last = lastSeenAt.get(value) ?? 0;
    if (now - last < DEDUP_WINDOW_MS) return false;
    lastSeenAt.set(value, now);
    return true;
  }

  if (typeof window !== 'undefined' && window.NativeBarcodeDetector) {
    const detector = new window.NativeBarcodeDetector({ formats: SUPPORTED_FORMATS });

    let stopped = false;
    let rafId = 0;
    let framesProcessed = 0;
    let lastDetectedAt: number | null = null;
    let lastFormat: BarcodeFormatType | null = null;
    let loopActive = false;

    const loop = async () => {
      if (stopped || loopActive) return;
      loopActive = true;

      try {
        if (videoEl.readyState >= 2) {
          framesProcessed += 1;
          const barcodes = await detector.detect(videoEl);
          if (barcodes.length > 0) {
            const entry = barcodes[0];
            const value = entry?.rawValue?.trim();
            if (value && shouldEmit(value)) {
              lastDetectedAt = Date.now();
              lastFormat = normalizeFormat(entry?.format);
              onResult(value);
              onScanResult?.({ value, format: lastFormat, timestamp: lastDetectedAt });
            }
          }
        }

        onDebug?.({
          engine: 'barcode_detector',
          framesProcessed,
          lastDetectedAt,
          lastFormat,
          videoWidth: videoEl.videoWidth,
          videoHeight: videoEl.videoHeight,
          readyState: videoEl.readyState,
        });
      } catch (error) {
        onDebug?.({
          engine: 'barcode_detector',
          framesProcessed,
          lastDetectedAt,
          lastFormat,
          videoWidth: videoEl.videoWidth,
          videoHeight: videoEl.videoHeight,
          readyState: videoEl.readyState,
          error: error instanceof Error ? error.message : String(error),
        });
      } finally {
        loopActive = false;
        if (!stopped) {
          rafId = window.requestAnimationFrame(loop);
        }
      }
    };

    rafId = window.requestAnimationFrame(loop);

    return {
      stop: () => {
        stopped = true;
        window.cancelAnimationFrame(rafId);
      },
    };
  }

  // ZXing fallback — BrowserMultiFormatReader handles all formats automatically
  const reader = new BrowserMultiFormatReader();
  let stopped = false;
  let framesProcessed = 0;
  let lastDetectedAt: number | null = null;
  let lastFormat: BarcodeFormatType | null = null;

  const controls = await reader.decodeFromVideoDevice(undefined, videoEl, (result, error) => {
    if (stopped) return;

    framesProcessed += 1;

    if (result) {
      const value = result.getText()?.trim();
      if (value && shouldEmit(value)) {
        lastDetectedAt = Date.now();
        lastFormat = normalizeFormat(result.getBarcodeFormat?.()?.toString());
        onResult(value);
        onScanResult?.({ value, format: lastFormat, timestamp: lastDetectedAt });
      }
    }

    onDebug?.({
      engine: 'zxing',
      framesProcessed,
      lastDetectedAt,
      lastFormat,
      videoWidth: videoEl.videoWidth,
      videoHeight: videoEl.videoHeight,
      readyState: videoEl.readyState,
      ...(error ? { error: error instanceof Error ? error.message : String(error) } : {}),
    });
  });

  return {
    stop: () => {
      stopped = true;
      controls.stop();
    },
  };
}
