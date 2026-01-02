import { useState } from 'react';
import { extractTextFromImage } from '../services/ocrService';
import OCRResultView from '../components/OCRResultView';
import { SCAN_STATE_MESSAGES } from '../types/scan';

export default function ScanOCR() {
  const [image, setImage] = useState(null);
  const [ocrResult, setOcrResult] = useState(null);
  const [scanState, setScanState] = useState('idle');
  const [error, setError] = useState(null);
  const [showSettings, setShowSettings] = useState(false);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const startTime = Date.now();
    
    console.info('[SCAN]', {
      step: 'ocr_upload_initiated',
      fileName: file.name,
      fileSize: file.size,
      timestamp: new Date().toISOString()
    });

    setImage(URL.createObjectURL(file));
    setScanState('ocr_processing');
    setError(null);
    setOcrResult(null);

    try {
      const result = await extractTextFromImage(file);
      const durationMs = Date.now() - startTime;
      
      if (result.success) {
        console.info('[SCAN]', {
          step: 'ocr_success',
          confidence: result.confidence,
          textLength: result.rawText?.length || 0,
          durationMs
        });
        
        setOcrResult(result);
        setScanState(result.rawText && result.rawText.trim() ? 'success' : 'no_result');
      } else {
        console.info('[SCAN]', {
          step: 'ocr_no_result',
          error: result.error,
          durationMs
        });
        
        setError(result.error || 'Erreur lors de l\'extraction du texte');
        setScanState('no_result');
      }
    } catch (err) {
      const durationMs = Date.now() - startTime;
      
      console.error('OCR error:', err);
      console.info('[SCAN]', {
        step: 'ocr_error',
        error: err.message,
        durationMs
      });
      
      setError('Une erreur s\'est produite lors de l\'analyse de l\'image');
      setScanState('error');
    }
  };

  const handleRetry = () => {
    setImage(null);
    setOcrResult(null);
    setError(null);
    setScanState('idle');
    
    console.info('[SCAN]', {
      step: 'ocr_reset',
      timestamp: new Date().toISOString()
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-slate-900 rounded-2xl p-6 shadow-lg">
          {/* Header with Settings Button */}
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-white">📸 Scanner Ingrédients (OCR)</h1>
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
                Paramètres OCR
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-2 text-gray-300">
                  <svg className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <div>
                    <p className="font-semibold text-white">Mode import photo</p>
                    <p className="text-xs text-gray-400">Choisissez une photo depuis votre galerie pour extraire le texte</p>
                  </div>
                </div>
                <div className="flex items-start gap-2 text-gray-300">
                  <svg className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <div>
                    <p className="font-semibold text-white">Confidentialité</p>
                    <p className="text-xs text-gray-400">L'image est traitée localement. Aucune donnée envoyée à un serveur.</p>
                  </div>
                </div>
                <div className="flex items-start gap-2 text-gray-300">
                  <svg className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className="font-semibold text-white">Conseils</p>
                    <p className="text-xs text-gray-400">Bon éclairage, texte net, évitez reflets et ombres</p>
                  </div>
                </div>
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
          {scanState === 'idle' && !ocrResult && !error && (
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

          {/* Loading/OCR Processing State */}
          {scanState === 'ocr_processing' && (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-4 border-blue-500 mb-4"></div>
              <p className="text-white text-lg font-semibold">{SCAN_STATE_MESSAGES.ocr_processing}</p>
              <p className="text-gray-400 text-sm mt-2">Extraction du texte de l'image</p>
            </div>
          )}

          {/* Error State */}
          {(scanState === 'error' || (scanState === 'no_result' && error)) && (
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

          {/* No Result State for OCR with no text */}
          {scanState === 'no_result' && !error && !ocrResult?.rawText && (
            <div className="space-y-4">
              <div className="bg-orange-900/20 border border-orange-700 rounded-lg p-6 text-center">
                <svg className="w-12 h-12 mx-auto mb-3 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-orange-200 font-semibold mb-2">Aucun texte détecté</p>
                <p className="text-orange-300 text-sm">Informations partielles disponibles</p>
              </div>
              <button
                onClick={handleRetry}
                className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
              >
                Réessayer avec une autre image
              </button>
            </div>
          )}

          {/* Success State - Show Results */}
          {(scanState === 'success' || scanState === 'no_result') && ocrResult && (
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
