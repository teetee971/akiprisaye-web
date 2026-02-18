<<<<<<< HEAD
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useRef } from 'react';
import { BrowserMultiFormatReader } from '@zxing/browser';
import uxMonitor from '../utils/uxMonitor';
import type { ScanState, ScannerOptions } from '../types/scan';
import { SCANNER_MESSAGES, type ScannerMessage } from '../constants/scannerMessages';
import { isAcceptedEanCode, normalizeDetectedCode } from '../utils/eanScan';
import { validateEan } from '../services/eanValidator';
import { startScan, type ScanController } from '../lib/barcodeEngine';
=======
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { validateEan } from '../services/eanValidator';
import { startScan, stop, setTorch, setZoom, type ScannerDebugInfo } from '../lib/barcodeEngine';
>>>>>>> b405bad7 (fix(frontend): use decodeFromStream to avoid camera stream conflicts)

interface BarcodeScannerProps {
  onScan: (code: string) => void;
  onClose: () => void;
}

<<<<<<< HEAD
export default function BarcodeScanner({ onScan, onClose, options = {} }: BarcodeScannerProps) {
  const isScanDebug = typeof window !== 'undefined' && ['scanDebug', 'debug'].some(
    (param) => new URLSearchParams(window.location.search).get(param) === '1',
  );

  // Scan state management
  const [scanState, setScanState] = useState<ScanState>('idle');

  // Legacy states (kept for backward compatibility)
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [manualInput, setManualInput] = useState('');
  const [torchSupported, setTorchSupported] = useState(false);
  const [torchEnabled, setTorchEnabled] = useState(false);
  const [zoomSupported, setZoomSupported] = useState(false);
  const [zoomValue, setZoomValue] = useState(1);
  const [zoomRange, setZoomRange] = useState<{ min: number; max: number; step: number } | null>(null);
  const [scanMode, setScanMode] = useState<'camera' | 'upload'>('camera');
  const [userMessage, setUserMessage] = useState<ScannerMessage | null>(null);

  // Scan feedback state
  const [scanFeedback, setScanFeedback] = useState<'searching' | 'focusing' | 'detecting' | null>(null);
  const [showNoResultFallback, setShowNoResultFallback] = useState(false);
  const [debugInfo, setDebugInfo] = useState({
    permission: 'unknown' as 'granted' | 'prompt' | 'denied' | 'unsupported' | 'unknown',
    selectedDeviceId: 'n/a',
    chosenDeviceId: 'n/a',
    chosenDeviceLabel: 'n/a',
    constraints: 'n/a',
    videoSize: '0x0',
    streamActive: false,
    scanEngine: 'n/a',
    playState: 'idle',
    framesReceived: 0,
    lastDetectedAt: 'never',
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'n/a',
    lastResult: 'none',
    lastError: 'none',
    cameraSettings: 'n/a',
    cameraCapabilities: 'n/a',
  });
=======
const EMPTY_DEBUG: ScannerDebugInfo = {
  engineUsed: 'idle',
  userAgent: '',
  barcodeDetectorSupported: false,
  fps: 0,
  framesProcessed: 0,
  roi: { x: 0, y: 0, w: 0, h: 0 },
  lastDetectedAt: null,
  lastCode: null,
  errors: null,
  settings: null,
  capabilities: null,
};
>>>>>>> b405bad7 (fix(frontend): use decodeFromStream to avoid camera stream conflicts)

export default function BarcodeScanner({ onScan, onClose }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
<<<<<<< HEAD
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanControllerRef = useRef<ScanController | null>(null);
  const activeTrackRef = useRef<any>(null);
  const scanStartTimeRef = useRef<number>(0);
  const timeoutRef = useRef<number | null>(null);
  const lastDetectedRef = useRef<{ code: string; timestamp: number } | null>(null);
  const lastDebugUpdateAtRef = useRef<number>(0);

  // Helpers to avoid stale state in async callbacks
  const scanStateRef = useRef<ScanState>('idle');
  useEffect(() => {
    scanStateRef.current = scanState;
  }, [scanState]);

  // Configuration with defaults
  const { timeout = 10000, enableDebugLogging = false, enableOcrFallback = true } = options;
  const debugEnabled = enableDebugLogging || isScanDebug;

  const updateDebugInfo = (patch: Partial<typeof debugInfo>) => {
    if (!debugEnabled) return;
    setDebugInfo((previous) => ({ ...previous, ...patch }));
  };

  const debugLog = (...args: unknown[]) => {
    if (debugEnabled) console.log('[SCAN_DEBUG]', ...args);
  };

  const transitionState = (to: ScanState, reason?: string) => {
    const from = scanStateRef.current;
    setScanState(to);
    if (debugEnabled) console.log(`[SCAN] State transition: ${from} → ${to}`, reason || '');
  };

  const checkCameraPermission = async (): Promise<'granted' | 'prompt' | 'denied' | 'unsupported'> => {
    try {
      if (typeof navigator === 'undefined' || !navigator.permissions || !navigator.permissions.query) {
        return 'unsupported';
      }
      const result = await navigator.permissions.query({ name: 'camera' as PermissionName });
      return result.state as 'granted' | 'prompt' | 'denied';
    } catch (err) {
      if (debugEnabled) console.log('[SCAN] Permissions API not available or error:', err);
      return 'unsupported';
    }
  };

  const activateImageUploadFallback = () => {
    setScanMode('upload');
    setUserMessage(SCANNER_MESSAGES.CAMERA_UNAVAILABLE);
    if (debugEnabled) console.log('[SCAN] Fallback activated: Switching to image upload mode');
  };

  const ensureVideoIsActuallyPlaying = async (videoElement: HTMLVideoElement) => {
    await new Promise((r) => setTimeout(r, 250));

    const isVideoReady = Boolean(videoElement.videoWidth && videoElement.videoHeight);
    const isPlaying = !videoElement.paused;

    updateDebugInfo({
      playState: isPlaying ? 'playing' : 'paused-after-play',
      videoSize: `${videoElement.videoWidth ?? 0}x${videoElement.videoHeight ?? 0}`,
    });

    if (!isVideoReady || !isPlaying) {
      if (debugEnabled) {
        console.warn('[SCAN] ⚠️ VIDEO_NOT_READY after play', {
          videoWidth: videoElement.videoWidth,
          videoHeight: videoElement.videoHeight,
          paused: videoElement.paused,
          readyState: videoElement.readyState,
        });
      }
      const videoNotReadyError = new Error('VIDEO_NOT_READY');
      videoNotReadyError.name = 'VIDEO_NOT_READY';
      throw videoNotReadyError;
    }
=======
  const scanHintTimerRef = useRef<number | null>(null);

  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState('');
  const [debugInfo, setDebugInfo] = useState<ScannerDebugInfo>(EMPTY_DEBUG);
  const [torchEnabled, setTorchEnabled] = useState(false);
  const [zoomValue, setZoomValue] = useState<number | null>(null);
  const [showManualHint, setShowManualHint] = useState(false);

  const showDebug = useMemo(() => {
    if (typeof window === 'undefined') return false;
    const params = new URLSearchParams(window.location.search);
    return params.get('debug') === '1' || params.get('scanDebug') === '1';
  }, []);

  const clearHintTimer = () => {
    if (scanHintTimerRef.current !== null) {
      window.clearTimeout(scanHintTimerRef.current);
      scanHintTimerRef.current = null;
    }
  };

  const stopCamera = async () => {
    clearHintTimer();
    await stop();
    setIsActive(false);
    setTorchEnabled(false);
    setShowManualHint(false);
>>>>>>> b405bad7 (fix(frontend): use decodeFromStream to avoid camera stream conflicts)
  };
  useEffect(() => {
<<<<<<< HEAD
    readerRef.current = new BrowserMultiFormatReader();
    setScanState('idle');

    return () => {
      const videoElement = videoRef.current;
      setIsScanning(false);

      if (scanControllerRef.current) {
        scanControllerRef.current.stop();
        scanControllerRef.current = null;
      }

      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      activeTrackRef.current = null;

      if (videoElement) {
        videoElement.onloadedmetadata = null;
        videoElement.onerror = null;
        videoElement.pause();
        videoElement.srcObject = null;
      }
    };
  }, []);

  const stopScanning = () => {
    setIsScanning(false);

    if (scanControllerRef.current) {
      scanControllerRef.current.stop();
      scanControllerRef.current = null;
    }

    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    activeTrackRef.current = null;

    updateDebugInfo({ streamActive: false });

    if (videoRef.current) {
      videoRef.current.onloadedmetadata = null;
      videoRef.current.onerror = null;
      videoRef.current.pause();
      videoRef.current.srcObject = null;
    }

    setTorchEnabled(false);
    setTorchSupported(false);
    setZoomSupported(false);
    setZoomRange(null);
    setScanFeedback(null);

    if (scanStateRef.current === 'scanning') transitionState('idle', 'Scanning stopped by user');
  };

  const startScanning = async () => {
    stopScanning();
    setError(null);
    setUserMessage(null);
    setIsScanning(true);
    setHasPermission(null);
    setScanMode('camera');
    setShowNoResultFallback(false);
    setScanFeedback('searching');
    scanStartTimeRef.current = Date.now();
    transitionState('scanning', 'User initiated scan');

    uxMonitor.scanStarted('barcode');

    const permission = await checkCameraPermission();
    uxMonitor.cameraPermissionRequested();

    updateDebugInfo({
      framesReceived: 0,
      videoSize: '0x0',
      playState: 'requesting',
      lastDetectedAt: 'never',
      scanEngine: 'initializing',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'n/a',
    });
    lastDebugUpdateAtRef.current = 0;

    if (debugEnabled) console.log('[SCAN] Camera permission state:', permission);
    updateDebugInfo({ permission });

    if (permission === 'granted' || permission === 'prompt' || permission === 'unsupported') {
      try {
        if (typeof navigator === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error('getUserMedia non disponible sur ce navigateur');
        }

        if (debugEnabled) console.log('[SCAN] 📷 Requesting camera access...');

        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 1280 },
            height: { ideal: 720 },
            frameRate: { ideal: 30 },
          },
          audio: false,
        });

        streamRef.current = stream;
        setHasPermission(true);
        updateDebugInfo({
          streamActive: true,
          constraints: JSON.stringify({
            facingMode: { ideal: 'environment' },
            width: { ideal: 1280 },
            height: { ideal: 720 },
            frameRate: { ideal: 30 },
          }),
        });

        if (videoRef.current) {
          const v = videoRef.current;
          v.srcObject = stream;
          v.setAttribute('playsinline', 'true');
          v.autoplay = true;
          v.muted = true;

          await new Promise<void>((resolve, reject) => {
            v.onloadedmetadata = () => resolve();
            v.onerror = () => reject(new Error('Erreur de chargement vidéo'));
          });

          await v.play().catch((e) => debugLog('video.play() failed', e));
          await ensureVideoIsActuallyPlaying(v);

          v.onloadedmetadata = null;
          v.onerror = null;
        }

        const track = stream.getVideoTracks()[0] ?? null;
        activeTrackRef.current = track;

        if (track) {
          const settings = track.getSettings();
          const capabilities = typeof track.getCapabilities === 'function' ? track.getCapabilities() : null;

          const hasTorch = Boolean(capabilities && 'torch' in capabilities && capabilities.torch);
          setTorchSupported(hasTorch);

          const zoomCaps = capabilities?.zoom;
          if (zoomCaps) {
            const min = zoomCaps.min ?? 1;
            const max = zoomCaps.max ?? Math.max(min, 1);
            const step = zoomCaps.step ?? 0.1;
            const initialZoom = Math.max(min, Math.min(max, settings.zoom ?? (min + max) / 2));
            setZoomSupported(true);
            setZoomRange({ min, max, step });
            setZoomValue(initialZoom);
            await track.applyConstraints({ advanced: [{ zoom: initialZoom }] as any });
          }

          updateDebugInfo({
            selectedDeviceId: settings.deviceId || 'unknown-device',
            cameraSettings: JSON.stringify(settings),
            cameraCapabilities: JSON.stringify(capabilities),
          });
        }

        if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current);
        timeoutRef.current = window.setTimeout(() => {
          setShowNoResultFallback(true);
          setUserMessage({
            type: 'warning',
            title: 'Toujours rien détecté',
            message:
              "Aucun code détecté après quelques secondes. Continuez le scan, saisissez le code manuellement, ou prenez une photo du code-barres.",
          });
          transitionState('scanning', `No result after ${timeout}ms - fallback suggested`);
        }, timeout);

        if (videoRef.current) {
          scanControllerRef.current = await startScan(
            videoRef.current,
            (rawValue) => {
              const now = Date.now();
              setScanFeedback('detecting');

              if (timeoutRef.current !== null) {
                window.clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
              }

              const code = normalizeDetectedCode(rawValue);
              const validation = validateEan(code);

              if (!validation.valid || !isAcceptedEanCode(validation.ean)) {
                if (debugEnabled) console.log('[SCAN] Ignored non-valid EAN code from camera:', code, validation);
                setScanFeedback('searching');
                return;
              }

              const lastSeen = lastDetectedRef.current;
              if (lastSeen?.code === validation.ean && now - lastSeen.timestamp <= 2000) {
                setUserMessage({
                  type: 'info',
                  title: 'Code confirmé',
                  message: `Deux lectures cohérentes en moins de 2s: ${validation.ean}`,
                });
              }
              lastDetectedRef.current = { code: validation.ean, timestamp: now };

              updateDebugInfo({
                lastResult: validation.ean,
                lastError: 'none',
                lastDetectedAt: new Date(now).toISOString(),
              });

              setShowNoResultFallback(false);
              transitionState('processing', `Barcode detected: ${validation.ean}`);
              uxMonitor.scanCompleted('barcode', true);
              stopScanning();
              onScan(validation.ean);
            },
            (debug) => {
              const now = Date.now();
              if (debug.framesProcessed > 8) setScanFeedback('focusing');
              if (now - lastDebugUpdateAtRef.current > 250) {
                updateDebugInfo({
                  scanEngine: debug.engine,
                  framesReceived: debug.framesProcessed,
                  videoSize: `${debug.videoWidth}x${debug.videoHeight}`,
                  playState: `readyState=${debug.readyState}`,
                  ...(debug.lastDetectedAt
                    ? { lastDetectedAt: new Date(debug.lastDetectedAt).toISOString() }
                    : {}),
                  ...(debug.error ? { lastError: debug.error } : {}),
                });
                lastDebugUpdateAtRef.current = now;
              }
            },
          );
        }

        return;
      } catch (err: unknown) {
        console.error('[SCAN] ❌ Camera error:', err);
        const mediaError = err as { name?: string; message?: string };

        if (mediaError?.name === 'NotAllowedError') {
          setError('Accès caméra refusé. Autorisez la caméra puis réessayez.');
        } else if (mediaError?.name === 'NotFoundError') {
          setError('Aucune caméra détectée sur cet appareil.');
        } else if (mediaError?.name === 'NotReadableError') {
          setError('Caméra indisponible (déjà utilisée par une autre application).');
        } else {
          setError('Caméra indisponible. Utilisez la photo du code-barres ou la saisie manuelle.');
        }

        debugLog('Camera startup failure details', mediaError?.name, mediaError?.message);
      }
    }

    if (debugEnabled) console.log('[SCAN] 🔄 Activating automatic fallback to image upload');

    setHasPermission(false);
    setIsScanning(false);
    setScanFeedback(null);
    activateImageUploadFallback();
    transitionState('idle', 'Camera unavailable - fallback to upload');
  };

  const retryCamera = () => {
    setScanMode('camera');
    setUserMessage(null);
    setError(null);
    setHasPermission(null);
    startScanning();
  };

  const toggleTorch = async () => {
    const track = activeTrackRef.current;
    if (!track || !torchSupported) return;

    try {
      await track.applyConstraints({
        advanced: [{ torch: !torchEnabled } as any],
      });
      setTorchEnabled(!torchEnabled);
    } catch (err) {
      console.error('[SCAN] Torch error:', err);
    }
  };

  const applyZoom = async (nextZoom: number) => {
    const track = activeTrackRef.current;
    if (!track || !zoomSupported || !zoomRange) return;

    const normalized = Math.max(zoomRange.min, Math.min(zoomRange.max, nextZoom));
    setZoomValue(normalized);

    try {
      await track.applyConstraints({
        advanced: [{ zoom: normalized } as any],
      });
      updateDebugInfo({ cameraSettings: JSON.stringify(track.getSettings()) });
    } catch (err) {
      console.error('[SCAN] Zoom error:', err);
    }
  };

  /**
   * Separate image pipeline with native barcode detection + OCR fallback
   */
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
=======
    return () => {
      clearHintTimer();
      void stop();
    };
  }, []);

  const handleScanResult = async (code: string) => {
    await stopCamera();
    onScan(code);
  };

  const handleActivateCamera = async () => {
    if (!videoRef.current) return;
>>>>>>> b405bad7 (fix(frontend): use decodeFromStream to avoid camera stream conflicts)

    setError(null);
    setDebugInfo(EMPTY_DEBUG);
    setShowManualHint(false);

    try {
      await startScan(videoRef.current, handleScanResult, setDebugInfo);
      setIsActive(true);
      clearHintTimer();
      scanHintTimerRef.current = window.setTimeout(() => {
        setShowManualHint(true);
      }, 10000);
    } catch (scanError) {
      setError(scanError instanceof Error ? scanError.message : 'Impossible de démarrer la caméra');
      setIsActive(false);
    }
  };

  const handleManualSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const value = manualCode.trim();
    if (!validateEan(value).valid) {
      setError('Code EAN invalide (longueur ou checksum).');
      return;
    }
    void stopCamera();
    onScan(value);
  };

  const handleTorchToggle = async () => {
    const ok = await setTorch(!torchEnabled);
    if (ok) setTorchEnabled((prev) => !prev);
  };

  const handleZoomChange = async (value: number) => {
    setZoomValue(value);
    await setZoom(value);
  };

  const handleCopyDebug = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(debugInfo, null, 2));
    } catch {
      setError('Impossible de copier le debug.');
    }
  };

  const capabilities = debugInfo.capabilities;
  const torchSupported = Boolean((capabilities as any)?.torch);
  const zoomCap = capabilities?.zoom;
  const zoomSupported = Boolean(zoomCap && typeof zoomCap.min === 'number' && typeof zoomCap.max === 'number');

  return (
    <div className="fixed inset-0 z-50 bg-black/90 p-4 overflow-y-auto">
      <div className="max-w-3xl mx-auto bg-slate-900 rounded-xl border border-slate-700 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">Scanner code-barres</h2>
          <button onClick={onClose} className="text-slate-300 hover:text-white">✕</button>
        </div>

        <div className="flex flex-wrap gap-2">
          <button onClick={handleActivateCamera} className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-500 text-white">
            Activer la caméra
          </button>
          <button onClick={stopCamera} className="px-4 py-2 rounded bg-red-700 hover:bg-red-600 text-white">
            Stop caméra
          </button>
          <button
            onClick={() => document.getElementById('manual-ean-input')?.focus()}
            className="px-4 py-2 rounded bg-slate-700 hover:bg-slate-600 text-white"
          >
            Saisir manuellement
          </button>
        </div>

        <p className="text-sm text-slate-200">Placez le code-barres dans le cadre.</p>

        <div className="relative aspect-[4/3] w-full rounded-lg overflow-hidden border border-slate-700 bg-black">
          <video ref={videoRef} className="absolute inset-0 h-full w-full object-cover" playsInline muted autoPlay />

<<<<<<< HEAD
              {/* Overlay must be transparent and non-blocking */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-0 flex items-center justify-center">
                  {/* Scan frame with dynamic border */}
                  <div
                    className={`relative border-2 w-64 h-32 rounded-lg shadow-lg transition-all ${
                      scanFeedback === 'searching'
                        ? 'border-blue-500 animate-pulse'
                        : scanFeedback === 'focusing'
                          ? 'border-yellow-500'
                          : scanFeedback === 'detecting'
                            ? 'border-green-500 scale-105'
                            : 'border-green-500'
                    }`}
                  >
                    <div
                      className={`absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 rounded-tl-lg transition-colors ${
                        scanFeedback === 'searching'
                          ? 'border-blue-500'
                          : scanFeedback === 'focusing'
                            ? 'border-yellow-500'
                            : 'border-green-500'
                      }`}
                    />
                    <div
                      className={`absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 rounded-tr-lg transition-colors ${
                        scanFeedback === 'searching'
                          ? 'border-blue-500'
                          : scanFeedback === 'focusing'
                            ? 'border-yellow-500'
                            : 'border-green-500'
                      }`}
                    />
                    <div
                      className={`absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 rounded-bl-lg transition-colors ${
                        scanFeedback === 'searching'
                          ? 'border-blue-500'
                          : scanFeedback === 'focusing'
                            ? 'border-yellow-500'
                            : 'border-green-500'
                      }`}
                    />
                    <div
                      className={`absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 rounded-br-lg transition-colors ${
                        scanFeedback === 'searching'
                          ? 'border-blue-500'
                          : scanFeedback === 'focusing'
                            ? 'border-yellow-500'
                            : 'border-green-500'
                      }`}
                    />
                  </div>
                </div>

                {/* Feedback message overlay */}
                {scanFeedback && (
                  <div
                    className={`absolute top-4 left-4 right-4 text-center px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                      scanFeedback === 'searching'
                        ? 'bg-blue-600/80 text-white'
                        : scanFeedback === 'focusing'
                          ? 'bg-yellow-600/80 text-white'
                          : 'bg-green-600/80 text-white'
                    }`}
                  >
                    {scanFeedback === 'searching' && '📷 Recherche de code-barres...'}
                    {scanFeedback === 'focusing' && '🎯 Cadre OK, stabilisez...'}
                    {scanFeedback === 'detecting' && '✓ Lecture en cours...'}
                  </div>
                )}
              </div>

              {zoomSupported && zoomRange && (
                <div className="absolute bottom-20 left-4 right-4 bg-slate-900/80 border border-slate-600 rounded-lg p-3 text-xs text-white">
                  <div className="flex items-center justify-between mb-2">
                    <span>Zoom</span>
                    <span>{zoomValue.toFixed(1)}x</span>
                  </div>
                  <input
                    type="range"
                    min={zoomRange.min}
                    max={zoomRange.max}
                    step={zoomRange.step}
                    value={zoomValue}
                    onChange={(e) => {
                      const next = Number(e.target.value);
                      setZoomValue(next);
                      void applyZoom(next);
                    }}
                    className="w-full"
                  />
                </div>
              )}

              {/* Torch button */}
              {torchSupported && (
                <button
                  onClick={toggleTorch}
                  className={`absolute bottom-4 right-4 p-3 rounded-full ${
                    torchEnabled ? 'bg-yellow-500' : 'bg-gray-700'
                  } text-white`}
                  aria-label="Lampe torche"
                >
                  {torchEnabled ? 'Torch OFF' : 'Torch ON'}
                </button>
              )}

              {/* Stop button */}
              <button
                onClick={stopScanning}
                className="absolute bottom-4 left-4 px-4 py-2 bg-red-600 text-white rounded-lg font-semibold"
              >
                Stop caméra
              </button>
            </div>
          )}

          {/* Instructions */}
          {!isScanning && !error && !userMessage && (
            <div className="bg-blue-900/20 border border-blue-700/30 rounded-lg p-4 text-sm text-blue-200">
              <p className="font-semibold mb-2">📋 Instructions :</p>
              <ul className="space-y-1 ml-4 list-disc">
                <li>Cliquez sur "Activer la caméra" pour démarrer le scan</li>
                <li>Autorisez l'accès à la caméra quand le navigateur le demande</li>
                <li>Positionnez le code-barres à 10-20 cm de la caméra</li>
                <li>Assurez-vous d'avoir un bon éclairage</li>
                <li>Maintenez le téléphone stable pendant 1-2 secondes</li>
              </ul>

              <div className="mt-3 pt-3 border-t border-blue-700/30">
                <p className="text-xs text-blue-300">
                  <strong>⚠️ Important :</strong> La caméra nécessite HTTPS ou localhost. Si vous voyez "getUserMedia non
                  disponible", utilisez l'import d'image.
                </p>
              </div>
            </div>
          )}

          {/* User Message (Fallback Info) */}
          {userMessage && (
=======
          {(showDebug || isActive) && (
>>>>>>> b405bad7 (fix(frontend): use decodeFromStream to avoid camera stream conflicts)
            <div
              className={`absolute border-2 ${showDebug ? 'border-amber-400' : 'border-white/60'}`}
              style={{ left: '20%', top: '33%', width: '60%', height: '34%' }}
            />
          )}

<<<<<<< HEAD
          {/* Permission denied help */}
          {hasPermission === false && !userMessage && (
            <div className="bg-yellow-900/20 border border-yellow-700/30 rounded-lg p-4 text-sm text-yellow-200">
              <p className="font-semibold mb-2">🔐 Comment autoriser l'accès à la caméra ?</p>
              <ul className="space-y-2 ml-4 list-disc">
                <li>
                  <strong>Chrome/Edge :</strong> Cliquez sur l'icône 🔒 ou ℹ️ dans la barre d'adresse → Paramètres du site
                  → Caméra → Autoriser
                </li>
                <li>
                  <strong>Safari (iOS) :</strong> Réglages → Safari → Caméra → Autoriser
                </li>
                <li>
                  <strong>Firefox :</strong> Cliquez sur l'icône 🔒 → Autorisations → Caméra → Autoriser
                </li>
              </ul>
              <p className="mt-3 text-xs">Une fois l'autorisation donnée, rechargez la page et réessayez.</p>
            </div>
          )}

          {/* Error message */}
          {error && <div className="bg-red-900/20 border border-red-700/30 rounded-lg p-4 text-red-200">{error}</div>}

          {isScanning && showNoResultFallback && (
            <div className="bg-amber-900/30 border border-amber-600/40 rounded-lg p-4 text-amber-100 text-sm space-y-3">
              <p className="font-semibold">⏱️ Astuce rapide</p>
              <p className="mt-1">
                Continuez à viser le code au centre, ou utilisez immédiatement la photo du code-barres / la saisie manuelle ci-dessous.
              </p>
              <label className="block">
                <div className="px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold text-center cursor-pointer transition-colors">
                  📸 Prendre une photo du code-barres
                </div>
                <input type="file" accept="image/*" capture="environment" onChange={handleImageUpload} className="hidden" />
              </label>
            </div>
          )}

          {/* Camera scan button */}
          {!isScanning && scanMode === 'camera' && !userMessage && (
            <button
              onClick={startScanning}
              className="w-full px-6 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-lg transition-colors"
            >
              📷 Activer la caméra
            </button>
          )}

          <button
            onClick={() => document.getElementById('manual-entry')?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
            className="w-full px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-semibold transition-colors"
          >
            ✍️ Saisir manuellement
          </button>

          {/* Fallback mode buttons */}
          {scanMode === 'upload' && userMessage && (
            <div className="space-y-3">
              <label className="block w-full">
                <div className="px-6 py-4 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold text-lg text-center cursor-pointer transition-colors">
                  🖼️ Prendre une photo du code-barres
                </div>
                <input type="file" accept="image/*" capture="environment" onChange={handleImageUpload} className="hidden" />
              </label>

              <button
                onClick={retryCamera}
                className="w-full px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-semibold transition-colors"
              >
                🔄 Réessayer la caméra
              </button>
            </div>
          )}

          {/* Image upload (always available) */}
          {!userMessage && (
            <div>
              <label className="block w-full">
                <div className="px-6 py-4 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold text-center cursor-pointer transition-colors">
                  🖼️ Prendre une photo du code-barres
                </div>
                <input type="file" accept="image/*" capture="environment" onChange={handleImageUpload} className="hidden" />
              </label>
            </div>
          )}

          {/* Manual input */}
          <div className="border-t border-slate-700 pt-4">
            <p id="manual-entry" className="text-gray-400 text-sm mb-3">Ou saisir manuellement :</p>
            <form onSubmit={handleManualSubmit} className="flex gap-2">
              <input
                type="text"
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value.replace(/\D/g, ''))}
                placeholder="Code EAN (8-13 chiffres)"
                className="flex-1 bg-slate-800 text-white border border-slate-600 px-4 py-3 rounded-lg focus:outline-none focus:border-blue-500"
                maxLength={13}
              />
              <button
                type="submit"
                disabled={manualInput.length < 8}
                className="px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition-colors"
              >
                ✓
              </button>
            </form>
          </div>

          {isScanDebug && (
            <div className="border-t border-slate-700 pt-4 text-xs text-slate-200 space-y-2">
              <p className="font-semibold text-amber-300">🧪 Debug scanner (?debug=1 ou ?scanDebug=1)</p>
              <ul className="space-y-1 font-mono bg-slate-950/80 border border-slate-700 rounded p-3">
                <li>userAgent: {debugInfo.userAgent}</li>
                <li>permission: {debugInfo.permission}</li>
                <li>engine: {debugInfo.scanEngine}</li>
                <li>deviceId (track): {debugInfo.selectedDeviceId}</li>
                <li>constraints: {debugInfo.constraints}</li>
                <li>video: {debugInfo.videoSize}</li>
                <li>streamActive: {String(debugInfo.streamActive)}</li>
                <li>play: {debugInfo.playState}</li>
                <li>frames: {debugInfo.framesReceived}</li>
                <li>lastDetectedAt: {debugInfo.lastDetectedAt}</li>
                <li>lastResult: {debugInfo.lastResult}</li>
                <li>lastError: {debugInfo.lastError}</li>
                <li>settings: {debugInfo.cameraSettings}</li>
                <li>capabilities: {debugInfo.cameraCapabilities}</li>
              </ul>
              <p className="text-slate-400">
                Test rapide: autoriser la caméra, vérifier que video {'>'} 0x0, puis essayer aussi l’import d’image (ex:
                EAN 3292090000016).
              </p>
            </div>
          )}
=======
          {!isActive && <div className="absolute inset-0 grid place-items-center text-slate-400">Caméra inactive</div>}
>>>>>>> b405bad7 (fix(frontend): use decodeFromStream to avoid camera stream conflicts)
        </div>

        {showManualHint && isActive && (
          <div className="rounded border border-amber-500/40 bg-amber-900/20 p-3 text-sm text-amber-200">
            Aucun code détecté pour l’instant. Améliorez la netteté, rapprochez le code ou activez la torche. Le scan continue.
          </div>
        )}

        {(torchSupported || zoomSupported) && (
          <div className="flex flex-wrap items-center gap-4">
            {torchSupported && (
              <button
                onClick={handleTorchToggle}
                className={`px-3 py-2 rounded text-white ${torchEnabled ? 'bg-amber-500' : 'bg-slate-700 hover:bg-slate-600'}`}
              >
                {torchEnabled ? 'Torch ON' : 'Torch OFF'}
              </button>
            )}

            {zoomSupported && zoomCap && (
              <label className="text-sm text-slate-200 flex items-center gap-2">
                Zoom
                <input
                  type="range"
                  min={zoomCap.min}
                  max={zoomCap.max}
                  step={zoomCap.step || 0.1}
                  value={zoomValue ?? debugInfo.settings?.zoom ?? zoomCap.min}
                  onChange={(event) => {
                    void handleZoomChange(Number(event.target.value));
                  }}
                />
              </label>
            )}
          </div>
        )}

        {error && <div className="rounded border border-red-500/40 bg-red-900/20 p-3 text-sm text-red-200">{error}</div>}

        <form onSubmit={handleManualSubmit} className="flex gap-2 border-t border-slate-700 pt-4">
          <input
            id="manual-ean-input"
            type="text"
            value={manualCode}
            onChange={(event) => setManualCode(event.target.value.replace(/\D/g, '').slice(0, 13))}
            placeholder="Code EAN"
            className="flex-1 rounded border border-slate-600 bg-slate-950 px-3 py-2 text-white"
          />
          <button type="submit" className="px-4 py-2 rounded bg-green-600 text-white font-semibold">
            Valider
          </button>
        </form>

        {showDebug && (
          <div className="space-y-2 rounded border border-slate-700 bg-slate-950 p-3 text-xs text-slate-200 font-mono">
            <div>engineUsed: {debugInfo.engineUsed}</div>
            <div>fps: {debugInfo.fps}</div>
            <div>
              roi: {'{'}x:{debugInfo.roi.x}, y:{debugInfo.roi.y}, w:{debugInfo.roi.w}, h:{debugInfo.roi.h}{'}'}
            </div>
            <div>lastDetectedAt: {debugInfo.lastDetectedAt ?? 'n/a'}</div>
            <div>lastCode: {debugInfo.lastCode ?? 'n/a'}</div>
            <div>errors: {debugInfo.errors ?? 'none'}</div>
            <div>frames: {debugInfo.framesProcessed}</div>
            <div>BarcodeDetector: {String(debugInfo.barcodeDetectorSupported)}</div>
            <div>userAgent: {debugInfo.userAgent}</div>
            <button onClick={handleCopyDebug} className="mt-1 px-2 py-1 rounded bg-slate-700 hover:bg-slate-600 text-white">
              Copy debug
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
