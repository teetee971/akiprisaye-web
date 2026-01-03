import { useState } from 'react';
import { extractTextFromImage } from '../services/ocrService';
import OCRResultView from '../components/OCRResultView';
import { DEFAULT_SCANNER_SETTINGS, logStateTransition } from '../types/scan';

export default function ScanOCR() {
  const [image, setImage] = useState(null);
  const [ocrResult, setOcrResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [ocrState, setOcrState] = useState('idle');
  const [error, setError] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState(DEFAULT_SCANNER_SETTINGS);
  
  // State transition helper with logging
  const transitionState = (newState, context) => {
    logStateTransition(ocrState, newState, context);
    setOcrState(newState);
  };

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Check if OCR is enabled
    if (!settings.ocr.enabled) {
      setError('L\'OCR est désactivé dans les paramètres');
      return;
    }

    setImage(URL.createObjectURL(file));
    setLoading(true);
    setError(null);
    setOcrResult(null);
    transitionState('preprocessing', { fileSize: file.size });

    // OPTIMIZATION 3: Async non-blocking OCR
    // Use setTimeout to allow UI to update immediately
    setTimeout(async () => {
      try {
        transitionState('ocr_processing', {});
        
        const result = await extractTextFromImage(file);
        
        if (result.success) {
          setOcrResult(result);
          transitionState('complete', { 
            confidence: result.confidence,
            textLength: result.rawText?.length 
          });
        } else {
          // Handle timeout or error gracefully
          if (result.timeoutTriggered) {
            transitionState('timeout', { duration: result.processingTime });
            setError('Le traitement a pris trop de temps. Le produit pourrait ne pas être référencé dans notre base.');
          } else {
            transitionState('error', { error: result.error });
            setError(result.error || 'Erreur lors de l\'extraction du texte');
          }
        }
      } catch (err) {
        console.error('OCR error:', err);
        transitionState('error', { error: err.message });
        setError('Une erreur s\'est produite lors de l\'analyse de l\'image');
      } finally {
        setLoading(false);
      }
    }, 0);
  };

  const handleRetry = () => {
    setImage(null);
    setOcrResult(null);
    setError(null);
    transitionState('idle', { trigger: 'user_retry' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-slate-900 rounded-2xl p-6 shadow-lg">
          <h1 className="text-3xl font-bold text-white mb-6">📸 Scanner Ingrédients (OCR)</h1>
          
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
              <h3 className="text-white font-semibold mb-3">⚙️ Paramètres OCR</h3>
              
              {/* Enable OCR */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="enableOCR"
                  checked={settings.ocr.enabled !== false}
                  onChange={(e) => setSettings({
                    ...settings,
                    ocr: {
                      ...settings.ocr,
                      enabled: e.target.checked
                    }
                  })}
                  className="rounded"
                />
                <label htmlFor="enableOCR" className="text-sm text-gray-300">
                  Activer l'OCR
                </label>
              </div>
              
              {/* Confidence Threshold */}
              <div>
                <label className="block text-sm text-gray-300 mb-2">
                  Seuil de confiance (%)
                </label>
                <input
                  type="range"
                  min="30"
                  max="100"
                  step="10"
                  value={settings.ocr.confidenceThreshold || 60}
                  onChange={(e) => setSettings({
                    ...settings,
                    ocr: {
                      ...settings.ocr,
                      confidenceThreshold: parseInt(e.target.value)
                    }
                  })}
                  className="w-full"
                />
                <span className="text-xs text-gray-400">
                  {settings.ocr.confidenceThreshold || 60}%
                </span>
              </div>
              
              {/* OCR Timeout */}
              <div>
                <label className="block text-sm text-gray-300 mb-2">
                  Délai d'attente OCR (secondes)
                </label>
                <input
                  type="range"
                  min="2"
                  max="10"
                  step="1"
                  value={(settings.ocr.timeout || 4000) / 1000}
                  onChange={(e) => setSettings({
                    ...settings,
                    ocr: {
                      ...settings.ocr,
                      timeout: parseInt(e.target.value) * 1000
                    }
                  })}
                  className="w-full"
                />
                <span className="text-xs text-gray-400">
                  {(settings.ocr.timeout || 4000) / 1000}s
                </span>
              </div>
              
              {/* Preprocessing Options */}
              <div className="space-y-2">
                <p className="text-sm text-gray-300 mb-2">Options de prétraitement</p>
                
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="enhanceContrast"
                    checked={settings.ocr.preprocessing?.enhanceContrast !== false}
                    onChange={(e) => setSettings({
                      ...settings,
                      ocr: {
                        ...settings.ocr,
                        preprocessing: {
                          ...settings.ocr.preprocessing,
                          enhanceContrast: e.target.checked
                        }
                      }
                    })}
                    className="rounded"
                  />
                  <label htmlFor="enhanceContrast" className="text-xs text-gray-400">
                    Améliorer le contraste
                  </label>
                </div>
                
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="grayscale"
                    checked={settings.ocr.preprocessing?.grayscale !== false}
                    onChange={(e) => setSettings({
                      ...settings,
                      ocr: {
                        ...settings.ocr,
                        preprocessing: {
                          ...settings.ocr.preprocessing,
                          grayscale: e.target.checked
                        }
                      }
                    })}
                    className="rounded"
                  />
                  <label htmlFor="grayscale" className="text-xs text-gray-400">
                    Convertir en niveaux de gris
                  </label>
                </div>
                
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="autoRotate"
                    checked={settings.ocr.preprocessing?.autoRotate !== false}
                    onChange={(e) => setSettings({
                      ...settings,
                      ocr: {
                        ...settings.ocr,
                        preprocessing: {
                          ...settings.ocr.preprocessing,
                          autoRotate: e.target.checked
                        }
                      }
                    })}
                    className="rounded"
                  />
                  <label htmlFor="autoRotate" className="text-xs text-gray-400">
                    Rotation automatique
                  </label>
                </div>
              </div>
              
              {/* Debug Logging */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="debugLoggingOCR"
                  checked={settings.ocr.enableDebugLogging || false}
                  onChange={(e) => setSettings({
                    ...settings,
                    ocr: {
                      ...settings.ocr,
                      enableDebugLogging: e.target.checked
                    }
                  })}
                  className="rounded"
                />
                <label htmlFor="debugLoggingOCR" className="text-sm text-gray-300">
                  Activer les logs de débogage
                </label>
              </div>
            </div>
          )}
          
          {/* Information Banner */}
          <div className="mb-6 p-4 bg-blue-900/30 border border-blue-700 rounded-lg">
            <p className="text-blue-200 text-sm">
              ℹ️ <strong>Extraction de texte uniquement</strong> - Cette fonctionnalité extrait le texte 
              visible sur les étiquettes produits (ingrédients, allergènes, mentions légales). 
              Aucune interprétation ou recommandation n'est fournie.
            </p>
          </div>

          {/* Initial State - Upload */}
          {!loading && !ocrResult && !error && (
            <div className="space-y-4">
              <div className="border-2 border-dashed border-slate-600 rounded-xl p-8 text-center">
                <svg className="w-16 h-16 mx-auto mb-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-white font-semibold mb-2">Sélectionnez une photo</p>
                <p className="text-gray-400 text-sm mb-4">Format: JPG, PNG, WEBP</p>
                <label className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold cursor-pointer transition-colors">
                  📷 Choisir une image
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleUpload}
                    className="hidden"
                  />
                </label>
              </div>
              
              {/* Instructions */}
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
                <h3 className="text-white font-semibold mb-2">💡 Conseils pour une meilleure lecture</h3>
                <ul className="text-gray-300 text-sm space-y-1 list-disc list-inside">
                  <li>Privilégiez un bon éclairage</li>
                  <li>Cadrez bien la zone de texte</li>
                  <li>Évitez les reflets et ombres</li>
                  <li>Tenez le téléphone stable</li>
                </ul>
              </div>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-4 border-blue-500 mb-4"></div>
              {ocrState === 'preprocessing' && (
                <>
                  <p className="text-white text-lg font-semibold">Préparation de l'image...</p>
                  <p className="text-gray-400 text-sm mt-2">Optimisation pour analyse rapide</p>
                </>
              )}
              {ocrState === 'ocr_processing' && (
                <>
                  <p className="text-white text-lg font-semibold">Lecture en cours...</p>
                  <p className="text-gray-400 text-sm mt-2">Extraction du texte de l'image</p>
                  {/* Progress bar - indeterminate */}
                  <div className="w-64 h-2 bg-gray-700 rounded-full mx-auto mt-4 overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full animate-pulse" style={{ width: '60%' }}></div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="space-y-4">
              <div className="bg-red-900/20 border border-red-700 rounded-lg p-6 text-center">
                <svg className="w-12 h-12 mx-auto mb-3 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-red-200 font-semibold mb-2">Erreur lors de l'analyse</p>
                <p className="text-red-300 text-sm">{error}</p>
              </div>
              <button
                onClick={handleRetry}
                className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
              >
                Réessayer
              </button>
            </div>
          )}

          {/* Success State - Show Results */}
          {ocrResult && (
            <div className="space-y-4">
              <OCRResultView 
                result={ocrResult} 
                onRetry={handleRetry}
              />
            </div>
          )}

          {/* Image Preview */}
          {image && !ocrResult && (
            <div className="mt-6">
              <h3 className="text-white font-semibold mb-2">Aperçu de l'image</h3>
              <img 
                src={image} 
                alt="Image sélectionnée" 
                className="w-full rounded-lg border border-slate-700"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
