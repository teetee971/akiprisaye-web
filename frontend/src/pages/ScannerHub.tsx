import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import {
  BarcodeFormat,
  BinaryBitmap,
  DecodeHintType,
  HTMLCanvasElementLuminanceSource,
  HybridBinarizer,
  MultiFormatReader,
  NotFoundException,
} from '@zxing/library';

type ScanStatus =
  | 'idle'
  | 'permissionDenied'
  | 'cameraNotFound'
  | 'initializing'
  | 'scanning'
  | 'notDetectedTimeout'
  | 'success'
  | 'errorNetwork'
  | 'notFound';

type DetectorFormat = 'ean_13' | 'ean_8' | 'upc_a' | 'upc_e';
type ScanEngine = 'native' | 'zxing';

type BarcodeResult = {
  rawValue: string;
};

type DetectSource = HTMLVideoElement | HTMLCanvasElement | ImageBitmap;

type BarcodeDetectorConstructor = {
  new (options?: { formats?: DetectorFormat[] }): {
    detect: (source: DetectSource) => Promise<BarcodeResult[]>;
  };
  getSupportedFormats?: () => Promise<string[]>;
};

type DebugState = {
  enabled: boolean;
  barcodeDetectorSupported: boolean;
  detectorFormats: string;
  permission: 'ok' | 'ko' | 'unknown';
  readyState: number;
  videoSize: string;
  trackSettings: string;
  framesAnalyzed: number;
  lastTimestamp: string;
  successCount: number;
  roiFallbackCount: number;
  activeEngine: ScanEngine;
  videoReady: boolean;
  lastNativeResultsCount: number;
  lastZXingError: string;
  framesSkippedNotReady: number;
};

const EAN_REGEX = /^[0-9]{8,14}$/;
const SCAN_TIMEOUT_MS = 15_000;
const SUCCESS_LOCK_MS = 1_500;
const SCAN_THROTTLE_MS = 150;
const ZXING_AFTER_FRAMES = 120;
const SUPPORTED_DETECTOR_FORMATS: DetectorFormat[] = ['ean_13', 'ean_8', 'upc_a', 'upc_e'];
const VIDEO_READY_FOR_SCAN = 3;

