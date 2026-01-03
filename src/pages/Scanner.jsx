import { useState } from 'react';
import BarcodeScanner from '../components/BarcodeScanner';
import ProductDetails from '../components/products/ProductDetails';
import { lookupProductByEan } from '../services/eanProductService';
import { toProductViewModel } from '../services/productViewModelService';
import { DEFAULT_SCANNER_SETTINGS, logStateTransition } from '../types/scan';

export default function Scanner() {
  const [showScanner, setShowScanner] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [productData, setProductData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [scanState, setScanState] = useState('idle');
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState(DEFAULT_SCANNER_SETTINGS);
  
  // State transition helper with logging
  const transitionState = (newState, context) => {
    logStateTransition(scanState, newState, context);
    setScanState(newState);
  };

  const handleScan = async (code) => {
    if (import.meta.env.DEV) {
      console.warn('Scanned code:', code);
    }
    
    // OPTIMIZATION 2: Conditional OCR
    // EAN detected → skip OCR entirely
    // OCR is only used as fallback in ScanOCR page when barcode detection fails
    console.info('[SCAN_PERF] EAN detected, skipping OCR:', code);
    
    setScanResult(code);
    setShowScanner(false);
    setLoading(true);
    setError(null);
    transitionState('processing', { code });

    try {
      const result = await lookupProductByEan(code, {
        territoire: 'martinique',
        source: 'scan_utilisateur'
      });

      if (result.success && result.product) {
        const viewModel = toProductViewModel(result.product);
        setProductData(viewModel);
        transitionState('success', { productName: viewModel.nom });
      } else {
        transitionState('not_found', { code });
        handleProductNotFound(code);
      }
    } catch (err) {
      console.error('Product lookup error:', err);
      transitionState('error', { error: err.message });
      setError('Une erreur s\'est produite lors de la recherche du produit');
    } finally {
      setLoading(false);
    }
  };
  
  const handleProductNotFound = (code) => {
    const behavior = settings.notFoundBehavior;
    
    switch (behavior) {
      case 'show_search':
        setError(`Produit ${code} non trouvé dans notre base de données. Vous pouvez effectuer une recherche manuelle.`);
        break;
      case 'show_message':
        setError(`Produit ${code} non référencé.`);
        break;
      case 'save_for_review':
        setError(`Produit ${code} non trouvé. Le scan a été enregistré localement pour revue.`);
        // Could implement local storage here
        if (typeof window !== 'undefined' && window.localStorage) {
          const saved = JSON.parse(localStorage.getItem('unrecognized_scans') || '[]');
          saved.push({ code, timestamp: Date.now() });
          localStorage.setItem('unrecognized_scans', JSON.stringify(saved));
        }
        break;
      case 'suggest_contribution':
        setError(`Produit ${code} non trouvé. Vous pouvez contribuer en ajoutant ses informations.`);
        break;
      default:
        setError('Produit non trouvé dans notre base de données');
    }
  };

  const handleReset = () => {
    setScanResult(null);
    setProductData(null);
    setError(null);
    transitionState('idle', { trigger: 'user_reset' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-slate-900 rounded-2xl p-6 shadow-lg">
          <h1 className="text-3xl font-bold text-white mb-6">📷 Scanner Code-Barres</h1>
          
          {/* Settings Button */}
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="mb-4 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm transition-colors"
          >
            ⚙️ {showSettings ? 'Masquer' : 'Afficher'} les paramètres
          </button>
          
          {/* Settings Panel */}
          {showSettings && (
            <div className="mb-6 p-4 bg-slate-800 border border-slate-700 rounded-lg space-y-4">
              <h3 className="text-white font-semibold mb-3">⚙️ Paramètres du scanner</h3>
              
              {/* Scan Timeout */}
              <div>
                <label className="block text-sm text-gray-300 mb-2">
                  Délai d'attente du scan (secondes)
                </label>
                <input
                  type="range"
                  min="5"
                  max="30"
                  step="5"
                  value={(settings.scanner.scanTimeout || 15000) / 1000}
                  onChange={(e) => setSettings({
                    ...settings,
                    scanner: {
                      ...settings.scanner,
                      scanTimeout: parseInt(e.target.value) * 1000
                    }
                  })}
                  className="w-full"
                />
                <span className="text-xs text-gray-400">
                  {(settings.scanner.scanTimeout || 15000) / 1000}s
                </span>
              </div>
              
              {/* Not Found Behavior */}
              <div>
                <label className="block text-sm text-gray-300 mb-2">
                  Comportement si produit non trouvé
                </label>
                <select
                  value={settings.notFoundBehavior}
                  onChange={(e) => setSettings({
                    ...settings,
                    notFoundBehavior: e.target.value
                  })}
                  className="w-full px-3 py-2 bg-slate-900 text-white border border-slate-600 rounded-lg focus:outline-none focus:border-blue-500"
                >
                  <option value="show_search">Proposer une recherche manuelle</option>
                  <option value="show_message">Afficher un message seulement</option>
                  <option value="save_for_review">Enregistrer pour revue ultérieure</option>
                  <option value="suggest_contribution">Suggérer de contribuer</option>
                </select>
              </div>
              
              {/* Debug Logging */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="debugLogging"
                  checked={settings.scanner.enableDebugLogging || false}
                  onChange={(e) => setSettings({
                    ...settings,
                    scanner: {
                      ...settings.scanner,
                      enableDebugLogging: e.target.checked
                    }
                  })}
                  className="rounded"
                />
                <label htmlFor="debugLogging" className="text-sm text-gray-300">
                  Activer les logs de débogage
                </label>
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
          {!scanResult && !loading && (
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

          {/* Loading State */}
          {loading && (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-4 border-blue-500 mb-4"></div>
              <p className="text-white text-lg font-semibold">Recherche en cours...</p>
              <p className="text-gray-400 text-sm mt-2">Code scanné: {scanResult}</p>
            </div>
          )}

          {/* Error State */}
          {error && (
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

          {/* Success State - Show Product */}
          {productData && (
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
          config={settings.scanner}
        />
      )}
    </div>
  );
}