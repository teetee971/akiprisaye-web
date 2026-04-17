// src/hooks/useEANScanner.ts
// Hook pour gérer le scan EAN via caméra (avec fallback manuel)

import { useCallback, useEffect, useRef, useState } from 'react';

export type ScannerState = {
  isScanning: boolean;
  hasPermission: boolean | null;
  error: string | null;
  detectedEAN: string | null;
};

export function useEANScanner() {
  const [state, setState] = useState<ScannerState>({
    isScanning: false,
    hasPermission: null,
    error: null,
    detectedEAN: null,
  });

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const stopScanning = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setState((prev) => ({ ...prev, isScanning: false }));
  }, []);

  const startScanning = useCallback(async () => {
    setState((prev) => ({ ...prev, isScanning: true, error: null, detectedEAN: null }));

    try {
      // Request camera access
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }, // Prefer back camera on mobile
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setState((prev) => ({ ...prev, hasPermission: true }));

      // Note: Real barcode scanning would require a library like @zxing/library
      // For now, this is a placeholder for the scanning logic
      // The actual implementation should use BarcodeDetector API or a library
    } catch (error) {
      const errorMessage =
        error instanceof Error && error.name === 'NotAllowedError'
          ? 'Autorisation caméra refusée. Veuillez utiliser la saisie manuelle.'
          : "Impossible d'accéder à la caméra. Veuillez utiliser la saisie manuelle.";

      setState((prev) => ({
        ...prev,
        isScanning: false,
        hasPermission: false,
        error: errorMessage,
      }));
    }
  }, []);

  const setDetectedEAN = useCallback(
    (ean: string) => {
      setState((prev) => ({ ...prev, detectedEAN: ean }));
      stopScanning();
    },
    [stopScanning]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopScanning();
    };
  }, [stopScanning]);

  return {
    ...state,
    videoRef,
    startScanning,
    stopScanning,
    setDetectedEAN,
  } as const;
}
