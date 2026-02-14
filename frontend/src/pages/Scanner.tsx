import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BarcodeScanner from '../components/BarcodeScanner';
import ProductDetails from '../components/products/ProductDetails';
import { useSearchHistory } from '../hooks/useSearchHistory';
import { lookupProductByEan } from '../services/eanProductService';
import { fetchOffProductByBarcode } from '../services/openFoodFacts';
import { toProductViewModel } from '../services/productViewModelService';
import type { ScanState, ScannerOptions } from '../types/scan';
import type { ProductViewModel } from '../types/productViewModel';
import { safeLocalStorage } from '../utils/safeLocalStorage';

export default function Scanner() {
  const navigate = useNavigate();
  const [showScanner, setShowScanner] = useState(false);
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [productData, setProductData] = useState<ProductViewModel | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scanState, setScanState] = useState<ScanState>('idle');
  const { addEntry } = useSearchHistory();
  
  // Settings panel state
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState<ScannerOptions>({
    timeout: 15000,
    notFoundBehavior: 'manual_search',
    enableDebugLogging: import.meta.env.DEV, // Enable debug logging in development
    enableOcrFallback: true, // Enable OCR fallback by default
  });

  const handleScan = async (code: string) => {
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
    setScanState('processing');

    try {
      const result = await lookupProductByEan(code, {
        territoire: 'martinique',
        source: 'scan_utilisateur'
      });

      if (result.success && result.product) {
        const viewModel = toProductViewModel(result.product);
        setProductData(viewModel);
        setScanState('success');

        const needsOffEnrichment =
          viewModel.nom === 'Produit inconnu' ||
          viewModel.marque === 'Non spécifiée' ||
          !viewModel.imageUrl;

        if (needsOffEnrichment) {
          void fetchOffProductByBarcode(code).then((offResult) => {
            if (offResult.status === 'OK' && offResult.product) {
              setProductData((current) => {
                if (!current) {
                  return current;
                }

                return {
                  ...current,
                  nom: current.nom === 'Produit inconnu' ? (offResult.product?.name ?? current.nom) : current.nom,
                  marque:
                    current.marque === 'Non spécifiée'
                      ? (offResult.product?.brands ?? current.marque)
                      : current.marque,
                  imageUrl: current.imageUrl ?? offResult.product?.imageUrl,
                  hasImage: Boolean(current.imageUrl ?? offResult.product?.imageUrl),
                };
              });
            } else if (offResult.status === 'ERROR' && import.meta.env.DEV) {
              console.debug('[OFF] lookup error', offResult.error);
            }
          });
        }

        addEntry({
          label: viewModel.nom || `EAN ${code}`,
          type: 'barcode',
          barcode: code,
          query: viewModel.nom || undefined,
        });
      } else {
        setError('Produit non trouvé dans notre base de données');
        setScanState('not_found');
        addEntry({
          label: `EAN ${code}`,
          type: 'barcode',
          barcode: code,
        });
      }
    } catch (err) {
      console.error('Product lookup error:', err);
      setError('Une erreur s\'est produite lors de la recherche du produit');
      setScanState('error');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setScanResult(null);
    setProductData(null);
    setError(null);
    setScanState('idle');
  };

  const handleNotFoundAction = () => {
    const behavior = settings.notFoundBehavior;
    
    if (behavior === 'manual_search') {
      // Use React Router navigate instead of window.location
      const searchQuery = encodeURIComponent(scanResult || '');
      navigate(`/recherche?q=${searchQuery}`);
    } else if (behavior === 'local_save') {
      // Save to local storage for review
      const savedScans = safeLocalStorage.getJSON<Array<{code: string; timestamp: string}>>('unrecognizedScans', []);
      savedScans.push({
        code: scanResult,
        timestamp: new Date().toISOString(),
      });
      safeLocalStorage.setJSON('unrecognizedScans', savedScans);
      alert('Code enregistré localement pour revue ultérieure');
      handleReset();
    } else if (behavior === 'show_empty') {
      // Show empty product page (already handled by not_found state)
      console.log('Showing empty product page');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-slate-900 rounded-2xl p-6 shadow-lg">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-white">📷 Scanner Code-Barres</h1>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 text-gray-400 hover:text-white transition-colors"
              aria-label="Paramètres"
            >
              ⚙️
            </button>
          </div>
          
          {/* Settings Panel */}
          {showSettings && (
            <div className="mb-6 p-4 bg-slate-800 border border-slate-700 rounded-lg">
              <h3 className="text-white font-semibold mb-4">⚙️ Paramètres de scan</h3>
              
              {/* Timeout setting */}
              <div className="mb-4">
                <label className="block text-gray-300 text-sm mb-2">
                  Délai d'attente (secondes)
                </label>
                <input
                  type="range"
                  min="5"
                  max="30"
                  step="5"
                  value={(settings.timeout ?? 15000) / 1000}
                  onChange={(e) => setSettings({ ...settings, timeout: parseInt(e.target.value) * 1000 })}
                  className="w-full"
                />
                <span className="text-gray-400 text-xs">{(settings.timeout ?? 15000) / 1000}s</span>
              </div>

              {/* Not found behavior */}
              <div className="mb-4">
                <label className="block text-gray-300 text-sm mb-2">
                  Si produit non référencé
                </label>
                <select
                  value={settings.notFoundBehavior}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === 'manual_search' || value === 'local_save' || value === 'show_empty') {
                      setSettings({ ...settings, notFoundBehavior: value });
                    }
                  }}
                  className="w-full bg-slate-700 text-white border border-slate-600 px-3 py-2 rounded-lg"
                >
                  <option value="manual_search">Proposer une recherche manuelle</option>
                  <option value="local_save">Enregistrer localement</option>
                  <option value="show_empty">Afficher page vide</option>
                </select>
              </div>

              {/* Debug logging */}
              <div className="mb-4">
                <label className="flex items-center gap-2 text-gray-300 text-sm">
                  <input
                    type="checkbox"
                    checked={settings.enableDebugLogging}
                    onChange={(e) => setSettings({ ...settings, enableDebugLogging: e.target.checked })}
                    className="rounded"
                  />
                  Activer le logging détaillé (console)
                </label>
              </div>

              {/* OCR Fallback */}
              <div className="mb-4">
                <label className="flex items-center gap-2 text-gray-300 text-sm">
                  <input
                    type="checkbox"
                    checked={settings.enableOcrFallback}
                    onChange={(e) => setSettings({ ...settings, enableOcrFallback: e.target.checked })}
                    className="rounded"
                  />
                  Activer la reconnaissance optique (OCR)
                </label>
                <p className="text-xs text-gray-400 mt-1 ml-6">
                  L'OCR aide à détecter les codes-barres sur des images floues
                </p>
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
              <p className="text-gray-500 text-xs mt-1">État: {scanState}</p>
            </div>
          )}

          {/* Error State - Product Not Found */}
          {scanState === 'not_found' && error && (
            <div className="space-y-4">
              <div className="bg-orange-900/20 border border-orange-700 rounded-lg p-6 text-center">
                <svg className="w-12 h-12 mx-auto mb-3 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-orange-200 font-semibold mb-2">Produit non référencé</p>
                <p className="text-orange-300 text-sm mb-4">Code scanné: {scanResult}</p>
                <p className="text-orange-300 text-sm mb-4">
                  Ce produit n'est pas encore dans notre base de données. Vous pouvez:
                </p>
                
                <div className="space-y-2">
                  {settings.notFoundBehavior === 'manual_search' && (
                    <button
                      onClick={handleNotFoundAction}
                      className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
                    >
                      🔍 Rechercher manuellement
                    </button>
                  )}
                  {settings.notFoundBehavior === 'local_save' && (
                    <button
                      onClick={handleNotFoundAction}
                      className="w-full px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-colors"
                    >
                      💾 Enregistrer pour revue
                    </button>
                  )}
                  <button
                    onClick={handleReset}
                    className="w-full px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-semibold transition-colors"
                  >
                    Scanner un autre produit
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Error State - General Error */}
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

          {/* Success State - Show Product */}
          {productData && scanState === 'success' && (
            <div className="space-y-4">
              <div className="bg-green-900/20 border border-green-700 rounded-lg p-3 text-center mb-4">
                <p className="text-green-200 text-sm">
                  ✅ Produit trouvé avec succès!
                </p>
              </div>
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
          options={settings}
        />
      )}
    </div>
  );
}
