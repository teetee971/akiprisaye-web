import { useCallback, useEffect, useRef, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { BrowserMultiFormatReader } from '@zxing/browser';
import { useLocation, useNavigate } from 'react-router-dom';
import { pickBestBackCameraDeviceId } from '../utils/cameraUtils';

type ScanStatus =
  | 'idle'
  | 'permissionDenied'
  | 'cameraNotFound'
  | 'scanning'
  | 'notDetectedTimeout'
  | 'success'
  | 'errorNetwork'
  | 'notFound'
  | 'invalidBarcode';

type ScannerControls = {
  stop: () => void;
  switchTorch?: (on: boolean) => Promise<void>;
};

const EAN13_REGEX = /^\d{13}$/;
const EAN8_REGEX = /^\d{8}$/;
const UPC_A_REGEX = /^\d{12}$/;
const GTIN14_REGEX = /^\d{14}$/;
const SCAN_TIMEOUT_MS = 10_000;
const SUCCESS_LOCK_MS = 1_500;
const UI_COOLDOWN_MS = 1_500;

function hasValidCheckDigit(code: string): boolean {
  if (!/^\d+$/.test(code) || code.length < 8) {
    return false;
  }

  const digits = code.split('').map(Number);
  const checkDigit = digits.pop() as number;
  const weightedSum = digits
    .slice()
    .reverse()
    .reduce((accumulator, digit, index) => {
      return accumulator + digit * (index % 2 === 0 ? 3 : 1);
    }, 0);
  const computed = (10 - (weightedSum % 10)) % 10;

  return computed === checkDigit;
}

function normalizeAndValidateGtin(rawCode: string): string | null {
  const code = rawCode.replace(/\D/g, '');

  if (EAN8_REGEX.test(code) || UPC_A_REGEX.test(code) || EAN13_REGEX.test(code) || GTIN14_REGEX.test(code)) {
    return hasValidCheckDigit(code) ? code : null;
  }

  return null;
}

export default function ScannerHub() {
  const navigate = useNavigate();
  const location = useLocation();
  const debugEnabled = new URLSearchParams(location.search).get('debug') === '1';

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const controlsRef = useRef<ScannerControls | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timeoutRef = useRef<number | null>(null);
  const successLockRef = useRef<number | null>(null);
  const cameraRetryTimeoutRef = useRef<number | null>(null);
  const detectionCountRef = useRef(0);
  const resultCountRef = useRef(0);
  const lastAcceptedDetectionAtRef = useRef(0);
  const lastDetectionTimestampsRef = useRef<Record<string, number>>({});
  const startingRef = useRef(false);
  const lastUiEmitRef = useRef<{ code: string; at: number } | null>(null);

  const [status, setStatus] = useState<ScanStatus>('idle');
  const [lastDetectedCode, setLastDetectedCode] = useState<string | null>(null);
  const [lastRawDetectedCode, setLastRawDetectedCode] = useState<string | null>(null);
  const [stableCounter, setStableCounter] = useState(0);
  const [resultCount, setResultCount] = useState(0);
  const [manualInputVisible, setManualInputVisible] = useState(false);
  const [manualEAN, setManualEAN] = useState('');
  const [manualError, setManualError] = useState<string | null>(null);
  const [torchSupported, setTorchSupported] = useState(false);
  const [torchEnabled, setTorchEnabled] = useState(false);
  const [successOverlayVisible, setSuccessOverlayVisible] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('fallback');
  const [zoomApplied, setZoomApplied] = useState(false);
  const [zoomValue, setZoomValue] = useState<number | null>(null);
  const [cameraInputsDebug, setCameraInputsDebug] = useState<string[]>([]);
  const barcodeSupport = typeof window !== 'undefined' && 'BarcodeDetector' in window;

  const stopCamera = useCallback(() => {
    controlsRef.current?.stop();
    controlsRef.current = null;

    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    if (cameraRetryTimeoutRef.current !== null) {
      window.clearTimeout(cameraRetryTimeoutRef.current);
      cameraRetryTimeoutRef.current = null;
    }

    const stream = streamRef.current ?? (videoRef.current?.srcObject instanceof MediaStream ? videoRef.current.srcObject : null);
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

  const scheduleNotDetectedTimeout = useCallback(() => {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = window.setTimeout(() => {
      if (successLockRef.current === null && resultCountRef.current === 0) {
        setStatus('notDetectedTimeout');
        setManualInputVisible(true);
      }
    }, SCAN_TIMEOUT_MS);
  }, []);

  const finalizeScan = useCallback(
    (rawCode: string) => {
      if (!canFinalize()) {
        return;
      }

      const code = normalizeAndValidateGtin(rawCode);
      if (!code) {
        setStatus('invalidBarcode');
        setManualInputVisible(true);
        setManualError('Code-barres invalide (8/12/13/14 chiffres + check digit).');
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

  const resetForNewScan = useCallback(() => {
    setLastDetectedCode(null);
    setLastRawDetectedCode(null);
    setStableCounter(0);
    setResultCount(0);
    resultCountRef.current = 0;
    detectionCountRef.current = 0;
    lastAcceptedDetectionAtRef.current = 0;
    lastDetectionTimestampsRef.current = {};
    setSelectedDeviceId('fallback');
    setZoomApplied(false);
    setZoomValue(null);
    setCameraInputsDebug([]);
    lastUiEmitRef.current = null;
    setManualError(null);
    setSuccessOverlayVisible(false);
    if (status !== 'permissionDenied' && status !== 'cameraNotFound') {
      setStatus('idle');
    }
  }, [status]);

  const startCamera = useCallback(async () => {
    if (startingRef.current || isScanning) {
      return;
    }

    startingRef.current = true;
    setIsStarting(true);

    stopCamera();
    resetForNewScan();
    setManualInputVisible(false);

    if (!videoRef.current || !navigator.mediaDevices?.getUserMedia) {
      setStatus('cameraNotFound');
      startingRef.current = false;
      setIsStarting(false);
      return;
    }

    try {
      if (!readerRef.current) {
        readerRef.current = new BrowserMultiFormatReader();
      }

      setStatus('scanning');
      setIsScanning(true);

      const cameraSelection = await pickBestBackCameraDeviceId();
      const reversedDeviceIds = cameraSelection.videoInputs.map((device) => device.deviceId).reverse();
      const cameraAttemptIds = cameraSelection.selectedDeviceId
        ? [cameraSelection.selectedDeviceId, ...reversedDeviceIds.filter((deviceId) => deviceId !== cameraSelection.selectedDeviceId)]
        : reversedDeviceIds;

      setCameraInputsDebug(
        cameraSelection.videoInputs.map((device) => `${device.label || '(label indisponible)'} [${device.deviceId}]`)
      );

      const runAttempt = async (attemptIndex: number): Promise<void> => {
        if (!videoRef.current || !readerRef.current) {
          return;
        }

        const attemptDeviceId = cameraAttemptIds[attemptIndex] ?? null;
        const videoConstraints = attemptDeviceId
          ? {
              deviceId: { exact: attemptDeviceId },
              width: { ideal: 1280 },
              height: { ideal: 720 },
            }
          : {
              facingMode: { ideal: 'environment' as const },
              width: { ideal: 1280 },
              height: { ideal: 720 },
            };

        setSelectedDeviceId(attemptDeviceId ?? 'fallback');

        if (debugEnabled) {
          console.info('[ScannerHub][debug] Démarrage scan', {
            selectedDeviceId: attemptDeviceId ?? 'fallback',
            tryingDeviceIndex: attemptIndex,
            videoInputs: cameraSelection.videoInputs.map((device) => device.label || '(label indisponible)'),
            constraints: videoConstraints,
          });
        }

        const controls = await readerRef.current.decodeFromConstraints(
          {
            video: videoConstraints,
            audio: false,
          },
          videoRef.current,
          (result) => {
            const text = result?.getText()?.trim();
            if (!text) {
              return;
            }

            setLastRawDetectedCode(text);

            const code = normalizeAndValidateGtin(text);
            if (!code) {
              return;
            }

            const now = Date.now();
            const lastSameCodeAt = lastDetectionTimestampsRef.current[code] ?? 0;
            if (now - lastSameCodeAt < 500) {
              return;
            }

            if (now - lastAcceptedDetectionAtRef.current < 700) {
              return;
            }

            lastDetectionTimestampsRef.current[code] = now;
            lastAcceptedDetectionAtRef.current = now;

            detectionCountRef.current += 1;
            resultCountRef.current += 1;
            setResultCount(resultCountRef.current);
            setManualInputVisible(false);
            scheduleNotDetectedTimeout();

            setLastDetectedCode((previousCode) => {
              if (previousCode === code) {
                setStableCounter((previousCounter) => {
                  return previousCounter + 1;
                });
                return previousCode;
              }

              setStableCounter(1);
              return code;
            });

            const lastUiEmit = lastUiEmitRef.current;
            if (!lastUiEmit || lastUiEmit.code !== code || now - lastUiEmit.at >= UI_COOLDOWN_MS) {
              lastUiEmitRef.current = { code, at: now };

              if (debugEnabled) {
                console.info('[ScannerHub][debug] Détection valide', { code });
              }
            }

            setStatus('scanning');
          }
        );

        controlsRef.current = controls as ScannerControls;

        const media = videoRef.current.srcObject;
        if (media instanceof MediaStream) {
          streamRef.current = media;
          detectTorchSupport();

          const [track] = media.getVideoTracks();
          if (track && typeof track.getCapabilities === 'function') {
            const capabilities = track.getCapabilities() as MediaTrackCapabilities & {
              zoom?: { min?: number; max?: number };
              torch?: boolean;
            };

            let applied = false;
            let appliedZoomValue: number | null = null;
            const zoomCapabilities = capabilities.zoom;
            if (zoomCapabilities && typeof track.applyConstraints === 'function') {
              const minZoom = typeof zoomCapabilities.min === 'number' ? zoomCapabilities.min : 1;
              const maxZoom = typeof zoomCapabilities.max === 'number' ? zoomCapabilities.max : 2;
              const targetZoom = Math.max(minZoom, Math.min(maxZoom, 2));

              try {
                await track.applyConstraints({ advanced: [{ zoom: targetZoom }] });
                applied = true;
                appliedZoomValue = targetZoom;
              } catch {
                applied = false;
                appliedZoomValue = null;
              }
            }

            setZoomApplied(applied);
            setZoomValue(appliedZoomValue);

            if (debugEnabled) {
              console.info('[ScannerHub][debug] Capacités caméra', {
                zoom: zoomCapabilities,
                torch: capabilities.torch,
                zoomApplied: applied,
                zoomValue: appliedZoomValue,
              });
            }
          } else {
            setZoomApplied(false);
            setZoomValue(null);
          }
        }

        scheduleNotDetectedTimeout();

        if (cameraAttemptIds.length > 1 && attemptIndex < cameraAttemptIds.length - 1) {
          if (cameraRetryTimeoutRef.current !== null) {
            window.clearTimeout(cameraRetryTimeoutRef.current);
          }

          cameraRetryTimeoutRef.current = window.setTimeout(async () => {
            if (detectionCountRef.current > 0 || successLockRef.current !== null) {
              return;
            }

            if (debugEnabled) {
              console.info('[ScannerHub][debug] Aucun résultat, tentative caméra suivante', {
                nextDeviceIndex: attemptIndex + 1,
                nextDeviceId: cameraAttemptIds[attemptIndex + 1],
              });
            }

            stopCamera();
            setStatus('scanning');
            setIsScanning(true);

            try {
              await runAttempt(attemptIndex + 1);
            } catch {
              setStatus('cameraNotFound');
              setManualInputVisible(true);
            }
          }, 2_500);
        }
      };

      await runAttempt(0);
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
    } finally {
      startingRef.current = false;
      setIsStarting(false);
    }
  }, [debugEnabled, detectTorchSupport, isScanning, resetForNewScan, scheduleNotDetectedTimeout, stopCamera]);

  useEffect(() => {
    if (!isScanning || !lastDetectedCode || stableCounter < 2) {
      return;
    }

    finalizeScan(lastDetectedCode);
  }, [finalizeScan, isScanning, lastDetectedCode, stableCounter]);

  useEffect(() => {
    if (!debugEnabled) {
      return;
    }

    console.info('[ScannerHub][debug] État scanner', {
      barcodeSupport,
      cameraError: status,
      scanActive: isScanning,
      lastSeen: lastDetectedCode,
      lastRawDetectedCode,
      resultCount,
      selectedDeviceId,
      zoomApplied,
      zoomValue,
    });
  }, [
    barcodeSupport,
    debugEnabled,
    isScanning,
    lastDetectedCode,
    lastRawDetectedCode,
    resultCount,
    selectedDeviceId,
    status,
    zoomApplied,
    zoomValue,
  ]);

  const handleManualSearch = useCallback(() => {
    const normalized = normalizeAndValidateGtin(manualEAN);

    if (!normalized) {
      setManualError('Code-barres invalide (8/12/13/14 chiffres + check digit).');
      return;
    }

    setManualError(null);
    finalizeScan(normalized);
  }, [finalizeScan, manualEAN]);

  const toggleTorch = useCallback(async () => {
    const controls = controlsRef.current;
    if (!controls || typeof controls.switchTorch !== 'function' || !torchSupported) {
      return;
    }

    const nextState = !torchEnabled;
    await controls.switchTorch(nextState);
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
              disabled={isScanning || isStarting}
              className={`rounded-lg px-5 py-3 text-base font-semibold text-white ${isScanning || isStarting ? 'bg-slate-600' : 'bg-blue-600 hover:bg-blue-700'}`}
            >
              Activer la caméra
            </button>

            <button
              type="button"
              onClick={stopCamera}
              className="rounded-lg border border-red-500 px-5 py-3 text-base font-semibold text-red-100"
            >
              Stop caméra
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

          {debugEnabled && (
            <div className="mt-4 rounded-xl border border-cyan-700 bg-cyan-950/30 p-3 text-sm text-cyan-100">
              <h2 className="mb-2 text-base font-semibold">Debug</h2>
              <ul className="space-y-1">
                <li>barcodeSupport: {String(barcodeSupport)}</li>
                <li>cameraError: {status}</li>
                <li>scanActive: {String(isScanning)}</li>
                <li>lastSeen: {lastDetectedCode ?? '—'}</li>
                <li>dernier raw détecté: {lastRawDetectedCode ?? '—'}</li>
                <li>results: {resultCount}</li>
                <li>selectedDeviceId: {selectedDeviceId}</li>
                <li>zoomApplied: {String(zoomApplied)}{zoomValue !== null ? ` (${zoomValue}x)` : ''}</li>
                <li>videoInputs: {cameraInputsDebug.length}</li>
                <li>videoInputsLabels: {cameraInputsDebug.slice(0, 3).join(' | ') || '—'}</li>
              </ul>
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
              Aucun code détecté après 10 secondes. Vous pouvez saisir le code EAN.
            </p>
          )}

          {(status === 'errorNetwork' || status === 'notFound') && (
            <p className="mt-3 rounded-lg border border-red-700 bg-red-500/10 p-3 text-sm text-red-200">
              Erreur pendant le scan. Passez par la saisie manuelle.
            </p>
          )}


          {status === 'invalidBarcode' && (
            <p className="mt-3 rounded-lg border border-amber-700 bg-amber-500/10 p-3 text-sm text-amber-200">
              Code-barres invalide. Vérifiez les chiffres et le check digit, ou ressaisissez le code manuellement.
            </p>
          )}

          {manualInputVisible && (
            <div className="mt-4 rounded-xl border border-slate-700 p-3">
              <label htmlFor="manual-ean" className="mb-2 block text-sm font-medium">
                Code EAN (8, 12, 13 ou 14 chiffres)
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
