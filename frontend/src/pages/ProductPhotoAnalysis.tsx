/**
 * Product Photo Analysis Page - v1.0.0
 *
 * Allows users to:
 * 1. Take a photo of a product
 * 2. Analyze ingredients via OCR
 * 3. Get comprehensive product information
 * 4. View price trends
 * 5. Display complete product sheet
 *
 * Conforme aux principes institutionnels
 */

import { useState, useRef } from 'react';
import toast from 'react-hot-toast';
import { Camera, Upload, ArrowLeft, Loader } from 'lucide-react';
import {
  analyzeProductPhoto,
  type ProductPhotoAnalysisResult,
} from '../services/productPhotoAnalysisService';
import ComprehensiveProductSheet from '../components/ComprehensiveProductSheet';
import EnhancedCamera from '../components/EnhancedCamera';
import { useFeedback } from '../services/feedbackService';

export default function ProductPhotoAnalysis() {
  const [showCamera, setShowCamera] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<ProductPhotoAnalysisResult | null>(null);
  const [showProductSheet, setShowProductSheet] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const feedback = useFeedback();

  /**
   * Handle photo capture from camera
   */
  const handleCameraCapture = async (imageData: string) => {
    setCapturedImage(imageData);
    setShowCamera(false);
    await analyzePhoto(imageData);
  };

  /**
   * Handle photo upload from file
   */
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file type
    if (!file.type.startsWith('image/')) {
      toast.error('Veuillez sélectionner une image');
      return;
    }

    // Convert to base64
    const reader = new FileReader();
    reader.onload = async (e) => {
      const imageData = e.target?.result as string;
      setCapturedImage(imageData);
      await analyzePhoto(imageData);
    };
    reader.readAsDataURL(file);
  };

  /**
   * Analyze the photo
   */
  const analyzePhoto = async (imageData: string) => {
    setIsAnalyzing(true);
    feedback.onDetection();

    try {
      const result = await analyzeProductPhoto(imageData, {
        territoire: 'martinique',
        includeHistory: true,
      });

      setAnalysisResult(result);

      if (result.success && result.productSheet) {
        feedback.onSuccess();
        setShowProductSheet(true);
      } else if (result.success && result.ingredients && result.ingredients.length > 0) {
        // Partial success - ingredients found but no complete sheet
        feedback.onSuccess();
      } else {
        feedback.onError();
      }
    } catch (error) {
      console.error('Analysis error:', error);
      feedback.onError();
      setAnalysisResult({
        success: false,
        error: "Erreur lors de l'analyse de la photo",
        confidenceScore: 0,
        ocrQuality: 'poor',
        analysisTimestamp: new Date(),
        processingTime: 0,
        warnings: ['Une erreur technique est survenue'],
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  /**
   * Reset and start over
   */
  const handleReset = () => {
    setAnalysisResult(null);
    setCapturedImage(null);
    setShowProductSheet(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      {/* Camera modal */}
      {showCamera && (
        <EnhancedCamera
          onCapture={handleCameraCapture}
          onClose={() => setShowCamera(false)}
          enableQualityAnalysis
          enableFeedback
        />
      )}

      {/* Product sheet modal */}
      {showProductSheet && analysisResult?.productSheet && (
        <ComprehensiveProductSheet
          productSheet={analysisResult.productSheet}
          confidenceScore={analysisResult.confidenceScore}
          ocrQuality={analysisResult.ocrQuality}
          warnings={analysisResult.warnings}
          onClose={() => setShowProductSheet(false)}
        />
      )}

      {/* Main content */}
      <div className="max-w-4xl mx-auto p-4">
        {/* Header */}
        <div className="mb-6 flex items-center gap-4">
          <button
            onClick={() => window.history.back()}
            className="p-2 text-gray-400 hover:text-white transition-colors"
            aria-label="Retour"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-white">📸 Analyse Photo Produit</h1>
            <p className="text-gray-400 text-sm mt-1">
              Scannez un produit pour obtenir toutes ses informations
            </p>
          </div>
        </div>

        {/* Institutional disclaimer with micro-reassurance */}
        <div className="mb-6 p-4 bg-blue-900/30 border border-blue-700 rounded-lg">
          <p className="text-blue-200 text-sm mb-2">
            <strong>📸 Reconnaissance assistée • Confirmation humaine possible</strong>
          </p>
          <p className="text-blue-200 text-sm">
            Cette fonctionnalité analyse les informations visibles sur l'emballage via OCR. Les
            données sont informatives et non contractuelles. Précision variable selon la qualité de
            la photo.
          </p>
        </div>

        {/* Initial state - Choose method */}
        {!capturedImage && !isAnalyzing && (
          <div className="space-y-4">
            <div className="bg-slate-900 rounded-2xl p-8 shadow-lg">
              <h2 className="text-xl font-semibold text-white mb-6 text-center">
                Comment souhaitez-vous capturer le produit ?
              </h2>

              <div className="grid md:grid-cols-2 gap-4">
                {/* Camera option */}
                <button
                  onClick={() => setShowCamera(true)}
                  className="p-6 bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 rounded-xl transition-all transform hover:scale-105 shadow-lg"
                >
                  <Camera className="w-12 h-12 mx-auto mb-3 text-white" />
                  <h3 className="text-white font-semibold mb-2">Prendre une photo</h3>
                  <p className="text-blue-100 text-sm">
                    Utilisez la caméra avec guidage intelligent
                  </p>
                  <div className="mt-3 text-green-300 text-xs font-medium">
                    ✓ Analyse en temps réel
                  </div>
                </button>

                {/* Upload option */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="p-6 bg-gradient-to-br from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 rounded-xl transition-all transform hover:scale-105 shadow-lg"
                >
                  <Upload className="w-12 h-12 mx-auto mb-3 text-white" />
                  <h3 className="text-white font-semibold mb-2">Importer une photo</h3>
                  <p className="text-purple-100 text-sm">Choisir une photo existante</p>
                  <div className="mt-3 text-purple-200 text-xs font-medium">
                    ✓ Depuis la galerie
                  </div>
                </button>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>
            </div>

            {/* Tips */}
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
              <h3 className="text-white font-semibold mb-3 text-sm">
                💡 Conseils pour une meilleure analyse
              </h3>
              <ul className="text-gray-300 text-xs space-y-2 list-disc list-inside">
                <li>
                  Photographiez la <strong>liste des ingrédients</strong> de face
                </li>
                <li>
                  Assurez-vous que le <strong>tableau nutritionnel</strong> est visible
                </li>
                <li>Bon éclairage et mise au point nette</li>
                <li>Évitez les reflets sur l'emballage</li>
                <li>
                  Si possible, incluez le <strong>code-barres EAN</strong>
                </li>
              </ul>
            </div>
          </div>
        )}

        {/* Analyzing state */}
        {isAnalyzing && (
          <div className="bg-slate-900 rounded-2xl p-12 shadow-lg text-center">
            <Loader className="w-16 h-16 mx-auto mb-4 text-blue-500 animate-spin" />
            <h2 className="text-white text-xl font-semibold mb-2">🔍 Analyse en cours...</h2>
            <p className="text-gray-400 text-sm mb-4">Extraction des informations du produit</p>
            <div className="flex justify-center gap-2 text-xs text-gray-500">
              <span className="animate-pulse">OCR en cours</span>
              <span>•</span>
              <span className="animate-pulse" style={{ animationDelay: '0.2s' }}>
                Détection ingrédients
              </span>
              <span>•</span>
              <span className="animate-pulse" style={{ animationDelay: '0.4s' }}>
                Analyse nutrition
              </span>
            </div>
          </div>
        )}

        {/* Analysis result */}
        {analysisResult && !isAnalyzing && (
          <div className="space-y-4">
            {/* Result summary card */}
            <div
              className={`rounded-2xl p-6 shadow-lg ${
                analysisResult.success
                  ? 'bg-gradient-to-br from-green-900/30 to-green-800/30 border border-green-700'
                  : 'bg-gradient-to-br from-red-900/30 to-red-800/30 border border-red-700'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className="flex-1">
                  <h2
                    className={`text-2xl font-bold mb-2 ${
                      analysisResult.success ? 'text-green-100' : 'text-red-100'
                    }`}
                  >
                    {analysisResult.success ? '✅ Analyse réussie' : '❌ Analyse incomplète'}
                  </h2>

                  {analysisResult.productName && (
                    <p className="text-white text-lg mb-1">{analysisResult.productName}</p>
                  )}
                  {analysisResult.brand && (
                    <p className="text-gray-300 text-sm mb-3">Marque: {analysisResult.brand}</p>
                  )}

                  {/* Quality indicators */}
                  <div className="flex gap-2 flex-wrap mb-3">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        analysisResult.ocrQuality === 'excellent'
                          ? 'bg-green-500/30 text-green-200'
                          : analysisResult.ocrQuality === 'good'
                            ? 'bg-blue-500/30 text-blue-200'
                            : analysisResult.ocrQuality === 'fair'
                              ? 'bg-yellow-500/30 text-yellow-200'
                              : 'bg-red-500/30 text-red-200'
                      }`}
                    >
                      OCR: {analysisResult.ocrQuality}
                    </span>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        analysisResult.confidenceScore >= 80
                          ? 'bg-green-500/30 text-green-200'
                          : analysisResult.confidenceScore >= 60
                            ? 'bg-yellow-500/30 text-yellow-200'
                            : 'bg-red-500/30 text-red-200'
                      }`}
                    >
                      Confiance: {analysisResult.confidenceScore}%
                    </span>
                    {analysisResult.ean && (
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/30 text-blue-200">
                        EAN: {analysisResult.ean}
                      </span>
                    )}
                  </div>

                  {/* Quick stats */}
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {analysisResult.ingredients && analysisResult.ingredients.length > 0 && (
                      <div className="text-gray-300">
                        📝 {analysisResult.ingredients.length} ingrédients détectés
                      </div>
                    )}
                    {analysisResult.nutritionalValues && (
                      <div className="text-gray-300">🥗 Informations nutritionnelles</div>
                    )}
                    {analysisResult.detectedPrice && (
                      <div className="text-gray-300">
                        💰 Prix: {analysisResult.detectedPrice.toFixed(2)} €
                      </div>
                    )}
                    {analysisResult.processingTime && (
                      <div className="text-gray-400 text-xs">
                        ⚡ Analysé en {(analysisResult.processingTime / 1000).toFixed(1)}s
                      </div>
                    )}
                  </div>
                </div>

                {capturedImage && (
                  <div className="w-32 h-32 rounded-lg overflow-hidden bg-gray-900 flex-shrink-0">
                    <img src={capturedImage} alt="Capture" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              {analysisResult.productSheet && (
                <button
                  onClick={() => setShowProductSheet(true)}
                  className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
                >
                  📋 Voir la fiche complète
                </button>
              )}
              <button
                onClick={handleReset}
                className="flex-1 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-semibold transition-colors"
              >
                📷 Analyser un autre produit
              </button>
            </div>

            {/* Warnings */}
            {analysisResult.warnings.length > 0 && (
              <div className="bg-yellow-900/30 border border-yellow-700 rounded-lg p-4">
                <h3 className="text-yellow-200 font-semibold mb-2 text-sm">
                  ⚠️ Limites de l'analyse
                </h3>
                <ul className="text-yellow-300 text-xs space-y-1">
                  {analysisResult.warnings.map((warning, idx) => (
                    <li key={idx}>• {warning}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
