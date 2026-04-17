/**
 * OCR Result View Component
 * Part of PR #3 - OCR Ingredients Extension
 *
 * Displays OCR results with clear warning about automatic detection
 * NO health interpretation, NO nutritional analysis
 */

import { useState } from 'react';
import type { OCRResult } from '../services/ocrService';

interface OCRResultViewProps {
  result: OCRResult;
  onClose?: () => void;
  onRetry?: () => void;
}

export default function OCRResultView({ result, onClose, onRetry }: OCRResultViewProps) {
  const [activeTab, setActiveTab] = useState<'raw' | 'sections'>('sections');

  // Confidence badge styling
  const confidenceColor =
    result.confidence >= 80
      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
      : result.confidence >= 60
        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
        : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl overflow-hidden max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">Résultat OCR</h2>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-2xl leading-none"
            aria-label="Fermer"
          >
            ×
          </button>
        )}
      </div>

      <div className="p-6 space-y-4">
        {/* Warning Banner - Always visible */}
        <div className="bg-orange-50 dark:bg-orange-900/20 border-2 border-orange-200 dark:border-orange-700 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <svg
              className="w-6 h-6 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <div className="flex-1">
              <p className="font-bold text-orange-900 dark:text-orange-200 mb-1">
                Détection automatique
              </p>
              <p className="text-sm text-orange-800 dark:text-orange-300">
                Le texte a été extrait automatiquement et peut contenir des erreurs. Vérifiez
                toujours les informations sur l'emballage original.
              </p>
            </div>
          </div>
        </div>

        {/* Confidence & Processing Time */}
        <div className="flex items-center gap-3 flex-wrap">
          <div
            className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold ${confidenceColor}`}
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            Fiabilité: {result.confidence.toFixed(0)}%
          </div>

          <span className="text-sm text-gray-600 dark:text-gray-400">
            Traitement: {(result.processingTime / 1000).toFixed(1)}s
          </span>

          {result.fromCache && (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z"
                  clipRule="evenodd"
                />
              </svg>
              Cache
            </span>
          )}

          {result.timeoutTriggered && (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                  clipRule="evenodd"
                />
              </svg>
              Timeout
            </span>
          )}
        </div>

        {/* Tabs */}
        {result.sections && (
          <div className="flex border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setActiveTab('sections')}
              className={`px-4 py-2 font-semibold text-sm transition-colors ${
                activeTab === 'sections'
                  ? 'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              Sections détectées
            </button>
            <button
              onClick={() => setActiveTab('raw')}
              className={`px-4 py-2 font-semibold text-sm transition-colors ${
                activeTab === 'raw'
                  ? 'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              Texte brut
            </button>
          </div>
        )}

        {/* Content Area */}
        <div className="space-y-4">
          {activeTab === 'sections' && result.sections ? (
            <>
              {/* Ingredients Section */}
              {result.sections.ingredients && (
                <div className="space-y-2">
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <svg
                      className="w-5 h-5 text-green-600 dark:text-green-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                      />
                    </svg>
                    Ingrédients
                  </h3>
                  <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
                    <p className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap">
                      {result.sections.ingredients}
                    </p>
                  </div>
                </div>
              )}

              {/* Allergens Section */}
              {result.sections.allergens && (
                <div className="space-y-2">
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <svg
                      className="w-5 h-5 text-orange-600 dark:text-orange-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                      />
                    </svg>
                    Allergènes
                  </h3>
                  <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700 rounded-lg p-4">
                    <p className="text-sm text-orange-900 dark:text-orange-200 whitespace-pre-wrap">
                      {result.sections.allergens}
                    </p>
                  </div>
                </div>
              )}

              {/* Legal Mentions Section */}
              {result.sections.legalMentions && (
                <div className="space-y-2">
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <svg
                      className="w-5 h-5 text-blue-600 dark:text-blue-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    Mentions légales
                  </h3>
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
                    <p className="text-sm text-blue-900 dark:text-blue-200 whitespace-pre-wrap">
                      {result.sections.legalMentions}
                    </p>
                  </div>
                </div>
              )}

              {/* Danger Pictograms */}
              {result.sections.dangerPictograms && result.sections.dangerPictograms.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <svg
                      className="w-5 h-5 text-red-600 dark:text-red-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                      />
                    </svg>
                    Pictogrammes de danger détectés
                  </h3>
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-4">
                    <div className="flex flex-wrap gap-2">
                      {result.sections.dangerPictograms.map((keyword) => (
                        <span
                          key={keyword}
                          className="px-3 py-1 bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-200 rounded-full text-sm font-semibold capitalize"
                        >
                          {keyword}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* No sections detected */}
              {!result.sections.ingredients &&
                !result.sections.allergens &&
                !result.sections.legalMentions && (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <svg
                      className="w-12 h-12 mx-auto mb-3 opacity-50"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <p className="font-semibold mb-1">Aucune section détectée</p>
                    <p className="text-sm">Consultez le texte brut pour voir le contenu extrait</p>
                  </div>
                )}
            </>
          ) : (
            /* Raw Text */
            <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
              <pre className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap font-mono">
                {result.rawText || 'Aucun texte détecté'}
              </pre>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          {onRetry && (
            <button
              onClick={onRetry}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Réessayer
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
