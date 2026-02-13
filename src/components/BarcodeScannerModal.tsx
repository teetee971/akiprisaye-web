import React, { useEffect, useMemo, useRef, useState } from 'react';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onDetected: (barcode: string) => void;
};

type BarcodeDetectorResult = {
  rawValue?: string;
};

type BarcodeDetectorLike = {
  detect: (source: HTMLVideoElement) => Promise<BarcodeDetectorResult[]>;
};

type BarcodeDetectorConstructor = new (options?: { formats?: string[] }) => BarcodeDetectorLike;

type CameraStatus =
  | 'idle'
  | 'requesting_permission'
  | 'initializing_video'
  | 'camera_ready'
  | 'permission_denied'
  | 'camera_unavailable'
  | 'error';

type DebugInfo = {
  permission: string;
  constraints: string;
  videoSize: string;
  readyState: number;
  isStreamActive: boolean;
  trackCount: number;
  trackSettings: string;
  frames: number;
};

declare global {
  interface Window {
    BarcodeDetector?: BarcodeDetectorConstructor;
  }
}

function isBarcodeDetectorSupported() {
  return typeof window !== 'undefined' && typeof window.BarcodeDetector === 'function';
}

function isAcceptedBarcodeFormat(code: string) {
  return /^\d{13}$/.test(code) || /^\d{8}$/.test(code);
}

function normalizeDetectedCode(rawValue: string | undefined) {
  return (rawValue ?? '').replace(/\s+/g, '').trim();
}

function getCameraErrorMessage(caughtError: unknown) {
  if (caughtError instanceof DOMException) {
    switch (caughtError.name) {
      case 'NotAllowedError':
      case 'SecurityError':
        return 'Accès caméra refusé. Autorise la caméra puis réessaie.';
      case 'NotFoundError':
        return 'Aucune caméra détectée sur cet appareil.';
      case 'NotReadableError':
        return 'Caméra indisponible (déjà utilisée par une autre application).';
      case 'OverconstrainedError':
        return 'Caméra incompatible avec les contraintes demandées. Réessaie.';
      default:
        return 'Impossible d’accéder à la caméra.';
    }
  }

  if (caughtError instanceof Error && caughtError.message) {
    return caughtError.message;
  }

  return 'Impossible d’accéder à la caméra.';
}

