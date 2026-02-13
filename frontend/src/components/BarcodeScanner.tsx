/* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useRef } from 'react';
import { BrowserMultiFormatReader, NotFoundException } from '@zxing/library';
import uxMonitor from '../utils/uxMonitor';
import type { ScanState, ScannerOptions } from '../types/scan';
import { SCANNER_MESSAGES, type ScannerMessage } from '../constants/scannerMessages';
import { isAcceptedEanCode, normalizeDetectedCode } from '../utils/eanScan';

interface BarcodeScannerProps {
  onScan: (code: string) => void;
  onClose: () => void;
  options?: ScannerOptions;
}

export default function BarcodeScanner({ onScan, onClose, options = {} }: BarcodeScannerProps) {
  const isScanDebug =
    typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('scanDebug') === '1';

  // Scan state management
  const [scanState, setScanState] = useState<ScanState>('idle');

  // Legacy states (kept for backward compatibility)
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [manualInput, setManualInput] = useState('');
  const [torchSupported, setTorchSupported] = useState(false);
  const [torchEnabled, setTorchEnabled] = useState(false);
  const [scanMode, setScanMode] = useState<'camera' | 'upload'>('camera');
  const [userMessage, setUserMessage] = useState<ScannerMessage | null>(null);

  // Scan feedback state
  const [scanFeedback, setScanFeedback] = useState<'searching' | 'focusing' | 'detecting' | null>(null);
  const [debugInfo, setDebugInfo] = useState({
    permission: 'unknown' as 'granted' | 'prompt' | 'denied' | 'unsupported' | 'unknown',
    selectedDeviceId: 'n/a',
    chosenDeviceId: 'n/a',
    chosenDeviceLabel: 'n/a',
    constraints: 'n/a',
    videoSize: '0x0',
    playState: 'idle',
    framesReceived: 0,
  });

  const videoRef = useRef<HTMLVideoElement>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanStartTimeRef = useRef<number>(0);
  const timeoutRef = useRef<number | null>(null);
  const debugFrameCounterRef = useRef<number>(0);
  const debugIntervalRef = useRef<number | null>(null);

  // Helpers to avoid stale state in async callbacks
  const scanStateRef = useRef<ScanState>('idle');
  useEffect(() => {
    scanStateRef.current = scanState;
  }, [scanState]);

  // Configuration with defaults
  const { timeout = 15000, enableDebugLogging = false, enableOcrFallback = true } = options;
  const debugEnabled = enableDebugLogging || isScanDebug;

  const updateDebugInfo = (patch: Partial<typeof debugInfo>) => {
    if (!debugEnabled) return;
    setDebugInfo((previous) => ({ ...previous, ...patch }));
  };

  const debugLog = (...args: unknown[]) => {
    if (debugEnabled) console.log('[SCAN_DEBUG]', ...args);
  };

  // State transition handler with logging
  const transitionState = (to: ScanState, reason?: string) => {
    const from = scanStateRef.current;
    setScanState(to);
    if (debugEnabled) console.log(`[SCAN] State transition: ${from} → ${to}`, reason || '');
  };

  // Check camera permission state using Permissions API
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

  // Activate fallback to image upload mode
  const activateImageUploadFallback = () => {
    setScanMode('upload');
    setUserMessage(SCANNER_MESSAGES.CAMERA_UNAVAILABLE);
    if (debugEnabled) console.log('[SCAN] Fallback activated: Switching to image upload mode');
  };

  const stopStreamTracks = (stream: MediaStream | null | undefined) => {
    if (!stream) return;
    stream.getTracks().forEach((track) => track.stop());
  };

  const pickBestVideoDeviceId = async (): Promise<{ deviceId: string; label?: string } | null> => {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.enumerateDevices) {
      return null;
    }

    const devices = await navigator.mediaDevices.enumerateDevices();
    const videoInputs = devices.filter((device) => device.kind === 'videoinput');

    if (!videoInputs.length) return null;

    const rearCamera = videoInputs.find((device) => /(back|rear|environment)/i.test(device.label));
    const picked = rearCamera ?? videoInputs[videoInputs.length - 1];

    return {
      deviceId: picked.deviceId,
      label: picked.label || undefined,
    };
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
  };

  useEffect(() => {
    readerRef.current = new BrowserMultiFormatReader();
    setScanState('idle');

    return () => {
      const videoElement = videoRef.current;

      setIsScanning(false);

      if (readerRef.current) readerRef.current.reset();

      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      if (debugIntervalRef.current !== null) {
        window.clearInterval(debugIntervalRef.current);
        debugIntervalRef.current = null;
      }

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }

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

    if (readerRef.current) readerRef.current.reset();

    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    if (debugIntervalRef.current !== null) {
      window.clearInterval(debugIntervalRef.current);
      debugIntervalRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.onloadedmetadata = null;
      videoRef.current.onerror = null;
      videoRef.current.pause();
      videoRef.current.srcObject = null;
    }

    debugFrameCounterRef.current = 0;
    setTorchEnabled(false);
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
    setScanFeedback('searching');
    scanStartTimeRef.current = Date.now();
    transitionState('scanning', 'User initiated scan');

    uxMonitor.scanStarted('barcode');

    const permission = await checkCameraPermission();
    uxMonitor.cameraPermissionRequested();

    updateDebugInfo({ framesReceived: 0, videoSize: '0x0', playState: 'requesting' });
    if (debugEnabled) console.log('[SCAN] Camera permission state:', permission);
    updateDebugInfo({ permission });

    if (permission === 'granted' || permission === 'prompt' || permission === 'unsupported') {
      try {
        if (typeof navigator === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error('getUserMedia non disponible sur ce navigateur');
        }

        if (debugEnabled) console.log('[SCAN] 📷 Requesting camera access...');

        const requestCameraStream = async () => {
          // IMPORTANT: last-resort constraints include ideal width/height removed (some devices fail on them)
          const constraintSets: MediaStreamConstraints[] = [
            {
              video: {
                facingMode: { ideal: 'environment' },
                width: { ideal: 1280 },
                height: { ideal: 720 },
              },
            },
            { video: { facingMode: { ideal: 'environment' } } },
            // some Android devices need this to avoid black preview
            { video: { facingMode: 'environment' as any } },
            { video: true },
          ];

          let lastError: unknown = null;
          let stream: MediaStream | null = null;

          for (const constraints of constraintSets) {
            try {
              if (debugEnabled) console.log('[SCAN] 📷 Trying constraints:', constraints);
              stream = await navigator.mediaDevices.getUserMedia(constraints);
              updateDebugInfo({ constraints: JSON.stringify((constraints as any).video ?? constraints) });
              return stream;
            } catch (constraintError) {
              stopStreamTracks(stream);
              stream = null;
              lastError = constraintError;
              if (debugEnabled) console.log('[SCAN] ⚠️ Constraint failed, trying fallback:', constraintError);
            }
          }

          const pickedDevice = await pickBestVideoDeviceId();
          if (pickedDevice?.deviceId) {
            updateDebugInfo({
              chosenDeviceId: pickedDevice.deviceId,
              chosenDeviceLabel: pickedDevice.label || 'unknown-label',
            });

            const byDeviceConstraints: MediaStreamConstraints[] = [
              {
                video: {
                  deviceId: { exact: pickedDevice.deviceId },
                  width: { ideal: 1280 },
                  height: { ideal: 720 },
                },
              },
              { video: { deviceId: { exact: pickedDevice.deviceId } } },
            ];

            for (const constraints of byDeviceConstraints) {
              try {
                if (debugEnabled) {
                  console.log('[SCAN] Retrying with exact deviceId ...', pickedDevice.deviceId, constraints);
                }
                stream = await navigator.mediaDevices.getUserMedia(constraints);
                updateDebugInfo({ constraints: JSON.stringify((constraints as any).video ?? constraints) });
                return stream;
              } catch (deviceIdError) {
                stopStreamTracks(stream);
                stream = null;
                lastError = deviceIdError;
                if (debugEnabled) console.log('[SCAN] ⚠️ deviceId exact failed:', deviceIdError);
              }
            }
          }

          throw lastError ?? new Error('Aucune contrainte caméra compatible');
        };

        let stream = await requestCameraStream();

        if (debugEnabled) console.log('[SCAN] ✅ Camera access granted');
        streamRef.current = stream;
        setHasPermission(true);

        // Attach stream to video
        if (videoRef.current) {
          const v = videoRef.current;

          v.srcObject = stream;
          v.setAttribute('playsinline', 'true');
          v.autoplay = true;
          v.muted = true;

          // Wait metadata
          await new Promise<void>((resolve, reject) => {
            v.onloadedmetadata = () => {
              if (debugEnabled) console.log('[SCAN] 📹 Video metadata loaded');
              updateDebugInfo({
                videoSize: `${v.videoWidth ?? 0}x${v.videoHeight ?? 0}`,
                playState: 'metadata-ready',
              });
              resolve();
            };
            v.onerror = () => {
              console.error('[SCAN] ❌ Video error');
              updateDebugInfo({ playState: 'video-error' });
              reject(new Error('Erreur de chargement vidéo'));
            };
          });

          // Force play (mobile Safari/Chrome policies)
          await v.play().catch((e) => {
            debugLog('video.play() failed', e);
            // continue; decoding may still work in some cases
          });

          try {
            await ensureVideoIsActuallyPlaying(v);
          } catch (videoError) {
            const streamError = videoError as { name?: string; message?: string };
            if (streamError?.name !== 'VIDEO_NOT_READY' && streamError?.message !== 'VIDEO_NOT_READY') {
              throw videoError;
            }

            stopStreamTracks(streamRef.current);
            streamRef.current = null;

            const pickedDevice = await pickBestVideoDeviceId();
            if (!pickedDevice?.deviceId) {
              throw videoError;
            }

            updateDebugInfo({
              chosenDeviceId: pickedDevice.deviceId,
              chosenDeviceLabel: pickedDevice.label || 'unknown-label',
            });

            const retryConstraints: MediaStreamConstraints[] = [
              {
                video: {
                  deviceId: { exact: pickedDevice.deviceId },
                  width: { ideal: 1280 },
                  height: { ideal: 720 },
                },
              },
              { video: { deviceId: { exact: pickedDevice.deviceId } } },
            ];

            let retryStream: MediaStream | null = null;
            let retryError: unknown = videoError;

            for (const constraints of retryConstraints) {
              try {
                if (debugEnabled) {
                  console.log('[SCAN] Retrying with exact deviceId ...', pickedDevice.deviceId, constraints);
                }
                retryStream = await navigator.mediaDevices.getUserMedia(constraints);
                updateDebugInfo({ constraints: JSON.stringify((constraints as any).video ?? constraints) });
                break;
              } catch (getUserMediaError) {
                stopStreamTracks(retryStream);
                retryStream = null;
                retryError = getUserMediaError;
              }
            }

            if (!retryStream) throw retryError;

            stream = retryStream;
            streamRef.current = retryStream;
            v.srcObject = retryStream;
            await v.play().catch((e) => {
              debugLog('video.play() failed after deviceId fallback', e);
            });
            await ensureVideoIsActuallyPlaying(v);
          }

          // clean handlers (we keep playback)
          v.onloadedmetadata = null;
          v.onerror = null;

          if (debugEnabled) console.log('[SCAN] ▶️ Video playing');
        }

        // Torch capability
        const track = stream.getVideoTracks()[0];
        if (track) {
          const capabilities = track.getCapabilities() as any;
          if (debugEnabled) console.log('[SCAN] 📱 Camera capabilities:', capabilities);
          if ('torch' in capabilities) {
            setTorchSupported(true);
            if (debugEnabled) console.log('[SCAN] 🔦 Torch supported');
          }
          const settings = track.getSettings();
          updateDebugInfo({ selectedDeviceId: settings.deviceId || 'unknown-device' });
          debugLog('Track settings', settings);
        } else if (debugEnabled) {
          console.log('[SCAN] ⚠️ No video track available to check torch support');
        }

        // Timeout
        if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current);
        timeoutRef.current = window.setTimeout(() => {
          console.warn('[SCAN] ⏱️ Scan timeout');
          setError('⏱️ Timeout: Approchez le code-barres de la caméra (10-20 cm)');
          transitionState('error', `Timeout after ${timeout}ms`);
          uxMonitor.scanCompleted('barcode', false);
        }, timeout);

        if (debugEnabled) console.log('[SCAN] 🔍 Starting barcode detection...');

        // Debug heartbeat
        if (debugEnabled) {
          if (debugIntervalRef.current !== null) window.clearInterval(debugIntervalRef.current);
          debugIntervalRef.current = window.setInterval(() => {
            const v = videoRef.current;
            updateDebugInfo({
              framesReceived: debugFrameCounterRef.current,
              videoSize: `${v?.videoWidth ?? 0}x${v?.videoHeight ?? 0}`,
              playState: v ? `${v.paused ? 'paused' : 'playing'} / ${v.readyState}` : 'no-video',
            });
          }, 500);
        }

        // Decode
        if (readerRef.current && videoRef.current) {
          // small UX improvement: after some frames, switch to focusing
          let firstFramesAt: number | null = null;

          readerRef.current.decodeFromStream(stream, videoRef.current, (result, err) => {
            debugFrameCounterRef.current += 1;

            if (firstFramesAt === null && debugFrameCounterRef.current > 10) {
              firstFramesAt = Date.now();
              setScanFeedback('focusing');
            }

            if (result) {
              setScanFeedback('detecting');

              if (timeoutRef.current !== null) {
                window.clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
              }

              const code = normalizeDetectedCode(result.getText());
              const duration = Date.now() - scanStartTimeRef.current;

              if (!isAcceptedEanCode(code)) {
                if (debugEnabled) console.log('[SCAN] Ignored non-EAN code from camera:', code);
                // keep searching
                setScanFeedback('searching');
                return;
              }

              if (debugEnabled) console.log(`[SCAN] ✅ Barcode detected in ${duration}ms:`, code);

              transitionState('processing', `Barcode detected: ${code}`);
              uxMonitor.scanCompleted('barcode', true);
              stopScanning();
              onScan(code);
              return;
            }

            if (err && !(err instanceof NotFoundException)) {
              console.error('[SCAN] Scan error:', err);
            }

            // if nothing found, keep searching state
            if (!result) setScanFeedback('searching');
          });
        }

        return; // Camera path success
      } catch (err: unknown) {
        console.error('[SCAN] ❌ Camera error:', err);
        const mediaError = err as { name?: string; message?: string };

        if (mediaError?.name === 'NotAllowedError') {
          setError('Accès caméra refusé. Autorisez la caméra puis réessayez.');
        } else if (mediaError?.name === 'NotFoundError') {
          setError('Aucune caméra détectée sur cet appareil.');
        } else if (mediaError?.name === 'NotReadableError') {
          setError('Caméra indisponible (déjà utilisée par une autre application).');
        } else if (mediaError?.name === 'OverconstrainedError') {
          setError('Contraintes caméra non compatibles. Nouvelle tentative avec réglages simplifiés.');
        } else {
          setError('Caméra indisponible. Utilisez l’import d’image ou la saisie manuelle.');
        }

        debugLog('Camera startup failure details', mediaError?.name, mediaError?.message);
        // fall through to fallback
      }
    }

    // Fallback
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
    if (!streamRef.current || !torchSupported) return;
    try {
      const track = streamRef.current.getVideoTracks()[0];
      await track.applyConstraints({
        advanced: [{ torch: !torchEnabled } as any],
      });
      setTorchEnabled(!torchEnabled);
    } catch (err) {
      console.error('[SCAN] Torch error:', err);
    }
  };

  /**
   * Separate image pipeline with native barcode detection + OCR fallback
   */
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setIsScanning(true);
    setUserMessage({
      type: 'info',
      title: 'Traitement en cours',
      message: "Analyse de l'image...",
    });
    transitionState('processing', 'Processing uploaded image');

    let ean: string | null = null;
    let detectionMethod: 'native' | 'zxing' | 'ocr' | null = null;

    try {
      const img = new Image();
      const imageUrl = URL.createObjectURL(file);
      img.src = imageUrl;

      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('Failed to load image'));
      });

      await img.decode();

      if (enableDebugLogging) console.log('[SCAN] 📷 Image loaded successfully');

      // Native BarcodeDetector
      if ('BarcodeDetector' in window) {
        try {
          if (enableDebugLogging) console.log('[SCAN] 🔍 Attempting native BarcodeDetector...');

          setUserMessage({
            type: 'info',
            title: 'Détection native en cours',
            message: 'Utilisation du détecteur natif du navigateur...',
          });

          const detector = new (window as any).BarcodeDetector({
            formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e'],
          });
          const codes = await detector.detect(img);

          if (codes.length > 0) {
            ean = codes[0].rawValue;
            detectionMethod = 'native';
            if (enableDebugLogging) console.log('[SCAN] ✅ Barcode detected with BarcodeDetector:', ean);
          } else if (enableDebugLogging) {
            console.log('[SCAN] ℹ️ BarcodeDetector found no codes, trying ZXing...');
          }
        } catch (detErr) {
          if (enableDebugLogging) console.log('[SCAN] BarcodeDetector failed, will try other methods:', detErr);
        }
      } else if (enableDebugLogging) {
        console.log('[SCAN] ℹ️ Native BarcodeDetector not available, using ZXing');
      }

      // ZXing
      if (!ean && readerRef.current) {
        try {
          if (enableDebugLogging) console.log('[SCAN] 🔍 Attempting ZXing barcode detection...');

          setUserMessage({
            type: 'info',
            title: 'Détection ZXing en cours',
            message: 'Analyse avec bibliothèque ZXing...',
          });

          const result = await readerRef.current.decodeFromImageUrl(imageUrl);
          ean = result.getText();
          detectionMethod = 'zxing';
          if (enableDebugLogging) console.log('[SCAN] ✅ Barcode detected with ZXing:', ean);
        } catch (zErr) {
          if (enableDebugLogging) console.log('[SCAN] ZXing detection failed, will try OCR:', zErr);
        }
      }

      // OCR fallback
      if (!ean && enableOcrFallback) {
        if (enableDebugLogging) console.log('[SCAN] 📝 Starting OCR fallback with Tesseract.js...');

        setUserMessage({
          type: 'info',
          title: 'Détection OCR en cours',
          message: "Recherche du code dans l'image...",
        });

        try {
          const Tesseract = await import('tesseract.js');
          const { data } = await Tesseract.recognize(img, 'eng');

          if (enableDebugLogging) console.log('[SCAN] OCR raw text:', data.text);

          const match = data.text.match(/\b\d{13}\b|\b\d{8}\b/);
          if (match) {
            ean = match[0];
            detectionMethod = 'ocr';
            if (enableDebugLogging) console.log('[SCAN] ✅ EAN detected via OCR:', ean);
          } else if (enableDebugLogging) {
            console.log('[SCAN] ⚠️ No EAN pattern found in OCR text');
          }
        } catch (ocrErr) {
          console.error('[SCAN] OCR error:', ocrErr);
          if (enableDebugLogging) console.log('[SCAN] ⚠️ OCR fallback failed, will prompt for manual entry');
        }
      } else if (!ean && !enableOcrFallback && enableDebugLogging) {
        console.log('[SCAN] ℹ️ OCR fallback is disabled - skipping OCR detection');
      }

      URL.revokeObjectURL(imageUrl);
      setIsScanning(false);

      if (ean) {
        const normalizedEan = normalizeDetectedCode(ean);
        if (!isAcceptedEanCode(normalizedEan)) {
          setUserMessage({
            type: 'warning',
            title: 'Code non supporté',
            message: 'Le scan a détecté un code, mais ce n’est pas un EAN-8/EAN-13 valide.',
          });
          transitionState('idle', 'Unsupported barcode format from image');
          uxMonitor.scanCompleted('barcode', false);
          return;
        }

        const methodName =
          detectionMethod === 'native'
            ? 'détecteur natif'
            : detectionMethod === 'zxing'
              ? 'bibliothèque ZXing'
              : detectionMethod === 'ocr'
                ? 'OCR Tesseract'
                : 'méthode inconnue';

        setUserMessage({
          type: 'info',
          title: 'Code détecté',
          message: `✅ Code détecté avec ${methodName}: ${normalizedEan}`,
        });

        if (enableDebugLogging) console.log('[SCAN] ✅ Final EAN to process:', ean, 'via', detectionMethod);

        transitionState('processing', `Barcode from image: ${ean}`);

        setTimeout(() => setUserMessage(null), 2000);

        uxMonitor.scanCompleted('barcode', true);

        try {
          onScan(normalizedEan);
        } catch (cbErr) {
          console.error('[SCAN] Error in onScan callback:', cbErr);
          setError('Erreur lors du traitement du code détecté');
          uxMonitor.scanCompleted('barcode', false);
        }
      } else {
        setError('❌ Aucun code détecté automatiquement');
        setUserMessage({
          type: 'warning',
          title: 'Code non détecté',
          message:
            "❌ Aucun code détecté automatiquement. 💡 Conseils : assurez-vous que le code-barres est bien visible, net et bien éclairé. Vous pouvez aussi saisir le code manuellement ci-dessous.",
        });
        transitionState('error', 'No barcode found in image');

        if (enableDebugLogging) {
          console.log('[SCAN] ⚠️ Detection summary:');
          console.log('  - Native BarcodeDetector:', 'BarcodeDetector' in window ? 'tried but no result' : 'not available');
          console.log('  - ZXing detection: tried but no result');
          console.log('  - OCR fallback:', enableOcrFallback ? 'tried but no EAN pattern found' : 'disabled');
        }

        uxMonitor.scanCompleted('barcode', false);
      }
    } catch (err: any) {
      console.error('[SCAN] Image processing error:', err);
      setError("❌ Erreur lors du traitement de l'image");
      setUserMessage({
        type: 'error',
        title: 'Erreur',
        message: 'Une erreur est survenue lors du traitement de l’image. Essayez la saisie manuelle.',
      });
      setIsScanning(false);
      transitionState('error', 'Image processing failed');
      uxMonitor.scanCompleted('barcode', false);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedManualInput = normalizeDetectedCode(manualInput);
    if (isAcceptedEanCode(normalizedManualInput)) {
      if (debugEnabled) console.log('[SCAN] Manual input submitted:', normalizedManualInput);
      transitionState('processing', `Manual input: ${normalizedManualInput}`);
      uxMonitor.scanCompleted('barcode', true);
      onScan(normalizedManualInput);
      setManualInput('');
      return;
    }
    setError('Veuillez saisir un code EAN-8 ou EAN-13 valide.');
    uxMonitor.scanCompleted('barcode', false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
      <div className="bg-slate-900 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <h2 className="text-xl font-bold text-white">📷 Scanner Code-Barres</h2>
          <button
            onClick={() => {
              stopScanning();
              onClose();
            }}
            className="text-gray-400 hover:text-white text-2xl"
            aria-label="Fermer"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Scanning indicator with state */}
          {isScanning && scanState === 'scanning' && (
            <div className="bg-blue-900/20 border border-blue-700/30 rounded-lg p-3 text-center">
              <div className="inline-flex items-center gap-2 text-blue-200 text-sm">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400"></div>
                <span>Scan en cours... État: {scanState}</span>
              </div>
            </div>
          )}

          {/* Video Preview (FIXED: ensures video is actually visible; overlays cannot hide it) */}
          {isScanning && hasPermission && (
            <div className="relative w-full max-w-2xl mx-auto aspect-[4/3] rounded-lg overflow-hidden bg-black">
              <video
                ref={videoRef}
                className="absolute inset-0 w-full h-full object-cover"
                playsInline
                muted
                autoPlay
              />

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

              {/* Torch button */}
              {torchSupported && (
                <button
                  onClick={toggleTorch}
                  className={`absolute bottom-4 right-4 p-3 rounded-full ${
                    torchEnabled ? 'bg-yellow-500' : 'bg-gray-700'
                  } text-white`}
                  aria-label="Lampe torche"
                >
                  {torchEnabled ? '🔦' : '💡'}
                </button>
              )}

              {/* Stop button */}
              <button
                onClick={stopScanning}
                className="absolute bottom-4 left-4 px-4 py-2 bg-red-600 text-white rounded-lg font-semibold"
              >
                Arrêter
              </button>
            </div>
          )}

          {/* Instructions */}
          {!isScanning && !error && !userMessage && (
            <div className="bg-blue-900/20 border border-blue-700/30 rounded-lg p-4 text-sm text-blue-200">
              <p className="font-semibold mb-2">📋 Instructions :</p>
              <ul className="space-y-1 ml-4 list-disc">
                <li>Cliquez sur "Scanner avec la caméra" pour activer la caméra</li>
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
            <div
              className={`rounded-lg p-4 text-sm ${
                userMessage.type === 'info'
                  ? 'bg-blue-900/20 border border-blue-700/30 text-blue-200'
                  : userMessage.type === 'warning'
                    ? 'bg-yellow-900/20 border border-yellow-700/30 text-yellow-200'
                    : 'bg-red-900/20 border border-red-700/30 text-red-200'
              }`}
            >
              <p className="font-semibold mb-2">📷 {userMessage.title}</p>
              <p>{userMessage.message}</p>

              <div className="mt-3 pt-3 border-t border-current/30">
                <p className="text-xs opacity-80">
                  💡 <strong>Astuce :</strong> Vous pouvez également utiliser la saisie manuelle en bas de page.
                </p>
              </div>
            </div>
          )}

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

          {/* Camera scan button */}
          {!isScanning && scanMode === 'camera' && !userMessage && (
            <button
              onClick={startScanning}
              className="w-full px-6 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-lg transition-colors"
            >
              📷 Scanner avec la caméra
            </button>
          )}

          {/* Fallback mode buttons */}
          {scanMode === 'upload' && userMessage && (
            <div className="space-y-3">
              <label className="block w-full">
                <div className="px-6 py-4 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold text-lg text-center cursor-pointer transition-colors">
                  🖼️ Importer une image
                </div>
                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
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
                  🖼️ Importer une image
                </div>
                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
              </label>
            </div>
          )}

          {/* Manual input */}
          <div className="border-t border-slate-700 pt-4">
            <p className="text-gray-400 text-sm mb-3">Ou saisir manuellement :</p>
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
              <p className="font-semibold text-amber-300">🧪 Debug scanner (?scanDebug=1)</p>
              <ul className="space-y-1 font-mono bg-slate-950/80 border border-slate-700 rounded p-3">
                <li>permission: {debugInfo.permission}</li>
                <li>deviceId (track): {debugInfo.selectedDeviceId}</li>
                <li>deviceId (chosen): {debugInfo.chosenDeviceId}</li>
                <li>device label: {debugInfo.chosenDeviceLabel}</li>
                <li>constraints: {debugInfo.constraints}</li>
                <li>video: {debugInfo.videoSize}</li>
                <li>play: {debugInfo.playState}</li>
                <li>frames: {debugInfo.framesReceived}</li>
              </ul>
              <p className="text-slate-400">
                Test rapide: autoriser la caméra, vérifier que video {'>'} 0x0, puis essayer aussi l’import d’image (ex:
                EAN 3292090000016).
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