export default function ScannerHub() {
  const navigate = useNavigate();

  const debugForced =
    typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('debug') === '1';

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timeoutRef = useRef<number | null>(null);
  const successLockRef = useRef<number | null>(null);
  const scanIntervalRef = useRef<number | null>(null);
  const processingRef = useRef(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const roiCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const workCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const fallbackFrameCounterRef = useRef(0);
  const zxingNotFoundCountRef = useRef(0);

  const zxingReaderRef = useRef<MultiFormatReader | null>(null);
  const nativeDetectorRef = useRef<InstanceType<BarcodeDetectorConstructor> | null>(null);

  const [status, setStatus] = useState<ScanStatus>('idle');
  const [lastDetectedCode, setLastDetectedCode] = useState<string | null>(null);
  const [stableCounter, setStableCounter] = useState(0);
  const [manualInputVisible, setManualInputVisible] = useState(false);
  const [manualEAN, setManualEAN] = useState('');
  const [manualError, setManualError] = useState<string | null>(null);
  const [successOverlayVisible, setSuccessOverlayVisible] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [activeEngine, setActiveEngine] = useState<ScanEngine>('native');
  const [torchSupported, setTorchSupported] = useState(false);
  const [torchEnabled, setTorchEnabled] = useState(false);
  const [scanLogs, setScanLogs] = useState<string[]>([]);
  const [showDebug, setShowDebug] = useState(debugForced);
  const [debugState, setDebugState] = useState<DebugState>({
    enabled: debugForced,
    barcodeDetectorSupported: false,
    detectorFormats: 'n/a',
    permission: 'unknown',
    readyState: 0,
    videoSize: '0x0',
    trackSettings: 'n/a',
    framesAnalyzed: 0,
    lastTimestamp: '—',
    successCount: 0,
    roiFallbackCount: 0,
    activeEngine: 'native',
    videoReady: false,
    lastNativeResultsCount: 0,
    lastZXingError: 'none',
    framesSkippedNotReady: 0,
  });

  const canFinalize = useCallback(() => successLockRef.current === null, []);

  const appendLog = useCallback((line: string) => {
    const timestamp = new Date().toLocaleTimeString('fr-FR', { hour12: false });
    const entry = `[${timestamp}] ${line}`;
    console.log('[EAN_SCAN]', entry);
    setScanLogs((previous) => [...previous.slice(-11), entry]);
  }, []);

  const detectorCtor = useMemo(() => {
    if (typeof window === 'undefined') {
      return null;
    }
    return (window as { BarcodeDetector?: BarcodeDetectorConstructor }).BarcodeDetector ?? null;
  }, []);

  const updateVideoDebugState = useCallback(() => {
    const video = videoRef.current;
    const stream = streamRef.current;
    const [track] = stream?.getVideoTracks() ?? [];
    const settings = track?.getSettings();

    const trackSettings = settings
      ? `w:${settings.width ?? '?'} h:${settings.height ?? '?'} fps:${settings.frameRate ?? '?'} facing:${settings.facingMode ?? '?'}`
      : 'n/a';

    const videoReady =
      Boolean(video) &&
      (video?.readyState ?? 0) >= VIDEO_READY_FOR_SCAN &&
      (video?.videoWidth ?? 0) > 0 &&
      (video?.videoHeight ?? 0) > 0;

    setDebugState((previous) => ({
      ...previous,
      readyState: video?.readyState ?? 0,
      videoSize: `${video?.videoWidth ?? 0}x${video?.videoHeight ?? 0}`,
      trackSettings,
      videoReady,
    }));
  }, []);

  const stopCamera = useCallback(() => {
    if (scanIntervalRef.current !== null) {
      window.clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    const stream = streamRef.current ?? (videoRef.current?.srcObject instanceof MediaStream ? videoRef.current.srcObject : null);
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    processingRef.current = false;
    fallbackFrameCounterRef.current = 0;
    zxingNotFoundCountRef.current = 0;
    setTorchEnabled(false);
    setTorchSupported(false);
    setIsScanning(false);
  }, []);

  const waitForVideoReady = useCallback(
    async (video: HTMLVideoElement, timeoutMs = 2_000) => {
      const start = Date.now();

      await new Promise<void>((resolve) => {
        const onReady = () => resolve();
        video.addEventListener('loadedmetadata', onReady, { once: true });
        if (video.readyState >= 1) {
          resolve();
        }
      });

      while (Date.now() - start < timeoutMs) {
        const isReady =
          video.readyState >= VIDEO_READY_FOR_SCAN && video.videoWidth > 0 && video.videoHeight > 0;

        if (isReady) {
          setDebugState((previous) => ({ ...previous, videoReady: true }));
          return true;
        }

        await new Promise((resolve) => window.setTimeout(resolve, 50));
      }

      setDebugState((previous) => ({ ...previous, videoReady: false }));
      appendLog('video not ready (timeout 2s)');
      return false;
    },
    [appendLog]
  );

  const finalizeScan = useCallback(
    (rawCode: string) => {
      if (!canFinalize()) {
        return;
      }

      const code = rawCode.replace(/\D/g, '');
      if (!EAN_REGEX.test(code)) {
        setStatus('notFound');
        appendLog(`Code ignoré (format invalide): ${rawCode}`);
        return;
      }

      successLockRef.current = window.setTimeout(() => {
        successLockRef.current = null;
      }, SUCCESS_LOCK_MS);

      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(200);
      }

      setStatus('success');
      setSuccessOverlayVisible(true);
      setDebugState((previous) => ({ ...previous, successCount: previous.successCount + 1 }));
      appendLog(`Code validé: ${code}`);
      stopCamera();

      window.setTimeout(() => {
        navigate(`/product/${code}`);
      }, SUCCESS_LOCK_MS);
    },
    [appendLog, canFinalize, navigate, stopCamera]
  );

  const ensureDetectorSetup = useCallback(async () => {
    if (detectorCtor && !nativeDetectorRef.current) {
      nativeDetectorRef.current = new detectorCtor({ formats: SUPPORTED_DETECTOR_FORMATS });
    }

    if (!zxingReaderRef.current) {
      const hints = new Map();
      hints.set(DecodeHintType.POSSIBLE_FORMATS, [
        BarcodeFormat.EAN_13,
        BarcodeFormat.EAN_8,
        BarcodeFormat.UPC_A,
        BarcodeFormat.UPC_E,
      ]);
      hints.set(DecodeHintType.TRY_HARDER, true);
      hints.set(DecodeHintType.ALSO_INVERTED, true);
      zxingReaderRef.current = new MultiFormatReader();
      zxingReaderRef.current.setHints(hints);
    }

    if (!detectorCtor) {
      setActiveEngine('zxing');
    }

    const detectorFormats = detectorCtor?.getSupportedFormats
      ? (await detectorCtor.getSupportedFormats()).join(', ')
      : SUPPORTED_DETECTOR_FORMATS.join(', ');

    setDebugState((previous) => ({
      ...previous,
      barcodeDetectorSupported: Boolean(detectorCtor),
      detectorFormats,
      activeEngine: detectorCtor ? previous.activeEngine : 'zxing',
    }));
  }, [detectorCtor]);

  const resolveTorchSupport = useCallback(() => {
    const [track] = streamRef.current?.getVideoTracks() ?? [];
    if (!track || typeof track.getCapabilities !== 'function') {
      setTorchSupported(false);
      return;
    }

    const capabilities = track.getCapabilities() as { torch?: boolean };
    setTorchSupported(Boolean(capabilities.torch));
  }, []);

  const drawFrame = useCallback(() => {
    const video = videoRef.current;
    if (!video) {
      return null;
    }

    if (!canvasRef.current) {
      canvasRef.current = document.createElement('canvas');
    }

    const fullCanvas = canvasRef.current;
    fullCanvas.width = video.videoWidth;
    fullCanvas.height = video.videoHeight;

    const fullContext = fullCanvas.getContext('2d', { willReadFrequently: true });
    if (!fullContext) {
      return null;
    }

    fullContext.drawImage(video, 0, 0, fullCanvas.width, fullCanvas.height);

    if (!roiCanvasRef.current) {
      roiCanvasRef.current = document.createElement('canvas');
    }

    const roiCanvas = roiCanvasRef.current;
    const roiContext = roiCanvas.getContext('2d', { willReadFrequently: true });
    if (!roiContext) {
      return { fullCanvas, roiCanvas: null, roiValid: false };
    }

    const roiWidth = Math.floor(video.videoWidth * 0.9);
    const roiHeight = Math.floor(video.videoHeight * 0.28);
    const roiX = Math.floor((video.videoWidth - roiWidth) / 2);
    const roiY = Math.floor(video.videoHeight * 0.55);

    const roiInsideVideo =
      roiWidth > 0 &&
      roiHeight > 0 &&
      roiX >= 0 &&
      roiY >= 0 &&
      roiX + roiWidth <= video.videoWidth &&
      roiY + roiHeight <= video.videoHeight;

    if (!roiInsideVideo) {
      setDebugState((previous) => ({ ...previous, roiFallbackCount: previous.roiFallbackCount + 1 }));
      appendLog('ROI invalide, fallback frame complète');
      return { fullCanvas, roiCanvas: null, roiValid: false };
    }

    roiCanvas.width = roiWidth;
    roiCanvas.height = roiHeight;

    try {
      roiContext.drawImage(fullCanvas, roiX, roiY, roiWidth, roiHeight, 0, 0, roiWidth, roiHeight);
      return { fullCanvas, roiCanvas, roiValid: true };
    } catch {
      setDebugState((previous) => ({ ...previous, roiFallbackCount: previous.roiFallbackCount + 1 }));
      appendLog('Erreur cropping ROI, fallback frame complète');
      return { fullCanvas, roiCanvas: null, roiValid: false };
    }
  }, [appendLog]);

  const preprocessForZXing = useCallback((sourceCanvas: HTMLCanvasElement) => {
    if (!workCanvasRef.current) {
      workCanvasRef.current = document.createElement('canvas');
    }

    const targetCanvas = workCanvasRef.current;
    const scale = sourceCanvas.width > 640 ? 640 / sourceCanvas.width : 1;
    const width = Math.max(1, Math.floor(sourceCanvas.width * scale));
    const height = Math.max(1, Math.floor(sourceCanvas.height * scale));

    targetCanvas.width = width;
    targetCanvas.height = height;

    const ctx = targetCanvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) {
      return sourceCanvas;
    }

    ctx.drawImage(sourceCanvas, 0, 0, width, height);

    const imageData = ctx.getImageData(0, 0, width, height);
    const pixels = imageData.data;
    let luminanceSum = 0;

    for (let i = 0; i < pixels.length; i += 4) {
      const l = pixels[i] * 0.299 + pixels[i + 1] * 0.587 + pixels[i + 2] * 0.114;
      luminanceSum += l;
      pixels[i] = l;
      pixels[i + 1] = l;
      pixels[i + 2] = l;
    }

    const mean = luminanceSum / (pixels.length / 4);
    const threshold = Math.max(60, Math.min(210, mean * 0.95));

    for (let i = 0; i < pixels.length; i += 4) {
      const value = pixels[i] > threshold ? 255 : 0;
      pixels[i] = value;
      pixels[i + 1] = value;
      pixels[i + 2] = value;
    }

    ctx.putImageData(imageData, 0, 0);
    return targetCanvas;
  }, []);

  const decodeWithNativeSource = useCallback(
    async (source: DetectSource) => {
      const detector = nativeDetectorRef.current;
      if (!detector) {
        return null;
      }
      const detected = await detector.detect(source);
      const firstRaw = detected[0]?.rawValue ?? 'none';
      setDebugState((previous) => ({ ...previous, lastNativeResultsCount: detected.length }));
      appendLog(`native results length=${detected.length} first=${firstRaw}`);
      const match = detected.find((item) => EAN_REGEX.test(item.rawValue.replace(/\D/g, '')));
      return match?.rawValue ?? null;
    },
    [appendLog]
  );

  const decodeWithNativeFromVideo = useCallback(
    async (video: HTMLVideoElement, fallbackCanvas: HTMLCanvasElement) => {
      const detector = nativeDetectorRef.current;
      if (!detector) {
        return null;
      }

      try {
        return await decodeWithNativeSource(video);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'native video detect error';
        appendLog(`native video detect fallback: ${message}`);
      }

      try {
        const imageBitmap = await window.createImageBitmap(fallbackCanvas);
        try {
          return await decodeWithNativeSource(imageBitmap);
        } finally {
          if ('close' in imageBitmap && typeof imageBitmap.close === 'function') {
            imageBitmap.close();
          }
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'native bitmap detect error';
        appendLog(`native bitmap detect fallback: ${message}`);
      }

      try {
        return await decodeWithNativeSource(fallbackCanvas);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'native canvas detect error';
        appendLog(`native canvas detect error: ${message}`);
        return null;
      }
    },
    [appendLog, decodeWithNativeSource]
  );

  const decodeWithZXing = useCallback(
    (canvas: HTMLCanvasElement) => {
      const reader = zxingReaderRef.current;
      if (!reader) {
        return null;
      }

      const source = new HTMLCanvasElementLuminanceSource(canvas);
      const bitmap = new BinaryBitmap(new HybridBinarizer(source));
      const result = reader.decode(bitmap);
      return result.getText();
    },
    []
  );

  const analyzeFrame = useCallback(async () => {
    if (processingRef.current || !isScanning || status !== 'scanning') {
      return;
    }

    processingRef.current = true;
    try {
      const video = videoRef.current;
      const isVideoReady =
        Boolean(video) &&
        (video?.readyState ?? 0) >= VIDEO_READY_FOR_SCAN &&
        (video?.videoWidth ?? 0) > 0 &&
        (video?.videoHeight ?? 0) > 0;

      if (!isVideoReady) {
        setDebugState((previous) => ({
          ...previous,
          framesSkippedNotReady: previous.framesSkippedNotReady + 1,
          videoReady: false,
        }));
        return;
      }

      const frame = drawFrame();
      if (!frame || !video) {
        updateVideoDebugState();
        return;
      }

      const now = new Date();
      setDebugState((previous) => ({
        ...previous,
        framesAnalyzed: previous.framesAnalyzed + 1,
        lastTimestamp: now.toLocaleTimeString('fr-FR', { hour12: false }),
      }));

      let result: string | null = null;
      if (activeEngine === 'native' && nativeDetectorRef.current) {
        result = await decodeWithNativeFromVideo(video, frame.fullCanvas);

        if (!result) {
          fallbackFrameCounterRef.current += 1;
          if (fallbackFrameCounterRef.current >= ZXING_AFTER_FRAMES) {
            setActiveEngine('zxing');
            appendLog(`Aucun résultat natif après ${ZXING_AFTER_FRAMES} frames, bascule ZXing`);
          }
        }
      }

      if (!result && activeEngine === 'zxing') {
        const zxingTargets: HTMLCanvasElement[] = [];
        if (frame.roiValid && frame.roiCanvas) {
          zxingTargets.push(preprocessForZXing(frame.roiCanvas));
        } else {
          zxingTargets.push(preprocessForZXing(frame.fullCanvas));
        }

        for (const target of zxingTargets) {
          try {
            result = decodeWithZXing(target);
            if (result) {
              appendLog(`zxing success: ${result}`);
              setDebugState((previous) => ({ ...previous, lastZXingError: 'none' }));
              break;
            }
          } catch (error) {
            if (error instanceof NotFoundException) {
              zxingNotFoundCountRef.current += 1;
              appendLog(`zxing NotFound count=${zxingNotFoundCountRef.current}`);
            } else {
              const message = error instanceof Error ? error.message : 'zxing error';
              setDebugState((previous) => ({ ...previous, lastZXingError: message }));
              appendLog(`ZXing erreur: ${message}`);
            }
          }
        }
      }

      updateVideoDebugState();

      if (!result || !canFinalize()) {
        return;
      }

      const text = result.trim();
      setLastDetectedCode((previousCode) => {
        if (previousCode === text) {
          setStableCounter((previousCounter) => {
            const nextCounter = previousCounter + 1;
            if (nextCounter >= 2) {
              finalizeScan(text);
            }
            return nextCounter;
          });
          return previousCode;
        }

        setStableCounter(1);
        return text;
      });
    } finally {
      processingRef.current = false;
    }
  }, [
    activeEngine,
    appendLog,
    canFinalize,
    decodeWithNativeFromVideo,
    decodeWithZXing,
    drawFrame,
    finalizeScan,
    isScanning,
    preprocessForZXing,
    status,
    updateVideoDebugState,
  ]);

  const handleCaptureDecode = useCallback(async () => {
    if (processingRef.current || !isScanning || status !== 'scanning') {
      return;
    }

    processingRef.current = true;
    appendLog('capture decode start');

    try {
      const video = videoRef.current;
      const frame = drawFrame();
      if (!video || !frame) {
        appendLog('capture decode fail: frame indisponible');
        return;
      }

      let result = await decodeWithNativeFromVideo(video, frame.fullCanvas);
      if (!result) {
        const target = preprocessForZXing(frame.fullCanvas);
        try {
          result = decodeWithZXing(target);
        } catch (error) {
          const message = error instanceof Error ? error.message : 'capture zxing error';
          setDebugState((previous) => ({ ...previous, lastZXingError: message }));
        }
      }

      if (result) {
        appendLog(`capture decode success: ${result}`);
        finalizeScan(result);
      } else {
        appendLog('capture decode fail');
      }
    } finally {
      processingRef.current = false;
    }
  }, [
    appendLog,
    decodeWithNativeFromVideo,
    decodeWithZXing,
    drawFrame,
    finalizeScan,
    isScanning,
    preprocessForZXing,
    status,
  ]);

  const resetForNewScan = useCallback(() => {
    setLastDetectedCode(null);
    setStableCounter(0);
    setManualError(null);
    setSuccessOverlayVisible(false);
    setScanLogs([]);
    setActiveEngine(detectorCtor ? 'native' : 'zxing');
    fallbackFrameCounterRef.current = 0;
    zxingNotFoundCountRef.current = 0;
    setDebugState((previous) => ({
      ...previous,
      framesAnalyzed: 0,
      lastTimestamp: '—',
      successCount: 0,
      roiFallbackCount: 0,
      activeEngine: detectorCtor ? 'native' : 'zxing',
      videoReady: false,
      lastNativeResultsCount: 0,
      lastZXingError: 'none',
      framesSkippedNotReady: 0,
    }));
    if (status !== 'permissionDenied' && status !== 'cameraNotFound') {
      setStatus('idle');
    }
  }, [detectorCtor, status]);

  const startCamera = useCallback(async () => {
    stopCamera();
    resetForNewScan();
    setManualInputVisible(false);

    if (!videoRef.current || !navigator.mediaDevices?.getUserMedia) {
      setStatus('cameraNotFound');
      setDebugState((previous) => ({ ...previous, permission: 'ko' }));
      return;
    }

    try {
      setStatus('initializing');
      await ensureDetectorSetup();
      appendLog(`Démarrage scan (${detectorCtor ? 'BarcodeDetector + fallback ZXing' : 'ZXing only'})`);

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;
      videoRef.current.srcObject = stream;
      videoRef.current.setAttribute('playsinline', 'true');
      await videoRef.current.play();
      await waitForVideoReady(videoRef.current);

      resolveTorchSupport();
      setStatus('scanning');
      setIsScanning(true);
      setDebugState((previous) => ({ ...previous, permission: 'ok' }));

      if (scanIntervalRef.current !== null) {
        window.clearInterval(scanIntervalRef.current);
      }
      scanIntervalRef.current = window.setInterval(() => {
        void analyzeFrame();
      }, SCAN_THROTTLE_MS);

      timeoutRef.current = window.setTimeout(() => {
        if (canFinalize()) {
          stopCamera();
          setStatus('notDetectedTimeout');
          setManualInputVisible(true);
          appendLog('Timeout scan atteint, aucun code détecté');
        }
      }, SCAN_TIMEOUT_MS);
    } catch (error) {
      stopCamera();
      const message = error instanceof Error ? error.message : '';
      appendLog(`Erreur démarrage caméra: ${message || 'inconnue'}`);

      if (/permission|denied|notallowed/i.test(message)) {
        setStatus('permissionDenied');
        setDebugState((previous) => ({ ...previous, permission: 'ko' }));
        setManualInputVisible(true);
        return;
      }

      if (/notfound|overconstrained|devices/i.test(message)) {
        setStatus('cameraNotFound');
        setManualInputVisible(true);
        return;
      }

      setStatus('errorNetwork');
      setManualInputVisible(true);
    }
  }, [
    analyzeFrame,
    appendLog,
    canFinalize,
    detectorCtor,
    ensureDetectorSetup,
    resetForNewScan,
    resolveTorchSupport,
    stopCamera,
    waitForVideoReady,
  ]);

  const handleManualSearch = useCallback(() => {
    const normalized = manualEAN.replace(/\D/g, '');

    if (!EAN_REGEX.test(normalized)) {
      setManualError('Code EAN invalide. Entrez 8 à 14 chiffres.');
      return;
    }

    setManualError(null);
    finalizeScan(normalized);
  }, [finalizeScan, manualEAN]);

  const toggleTorch = useCallback(async () => {
    const [track] = streamRef.current?.getVideoTracks() ?? [];
    if (!track || !torchSupported) {
      return;
    }

    const nextState = !torchEnabled;
    try {
      await track.applyConstraints({ advanced: [{ torch: nextState }] });
      setTorchEnabled(nextState);
      appendLog(`Torch ${nextState ? 'activée' : 'désactivée'}`);
    } catch {
      appendLog('Torch/focus indisponible (scan continue sans interruption)');
    }
  }, [appendLog, torchEnabled, torchSupported]);

  useEffect(() => {
    setDebugState((previous) => ({ ...previous, enabled: showDebug }));
  }, [showDebug]);

  useEffect(() => {
    setDebugState((previous) => ({ ...previous, activeEngine }));
  }, [activeEngine]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopCamera();
      }
    };

    const handlePageHide = () => {
      stopCamera();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pagehide', handlePageHide);

    return () => {
      stopCamera();

      if (successLockRef.current !== null) {
        window.clearTimeout(successLockRef.current);
        successLockRef.current = null;
      }

      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pagehide', handlePageHide);
    };
  }, [stopCamera]);

  return (
    <>
      <Helmet>
        <title>Scanner - A KI PRI SA YÉ</title>
      </Helmet>

      <main className="min-h-screen bg-slate-950 p-4 pt-24 text-white">
        <section className="mx-auto w-full max-w-2xl rounded-2xl border border-slate-800 bg-slate-900 p-4">
          <h1 className="mb-3 text-2xl font-semibold">Scanner un code-barres</h1>

          <div className="relative overflow-hidden rounded-xl border border-slate-700 bg-black">
            <video
              ref={videoRef}
              playsInline
              muted
              autoPlay
              className="aspect-video w-full"
              aria-label="Caméra de scan"
            />

            {successOverlayVisible && (
              <div className="absolute inset-0 flex items-center justify-center bg-emerald-600/80 text-xl font-semibold">
                Succès
              </div>
            )}
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void startCamera()}
              className="rounded-lg bg-blue-600 px-5 py-3 text-base font-semibold hover:bg-blue-700"
            >
              Activer la caméra
            </button>

            <button
              type="button"
              onClick={() => {
                stopCamera();
                setManualInputVisible(true);
              }}
              className="rounded-lg border border-slate-500 px-5 py-3 text-base font-semibold"
            >
              Saisir manuellement
            </button>

            {isScanning && (
              <button
                type="button"
                onClick={() => void handleCaptureDecode()}
                className="rounded-lg border border-cyan-500 px-5 py-3 text-base font-semibold text-cyan-200"
              >
                Capturer
              </button>
            )}

            <button
              type="button"
              onClick={() => setShowDebug((previous) => !previous)}
              className="rounded-lg border border-slate-600 px-4 py-2 text-xs text-slate-200"
            >
              {showDebug ? 'Masquer debug' : 'Debug'}
            </button>

            {torchSupported && isScanning && (
              <button
                type="button"
                onClick={() => void toggleTorch()}
                className="rounded-lg border border-amber-400 px-5 py-3 text-base font-semibold text-amber-100"
              >
                {torchEnabled ? 'Lampe: ON' : 'Lampe'}
              </button>
            )}
          </div>

          <div className="mt-4 space-y-1 text-sm text-slate-300">
            <p>État: {status}</p>
            <p>Moteur: {activeEngine}</p>
            <p>Dernier code: {lastDetectedCode ?? '—'}</p>
            <p>Validation stable: {stableCounter}/2</p>
          </div>

          {showDebug && (
            <div className="mt-4 rounded-xl border border-slate-700 bg-slate-950/70 p-3 text-xs text-slate-200">
              <p>BarcodeDetector support: {debugState.barcodeDetectorSupported ? 'oui' : 'non'}</p>
              <p>Formats detector: {debugState.detectorFormats}</p>
              <p>Permission caméra: {debugState.permission}</p>
              <p>videoReady: {debugState.videoReady ? 'oui' : 'non'}</p>
              <p>
                Video state: readyState={debugState.readyState} size={debugState.videoSize}
              </p>
              <p>Track settings: {debugState.trackSettings}</p>
              <p>
                Frames analysées: {debugState.framesAnalyzed} | Last TS: {debugState.lastTimestamp} | Succès:{' '}
                {debugState.successCount}
              </p>
              <p>framesSkippedNotReady: {debugState.framesSkippedNotReady}</p>
              <p>lastNativeResultsCount: {debugState.lastNativeResultsCount}</p>
              <p>lastZXingError: {debugState.lastZXingError}</p>
              <p>Fallback ROI → frame complète: {debugState.roiFallbackCount}</p>
              <p>Engine actif: {debugState.activeEngine}</p>
              <div className="mt-2 max-h-40 overflow-auto rounded border border-slate-800 bg-slate-900 p-2 text-[11px]">
                {scanLogs.length === 0 ? <p>Aucun log</p> : scanLogs.map((line) => <p key={line}>{line}</p>)}
              </div>
            </div>
          )}

          {status === 'permissionDenied' && (
            <p className="mt-3 rounded-lg border border-red-700 bg-red-500/10 p-3 text-sm text-red-200">
              Permission caméra refusée. Utilisez la saisie manuelle.
            </p>
          )}

          {status === 'cameraNotFound' && (
            <p className="mt-3 rounded-lg border border-red-700 bg-red-500/10 p-3 text-sm text-red-200">
              Caméra introuvable ou indisponible.
            </p>
          )}

          {status === 'notDetectedTimeout' && (
            <p className="mt-3 rounded-lg border border-amber-700 bg-amber-500/10 p-3 text-sm text-amber-200">
              Aucun code détecté après 15 secondes. Vous pouvez saisir le code EAN.
            </p>
          )}

          {(status === 'errorNetwork' || status === 'notFound') && (
            <p className="mt-3 rounded-lg border border-red-700 bg-red-500/10 p-3 text-sm text-red-200">
              Erreur pendant le scan. Passez par la saisie manuelle.
            </p>
          )}

          {manualInputVisible && (
            <div className="mt-4 rounded-xl border border-slate-700 p-3">
              <label htmlFor="manual-ean" className="mb-2 block text-sm font-medium">
                Code EAN (8 à 14 chiffres)
              </label>
              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  id="manual-ean"
                  value={manualEAN}
                  onChange={(event) => {
                    setManualEAN(event.target.value.replace(/\D/g, ''));
                    setManualError(null);
                  }}
                  inputMode="numeric"
                  className="flex-1 rounded-lg border border-slate-600 bg-slate-950 px-3 py-3"
                  placeholder="3017620422003"
                />
                <button
                  type="button"
                  onClick={handleManualSearch}
                  className="rounded-lg bg-emerald-600 px-5 py-3 text-base font-semibold hover:bg-emerald-700"
                >
                  Rechercher
                </button>
              </div>
              {manualError && <p className="mt-2 text-sm text-red-300">{manualError}</p>}
            </div>
          )}
        </section>
      </main>
    </>
  );
}