export const BarcodeScannerModal: React.FC<Props> = ({ isOpen, onClose, onDetected }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const startingRef = useRef(false);
  const retryCountRef = useRef(0);
  const detectedCodeLockRef = useRef<string | null>(null);
  const debugFramesRef = useRef(0);

  const [error, setError] = useState<string | null>(null);
  const [supported, setSupported] = useState(false);
  const [cameraStatus, setCameraStatus] = useState<CameraStatus>('idle');
  const [debugInfo, setDebugInfo] = useState<DebugInfo>({
    permission: 'unknown',
    constraints: 'n/a',
    videoSize: '0x0',
    readyState: 0,
    isStreamActive: false,
    trackCount: 0,
    trackSettings: 'n/a',
    frames: 0,
  });

  const scanDebug = useMemo(() => {
    if (typeof window === 'undefined') {
      return false;
    }

    return new URLSearchParams(window.location.search).has('scanDebug');
  }, []);

  useEffect(() => {
    setSupported(isBarcodeDetectorSupported());
  }, []);

  const logDebug = (...args: unknown[]) => {
    if (scanDebug) {
      console.log('[scanDebug]', ...args);
    }
  };

  const updateDebugInfo = (patch: Partial<DebugInfo>) => {
    if (!scanDebug) {
      return;
    }

    setDebugInfo((current) => ({ ...current, ...patch }));
  };

  function stopCamera() {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    const video = videoRef.current;
    if (video) {
      video.pause();
      video.srcObject = null;
      video.onloadedmetadata = null;
    }

    startingRef.current = false;
    retryCountRef.current = 0;
    detectedCodeLockRef.current = null;
    debugFramesRef.current = 0;

    updateDebugInfo({
      isStreamActive: false,
      trackCount: 0,
      videoSize: '0x0',
      readyState: 0,
      frames: 0,
      trackSettings: 'n/a',
      constraints: 'n/a',
    });
  }

  async function playVideoWithRetry(video: HTMLVideoElement) {
    const maxAttempts = 2;

    while (retryCountRef.current < maxAttempts) {
      try {
        await video.play();
        return;
      } catch (playError) {
        retryCountRef.current += 1;
        logDebug('video.play failed', { attempt: retryCountRef.current, playError });

        if (retryCountRef.current >= maxAttempts) {
          throw playError;
        }

        await new Promise<void>((resolve) => {
          window.setTimeout(resolve, 120);
        });
      }
    }
  }

  async function startCamera() {
    if (startingRef.current) {
      logDebug('startCamera ignored: already starting');
      return;
    }

    startingRef.current = true;
    setError(null);
    setCameraStatus('requesting_permission');

    const constraints: MediaStreamConstraints = {
      video: {
        facingMode: { ideal: 'environment' },
        width: { ideal: 1280 },
        height: { ideal: 720 },
        frameRate: { ideal: 30, max: 60 },
      },
      audio: false,
    };

    updateDebugInfo({ constraints: JSON.stringify(constraints.video) });

    try {
      const mediaDevices = navigator.mediaDevices;
      if (!mediaDevices?.getUserMedia) {
        throw new Error('Caméra non supportée sur cet appareil.');
      }

      try {
        if (navigator.permissions?.query) {
          const permissionResult = await navigator.permissions.query({ name: 'camera' as PermissionName });
          updateDebugInfo({ permission: permissionResult.state });
        }
      } catch {
        updateDebugInfo({ permission: 'unsupported' });
      }

      const stream = await mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      updateDebugInfo({ isStreamActive: true, trackCount: stream.getTracks().length });

      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        updateDebugInfo({ trackSettings: JSON.stringify(videoTrack.getSettings()) });
      }

      const video = videoRef.current;
      if (!video) {
        throw new Error('Lecteur vidéo indisponible.');
      }

      setCameraStatus('initializing_video');
      video.srcObject = stream;
      video.setAttribute('playsinline', 'true');
      video.muted = true;
      video.autoplay = true;

      await new Promise<void>((resolve) => {
        video.onloadedmetadata = () => resolve();
      });

      await playVideoWithRetry(video);

      updateDebugInfo({
        videoSize: `${video.videoWidth}x${video.videoHeight}`,
        readyState: video.readyState,
      });

      if (!window.BarcodeDetector) {
        setError('Scan non supporté sur ce navigateur (BarcodeDetector indisponible).');
        setCameraStatus('error');
        return;
      }

      const detector = new window.BarcodeDetector({
        formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e'],
      });

      setCameraStatus('camera_ready');

      const loop = async () => {
        if (!videoRef.current) {
          return;
        }

        try {
          debugFramesRef.current += 1;
          if (scanDebug && debugFramesRef.current % 12 === 0) {
            updateDebugInfo({
              videoSize: `${videoRef.current.videoWidth}x${videoRef.current.videoHeight}`,
              readyState: videoRef.current.readyState,
              frames: debugFramesRef.current,
            });
          }

          const barcodes = await detector.detect(videoRef.current);
          if (barcodes.length > 0) {
            const normalized = normalizeDetectedCode(barcodes[0]?.rawValue);
            if (isAcceptedBarcodeFormat(normalized)) {
              if (detectedCodeLockRef.current === normalized) {
                rafRef.current = requestAnimationFrame(loop);
                return;
              }

              detectedCodeLockRef.current = normalized;
              onDetected(normalized);
              stopCamera();
              onClose();
              return;
            }

            logDebug('Ignored non EAN barcode', barcodes[0]?.rawValue);
          }
        } catch {
          // Ignore frame-level errors.
        }

        rafRef.current = requestAnimationFrame(loop);
      };

      rafRef.current = requestAnimationFrame(loop);
    } catch (caughtError) {
      const message = getCameraErrorMessage(caughtError);
      setError(message);

      if (caughtError instanceof DOMException) {
        if (caughtError.name === 'NotAllowedError' || caughtError.name === 'SecurityError') {
          setCameraStatus('permission_denied');
        } else if (
          caughtError.name === 'NotFoundError'
          || caughtError.name === 'NotReadableError'
          || caughtError.name === 'OverconstrainedError'
        ) {
          setCameraStatus('camera_unavailable');
        } else {
          setCameraStatus('error');
        }
      } else {
        setCameraStatus('error');
      }

      logDebug('startCamera error', caughtError);
      stopCamera();
    } finally {
      startingRef.current = false;
    }
  }

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setError(null);
      setCameraStatus('idle');
      return;
    }

    startCamera();

    return () => {
      stopCamera();
      setCameraStatus('idle');
    };
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-lg rounded-2xl bg-neutral-950 border border-neutral-800 overflow-hidden">
        <div className="p-4 flex items-center justify-between">
          <div>
            <div className="text-white font-semibold">Scanner un code-barres</div>
            <div className="text-xs text-neutral-400">
              Aligne le code-barres dans le cadre. Détection automatique.
            </div>
          </div>
          <button
            className="px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-white"
            onClick={() => {
              stopCamera();
              onClose();
            }}
            type="button"
          >
            Fermer
          </button>
        </div>

        <div className="relative bg-neutral-900">
          <video
            ref={videoRef}
            className="relative z-10 block w-full min-h-[320px] h-[360px] object-cover bg-neutral-900"
            playsInline
            muted
            autoPlay
          />
          {cameraStatus !== 'camera_ready' && (
            <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center bg-neutral-900/80">
              <div className="text-sm text-neutral-300 px-4 text-center">
                {cameraStatus === 'requesting_permission' && 'Demande d’accès caméra…'}
                {cameraStatus === 'initializing_video' && 'Initialisation du flux vidéo…'}
                {cameraStatus === 'permission_denied' && 'Permission refusée'}
                {cameraStatus === 'camera_unavailable' && 'Caméra indisponible'}
                {cameraStatus === 'error' && 'Erreur de caméra'}
                {cameraStatus === 'idle' && 'Préparation du scanner…'}
              </div>
            </div>
          )}
          <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center">
            <div className="w-[70%] h-[45%] border-2 border-white/60 rounded-xl" />
          </div>
        </div>

        <div className="p-4 space-y-2">
          {!supported && (
            <div className="text-sm text-yellow-300">
              Ton navigateur ne supporte pas le scan natif. Utilise la saisie manuelle du code-barres.
            </div>
          )}
          {error && <div className="text-sm text-red-400">{error}</div>}

          {scanDebug && (
            <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-3 text-xs text-neutral-300">
              <div className="font-semibold text-neutral-100 mb-2">Debug scanner (?scanDebug=1)</div>
              <ul className="space-y-1 font-mono">
                <li>permission: {debugInfo.permission}</li>
                <li>constraints: {debugInfo.constraints}</li>
                <li>video: {debugInfo.videoSize}</li>
                <li>readyState: {debugInfo.readyState}</li>
                <li>streamActive: {String(debugInfo.isStreamActive)}</li>
                <li>tracks: {debugInfo.trackCount}</li>
                <li>trackSettings: {debugInfo.trackSettings}</li>
                <li>frames: {debugInfo.frames}</li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export { isAcceptedBarcodeFormat, normalizeDetectedCode };
