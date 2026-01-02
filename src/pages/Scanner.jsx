import { useState } from 'react';
import BarcodeScanner from '../components/BarcodeScanner';
import ProductDetails from '../components/products/ProductDetails';
import { lookupProductByEan } from '../services/eanProductService';
import { toProductViewModel } from '../services/productViewModelService';
import { SCAN_STATE_MESSAGES } from '../types/scan';

export default function Scanner() {
  const [showScanner, setShowScanner] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [productData, setProductData] = useState(null);
  const [unreferencedProduct, setUnreferencedProduct] = useState(null);
  const [scanState, setScanState] = useState('idle');
  const [showSettings, setShowSettings] = useState(false);
  const [error, setError] = useState(null);

  const handleScan = async (code) => {
    const startTime = Date.now();
    
    // Log UX pour debug
    console.info('[SCAN]', {
      step: 'scan_initiated',
      eanDetected: code,
      timestamp: new Date().toISOString()
    });
    
    if (import.meta.env.DEV) {
      console.warn('Scanned code:', code);
    }
    
    setScanResult(code);
    setShowScanner(false);
    setScanState('scanning');
    setError(null);

    try {
      const result = await lookupProductByEan(code, {
        territoire: 'martinique',
        source: 'scan_utilisateur'
      });

      const durationMs = Date.now() - startTime;

      if (result.success && result.product) {
        // Produit trouvé
        console.info('[SCAN]', {
          step: 'product_found',
          eanDetected: code,
          durationMs
        });
        
        const viewModel = toProductViewModel(result.product);
        setProductData(viewModel);
        setScanState('success');
      } else {
        // Produit non trouvé - afficher fallback
        console.info('[SCAN]', {
          step: 'no_result',
          eanDetected: code,
          ocrDetected: false,
          durationMs
        });
        
        // Créer un produit non référencé
        const unrefProduct = {
          type: 'unrecognized',
          ean: code,
          captureDate: new Date().toISOString(),
          territoire: 'martinique',
          message: 'Code non reconnu, analyse visuelle en cours'
        };
        
        setUnreferencedProduct(unrefProduct);
        setScanState('no_result');
      }
    } catch (err) {
      const durationMs = Date.now() - startTime;
      
      console.error('Product lookup error:', err);
      console.info('[SCAN]', {
        step: 'error',
        eanDetected: code,
        durationMs,
        error: err.message
      });
      
      setError('Une erreur s\'est produite lors de la recherche du produit');
      setScanState('error');
    }
  };

  const handleReset = () => {
    setScanResult(null);
    setProductData(null);
    setUnreferencedProduct(null);
    setError(null);
    setScanState('idle');
    
    console.info('[SCAN]', {
      step: 'reset',
      timestamp: new Date().toISOString()
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-slate-900 rounded-2xl p-6 shadow-lg">
          {/* Header with Settings Button */}
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-white">📷 Scanner Code-Barres</h1>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 text-gray-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              aria-label="Paramètres"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          </div>
          
          {/* Settings Panel */}
          {showSettings && (
            <div className="mb-6 p-4 bg-slate-800 border border-slate-700 rounded-lg">
              <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Paramètres du scan
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-2 text-gray-300">
                  <svg className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <div>
                    <p className="font-semibold text-white">Permissions caméra</p>
                    <p className="text-xs text-gray-400">Autorisez l'accès à la caméra dans les paramètres de votre navigateur</p>
                  </div>
                </div>
                <div className="flex items-start gap-2 text-gray-300">
                  <svg className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <div>
                    <p className="font-semibold text-white">Mode scan / import photo</p>
                    <p className="text-xs text-gray-400">Utilisez la caméra pour scanner en direct ou importez une photo existante</p>
                  </div>
                </div>
                <div className="flex items-start gap-2 text-gray-300">
                  <svg className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <div>
                    <p className="font-semibold text-white">Confidentialité</p>
                    <p className="text-xs text-gray-400">Les images ne sont jamais envoyées à un serveur. Traitement 100% local.</p>
                  </div>
                </div>
                <div className="flex items-start gap-2 text-gray-300">
                  <svg className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className="font-semibold text-white">Aide au scan</p>
                    <p className="text-xs text-gray-400">Positionnez le code-barres à 10-20 cm, assurez un bon éclairage</p>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Information Banner */}
          <div className="mb-6 p-4 bg-blue-900/30 border border-blue-700 rounded-lg">
            <p className="text-blue-200 text-sm">
              ℹ️ <strong>Recherche de produits</strong> - Scannez le code-barres d'un produit 
              pour obtenir ses informations (nom, marque, origine, prix observés).
            </p>
          </div>

          {/* Initial State */}
          {scanState === 'idle' && !scanResult && (
            <div className="space-y-4">
              <div className="border-2 border-dashed border-slate-600 rounded-xl p-8 text-center">
                <svg className="w-16 h-16 mx-auto mb-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                </svg>
                <p className="text-white font-semibold mb-2">Scanner un code-barres</p>
                <p className="text-gray-400 text-sm mb-4">Codes EAN-8, EAN-13, UPC</p>
                <button
                  onClick={() => setShowScanner(true)}
                  className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold cursor-pointer transition-colors"
                >
                  📷 Lancer le scanner
                </button>
              </div>
              
              {/* Instructions */}
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
                <h3 className="text-white font-semibold mb-2">💡 Conseils de scan</h3>
                <ul className="text-gray-300 text-sm space-y-1 list-disc list-inside">
                  <li>Positionnez le code-barres à 10-20 cm de la caméra</li>
                  <li>Assurez-vous d'avoir un bon éclairage</li>
                  <li>Maintenez le téléphone stable</li>
                  <li>Le scan est automatique une fois détecté</li>
                </ul>
              </div>
            </div>
          )}

          {/* Loading/Scanning State */}
          {(scanState === 'scanning' || scanState === 'camera_open') && (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-4 border-blue-500 mb-4"></div>
              <p className="text-white text-lg font-semibold">{SCAN_STATE_MESSAGES[scanState]}</p>
              <p className="text-gray-400 text-sm mt-2">Code scanné: {scanResult || 'En attente...'}</p>
            </div>
          )}

          {/* Error State */}
          {scanState === 'error' && error && (
            <div className="space-y-4">
              <div className="bg-red-900/20 border border-red-700 rounded-lg p-6 text-center">
                <svg className="w-12 h-12 mx-auto mb-3 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-red-200 font-semibold mb-2">{error}</p>
                <p className="text-red-300 text-sm">Code scanné: {scanResult}</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleReset}
                  className="flex-1 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-semibold transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={() => setShowScanner(true)}
                  className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
                >
                  Scanner à nouveau
                </button>
              </div>
            </div>
          )}

          {/* No Result State - Universal Fallback */}
          {scanState === 'no_result' && unreferencedProduct && (
            <div className="space-y-4">
              <div className="bg-orange-900/20 border border-orange-700 rounded-lg p-6">
                <div className="flex items-start gap-3 mb-4">
                  <svg className="w-12 h-12 text-orange-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="flex-1">
                    <h3 className="text-orange-200 font-bold text-lg mb-2">
                      Produit détecté (non référencé)
                    </h3>
                    <p className="text-orange-300 text-sm mb-4">
                      {unreferencedProduct.message}
                    </p>
                  </div>
                </div>
                
                <div className="bg-slate-800 rounded-lg p-4 space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                    </svg>
                    <span className="text-gray-300">
                      <span className="font-semibold text-white">Code EAN:</span> {unreferencedProduct.ean}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-gray-300">
                      <span className="font-semibold text-white">Date:</span> {new Date(unreferencedProduct.captureDate).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="text-gray-300">
                      <span className="font-semibold text-white">Territoire:</span> {unreferencedProduct.territoire}
                    </span>
                  </div>
                </div>
                
                <div className="mt-4 p-3 bg-blue-900/30 border border-blue-700 rounded-lg">
                  <p className="text-blue-200 text-sm">
                    💡 <strong>Possibilité d'ajout futur</strong> - Ce produit pourra être ajouté à notre base de données 
                    lors d'une prochaine observation citoyenne.
                  </p>
                </div>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={handleReset}
                  className="flex-1 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-semibold transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={() => {
                    handleReset();
                    setShowScanner(true);
                  }}
                  className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
                >
                  Scanner à nouveau
                </button>
              </div>
            </div>
          )}

          {/* Success State - Show Product */}
          {scanState === 'success' && productData && (
            <div className="space-y-4">
              <ProductDetails 
                product={productData}
                onClose={handleReset}
              />
              <button
                onClick={handleReset}
                className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
              >
                Scanner un autre produit
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Barcode Scanner Modal */}
      {showScanner && (
        <BarcodeScanner
          onScan={handleScan}
          onClose={() => setShowScanner(false)}
        />
      )}
    </div>
  );
}