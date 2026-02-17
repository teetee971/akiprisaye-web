import { useCallback, useEffect, useRef, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import {
  BarcodeFormat,
  BinaryBitmap,
  DecodeHintType,
  HTMLCanvasElementLuminanceSource,
  HybridBinarizer,
  MultiFormatReader,
  NotFoundException,
} from '@zxing/library';
import { useNavigate } from 'react-router-dom';

type ScanStatus =
  | 'idle'
  | 'permissionDenied'
  | 'cameraNotFound'
  | 'scanning'
  | 'notDetectedTimeout'
  | 'success'
  | 'errorNetwork'
  | 'notFound';

const EAN_REGEX = /^[0-9]{8,14}$/;
const SCAN_TIMEOUT_MS = 10_000;
const SUCCESS_LOCK_MS = 1_500;

export default function ScannerHub() {
  const navigate = useNavigate();

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const readerRef = useRef<MultiFormatReader | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timeoutRef = useRef<number | null>(null);
  const successLockRef = useRef<number | null>(null);
  const frameRequestRef = useRef<number | null>(null);

  const [status, setStatus] = useState<ScanStatus>('idle');
  const [lastDetectedCode, setLastDetectedCode] = useState<string | null>(null);
  const [stableCounter, setStableCounter] = useState(0);
  const [manualInputVisible, setManualInputVisible] = useState(false);
  const [manualEAN, setManualEAN] = useState('');
  const [manualError, setManualError] = useState<string | null>(null);
  const [torchSupported, setTorchSupported] = useState(false);
  const [torchEnabled, setTorchEnabled] = useState(false);
  const [successOverlayVisible, setSuccessOverlayVisible] = useState(false);
  const [isScanning, setIsScanning] = useState(false);

  const stopCamera = useCallback(() => {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    if (frameRequestRef.current !== null) {
      window.cancelAnimationFrame(frameRequestRef.current);
      frameRequestRef.current = null;
    }

    const stream =
      streamRef.current ??
      (videoRef.current?.srcObject instanceof MediaStream ? videoRef.current.srcObject : null);
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setIsScanning(false);
    setTorchEnabled(false);
    setTorchSupported(false);
  }, []);

  const canFinalize = () => successLockRef.current === null;

  const finalizeScan = useCallback(
    (rawCode: string) => {
      if (!canFinalize()) {
        return;
      }

      const code = rawCode.replace(/\D/g, '');
      if (!EAN_REGEX.test(code)) {
        setStatus('notFound');
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
      stopCamera();

      window.setTimeout(() => {
        navigate(`/product/${code}`);
      }, SUCCESS_LOCK_MS);
    },
    [navigate, stopCamera]
  );

  const detectTorchSupport = useCallback(() => {
    const stream = streamRef.current;
    if (!stream) {
      setTorchSupported(false);
      return;
    }

    const [track] = stream.getVideoTracks();
    if (!track || typeof track.getCapabilities !== 'function') {
      setTorchSupported(false);
      return;
    }

    const capabilities = track.getCapabilities() as { torch?: boolean };
    setTorchSupported(Boolean(capabilities.torch));
  }, []);

  const createReader = useCallback(() => {
    const hints = new Map();
    hints.set(DecodeHintType.POSSIBLE_FORMATS, [
      BarcodeFormat.EAN_13,
      BarcodeFormat.EAN_8,
      BarcodeFormat.CODE_128,
      BarcodeFormat.UPC_A,
      BarcodeFormat.UPC_E,
    ]);
    hints.set(DecodeHintType.TRY_HARDER, true);

    const reader = new MultiFormatReader();
    reader.setHints(hints);
    return reader;
  }, []);

  const resetForNewScan = useCallback(() => {
    setLastDetectedCode(null);
    setStableCounter(0);
    setManualError(null);
    setSuccessOverlayVisible(false);
    if (status !== 'permissionDenied' && status !== 'cameraNotFound') {
      setStatus('idle');
    }
  }, [status]);

  const startCamera = useCallback(async () => {
    stopCamera();
    resetForNewScan();
    setManualInputVisible(false);

    if (!videoRef.current || !navigator.mediaDevices?.getUserMedia) {
      setStatus('cameraNotFound');
      return;
    }

    try {
      setStatus('scanning');
      setIsScanning(true);

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false,
      });
      streamRef.current = stream;

      videoRef.current.srcObject = stream;
      await videoRef.current.play();

      detectTorchSupport();

      if (!readerRef.current) {
        readerRef.current = createReader();
      }

      const scanFrame = () => {
        const video = videoRef.current;
        const reader = readerRef.current;

        if (!video || !reader || !streamRef.current || !canFinalize()) {
          return;
        }

        const width = video.videoWidth;
        const height = video.videoHeight;

        if (!width || !height) {
          frameRequestRef.current = window.requestAnimationFrame(scanFrame);
          return;
        }

        if (!canvasRef.current) {
          canvasRef.current = document.createElement('canvas');
        }

        const canvas = canvasRef.current;
        canvas.width = width;
        canvas.height = height;

        const context = canvas.getContext('2d', { willReadFrequently: true });
        if (!context) {
          setStatus('errorNetwork');
          setManualInputVisible(true);
          stopCamera();
          return;
        }

        context.drawImage(video, 0, 0, width, height);

        try {
          const luminanceSource = new HTMLCanvasElementLuminanceSource(canvas);
          const binaryBitmap = new BinaryBitmap(new HybridBinarizer(luminanceSource));
          const result = reader.decode(binaryBitmap);
          const text = result?.getText()?.trim();

          if (text) {
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
          }
        } catch (error) {
          if (!(error instanceof NotFoundException)) {
            setStatus('errorNetwork');
            setManualInputVisible(true);
            stopCamera();
            return;
          }
        }

        frameRequestRef.current = window.requestAnimationFrame(scanFrame);
      };

      frameRequestRef.current = window.requestAnimationFrame(scanFrame);

      timeoutRef.current = window.setTimeout(() => {
        if (canFinalize()) {
          stopCamera();
          setStatus('notDetectedTimeout');
          setManualInputVisible(true);
        }
      }, SCAN_TIMEOUT_MS);
    } catch (error) {
      stopCamera();
      const message = error instanceof Error ? error.message : '';

      if (/permission|denied|notallowed/i.test(message)) {
        setStatus('permissionDenied');
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
  }, [createReader, detectTorchSupport, finalizeScan, resetForNewScan, stopCamera]);

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
    if (!torchSupported || !streamRef.current) {
      return;
    }

    const [track] = streamRef.current.getVideoTracks();
    if (!track) {
      return;
    }

    const nextState = !torchEnabled;
    await track.applyConstraints({ advanced: [{ torch: nextState }] });
    setTorchEnabled(nextState);
  }, [torchEnabled, torchSupported]);

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
            <p>Dernier code: {lastDetectedCode ?? '—'}</p>
            <p>Validation stable: {stableCounter}/2</p>
          </div>

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
              Aucun code détecté après 10 secondes. Vous pouvez saisir le code EAN.
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
