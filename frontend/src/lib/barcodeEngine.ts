import { BarcodeFormat, BrowserMultiFormatReader, DecodeHintType, NotFoundException } from '@zxing/library';
import { validateEan } from '../services/eanValidator';
import { normalizeDetectedCode } from '../utils/eanScan';

export type EngineUsed = 'idle' | 'barcode_detector' | 'zxing';

export interface RoiRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface ScannerDebugInfo {
  engineUsed: EngineUsed;
  userAgent: string;
  barcodeDetectorSupported: boolean;
  fps: number;
  framesProcessed: number;
  roi: RoiRect;
  lastDetectedAt: number | null;
  lastCode: string | null;
  errors: string | null;
  settings: MediaTrackSettings | null;
  capabilities: MediaTrackCapabilities | null;
}

type DebugCallback = (info: ScannerDebugInfo) => void;

type ScanSession = {
  videoEl: HTMLVideoElement | null;
  stream: MediaStream | null;
  track: MediaStreamTrack | null;
  reader: BrowserMultiFormatReader | null;
  stopped: boolean;
  engineUsed: EngineUsed;
  frameHandle: number | null;
  frameCallbackId: number | null;
  lastTickAt: number;
  startedAt: number;
  framesThisSecond: number;
  fpsWindowStartedAt: number;
  lastTriggeredCode: string | null;
  lastTriggeredAt: number;
  pendingBitmap: ImageBitmap | null;
  debug: ScannerDebugInfo;
};

const hints = new Map();
hints.set(DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.EAN_13, BarcodeFormat.EAN_8, BarcodeFormat.UPC_A, BarcodeFormat.UPC_E]);
hints.set(DecodeHintType.TRY_HARDER, true);
hints.set(DecodeHintType.ALSO_INVERTED, true);

const ROI_X = 0.2;
const ROI_Y = 0.33;
const ROI_W = 0.6;
const ROI_H = 0.34;

let session: ScanSession | null = null;

const isMobileUa = () => /Android|iPhone|iPad|Mobile/i.test(navigator.userAgent);

const getRoiRect = (video: HTMLVideoElement): RoiRect => ({
  x: Math.floor(video.videoWidth * ROI_X),
  y: Math.floor(video.videoHeight * ROI_Y),
  w: Math.floor(video.videoWidth * ROI_W),
  h: Math.floor(video.videoHeight * ROI_H),
});

const patchDebug = (patch: Partial<ScannerDebugInfo>, onDebug?: DebugCallback) => {
  if (!session) return;
  session.debug = { ...session.debug, ...patch };
  onDebug?.(session.debug);
};

const updateFps = (onDebug?: DebugCallback) => {
  if (!session) return;
  const now = Date.now();
  session.framesThisSecond += 1;
  if (now - session.fpsWindowStartedAt >= 1000) {
    patchDebug({ fps: session.framesThisSecond }, onDebug);
    session.framesThisSecond = 0;
    session.fpsWindowStartedAt = now;
  }
};

const getValidEan = (rawCode?: string) => {
  if (!rawCode) return null;
  const normalized = normalizeDetectedCode(rawCode);
  return validateEan(normalized).valid ? normalized : null;
};

const getThrottleIntervalMs = () => {
  if (!session) return 0;
  const elapsed = Date.now() - session.startedAt;
  if (elapsed <= 3000) return 0;
  return 83;
};

const scheduleNextFrame = (tick: (timestamp: number) => void) => {
  if (!session || session.stopped || !session.videoEl) return;

  if ('requestVideoFrameCallback' in session.videoEl) {
    session.frameCallbackId = (session.videoEl as any).requestVideoFrameCallback(() => tick(performance.now()));
    return;
  }

  session.frameHandle = requestAnimationFrame(tick);
};

const cancelScheduledFrame = () => {
  if (!session || !session.videoEl) return;

  if (session.frameHandle !== null) {
    cancelAnimationFrame(session.frameHandle);
    session.frameHandle = null;
  }

  if (session.frameCallbackId !== null && 'cancelVideoFrameCallback' in session.videoEl) {
    (session.videoEl as any).cancelVideoFrameCallback(session.frameCallbackId);
    session.frameCallbackId = null;
  }
};

const buildConstraints = (): MediaStreamConstraints => ({
  video: {
    facingMode: { ideal: 'environment' },
    width: { ideal: 1280 },
    height: { ideal: 720 },
    frameRate: { ideal: 30, max: 60 },
  },
  audio: false,
});

