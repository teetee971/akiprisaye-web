import { useState, useEffect, useRef } from 'react';
import { BrowserMultiFormatReader, NotFoundException } from '@zxing/library';
import { SCAN_MESSAGES } from '../constants/scanMessages';
import { handleScanError } from '../utils/errorHandler';

export default function BarcodeScanner({ onScan, onClose }) {
  const [scanState, setScanState] = useState('idle'); // idle, requesting, scanning, failed, success
  const [error, setError] = useState(null);
  const [hasPermission, setHasPermission] = useState(null);
  const [manualInput, setManualInput] = useState('');
  const [torchSupported, setTorchSupported] = useState(false);
  const [torchEnabled, setTorchEnabled] = useState(false);
  const [validationError, setValidationError] = useState('');
  
  const videoRef = useRef(null);
  const readerRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    readerRef.current = new BrowserMultiFormatReader();
    
    return () => {
      stopScanning();
    };
  }, []);

  const startScanning = async () => {
    setError(null);
    setScanState('requesting');

    try {
      // Request camera permission
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      // Check if torch is supported
      const track = stream.getVideoTracks()[0];
      const capabilities = track.getCapabilities();
      if (capabilities.torch) {
        setTorchSupported(true);
      }

      setHasPermission(true);
      setScanState('scanning');

      // Start decoding with timeout
      const timeoutId = setTimeout(() => {
        setError(SCAN_MESSAGES.scanning.timeout);
      }, 10000); // Increased to 10 seconds

      readerRef.current.decodeFromVideoDevice(undefined, videoRef.current, (result, err) => {
        if (result) {
          clearTimeout(timeoutId);
          const code = result.getText();
          setScanState('success');
          stopScanning();
          onScan(code);
        }
        
        if (err && !(err instanceof NotFoundException)) {
          if (import.meta.env.DEV) {
            console.error('Scan error:', err);
          }
        }
      });

    } catch (err) {
      const userError = handleScanError(err);
      setHasPermission(false);
      setScanState('failed');
      
      if (err.name === 'NotAllowedError') {
        setError(SCAN_MESSAGES.permission.denied.description);
      } else if (err.name === 'NotFoundError') {
        setError(SCAN_MESSAGES.permission.notFound.description);
      } else {
        setError(userError.message);
      }
    }
  };

  const stopScanning = () => {
    setScanState('idle');
    
    if (readerRef.current) {
      readerRef.current.reset();
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setTorchEnabled(false);
    setError(null);
  };

  const toggleTorch = async () => {
    if (!streamRef.current || !torchSupported) return;

    try {
      const track = streamRef.current.getVideoTracks()[0];
      await track.applyConstraints({
        advanced: [{ torch: !torchEnabled }],
      });
      setTorchEnabled(!torchEnabled);
    } catch (err) {
      console.error('Torch error:', err);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setError(null);
    setScanState('scanning');

    try {
      const imageUrl = URL.createObjectURL(file);
      const result = await readerRef.current.decodeFromImageUrl(imageUrl);
      const code = result.getText();
      URL.revokeObjectURL(imageUrl);
      setScanState('success');
      onScan(code);
    } catch (err) {
      const userError = handleScanError(err);
      setError(SCAN_MESSAGES.result.failed.description);
      setScanState('failed');
    }
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    setValidationError('');
    
    // Validation
    if (manualInput.length < 8) {
      setValidationError(SCAN_MESSAGES.alternatives.manual.validation.tooShort);
      return;
    }
    
    if (manualInput.length > 13) {
      setValidationError(SCAN_MESSAGES.alternatives.manual.validation.tooLong);
      return;
    }
    
    if (!/^\d+$/.test(manualInput)) {
      setValidationError(SCAN_MESSAGES.alternatives.manual.validation.invalidFormat);
      return;
    }
    
    onScan(manualInput);
    setManualInput('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
      <div className="bg-slate-900 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <h2 className="text-xl font-bold text-white">📷 Scanner Code-Barres</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl"
            aria-label="Fermer"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Scanning State - Video Preview with Overlay */}
          {scanState === 'scanning' && hasPermission && (
            <div className="relative bg-black rounded-lg overflow-hidden">
              <video
                ref={videoRef}
                className="w-full h-64 object-cover"
                playsInline
                muted
              />
              
              {/* Scanning overlay with animated border */}
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/30">
                <div className="relative border-2 border-green-500 w-64 h-32 rounded-lg shadow-lg animate-pulse">
                  <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-green-500 rounded-tl-lg"></div>
                  <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-green-500 rounded-tr-lg"></div>
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-green-500 rounded-bl-lg"></div>
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-green-500 rounded-br-lg"></div>
                </div>
                
                {/* Scanning instruction overlay */}
                <div className="mt-4 bg-black/70 px-4 py-2 rounded-lg">
                  <p className="text-white font-semibold text-sm">
                    {SCAN_MESSAGES.scanning.active.instruction}
                  </p>
                </div>
              </div>

              {/* Torch button */}
              {torchSupported && (
                <button
                  onClick={toggleTorch}
                  className={`absolute bottom-4 right-4 p-3 rounded-full ${
                    torchEnabled ? 'bg-yellow-500' : 'bg-gray-700'
                  } text-white shadow-lg hover:scale-110 transition-transform`}
                  aria-label="Lampe torche"
                >
                  {torchEnabled ? '🔦' : '💡'}
                </button>
              )}

              {/* Stop button */}
              <button
                onClick={stopScanning}
                className="absolute bottom-4 left-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold shadow-lg transition-colors"
              >
                {SCAN_MESSAGES.actions.stopScan}
              </button>
            </div>
          )}
          
          {/* Requesting Permission State */}
          {scanState === 'requesting' && (
            <div className="bg-blue-900/20 border border-blue-700/30 rounded-lg p-6 text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
              <p className="text-blue-200 font-semibold">
                {SCAN_MESSAGES.permission.requesting}
              </p>
            </div>
          )}

          {/* Instructions - shown when idle */}
          {scanState === 'idle' && !error && (
            <div className="bg-blue-900/20 border border-blue-700/30 rounded-lg p-4">
              <p className="font-semibold mb-2 text-blue-200">
                📋 {SCAN_MESSAGES.instructions.title}
              </p>
              <ul className="space-y-1 ml-4 list-disc text-sm text-blue-200">
                {SCAN_MESSAGES.instructions.steps.map((step, idx) => (
                  <li key={idx}>{step}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Error message with recovery options */}
          {error && scanState === 'failed' && (
            <div className="space-y-3">
              <div className="bg-red-900/20 border border-red-700/30 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div>
                    <p className="font-bold text-red-200 mb-1">
                      {SCAN_MESSAGES.result.failed.title}
                    </p>
                    <p className="text-sm text-red-300">{error}</p>
                  </div>
                </div>
              </div>
              
              {/* Recovery actions */}
              <div className="bg-slate-800/50 rounded-lg p-4">
                <p className="text-gray-300 text-sm mb-3 font-semibold">
                  {SCAN_MESSAGES.result.failed.description}
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => {
                      setError(null);
                      setScanState('idle');
                    }}
                    className="flex-1 min-w-[120px] px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-sm transition-colors"
                  >
                    {SCAN_MESSAGES.result.failed.actions.retry}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Camera scan button */}
          {scanState === 'idle' && !error && (
            <button
              onClick={startScanning}
              className="w-full px-6 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-lg transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {SCAN_MESSAGES.actions.startScan}
            </button>
          )}

          {/* Image upload - always available */}
          <div>
            <label className="block w-full">
              <div className="px-6 py-4 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold text-center cursor-pointer transition-colors flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {SCAN_MESSAGES.alternatives.import.title}
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                disabled={scanState === 'scanning'}
              />
            </label>
            <p className="text-xs text-gray-400 mt-1 text-center">
              {SCAN_MESSAGES.alternatives.import.description}
            </p>
          </div>

          {/* Manual input - always available */}
          <div className="border-t border-slate-700 pt-4">
            <p className="text-gray-300 text-sm mb-3 font-semibold">
              {SCAN_MESSAGES.alternatives.manual.title}
            </p>
            <p className="text-xs text-gray-400 mb-3">
              {SCAN_MESSAGES.alternatives.manual.description}
            </p>
            <form onSubmit={handleManualSubmit} className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={manualInput}
                  onChange={(e) => {
                    setManualInput(e.target.value.replace(/\D/g, ''));
                    setValidationError('');
                  }}
                  placeholder={SCAN_MESSAGES.alternatives.manual.placeholder}
                  className="flex-1 bg-slate-800 text-white border border-slate-600 px-4 py-3 rounded-lg focus:outline-none focus:border-blue-500"
                  maxLength="13"
                  disabled={scanState === 'scanning'}
                />
                <button
                  type="submit"
                  disabled={manualInput.length < 8 || scanState === 'scanning'}
                  className="px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition-colors"
                >
                  ✓
                </button>
              </div>
              {validationError && (
                <p className="text-red-400 text-xs">{validationError}</p>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
