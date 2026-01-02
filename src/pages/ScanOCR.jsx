import { useState } from 'react';
import Tesseract from 'tesseract.js';
import { OCR_MESSAGES } from '../constants/ocrMessages';
import { handleOCRError } from '../utils/errorHandler';

export default function ScanOCR() {
  const [image, setImage] = useState(null);
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasConsent, setHasConsent] = useState(false);
  const [showConsentError, setShowConsentError] = useState(false);
  const [metadata, setMetadata] = useState(null);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check consent first
    if (!hasConsent) {
      setShowConsentError(true);
      return;
    }

    setShowConsentError(false);
    setImage(URL.createObjectURL(file));
    setLoading(true);
    setResult(OCR_MESSAGES.processing.analyzing);

    const startTime = Date.now();

    try {
      const { data: { text, confidence } } = await Tesseract.recognize(file, 'fra', {
        logger: import.meta.env.DEV ? m => console.log(m) : () => {},
      });

      const processingTime = Date.now() - startTime;
      
      // Store metadata
      setMetadata({
        confidence: confidence || 0,
        processingTime,
        date: new Date().toLocaleString('fr-FR'),
        source: OCR_MESSAGES.metadata.imageSource
      });

      if (!text || text.trim().length === 0) {
        setResult(OCR_MESSAGES.result.empty.title + '\n\n' + 
          OCR_MESSAGES.result.empty.description + '\n\n' +
          OCR_MESSAGES.result.empty.suggestions.join('\n• '));
      } else {
        setResult(OCR_MESSAGES.result.success.warning + '\n\n' + text);
      }

    } catch (err) {
      const userError = handleOCRError(err);
      setResult('❌ ' + userError.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setImage(null);
    setResult('');
    setMetadata(null);
    setHasConsent(false);
    setShowConsentError(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-slate-900/80 backdrop-blur-sm rounded-2xl shadow-2xl p-6">
          <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Analyse OCR - Ingrédients
          </h2>
          <p className="text-gray-400 text-sm mb-6">
            Extraction automatique du texte présent sur les emballages
          </p>

          {/* Consent Notice */}
          <div className="mb-6 bg-blue-900/20 border border-blue-700/30 rounded-lg p-4">
            <h3 className="text-blue-200 font-semibold mb-2 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {OCR_MESSAGES.consent.notice.title}
            </h3>
            <ul className="text-blue-200 text-sm space-y-1 ml-6 list-disc">
              {OCR_MESSAGES.consent.notice.content.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          </div>

          {/* Consent Checkbox */}
          <div className="mb-6">
            <label className="flex items-start gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={hasConsent}
                onChange={(e) => {
                  setHasConsent(e.target.checked);
                  setShowConsentError(false);
                }}
                className="mt-1 w-5 h-5 text-blue-600 bg-slate-800 border-slate-600 rounded focus:ring-blue-500 focus:ring-2"
              />
              <span className="text-gray-300 group-hover:text-white transition-colors flex-1">
                {OCR_MESSAGES.consent.checkbox.label}
              </span>
            </label>
            {showConsentError && (
              <p className="mt-2 text-red-400 text-sm flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                {OCR_MESSAGES.consent.checkbox.required}
              </p>
            )}
          </div>

          {/* File Upload */}
          <div className="mb-6">
            <label className="block">
              <div className={`w-full px-6 py-4 rounded-lg font-semibold text-center cursor-pointer transition-all ${
                hasConsent 
                  ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                  : 'bg-gray-700 text-gray-400 cursor-not-allowed'
              }`}>
                <div className="flex items-center justify-center gap-2">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  {OCR_MESSAGES.actions.uploadImage}
                </div>
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handleUpload}
                disabled={!hasConsent}
                className="hidden"
              />
            </label>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="bg-blue-900/20 border border-blue-700/30 rounded-lg p-6 text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
              <p className="text-blue-200 font-semibold">{OCR_MESSAGES.processing.analyzing}</p>
            </div>
          )}

          {/* Image Preview */}
          {image && !loading && (
            <div className="mb-6">
              <h3 className="text-white font-semibold mb-3">Image analysée</h3>
              <img 
                src={image} 
                alt="Aperçu" 
                className="w-full rounded-lg border border-slate-700 shadow-lg" 
              />
            </div>
          )}

          {/* Results */}
          {result && !loading && (
            <div className="space-y-4">
              {/* Warning Banner */}
              <div className="bg-orange-50 dark:bg-orange-900/20 border-2 border-orange-200 dark:border-orange-700 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div className="flex-1">
                    <p className="font-bold text-orange-900 dark:text-orange-200 mb-1">
                      {OCR_MESSAGES.warnings.automaticDetection}
                    </p>
                    <p className="text-sm text-orange-800 dark:text-orange-300">
                      {OCR_MESSAGES.result.success.disclaimer}
                    </p>
                  </div>
                </div>
              </div>

              {/* Metadata */}
              {metadata && (
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="bg-slate-800/50 rounded-lg p-3">
                    <p className="text-gray-400">{OCR_MESSAGES.metadata.confidence}</p>
                    <p className="text-white font-semibold">{metadata.confidence.toFixed(0)}%</p>
                  </div>
                  <div className="bg-slate-800/50 rounded-lg p-3">
                    <p className="text-gray-400">{OCR_MESSAGES.metadata.processingTime}</p>
                    <p className="text-white font-semibold">{(metadata.processingTime / 1000).toFixed(1)}s</p>
                  </div>
                  <div className="bg-slate-800/50 rounded-lg p-3">
                    <p className="text-gray-400">{OCR_MESSAGES.metadata.date}</p>
                    <p className="text-white font-semibold">{metadata.date}</p>
                  </div>
                  <div className="bg-slate-800/50 rounded-lg p-3">
                    <p className="text-gray-400">{OCR_MESSAGES.metadata.source}</p>
                    <p className="text-white font-semibold text-xs">{metadata.source}</p>
                  </div>
                </div>
              )}

              {/* Result Text */}
              <div className="bg-slate-800/50 rounded-lg p-4">
                <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  {OCR_MESSAGES.result.sections.rawText}
                </h3>
                <pre className="text-gray-200 whitespace-pre-wrap font-mono text-sm bg-black/30 p-4 rounded">
                  {result}
                </pre>
              </div>

              {/* Disclaimer */}
              <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
                <p className="text-gray-300 text-sm">
                  ℹ️ {OCR_MESSAGES.warnings.dataObservation}
                </p>
                <p className="text-gray-400 text-xs mt-2">
                  {OCR_MESSAGES.warnings.noMedicalAdvice}
                </p>
              </div>

              {/* Reset Button */}
              <button
                onClick={handleReset}
                className="w-full px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Nouvelle analyse
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
