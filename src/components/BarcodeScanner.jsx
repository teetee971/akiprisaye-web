import { useState, useEffect, useRef } from 'react';
import { BrowserMultiFormatReader, NotFoundException } from '@zxing/library';

// TODO: Intégrer une librairie de détection de code-barres plus performante
// Options à évaluer: @undecaf/zbar-wasm, html5-qrcode, ou solution native
// Critères: performance, taux de détection, support des formats, taille bundle

export default function BarcodeScanner({ 
  onScan, 
  onClose, 
  timeout = 15000, 
  notFoundBehavior = 'suggest_search' 
}) {
  const [scanState, setScanState] = useState('idle'); // 'idle', 'scanning', 'processing', 'success', 'not_found', 'error', 'permission_denied'
  const [error, setError] = useState(null);
  const [hasPermission, setHasPermission] = useState(null);
  const [manualInput, setManualInput] = useState('');
  const [torchSupported, setTorchSupported] = useState(false);
  const [torchEnabled, setTorchEnabled] = useState(false);
  
  const videoRef = useRef(null);
  const readerRef = useRef(null);
  const streamRef = useRef(null);
  const timeoutRef = useRef(null);

  useEffect(() => {
    readerRef.current = new BrowserMultiFormatReader();
    
    return () => {
      stopScanning();
    };
  }, []);

  const startScanning = async () => {
    setError(null);
    setScanState('scanning');
    setHasPermission(null); // Reset permission state

    try {
      // Check if getUserMedia is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('getUserMedia non disponible sur ce navigateur');
      }

      console.log('📷 Requesting camera access...');
      
      // Request camera permission with proper constraints
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
      });
      
      console.log('✅ Camera access granted');
      streamRef.current = stream;
      setHasPermission(true);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        
        // Wait for video to be ready
        await new Promise((resolve, reject) => {
          videoRef.current.onloadedmetadata = () => {
            console.log('📹 Video metadata loaded');
            resolve();
          };
          videoRef.current.onerror = (e) => {
            console.error('❌ Video error:', e);
            reject(new Error('Erreur de chargement vidéo'));
          };
        });
        
        await videoRef.current.play();
        console.log('▶️ Video playing');
      }

      // Check if torch is supported
      const track = stream.getVideoTracks()[0];
      const capabilities = track.getCapabilities();
      console.log('📱 Camera capabilities:', capabilities);
      
      if (capabilities.torch) {
        setTorchSupported(true);
        console.log('🔦 Torch supported');
      }

      // Start decoding with timeout
      // TODO: Rendre le timeout configurable via props
      timeoutRef.current = setTimeout(() => {
        console.warn('⏱️ Scan timeout');
        setScanState('not_found');
        setError('⏱️ Timeout: Approchez le code-barres de la caméra (10-20 cm)');
        stopScanning();
        
        // Handle notFoundBehavior
        if (notFoundBehavior === 'suggest_search') {
          // Keep error message to suggest search
        } else if (notFoundBehavior === 'save_for_review') {
          // TODO: Implémenter la sauvegarde pour revue
          console.log('TODO: Save scan attempt for review');
        } else if (notFoundBehavior === 'open_empty_product_page') {
          // TODO: Implémenter l'ouverture d'une page produit vide
          console.log('TODO: Open empty product page');
        }
      }, timeout);

      console.log('🔍 Starting barcode detection...');
      
      // TODO: Remplacer par une librairie plus performante
      // Évaluer @undecaf/zbar-wasm pour améliorer le taux de détection
      readerRef.current.decodeFromVideoDevice(undefined, videoRef.current, (result, err) => {
        if (result) {
          clearTimeout(timeoutRef.current);
          const code = result.getText();
          console.log('✅ Barcode detected:', code);
          setScanState('success');
          stopScanning();
          onScan(code);
        }
        
        if (err && !(err instanceof NotFoundException)) {
          console.error('Scan error:', err);
        }
      });

    } catch (err) {
      console.error('❌ Camera error:', err);
      setHasPermission(false);
      setScanState('permission_denied');
      
      if (err.name === 'NotAllowedError') {
        setError('📷 Accès caméra refusé. Veuillez autoriser l\'accès à la caméra dans les paramètres de votre navigateur.');
      } else if (err.name === 'NotFoundError') {
        setError('📷 Aucune caméra détectée sur cet appareil. Utilisez l\'import d\'image ou la saisie manuelle.');
      } else if (err.name === 'NotReadableError') {
        setError('📷 Caméra déjà utilisée par une autre application. Fermez les autres applications utilisant la caméra.');
      } else if (err.name === 'NotSupportedError' || err.message.includes('getUserMedia')) {
        setError('📷 Caméra non supportée sur ce navigateur. Utilisez Chrome, Firefox ou Safari récent. Ou utilisez l\'import d\'image.');
      } else {
        setScanState('error');
        setError(`❌ Erreur: ${err.message || 'Impossible d\'accéder à la caméra'}. Essayez l\'import d\'image.`);
      }
    }
  };

  const stopScanning = () => {
    setScanState('idle');
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    
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
    setScanState('processing');

    try {
      const imageUrl = URL.createObjectURL(file);
      // TODO: Améliorer la détection sur images avec prétraitement
      const result = await readerRef.current.decodeFromImageUrl(imageUrl);
      const code = result.getText();
      URL.revokeObjectURL(imageUrl);
      setScanState('success');
      onScan(code);
    } catch (err) {
      console.error('Image decode error:', err);
      setScanState('not_found');
      setError('❌ Code-barres non détecté dans l\'image. Essayez la saisie manuelle.');
    }
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (manualInput.length >= 8) {
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
          {/* Video Preview */}
          {scanState === 'scanning' && hasPermission && (
            <div className="relative bg-black rounded-lg overflow-hidden">
              <video
                ref={videoRef}
                className="w-full h-64 object-cover"
                playsInline
                muted
              />
              
              {/* Scanning overlay */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="border-2 border-green-500 w-64 h-32 rounded-lg shadow-lg">
                  <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-green-500 rounded-tl-lg"></div>
                  <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-green-500 rounded-tr-lg"></div>
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-green-500 rounded-bl-lg"></div>
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-green-500 rounded-br-lg"></div>
                </div>
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
                data-testid="stop-scan"
                className="absolute bottom-4 left-4 px-4 py-2 bg-red-600 text-white rounded-lg font-semibold"
              >
                Arrêter
              </button>
            </div>
          )}

          {/* Instructions */}
          {scanState === 'idle' && !error && (
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

          {/* Permission denied help */}
          {hasPermission === false && (
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
          {scanState === 'idle' && (
            <button
              onClick={startScanning}
              data-testid="start-scan"
              className="w-full px-6 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-lg transition-colors"
            >
              📷 Scanner avec la caméra
            </button>
          )}

          {/* Image upload */}
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
                maxLength="13"
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
