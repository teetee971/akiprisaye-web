import { useCallback, useEffect, useRef, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { BrowserMultiFormatReader, NotFoundException } from '@zxing/library';
import { Camera, FileText, Barcode, Flashlight, FlashlightOff } from 'lucide-react';
import { GlassCard } from '../components/ui/glass-card';
import ReceiptScanner from '../components/ReceiptScanner';
import ScanOCR from './ScanOCR';

type ScanMode = 'barcode' | 'ocr' | 'ticket';
type ScannerState =
  | 'idle'
  | 'scanning'
  | 'permissionDenied'
  | 'cameraNotFound'
  | 'notDetectedTimeout'
  | 'success'
  | 'errorNetwork'
  | 'notFound';

type TorchCapabilities = { torch?: boolean };
type TorchConstraintsPayload = { advanced: Array<{ torch?: boolean }> };
type DetectedBarcode = { rawValue?: string };
type BarcodeDetectorLike = { detect: (source: HTMLVideoElement) => Promise<DetectedBarcode[]> };

const STABLE_DETECTION_TARGET = 2;
const FRAME_INTERVAL_MS = 220;
const SCAN_LOCK_MS = 1500;
const DUPLICATE_WINDOW_MS = 3000;
const HELP_STEP_1_MS = 5000;
const HELP_STEP_2_MS = 10000;
const HELP_STEP_3_MS = 20000;
const MANUAL_FALLBACK_MS = 30000;

export default function ScannerHub() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<ScanMode>('barcode');
  const [scannerState, setScannerState] = useState<ScannerState>('idle');
  const [manualInput, setManualInput] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);
  const [highlightManualInput, setHighlightManualInput] = useState(false);
  const [helpMessage, setHelpMessage] = useState('Alignez le code dans le cadre');
  const [showSuccessOverlay, setShowSuccessOverlay] = useState(false);
  const [torchSupported, setTorchSupported] = useState(false);
  const [torchEnabled, setTorchEnabled] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const detectorRef = useRef<BarcodeDetectorLike | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastFrameProcessedAtRef = useRef(0);
  const stableCandidateRef = useRef<string | null>(null);
  const stableCountRef = useRef(0);
  const scanLockedUntilRef = useRef(0);
  const lastDetectedRef = useRef<{ code: string; timestamp: number } | null>(null);
  const isMountedRef = useRef(true);

  const helpStep1Ref = useRef<number | null>(null);
  const helpStep2Ref = useRef<number | null>(null);
  const helpStep3Ref = useRef<number | null>(null);
  const fallbackRef = useRef<number | null>(null);
  const successTimerRef = useRef<number | null>(null);

  const clearTimers = useCallback(() => {
    if (helpStep1Ref.current !== null) {
      window.clearTimeout(helpStep1Ref.current);
      helpStep1Ref.current = null;
    }
    if (helpStep2Ref.current !== null) {
      window.clearTimeout(helpStep2Ref.current);
      helpStep2Ref.current = null;
    }
    if (helpStep3Ref.current !== null) {
      window.clearTimeout(helpStep3Ref.current);
      helpStep3Ref.current = null;
    }
    if (fallbackRef.current !== null) {
      window.clearTimeout(fallbackRef.current);
      fallbackRef.current = null;
    }
    if (successTimerRef.current !== null) {
      window.clearTimeout(successTimerRef.current);
      successTimerRef.current = null;
    }
  }, []);

  const finalizeScan = useCallback(
    (barcode: string) => {
      if (!isMountedRef.current) return;
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(35);
      }
      setScannerState('success');
      setShowSuccessOverlay(true);

      successTimerRef.current = window.setTimeout(() => {
        navigate(`/product/${barcode}`);
      }, 420);
    },
    [navigate],
  );

  const cleanupCamera = useCallback(async () => {
    if (animationFrameRef.current !== null) {
      window.cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    clearTimers();

    const stream = streamRef.current;
    if (stream) {
      const track = stream.getVideoTracks()[0];
      if (track && torchEnabled) {
        try {
          await track.applyConstraints({ advanced: [{ torch: false }] } as TorchConstraintsPayload);
        } catch {
          // noop - torch disable best effort
        }
      }

      stream.getTracks().forEach((trackItem) => trackItem.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.srcObject = null;
    }

    if (readerRef.current) {
      readerRef.current.reset();
    }

    setTorchEnabled(false);
  }, [clearTimers, torchEnabled]);

  const detectLowLight = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !video.videoWidth || !video.videoHeight) return false;

    const width = Math.min(180, video.videoWidth);
    const height = Math.round((width / video.videoWidth) * video.videoHeight);
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    if (!context) return false;

    context.drawImage(video, 0, 0, width, height);
    const frame = context.getImageData(0, 0, width, height).data;
    let total = 0;
    for (let i = 0; i < frame.length; i += 4) {
      total += (frame[i] + frame[i + 1] + frame[i + 2]) / 3;
    }
    const average = total / (frame.length / 4);
    return average < 55;
  }, []);

  const handleDetectedCode = useCallback(
    (rawCode: string) => {
      const normalized = rawCode.replace(/\D/g, '');
      if (!normalized || normalized.length < 8) return;

      const now = Date.now();
      if (now < scanLockedUntilRef.current) return;

      const last = lastDetectedRef.current;
      if (last && last.code === normalized && now - last.timestamp < DUPLICATE_WINDOW_MS) return;

      if (stableCandidateRef.current === normalized) {
        stableCountRef.current += 1;
      } else {
        stableCandidateRef.current = normalized;
        stableCountRef.current = 1;
      }

      if (stableCountRef.current < STABLE_DETECTION_TARGET) return;

      scanLockedUntilRef.current = now + SCAN_LOCK_MS;
      lastDetectedRef.current = { code: normalized, timestamp: now };
      void cleanupCamera();
      finalizeScan(normalized);
    },
    [cleanupCamera, finalizeScan],
  );

  const decodeLoop = useCallback(() => {
    const video = videoRef.current;
    if (!video || scannerState !== 'scanning') return;

    animationFrameRef.current = window.requestAnimationFrame(async () => {
      const now = performance.now();
      if (now - lastFrameProcessedAtRef.current < FRAME_INTERVAL_MS) {
        decodeLoop();
        return;
      }
      lastFrameProcessedAtRef.current = now;

      if (detectLowLight()) {
        setHelpMessage('Augmentez la lumière ou activez la lampe');
      }

      try {
        if (detectorRef.current) {
          const result = await detectorRef.current.detect(video);
          if (result.length > 0 && result[0].rawValue) {
            handleDetectedCode(result[0].rawValue);
            decodeLoop();
            return;
          }
        }

        if (readerRef.current) {
          const result = await readerRef.current.decodeFromVideoElement(video);
          handleDetectedCode(result.getText());
        }
      } catch (error) {
        if (!(error instanceof NotFoundException)) {
          setScannerState('errorNetwork');
        }
      }

      decodeLoop();
    });
  }, [detectLowLight, handleDetectedCode, scannerState]);

  const configureTorchSupport = useCallback(() => {
    const track = streamRef.current?.getVideoTracks()[0];
    if (!track || typeof track.getCapabilities !== 'function') {
      setTorchSupported(false);
      return;
    }

    const capabilities = track.getCapabilities() as TorchCapabilities;
    setTorchSupported(Boolean(capabilities.torch));
  }, []);

  const startScanTimers = useCallback(() => {
    setHelpMessage('Alignez le code dans le cadre');
    setShowManualInput(false);
    setHighlightManualInput(false);

    helpStep1Ref.current = window.setTimeout(() => {
      setHelpMessage('Approchez légèrement et stabilisez');
    }, HELP_STEP_1_MS);

    helpStep2Ref.current = window.setTimeout(() => {
      setShowManualInput(true);
      setHighlightManualInput(true);
    }, HELP_STEP_2_MS);

    helpStep3Ref.current = window.setTimeout(() => {
      setHelpMessage('Essayez en meilleure lumière');
    }, HELP_STEP_3_MS);

    fallbackRef.current = window.setTimeout(() => {
      setScannerState('notDetectedTimeout');
      setShowManualInput(true);
      setHighlightManualInput(true);
    }, MANUAL_FALLBACK_MS);
  }, []);

  const startScanner = useCallback(async () => {
    await cleanupCamera();
    setScannerState('idle');

    stableCandidateRef.current = null;
    stableCountRef.current = 0;
    scanLockedUntilRef.current = 0;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;
      const video = videoRef.current;
      if (!video) return;

      video.srcObject = stream;
      await video.play();

      setScannerState('scanning');
      startScanTimers();
      configureTorchSupport();

      readerRef.current = new BrowserMultiFormatReader(undefined, 150);
      const maybeCtor = (window as unknown as { BarcodeDetector?: new () => BarcodeDetectorLike }).BarcodeDetector;
      detectorRef.current = maybeCtor ? new maybeCtor() : null;
      decodeLoop();
    } catch (error) {
      const message = error instanceof Error ? error.message : '';
      if (message.toLowerCase().includes('permission')) {
        setScannerState('permissionDenied');
      } else {
        setScannerState('cameraNotFound');
      }
    }
  }, [cleanupCamera, configureTorchSupport, decodeLoop, startScanTimers]);

  const toggleTorch = useCallback(async () => {
    const track = streamRef.current?.getVideoTracks()[0];
    if (!track || !torchSupported) return;

    try {
      await track.applyConstraints({
        advanced: [{ torch: !torchEnabled }],
      } as TorchConstraintsPayload);
      setTorchEnabled((current) => !current);
    } catch {
      setTorchEnabled(false);
    }
  }, [torchEnabled, torchSupported]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      void cleanupCamera();
    };
  }, [cleanupCamera]);

  useEffect(() => {
    const handleVisibilityCleanup = () => {
      if (document.hidden) {
        void cleanupCamera();
      }
    };

    const handlePageHide = () => {
      void cleanupCamera();
    };

    document.addEventListener('visibilitychange', handleVisibilityCleanup);
    window.addEventListener('pagehide', handlePageHide);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityCleanup);
      window.removeEventListener('pagehide', handlePageHide);
    };
  }, [cleanupCamera]);

  const handleManualSubmit = () => {
    const normalized = manualInput.replace(/\D/g, '');
    if (!normalized) return;
    finalizeScan(normalized);
  };

  return (
    <>
      <Helmet>
        <title>Scanner - A KI PRI SA YÉ</title>
        <meta name="description" content="Scanner de produits : code-barres, OCR texte, et tickets de caisse" />
      </Helmet>

      <div className="min-h-screen bg-slate-950 p-4 pt-24">
        <div className="mx-auto max-w-4xl">
          <div className="mb-8">
            <h1 className="mb-3 text-3xl font-bold text-white md:text-4xl">📷 Scanner de produits</h1>
            <p className="text-lg text-gray-400">Scannez vos produits pour comparer les prix instantanément</p>
          </div>

          <GlassCard className="mb-6 p-3">
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setMode('barcode')}
                className={`flex flex-col items-center gap-2 rounded-xl px-4 py-4 font-semibold transition-all ${
                  mode === 'barcode'
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                    : 'bg-slate-800/50 text-gray-400 hover:bg-slate-700 hover:text-gray-300'
                }`}
                aria-label="Sélectionner le mode code-barres"
                aria-pressed={mode === 'barcode'}
              >
                <Barcode className="h-6 w-6" />
                <span className="text-sm">Code-barres</span>
              </button>
              <button
                onClick={() => setMode('ocr')}
                className={`flex flex-col items-center gap-2 rounded-xl px-4 py-4 font-semibold transition-all ${
                  mode === 'ocr'
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                    : 'bg-slate-800/50 text-gray-400 hover:bg-slate-700 hover:text-gray-300'
                }`}
                aria-label="Sélectionner le mode OCR texte"
                aria-pressed={mode === 'ocr'}
              >
                <FileText className="h-6 w-6" />
                <span className="text-sm">OCR Texte</span>
              </button>
              <button
                onClick={() => setMode('ticket')}
                className={`flex flex-col items-center gap-2 rounded-xl px-4 py-4 font-semibold transition-all ${
                  mode === 'ticket'
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                    : 'bg-slate-800/50 text-gray-400 hover:bg-slate-700 hover:text-gray-300'
                }`}
                aria-label="Sélectionner le mode ticket de caisse"
                aria-pressed={mode === 'ticket'}
              >
                <Camera className="h-6 w-6" />
                <span className="text-sm">Ticket</span>
              </button>
            </div>
          </GlassCard>

          <div>
            {mode === 'barcode' && (
              <GlassCard>
                <h2 className="mb-4 text-xl font-semibold text-white">Scanner un code-barres</h2>
                <p className="mb-6 text-gray-400">Positionnez le code-barres devant votre caméra</p>

                <div className="rounded-xl bg-slate-900/60 p-3">
                  {scannerState === 'idle' && (
                    <button
                      onClick={() => void startScanner()}
                      className="w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white transition-colors hover:bg-blue-500"
                    >
                      Démarrer la caméra
                    </button>
                  )}

                  {(scannerState === 'scanning' || scannerState === 'success') && (
                    <div className="relative overflow-hidden rounded-xl border border-slate-700 bg-black">
                      <video ref={videoRef} className="h-[360px] w-full object-cover" playsInline muted />
                      <canvas ref={canvasRef} className="hidden" />

                      <div className="pointer-events-none absolute inset-0 bg-black/30" />
                      <div className="pointer-events-none absolute left-1/2 top-1/2 h-40 w-[78%] -translate-x-1/2 -translate-y-1/2 rounded-2xl border-2 border-white/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.25)]" />

                      <div className="absolute bottom-3 left-3 right-3 rounded-lg bg-slate-900/75 px-3 py-2 text-center text-sm text-slate-100">
                        {helpMessage}
                      </div>

                      {torchSupported && scannerState === 'scanning' && (
                        <button
                          onClick={() => void toggleTorch()}
                          className="absolute right-3 top-3 rounded-full bg-slate-900/85 p-2 text-white"
                          aria-label="Activer ou désactiver la lampe"
                        >
                          {torchEnabled ? <Flashlight className="h-5 w-5" /> : <FlashlightOff className="h-5 w-5" />}
                        </button>
                      )}

                      {showSuccessOverlay && (
                        <div className="absolute inset-0 flex items-center justify-center bg-emerald-500/30 text-lg font-semibold text-white backdrop-blur-[1px]">
                          Succès
                        </div>
                      )}
                    </div>
                  )}

                  {(scannerState === 'permissionDenied' || scannerState === 'cameraNotFound' || scannerState === 'errorNetwork') && (
                    <div className="rounded-lg border border-red-700/70 bg-red-950/30 px-4 py-3 text-sm text-red-200">
                      {scannerState === 'permissionDenied' && 'Accès caméra refusé. Autorisez la caméra puis réessayez.'}
                      {scannerState === 'cameraNotFound' && 'Caméra non disponible sur cet appareil.'}
                      {scannerState === 'errorNetwork' && 'Erreur de détection. Réessayez dans de meilleures conditions.'}
                    </div>
                  )}

                  {(showManualInput || scannerState === 'notDetectedTimeout') && (
                    <div
                      className={`mt-3 rounded-lg border p-3 transition-colors ${
                        highlightManualInput ? 'border-amber-400 bg-amber-950/20' : 'border-slate-700 bg-slate-900/50'
                      }`}
                    >
                      <p className="mb-2 text-sm text-slate-300">Saisie manuelle du code-barres</p>
                      <div className="flex gap-2">
                        <input
                          value={manualInput}
                          onChange={(event) => setManualInput(event.target.value)}
                          inputMode="numeric"
                          className="min-w-0 flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
                          placeholder="Ex: 3274080005003"
                        />
                        <button
                          onClick={handleManualSubmit}
                          className="rounded-lg bg-blue-600 px-3 py-2 font-semibold text-white hover:bg-blue-500"
                        >
                          Valider
                        </button>
                      </div>
                    </div>
                  )}

                  {scannerState === 'notDetectedTimeout' && (
                    <p className="mt-3 text-sm text-amber-300">Aucune détection automatique. Essayez manuellement.</p>
                  )}
                </div>
              </GlassCard>
            )}

            {mode === 'ocr' && (
              <div className="-mt-6">
                <ScanOCR />
              </div>
            )}

            {mode === 'ticket' && (
              <GlassCard>
                <h2 className="mb-4 text-xl font-semibold text-white">Scanner un ticket de caisse</h2>
                <p className="mb-6 text-gray-400">Prenez une photo de votre ticket pour extraire les informations</p>
                <ReceiptScanner />
              </GlassCard>
            )}
          </div>

          <GlassCard className="mt-6">
            <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold text-white">
              <span>💡</span>
              <span>Conseils d'utilisation</span>
            </h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li className="flex items-start gap-2">
                <span className="mt-0.5 text-blue-400">•</span>
                <span>Assurez-vous d'avoir un bon éclairage</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 text-blue-400">•</span>
                <span>Tenez votre appareil stable pendant le scan</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 text-blue-400">•</span>
                <span>Pour les tickets, cadrez bien l'ensemble du document</span>
              </li>
            </ul>
          </GlassCard>
        </div>
      </div>
    </>
  );
}
