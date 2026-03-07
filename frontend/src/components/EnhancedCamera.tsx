/* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any */
/**
 * Enhanced Camera Component - v1.0.0
 * 
 * Composant caméra amélioré avec:
 * - Guide visuel intelligent en temps réel
 * - Feedback haptique et audio
 * - Contrôles de flash et zoom
 * - Analyse de qualité d'image
 */

import React, { useRef, useEffect, useState } from 'react';
import { Camera, Zap, ZapOff, ZoomIn, ZoomOut, RotateCcw, AlertCircle } from 'lucide-react';
import { useCameraQualityAnalyzer, type QualityTip } from '../utils/cameraQualityAnalyzer';
import { useFeedback } from '../services/feedbackService';

interface EnhancedCameraProps {
  onCapture: (imageData: string) => void;
  onClose?: () => void;
  enableQualityAnalysis?: boolean;
  enableFeedback?: boolean;
}

export default function EnhancedCamera({
  onCapture,
  onClose,
  enableQualityAnalysis = true,
  enableFeedback = true,
}: EnhancedCameraProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [flashEnabled, setFlashEnabled] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [showTips, setShowTips] = useState(true);
  
  // Services
  const { quality, tips } = useCameraQualityAnalyzer(
    videoRef,
    enableQualityAnalysis ? 1000 : 0
  );
  const feedback = useFeedback();

  /**
   * Démarre la caméra
   */
  const startCamera = async () => {
    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setIsActive(true);
      setError(null);

      if (enableFeedback) {
        feedback.onClick();
      }
    } catch (err) {
      console.error('Camera error:', err);
      setError('Impossible d\'accéder à la caméra. Vérifiez les permissions.');
      
      if (enableFeedback) {
        feedback.onError();
      }
    }
  };

  /**
   * Arrête la caméra
   */
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsActive(false);
  };

  /**
   * Active/désactive la torche
   */
  const toggleFlash = async () => {
    if (!streamRef.current) return;

    const track = streamRef.current.getVideoTracks()[0];
    const capabilities = track.getCapabilities() as any;

    if (capabilities.torch) {
      try {
        await track.applyConstraints({
          advanced: [{ torch: !flashEnabled } as any],
        });
        setFlashEnabled(!flashEnabled);
        
        if (enableFeedback) {
          feedback.onClick();
        }
      } catch (err) {
        console.error('Flash error:', err);
      }
    } else {
      setError('Flash non disponible sur cet appareil');
    }
  };

  /**
   * Ajuste le zoom
   */
  const adjustZoom = async (delta: number) => {
    if (!streamRef.current) return;

    const track = streamRef.current.getVideoTracks()[0];
    const capabilities = track.getCapabilities() as any;

    if (capabilities.zoom) {
      const newZoom = Math.max(
        capabilities.zoom.min,
        Math.min(capabilities.zoom.max, zoomLevel + delta)
      );

      try {
        await track.applyConstraints({
          advanced: [{ zoom: newZoom } as any],
        });
        setZoomLevel(newZoom);
        
        if (enableFeedback) {
          feedback.onClick();
        }
      } catch (err) {
        console.error('Zoom error:', err);
      }
    }
  };

  /**
   * Change de caméra (avant/arrière)
   */
  const switchCamera = async () => {
    stopCamera();
    setFacingMode(prev => (prev === 'user' ? 'environment' : 'user'));
    
    if (enableFeedback) {
      feedback.onClick();
    }
  };

  /**
   * Capture une photo
   */
  const capturePhoto = () => {
    if (!videoRef.current) return;

    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(videoRef.current, 0, 0);
    const imageData = canvas.toDataURL('image/jpeg', 0.95);

    if (enableFeedback) {
      feedback.onSuccess();
    }

    onCapture(imageData);
  };

  /**
   * Démarre la caméra au montage
   */
  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, [facingMode]);

  /**
   * Affiche le tip le plus important
   */
  const primaryTip = tips.length > 0 ? tips[0] : null;

  /**
   * Couleur de l'indicateur de qualité
   */
  const qualityColor = quality
    ? quality.overall === 'excellent'
      ? 'green'
      : quality.overall === 'good'
      ? 'yellow'
      : 'red'
    : 'gray';

  return (
    <div className="fixed inset-0 z-50 bg-black">
      {/* Zone vidéo */}
      <div className="relative h-full w-full">
        <video
          ref={videoRef}
          className="h-full w-full object-cover"
          playsInline
          muted
          aria-label="Flux vidéo de la caméra"
        >
          <track kind="captions" src="" srcLang="fr" label="Captions" default />
        </video>

        {/* Overlay de guidage */}
        {isActive && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            {/* Frame de scan */}
            <div className="relative w-3/4 max-w-md aspect-[4/3] border-4 border-white/50 rounded-lg">
              {/* Ligne de scan animée */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent animate-scan" />
              
              {/* Coins */}
              <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-white rounded-tl-lg" />
              <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-white rounded-tr-lg" />
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-white rounded-bl-lg" />
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-white rounded-br-lg" />
            </div>

            {/* Indicateur de qualité */}
            {quality && showTips && (
              <div className="absolute top-6 left-0 right-0 mx-auto max-w-md pointer-events-auto">
                <div
                  className={`mx-4 p-3 rounded-lg backdrop-blur-sm ${
                    qualityColor === 'green'
                      ? 'bg-green-500/20 border border-green-500/50'
                      : qualityColor === 'yellow'
                      ? 'bg-yellow-500/20 border border-yellow-500/50'
                      : qualityColor === 'red'
                      ? 'bg-red-500/20 border border-red-500/50'
                      : 'bg-gray-500/20 border border-gray-500/50'
                  }`}
                >
                  <div className="flex items-center justify-between text-white">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-3 h-3 rounded-full ${
                          qualityColor === 'green'
                            ? 'bg-green-500'
                            : qualityColor === 'yellow'
                            ? 'bg-yellow-500'
                            : 'bg-red-500'
                        } animate-pulse`}
                      />
                      <span className="text-sm font-medium">
                        Qualité: {quality.score}%
                      </span>
                    </div>
                    <button
                      onClick={() => setShowTips(false)}
                      className="text-white/60 hover:text-white text-xs"
                    >
                      Masquer
                    </button>
                  </div>
                  
                  {primaryTip && (
                    <div className="mt-2 text-sm text-white">
                      <span className="mr-2">{primaryTip.icon}</span>
                      {primaryTip.message}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Message d'erreur */}
        {error && (
          <div className="absolute top-6 left-0 right-0 mx-auto max-w-md">
            <div className="mx-4 p-4 bg-red-500/20 border border-red-500/50 rounded-lg backdrop-blur-sm">
              <div className="flex items-center gap-2 text-white">
                <AlertCircle className="w-5 h-5" />
                <span className="text-sm">{error}</span>
              </div>
            </div>
          </div>
        )}

        {/* Contrôles en bas */}
        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
          <div className="flex items-center justify-between max-w-md mx-auto">
            {/* Bouton flash */}
            <button
              onClick={toggleFlash}
              disabled={!isActive}
              className={`p-3 rounded-full transition-all ${
                flashEnabled
                  ? 'bg-yellow-500 text-black'
                  : 'bg-white/20 text-white hover:bg-white/30'
              } disabled:opacity-50`}
              aria-label={flashEnabled ? 'Désactiver flash' : 'Activer flash'}
            >
              {flashEnabled ? <Zap className="w-6 h-6" /> : <ZapOff className="w-6 h-6" />}
            </button>

            {/* Bouton capture (grand au centre) */}
            <button
              onClick={capturePhoto}
              disabled={!isActive}
              className="w-20 h-20 rounded-full bg-white hover:bg-gray-200 disabled:bg-gray-500 transition-all shadow-lg flex items-center justify-center"
              aria-label="Prendre une photo"
            >
              <div className="w-16 h-16 rounded-full border-4 border-black" />
            </button>

            {/* Bouton changement caméra */}
            <button
              onClick={switchCamera}
              disabled={!isActive}
              className="p-3 rounded-full bg-white/20 text-white hover:bg-white/30 disabled:opacity-50 transition-all"
              aria-label="Changer de caméra"
            >
              <RotateCcw className="w-6 h-6" />
            </button>
          </div>

          {/* Contrôles zoom */}
          <div className="flex items-center justify-center gap-4 mt-4">
            <button
              onClick={() => adjustZoom(-0.5)}
              disabled={!isActive || zoomLevel <= 1}
              className="p-2 rounded-full bg-white/20 text-white hover:bg-white/30 disabled:opacity-30 transition-all"
              aria-label="Zoom arrière"
            >
              <ZoomOut className="w-5 h-5" />
            </button>
            
            <span className="text-white text-sm font-medium min-w-[3rem] text-center">
              {zoomLevel.toFixed(1)}x
            </span>
            
            <button
              onClick={() => adjustZoom(0.5)}
              disabled={!isActive}
              className="p-2 rounded-full bg-white/20 text-white hover:bg-white/30 disabled:opacity-30 transition-all"
              aria-label="Zoom avant"
            >
              <ZoomIn className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Bouton fermer */}
        {onClose && (
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="absolute top-4 right-4 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-all"
            aria-label="Fermer la caméra"
          >
            <span className="text-2xl">×</span>
          </button>
        )}
      </div>

      {/* Animation de scan */}
      <style>{`
        @keyframes scan {
          0%, 100% { top: 0; }
          50% { top: calc(100% - 4px); }
        }
        .animate-scan {
          animation: scan 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