const readCapabilities = (track: MediaStreamTrack | null) => {
  if (!track?.getCapabilities) return null;
  try {
    return track.getCapabilities();
  } catch {
    return null;
  }
};

const applyTrackConstraints = async (track: MediaStreamTrack, capabilities: MediaTrackCapabilities | null) => {
  const advanced: MediaTrackConstraintSet = {};

  if (Array.isArray((capabilities as any)?.focusMode) && (capabilities as any).focusMode.includes('continuous')) {
    (advanced as any).focusMode = 'continuous';
  }

  const zoom = capabilities?.zoom;
  if (zoom && typeof zoom.min === 'number' && typeof zoom.max === 'number') {
    (advanced as any).zoom = Math.min(Math.max(1.35, zoom.min), zoom.max);
  }

  if (Object.keys(advanced).length > 0) {
    try {
      await track.applyConstraints({ advanced: [advanced] });
    } catch {
      // best-effort only
    }
  }
};

const waitReady = async (videoEl: HTMLVideoElement) => {
  const startedAt = Date.now();
  while (videoEl.readyState < HTMLMediaElement.HAVE_ENOUGH_DATA) {
    if (Date.now() - startedAt > 3000) break;
    await new Promise((resolve) => setTimeout(resolve, 40));
  }
};

const triggerResult = (code: string, onResult: (code: string) => void, onDebug?: DebugCallback) => {
  if (!session) return;
  const now = Date.now();

  if (session.lastTriggeredCode === code && now - session.lastTriggeredAt < 1200) {
    return;
  }

  session.lastTriggeredCode = code;
  session.lastTriggeredAt = now;
  patchDebug({ lastCode: code, lastDetectedAt: now, errors: null }, onDebug);
  onResult(code);
};

const runZxingRoiLoop = (videoEl: HTMLVideoElement, onResult: (code: string) => void, onDebug?: DebugCallback) => {
  if (!session) return;

  session.engineUsed = 'zxing';
  patchDebug({ engineUsed: 'zxing' }, onDebug);

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) {
    patchDebug({ errors: 'Canvas context unavailable for ZXing loop' }, onDebug);
    return;
  }

  const tick = (timestamp: number) => {
    if (!session || session.stopped) return;

    const interval = getThrottleIntervalMs();
    if (interval > 0 && timestamp - session.lastTickAt < interval) {
      scheduleNextFrame(tick);
      return;
    }
    session.lastTickAt = timestamp;

    const roi = getRoiRect(videoEl);
    patchDebug({ roi }, onDebug);

    if (!roi.w || !roi.h) {
      scheduleNextFrame(tick);
      return;
    }

    canvas.width = roi.w;
    canvas.height = roi.h;
    ctx.drawImage(videoEl, roi.x, roi.y, roi.w, roi.h, 0, 0, roi.w, roi.h);

    try {
      const result = session.reader?.decodeFromCanvas(canvas);
      const valid = getValidEan(result?.getText());
      if (valid) {
        triggerResult(valid, onResult, onDebug);
        return;
      }
    } catch (error) {
      if (!(error instanceof NotFoundException)) {
        patchDebug({ errors: error instanceof Error ? error.message : String(error) }, onDebug);
      }
    }

    if (session) {
      session.debug.framesProcessed += 1;
      patchDebug({ framesProcessed: session.debug.framesProcessed }, onDebug);
      updateFps(onDebug);
    }

    scheduleNextFrame(tick);
  };

  scheduleNextFrame(tick);
};

