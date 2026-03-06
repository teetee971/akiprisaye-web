/* eslint-disable @typescript-eslint/no-unused-vars */
// src/components/ScanCamera.tsx
import React, { useEffect } from 'react'

type ScanCameraProps = {
  videoRef: React.RefObject<HTMLVideoElement>
  isScanning: boolean
  error: string | null
  onStartScan: () => void
  onStopScan: () => void
}

export default function ScanCamera({
  videoRef,
  isScanning,
  error,
  onStartScan,
  onStopScan,
}: ScanCameraProps) {
  return (
    <div className="space-y-4">
      <div className="relative bg-black rounded-lg overflow-hidden" style={{ aspectRatio: '4/3' }}>
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          playsInline
          muted
          aria-label="Flux vidéo de la caméra pour scanner le code EAN"
        >
          <track kind="captions" src="" srcLang="fr" label="Captions" default />
        </video>
        
        {isScanning && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-3/4 h-1/3 border-2 border-green-500 rounded-lg">
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full h-0.5 bg-red-500 animate-pulse" />
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-sm text-red-300">
          {error}
        </div>
      )}

      <div className="flex gap-2">
        {!isScanning ? (
          <button
            onClick={onStartScan}
            className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors"
            aria-label="Démarrer le scan caméra"
          >
            📷 Démarrer le scan
          </button>
        ) : (
          <button
            onClick={onStopScan}
            className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-500 text-white rounded-lg font-medium transition-colors"
            aria-label="Arrêter le scan"
          >
            ⏹️ Arrêter
          </button>
        )}
      </div>

      <div className="text-xs text-white/60 text-center">
        Positionnez le code-barres EAN dans le cadre vert
      </div>
    </div>
  )
}
