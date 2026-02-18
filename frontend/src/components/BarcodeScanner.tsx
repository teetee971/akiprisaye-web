import React, { useEffect, useMemo, useRef, useState } from 'react';
import { validateEan } from '../services/eanValidator';
import { startScan, stop, setTorch, setZoom, type ScannerDebugInfo } from '../lib/barcodeEngine';

interface BarcodeScannerProps {
  onScan: (code: string) => void;
  onClose: () => void;
}

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

export default function BarcodeScanner({ onScan, onClose }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState('');
  const [debugInfo, setDebugInfo] = useState<ScannerDebugInfo>(EMPTY_DEBUG);
  const [torchEnabled, setTorchEnabled] = useState(false);
  const [zoomValue, setZoomValue] = useState<number | null>(null);

  const showDebug = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return new URLSearchParams(window.location.search).get('debug') === '1';
  }, []);

  const stopCamera = async () => {
    await stop();
    setIsActive(false);
    setTorchEnabled(false);
  };

  useEffect(() => {
    return () => {
      void stop();
    };
  }, []);

  const handleScanResult = async (code: string) => {
    await stopCamera();
    onScan(code);
  };

  const handleActivateCamera = async () => {
    if (!videoRef.current) return;

    setError(null);
    setDebugInfo(EMPTY_DEBUG);

    try {
      await startScan(videoRef.current, handleScanResult, setDebugInfo);
      setIsActive(true);
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

          {(showDebug || isActive) && (
            <div
              className={`absolute border-2 ${showDebug ? 'border-amber-400' : 'border-white/60'}`}
              style={{
                left: '20%',
                top: '33%',
                width: '60%',
                height: '34%',
              }}
            />
          )}

          {!isActive && <div className="absolute inset-0 grid place-items-center text-slate-400">Caméra inactive</div>}
        </div>

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