const runBarcodeDetectorLoop = async (
  videoEl: HTMLVideoElement,
  onResult: (code: string) => void,
  onDebug?: DebugCallback,
): Promise<boolean> => {
  const detectorCtor = (window as any).BarcodeDetector;
  if (!detectorCtor || !session) return false;

  const detector = new detectorCtor({ formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e'] });
  session.engineUsed = 'barcode_detector';
  patchDebug({ engineUsed: 'barcode_detector' }, onDebug);

  const tick = async (timestamp: number) => {
    if (!session || session.stopped) return;

    const interval = getThrottleIntervalMs();
    if (interval > 0 && timestamp - session.lastTickAt < interval) {
      scheduleNextFrame(tick);
      return;
    }
    session.lastTickAt = timestamp;

    const roi = getRoiRect(videoEl);
    patchDebug({ roi }, onDebug);

    if (!roi.w || !roi.h) {
      scheduleNextFrame(tick);
      return;
    }

    let bitmap: ImageBitmap | null = null;

    try {
      bitmap = await createImageBitmap(videoEl, roi.x, roi.y, roi.w, roi.h);
      session.pendingBitmap = bitmap;
      const foundCodes = await detector.detect(bitmap);

      if (foundCodes?.length) {
        for (const foundCode of foundCodes) {
          const valid = getValidEan(foundCode.rawValue);
          if (valid) {
            triggerResult(valid, onResult, onDebug);
            return;
          }
        }
      }

      const fallbackAfterMs = 2000;
      if (Date.now() - session.startedAt >= fallbackAfterMs) {
        runZxingRoiLoop(videoEl, onResult, onDebug);
        return;
      }
    } catch (error) {
      patchDebug({ errors: error instanceof Error ? error.message : String(error) }, onDebug);
      runZxingRoiLoop(videoEl, onResult, onDebug);
      return;
    } finally {
      if (bitmap) {
        bitmap.close();
      }
      if (session) {
        session.pendingBitmap = null;
        session.debug.framesProcessed += 1;
        patchDebug({ framesProcessed: session.debug.framesProcessed }, onDebug);
        updateFps(onDebug);
      }
    }

    scheduleNextFrame(tick);
  };

  scheduleNextFrame(tick);
  return true;
};

export async function startScan(
  videoEl: HTMLVideoElement,
  onResult: (code: string) => void,
  onDebug?: DebugCallback,
): Promise<void> {
  await stop();

  session = {
    videoEl,
    stream: null,
    track: null,
    reader: new BrowserMultiFormatReader(hints, 60),
    stopped: false,
    engineUsed: 'idle',
    frameHandle: null,
    frameCallbackId: null,
    lastTickAt: 0,
    startedAt: Date.now(),
    framesThisSecond: 0,
    fpsWindowStartedAt: Date.now(),
    lastTriggeredCode: null,
    lastTriggeredAt: 0,
    pendingBitmap: null,
    debug: {
      engineUsed: 'idle',
      userAgent: navigator.userAgent,
      barcodeDetectorSupported: typeof (window as any).BarcodeDetector !== 'undefined',
      fps: 0,
      framesProcessed: 0,
      roi: { x: 0, y: 0, w: 0, h: 0 },
      lastDetectedAt: null,
      lastCode: null,
      errors: null,
      settings: null,
      capabilities: null,
    },
  };

  onDebug?.(session.debug);

  const stream = await navigator.mediaDevices.getUserMedia(buildConstraints());
  session.stream = stream;
  session.track = stream.getVideoTracks()[0] ?? null;

  if (session.track) {
    const capabilities = readCapabilities(session.track);
    await applyTrackConstraints(session.track, capabilities);
    patchDebug({ settings: session.track.getSettings(), capabilities }, onDebug);
  }

  videoEl.srcObject = stream;
  videoEl.playsInline = true;
  videoEl.muted = true;
  videoEl.autoplay = true;

  await videoEl.play();
  await waitReady(videoEl);

  const useFastScan = isMobileUa();
  if (!useFastScan) {
    patchDebug({ errors: null }, onDebug);
  }

  const usingNative = await runBarcodeDetectorLoop(videoEl, onResult, onDebug);
  if (!usingNative) {
    runZxingRoiLoop(videoEl, onResult, onDebug);
  }
}

export async function stop(): Promise<void> {
  if (!session) return;

  session.stopped = true;
  cancelScheduledFrame();

  if (session.pendingBitmap) {
    session.pendingBitmap.close();
    session.pendingBitmap = null;
  }

  if (session.reader) {
    session.reader.reset();
    session.reader = null;
  }

  if (session.track) {
    try {
      await session.track.applyConstraints({ advanced: [{ torch: false } as any] });
    } catch {
      // best-effort
    }
  }

  if (session.stream) {
    session.stream.getTracks().forEach((track) => track.stop());
  }

  if (session.videoEl) {
    session.videoEl.pause();
    session.videoEl.srcObject = null;
  }

  session = null;
}

export async function setTorch(enabled: boolean): Promise<boolean> {
  if (!session?.track) return false;
  try {
    await session.track.applyConstraints({ advanced: [{ torch: enabled } as any] });
    return true;
  } catch {
    return false;
  }
}

export async function setZoom(zoom: number): Promise<boolean> {
  if (!session?.track) return false;
  try {
    await session.track.applyConstraints({ advanced: [{ zoom } as any] });
    return true;
  } catch {
    return false;
  }
}
