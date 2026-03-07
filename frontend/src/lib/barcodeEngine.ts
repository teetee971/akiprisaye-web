import { BrowserMultiFormatReader } from '@zxing/browser';

export interface ScanDebugPayload {
  engine: 'barcode_detector' | 'zxing';
  framesProcessed: number;
  lastDetectedAt: number | null;
  videoWidth: number;
  videoHeight: number;
  readyState: number;
  error?: string;
}

export interface ScanController {
  stop: () => void;
}

type LocalBarcodeFormat = 'ean_13' | 'ean_8' | 'upc_a' | 'code_128';

interface BarcodeDetectorLike {
  detect: (source: HTMLVideoElement) => Promise<Array<{ rawValue?: string }>>;
}

declare global {
  interface Window {
     
    NativeBarcodeDetector?: new (options?: { formats?: LocalBarcodeFormat[] }) => BarcodeDetectorLike;
  }
}

const SUPPORTED_FORMATS: LocalBarcodeFormat[] = ['ean_13', 'ean_8', 'upc_a', 'code_128'];

export async function startScan(
  videoEl: HTMLVideoElement,
  onResult: (code: string) => void,
  onDebug?: (debug: ScanDebugPayload) => void,
): Promise<ScanController> {
  if (typeof window !== 'undefined' && window.NativeBarcodeDetector) {
    const detector = new window.NativeBarcodeDetector({ formats: SUPPORTED_FORMATS });

    let stopped = false;
    let rafId = 0;
    let framesProcessed = 0;
    let lastDetectedAt: number | null = null;
    let loopActive = false;

    const loop = async () => {
      if (stopped || loopActive) return;
      loopActive = true;

      try {
        if (videoEl.readyState >= 2) {
          framesProcessed += 1;
          const barcodes = await detector.detect(videoEl);
          if (barcodes.length > 0) {
            const value = barcodes[0]?.rawValue?.trim();
            if (value) {
              lastDetectedAt = Date.now();
              onResult(value);
              // Continuous scan: do not return early, keep the RAF loop running.
            }
          }
        }

        onDebug?.({
          engine: 'barcode_detector',
          framesProcessed,
          lastDetectedAt,
          videoWidth: videoEl.videoWidth,
          videoHeight: videoEl.videoHeight,
          readyState: videoEl.readyState,
        });
      } catch (error) {
        onDebug?.({
          engine: 'barcode_detector',
          framesProcessed,
          lastDetectedAt,
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

  const reader = new BrowserMultiFormatReader();
  let stopped = false;
  let framesProcessed = 0;
  let lastDetectedAt: number | null = null;

  const controls = await reader.decodeFromVideoDevice(undefined, videoEl, (result, error) => {
    if (stopped) return;

    framesProcessed += 1;

    if (result) {
      const value = result.getText()?.trim();
      if (value) {
        lastDetectedAt = Date.now();
        onResult(value);
      }
    }

    onDebug?.({
      engine: 'zxing',
      framesProcessed,
      lastDetectedAt,
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
      // BrowserMultiFormatReader doesn't expose reset() — stopping controls is sufficient
    },
  };
}
