import React, { useEffect, useRef, useState } from 'react';

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

declare global {
  interface Window {
    BarcodeDetector?: BarcodeDetectorConstructor;
  }
}

function isBarcodeDetectorSupported() {
  return typeof window !== 'undefined' && typeof window.BarcodeDetector === 'function';
}

export const BarcodeScannerModal: React.FC<Props> = ({ isOpen, onClose, onDetected }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [supported, setSupported] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setSupported(isBarcodeDetectorSupported());
  }, []);

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
      video.srcObject = null;
    }
  }

  async function startCamera() {
    setError(null);
    setBusy(true);

    try {
      const mediaDevices = navigator.mediaDevices;
      if (!mediaDevices?.getUserMedia) {
        throw new Error('Caméra non supportée sur cet appareil.');
      }

      const stream = await mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false,
      });

      streamRef.current = stream;

      const video = videoRef.current;
      if (!video) {
        throw new Error('Lecteur vidéo indisponible.');
      }

      video.srcObject = stream;
      await video.play();

      if (!window.BarcodeDetector) {
        setError('Scan non supporté sur ce navigateur (BarcodeDetector indisponible).');
        return;
      }

      const detector = new window.BarcodeDetector({
        formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'qr_code'],
      });

      const loop = async () => {
        if (!videoRef.current) {
          return;
        }

        try {
          const barcodes = await detector.detect(videoRef.current);
          if (barcodes.length > 0) {
            const rawValue = barcodes[0]?.rawValue;
            if (rawValue) {
              onDetected(rawValue);
              stopCamera();
              onClose();
              return;
            }
          }
        } catch {
          // Ignore frame-level errors
        }

        rafRef.current = requestAnimationFrame(loop);
      };

      rafRef.current = requestAnimationFrame(loop);
    } catch (caughtError) {
      const message = caughtError instanceof Error
        ? caughtError.message
        : 'Impossible d’accéder à la caméra.';
      setError(message);
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setError(null);
      return;
    }

    startCamera();

    return () => {
      stopCamera();
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

        <div className="relative">
          <video ref={videoRef} className="w-full h-[360px] object-cover bg-black" playsInline muted />
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="w-[70%] h-[45%] border-2 border-white/60 rounded-xl" />
          </div>
        </div>

        <div className="p-4">
          {!supported && (
            <div className="text-sm text-yellow-300">
              Ton navigateur ne supporte pas le scan natif. Utilise la saisie manuelle du code-barres.
            </div>
          )}
          {busy && <div className="text-sm text-neutral-400">Initialisation caméra…</div>}
          {error && <div className="text-sm text-red-400">{error}</div>}
        </div>
      </div>
    </div>
  );
};
