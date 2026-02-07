import { useState, useEffect, useRef } from 'react';
import { BrowserMultiFormatReader, NotFoundException } from '@zxing/library';
import uxMonitor from '../utils/uxMonitor';
import type { ScanState, ScannerOptions, ScanStateTransition } from '../types/scan';
import { SCANNER_MESSAGES, type ScannerMessage } from '../constants/scannerMessages';

interface BarcodeScannerProps {
  onScan: (code: string) => void;
  onClose: () => void;
  options?: ScannerOptions;
}

export default function BarcodeScanner({ onScan, onClose, options = {} }: BarcodeScannerProps) {
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
  
  // OPTIMIZATION #2: Scan feedback state
  const [scanFeedback, setScanFeedback] = useState<'searching' | 'focusing' | 'detecting' | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanStartTimeRef = useRef<number>(0);
  
  // Configuration with defaults
  const {
    timeout = 15000,
    enableDebugLogging = false,
    enableOcrFallback = true, // OCR enabled by default for better detection
  } = options;

  // State transition handler with logging
  const transitionState = (to: ScanState, reason?: string) => {
    const from = scanState;
    
    setScanState(to);
    
    if (enableDebugLogging) {
      console.log(`[SCAN] State transition: ${from} → ${to}`, reason || '');
    }
  };

  // Check camera permission state using Permissions API
  const checkCameraPermission = async (): Promise<'granted' | 'prompt' | 'denied' | 'unsupported'> => {
    try {
      // Guard for non-browser environments (Node.js, SSR)
      if (typeof navigator === 'undefined' || !navigator.permissions || !navigator.permissions.query) {
        return 'unsupported';
      }
      
      const result = await navigator.permissions.query({ name: "camera" as PermissionName });
      return result.state as 'granted' | 'prompt' | 'denied';
    } catch (error) {
      if (enableDebugLogging) {
        console.log('[SCAN] Permissions API not available or error:', error);
      }
      return 'unsupported';
    }
  };

  // Activate fallback to image upload mode
  const activateImageUploadFallback = () => {
    setScanMode('upload');
    setUserMessage(SCANNER_MESSAGES.CAMERA_UNAVAILABLE);
    
    if (enableDebugLogging) {
      console.log('[SCAN] Fallback activated: Switching to image upload mode');
    }
  };

  useEffect(() => {
    readerRef.current = new BrowserMultiFormatReader();
    transitionState('idle', 'Component mounted');
    
    return () => {
      stopScanning();
    };
  }, []);

  const startScanning = async () => {
    setError(null);
    setUserMessage(null);
    setIsScanning(true);
    setHasPermission(null); // Reset permission state
    setScanFeedback('searching'); // OPTIMIZATION #2: Set initial feedback
    scanStartTimeRef.current = Date.now();
    transitionState('scanning', 'User initiated scan');
    
    // PROMPT 4: Monitor scan start
    uxMonitor.scanStarted('barcode');

    // Check camera permission first
    const permission = await checkCameraPermission();
    
    // PROMPT 4: Monitor permission request
    uxMonitor.cameraPermissionRequested();
    
    if (enableDebugLogging) {
      console.log('[SCAN] Camera permission state:', permission);
    }

    // Try camera if permission is granted, prompt, or unsupported (browsers without Permissions API)
    if (permission === 'granted' || permission === 'prompt' || permission === 'unsupported') {
      try {
        // Guard for non-browser environments
        if (typeof navigator === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error('getUserMedia non disponible sur ce navigateur');
        }

        if (enableDebugLogging) {
          console.log('[SCAN] 📷 Requesting camera access...');
        }
        
        // Request camera permission with proper constraints
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { 
            facingMode: { ideal: 'environment' },
            width: { ideal: 1280 },
            height: { ideal: 720 }
          },
        });
        
        if (enableDebugLogging) {
          console.log('[SCAN] ✅ Camera access granted');
        }
        streamRef.current = stream;
        setHasPermission(true);
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          
          // Wait for video to be ready
          await new Promise<void>((resolve, reject) => {
            if (videoRef.current) {
              videoRef.current.onloadedmetadata = () => {
                if (enableDebugLogging) {
                  console.log('[SCAN] 📹 Video metadata loaded');
                }
                resolve();
              };
              videoRef.current.onerror = () => {
                console.error('[SCAN] ❌ Video error');
                reject(new Error('Erreur de chargement vidéo'));
              };
            } else {
              reject(new Error('Video ref not available'));
            }
          });
          
          await videoRef.current.play();
          if (enableDebugLogging) {
            console.log('[SCAN] ▶️ Video playing');
          }
        }

        // Check if torch is supported
        const track = stream.getVideoTracks()[0];
        const capabilities = track.getCapabilities() as any;
        if (enableDebugLogging) {
          console.log('[SCAN] 📱 Camera capabilities:', capabilities);
        }
        
        if ('torch' in capabilities) {
          setTorchSupported(true);
          if (enableDebugLogging) {
            console.log('[SCAN] 🔦 Torch supported');
          }
        }

        // Start decoding with timeout
        const timeoutId = setTimeout(() => {
          console.warn('[SCAN] ⏱️ Scan timeout');
          setError('⏱️ Timeout: Approchez le code-barres de la caméra (10-20 cm)');
          transitionState('error', `Timeout after ${timeout}ms`);
        }, timeout);

        if (enableDebugLogging) {
          console.log('[SCAN] 🔍 Starting barcode detection...');
        }
        
        if (readerRef.current && videoRef.current) {
          readerRef.current.decodeFromVideoDevice(null, videoRef.current, (result, err) => {
            if (result) {
              clearTimeout(timeoutId);
              const code = result.getText();
              const duration = Date.now() - scanStartTimeRef.current;
              
              if (enableDebugLogging) {
                console.log(`[SCAN] ✅ Barcode detected in ${duration}ms:`, code);
              }
              
              transitionState('processing', `Barcode detected: ${code}`);
              stopScanning();
              onScan(code);
            }
            
            if (err && !(err instanceof NotFoundException)) {
              console.error('[SCAN] Scan error:', err);
            }
          });
        }

        return; // Success - camera is working
      } catch (err: any) {
        console.error('[SCAN] ❌ Camera error:', err);
        // Camera technically inaccessible - fall through to fallback
      }
    }

    // 🔴 FALLBACK AUTOMATIQUE - Camera denied, not supported, or failed
    if (enableDebugLogging) {
      console.log('[SCAN] 🔄 Activating automatic fallback to image upload');
    }
    
    setHasPermission(false);
    setIsScanning(false);
    activateImageUploadFallback();
    transitionState('idle', 'Camera unavailable - fallback to upload');
  };

  const stopScanning = () => {
    setIsScanning(false);
    
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
    
    if (scanState === 'scanning') {
      transitionState('idle', 'Scanning stopped by user');
    }
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
   * This is completely independent from the camera pipeline
   */
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setIsScanning(true);
    setUserMessage({ 
      type: 'info', 
      title: 'Traitement en cours', 
      message: 'Analyse de l\'image...' 
    });
    transitionState('processing', 'Processing uploaded image');

    let ean: string | null = null;
    let detectionMethod: 'native' | 'zxing' | 'ocr' | null = null;

    try {
      // Step 1: Load image properly
      const img = new Image();
      const imageUrl = URL.createObjectURL(file);
      img.src = imageUrl;
      
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('Failed to load image'));
      });
      
      await img.decode();
      
      if (enableDebugLogging) {
        console.log('[SCAN] 📷 Image loaded successfully');
      }

      // Step 2: Try native barcode detection first (if available)
      if ('BarcodeDetector' in window) {
        try {
          if (enableDebugLogging) {
            console.log('[SCAN] 🔍 Attempting native BarcodeDetector...');
          }
          
          setUserMessage({ 
            type: 'info', 
            title: 'Détection native en cours', 
            message: 'Utilisation du détecteur natif du navigateur...' 
          });
          
          const detector = new (window as any).BarcodeDetector({ 
            formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e'] 
          });
          const codes = await detector.detect(img);
          
          if (codes.length > 0) {
            ean = codes[0].rawValue;
            detectionMethod = 'native';
            if (enableDebugLogging) {
              console.log('[SCAN] ✅ Barcode detected with BarcodeDetector:', ean);
            }
          } else if (enableDebugLogging) {
            console.log('[SCAN] ℹ️ BarcodeDetector found no codes, trying ZXing...');
          }
        } catch (err) {
          if (enableDebugLogging) {
            console.log('[SCAN] BarcodeDetector failed, will try other methods:', err);
          }
        }
      } else if (enableDebugLogging) {
        console.log('[SCAN] ℹ️ Native BarcodeDetector not available, using ZXing');
      }

      // Step 2b: Try ZXing library if native BarcodeDetector not available or failed
      if (!ean && readerRef.current) {
        try {
          if (enableDebugLogging) {
            console.log('[SCAN] 🔍 Attempting ZXing barcode detection...');
          }
          
          setUserMessage({ 
            type: 'info', 
            title: 'Détection ZXing en cours', 
            message: 'Analyse avec bibliothèque ZXing...' 
          });
          
          const result = await readerRef.current.decodeFromImageUrl(imageUrl);
          ean = result.getText();
          detectionMethod = 'zxing';
          if (enableDebugLogging) {
            console.log('[SCAN] ✅ Barcode detected with ZXing:', ean);
          }
        } catch (err) {
          if (enableDebugLogging) {
            console.log('[SCAN] ZXing detection failed, will try OCR:', err);
          }
        }
      }

      // Step 3: OCR Fallback (if enabled)
      if (!ean && enableOcrFallback) {
        if (enableDebugLogging) {
          console.log('[SCAN] 📝 Starting OCR fallback with Tesseract.js...');
        }
        
        setUserMessage({ 
          type: 'info', 
          title: 'Détection OCR en cours', 
          message: 'Recherche du code dans l\'image...' 
        });

        try {
          // Dynamic import for code splitting - only load OCR when needed
          const Tesseract = await import('tesseract.js');
          const { data } = await Tesseract.recognize(img, 'eng');

          if (enableDebugLogging) {
            console.log('[SCAN] OCR raw text:', data.text);
          }

          // Look for EAN-13 (13 digits) or EAN-8 (8 digits)
          const match = data.text.match(/\b\d{13}\b|\b\d{8}\b/);
          if (match) {
            ean = match[0];
            detectionMethod = 'ocr';
            if (enableDebugLogging) {
              console.log('[SCAN] ✅ EAN detected via OCR:', ean);
            }
          } else if (enableDebugLogging) {
            console.log('[SCAN] ⚠️ No EAN pattern found in OCR text');
          }
        } catch (ocrErr) {
          console.error('[SCAN] OCR error:', ocrErr);
          if (enableDebugLogging) {
            console.log('[SCAN] ⚠️ OCR fallback failed, will prompt for manual entry');
          }
        }
      } else if (!ean && !enableOcrFallback && enableDebugLogging) {
        console.log('[SCAN] ℹ️ OCR fallback is disabled - skipping OCR detection');
      }

      // Cleanup
      URL.revokeObjectURL(imageUrl);
      setIsScanning(false);

      // Step 4: Handle result
      if (ean) {
        // SUCCESS CASE
        // TODO: Externalize detection method names to constants or i18n for better maintainability
        const methodName = 
          detectionMethod === 'native' ? 'détecteur natif' :
          detectionMethod === 'zxing' ? 'bibliothèque ZXing' :
          detectionMethod === 'ocr' ? 'OCR Tesseract' :
          'méthode inconnue';
          
        setUserMessage({ 
          type: 'info', 
          title: 'Code détecté', 
          message: `✅ Code détecté avec ${methodName}: ${ean}` 
        });
        
        if (enableDebugLogging) {
          console.log('[SCAN] ✅ Final EAN to process:', ean, 'via', detectionMethod);
        }
        
        transitionState('processing', `Barcode from image: ${ean}`);
        
        // Clear message after a short delay so user can see it
        setTimeout(() => setUserMessage(null), 2000);
        
        // PROMPT 4: Monitor scan success from image upload
        uxMonitor.scanCompleted('barcode', true);
        
        try {
          onScan(ean);
        } catch (err) {
          console.error('[SCAN] Error in onScan callback:', err);
          setError('Erreur lors du traitement du code détecté');
        }
      } else {
        // FAILURE CASE - Honest message with helpful tips
        // TODO: Externalize user-facing error messages to constants or i18n for better maintainability
        setError('❌ Aucun code détecté automatiquement');
        setUserMessage({ 
          type: 'warning', 
          title: 'Code non détecté', 
          message: '❌ Aucun code détecté automatiquement. 💡 Conseils : assurez-vous que le code-barres est bien visible, net et bien éclairé. Vous pouvez aussi saisir le code manuellement ci-dessous.' 
        });
        transitionState('error', 'No barcode found in image');
        
        if (enableDebugLogging) {
          console.log('[SCAN] ⚠️ Detection summary:');
          console.log('  - Native BarcodeDetector:', 'BarcodeDetector' in window ? 'tried but no result' : 'not available');
          console.log('  - ZXing detection: tried but no result');
          console.log('  - OCR fallback:', enableOcrFallback ? 'tried but no EAN pattern found' : 'disabled');
        }
        
        // PROMPT 4: Monitor scan failure from image upload
        uxMonitor.scanCompleted('barcode', false);
      }
    } catch (err: any) {
      console.error('[SCAN] Image processing error:', err);
      setError('❌ Erreur lors du traitement de l\'image');
      setUserMessage({ 
        type: 'error', 
        title: 'Erreur', 
        message: 'Une erreur est survenue lors du traitement de l\'image. Essayez la saisie manuelle.' 
      });
      setIsScanning(false);
      transitionState('error', 'Image processing failed');
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualInput.length >= 8) {
      if (enableDebugLogging) {
        console.log('[SCAN] Manual input submitted:', manualInput);
      }
      transitionState('processing', `Manual input: ${manualInput}`);
      onScan(manualInput);
      setManualInput('');
    }
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
          {/* Scanning indicator with state */}
          {isScanning && scanState === 'scanning' && (
            <div className="bg-blue-900/20 border border-blue-700/30 rounded-lg p-3 text-center">
              <div className="inline-flex items-center gap-2 text-blue-200 text-sm">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400"></div>
                <span>Scan en cours... État: {scanState}</span>
              </div>
            </div>
          )}

          {/* Video Preview */}
          {isScanning && hasPermission && (
            <div className="relative bg-black rounded-lg overflow-hidden">
              <video
                ref={videoRef}
                className="w-full h-64 object-cover"
                playsInline
                muted
              />
              
              {/* OPTIMIZATION #2: Enhanced scanning overlay with real-time feedback */}
              <div className="absolute inset-0 flex items-center justify-center">
                {/* Scan frame with dynamic border */}
                <div className={`border-2 w-64 h-32 rounded-lg shadow-lg transition-all ${
                  scanFeedback === 'searching' ? 'border-blue-500 animate-pulse' :
                  scanFeedback === 'focusing' ? 'border-yellow-500' :
                  scanFeedback === 'detecting' ? 'border-green-500 scale-105' :
                  'border-green-500'
                }`}>
                  <div className={`absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 rounded-tl-lg transition-colors ${
                    scanFeedback === 'searching' ? 'border-blue-500' :
                    scanFeedback === 'focusing' ? 'border-yellow-500' :
                    'border-green-500'
                  }`}></div>
                  <div className={`absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 rounded-tr-lg transition-colors ${
                    scanFeedback === 'searching' ? 'border-blue-500' :
                    scanFeedback === 'focusing' ? 'border-yellow-500' :
                    'border-green-500'
                  }`}></div>
                  <div className={`absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 rounded-bl-lg transition-colors ${
                    scanFeedback === 'searching' ? 'border-blue-500' :
                    scanFeedback === 'focusing' ? 'border-yellow-500' :
                    'border-green-500'
                  }`}></div>
                  <div className={`absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 rounded-br-lg transition-colors ${
                    scanFeedback === 'searching' ? 'border-blue-500' :
                    scanFeedback === 'focusing' ? 'border-yellow-500' :
                    'border-green-500'
                  }`}></div>
                </div>
                
                {/* Feedback message overlay */}
                {scanFeedback && (
                  <div className={`absolute top-4 left-0 right-0 text-center px-4 py-2 text-sm font-medium transition-all ${
                    scanFeedback === 'searching' ? 'bg-blue-600/90 text-white' :
                    scanFeedback === 'focusing' ? 'bg-yellow-600/90 text-white' :
                    'bg-green-600/90 text-white'
                  }`}>
                    {scanFeedback === 'searching' && '📷 Recherche de code-barres...'}
                    {scanFeedback === 'focusing' && '🎯 Code détecté ! Analyse...'}
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
                  <strong>⚠️ Important :</strong> La caméra nécessite HTTPS ou localhost. 
                  Si vous voyez "getUserMedia non disponible", utilisez l'import d'image.
                </p>
              </div>
            </div>
          )}

          {/* User Message (Fallback Info) */}
          {userMessage && (
            <div className={`rounded-lg p-4 text-sm ${
              userMessage.type === 'info' ? 'bg-blue-900/20 border border-blue-700/30 text-blue-200' :
              userMessage.type === 'warning' ? 'bg-yellow-900/20 border border-yellow-700/30 text-yellow-200' :
              'bg-red-900/20 border border-red-700/30 text-red-200'
            }`}>
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
                <li><strong>Chrome/Edge :</strong> Cliquez sur l'icône 🔒 ou ℹ️ dans la barre d'adresse → Paramètres du site → Caméra → Autoriser</li>
                <li><strong>Safari (iOS) :</strong> Réglages → Safari → Caméra → Autoriser</li>
                <li><strong>Firefox :</strong> Cliquez sur l'icône 🔒 → Autorisations → Caméra → Autoriser</li>
              </ul>
              <p className="mt-3 text-xs">Une fois l'autorisation donnée, rechargez la page et réessayez.</p>
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="bg-red-900/20 border border-red-700/30 rounded-lg p-4 text-red-200">
              {error}
            </div>
          )}

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
              {/* Primary: Image upload */}
              <label className="block w-full">
                <div className="px-6 py-4 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold text-lg text-center cursor-pointer transition-colors">
                  🖼️ Importer une image
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
              
              {/* Secondary: Retry camera */}
              <button
                onClick={retryCamera}
                className="w-full px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-semibold transition-colors"
              >
                🔄 Réessayer la caméra
              </button>
            </div>
          )}

          {/* Image upload (always available as alternative) */}
          {!userMessage && (
            <div>
              <label className="block w-full">
                <div className="px-6 py-4 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold text-center cursor-pointer transition-colors">
                  🖼️ Importer une image
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
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
        </div>
      </div>
    </div>
  );
}
