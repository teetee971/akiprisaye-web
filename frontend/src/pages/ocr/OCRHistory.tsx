/**
 * OCR History Page
 * 
 * Displays local OCR scan history
 * - Opt-in only
 * - Stored locally (localStorage)
 * - User can delete at any time
 * - Export to JSON
 * - RGPD compliant
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  getHistory,
  hasHistoryConsent,
  setHistoryConsent,
  clearHistory,
  deleteHistoryEntry,
  exportHistoryToJSON,
  getHistoryStats,
  type OCRHistoryEntry,
} from '../../services/ocr/ocrHistoryService';

export default function OCRHistory() {
  // Production proof: Log when component mounts
  if (import.meta.env.MODE === 'production') {
    console.info('[OCR] OCRHistory mounted', import.meta.env.MODE);
  }

  const [consent, setConsent] = useState(hasHistoryConsent());
  const [history, setHistory] = useState<OCRHistoryEntry[]>([]);
  const [stats, setStats] = useState(getHistoryStats());
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  useEffect(() => {
    if (consent) {
      setHistory(getHistory());
      setStats(getHistoryStats());
    }
  }, [consent]);

  const handleConsentToggle = (newConsent: boolean) => {
    setHistoryConsent(newConsent);
    setConsent(newConsent);
    if (!newConsent) {
      setHistory([]);
      setStats(getHistoryStats());
    }
  };

  const handleClearHistory = () => {
    clearHistory();
    setHistory([]);
    setStats(getHistoryStats());
    setShowConfirmDelete(false);
  };

  const handleDeleteEntry = (id: string) => {
    deleteHistoryEntry(id);
    setHistory(getHistory());
    setStats(getHistoryStats());
  };

  const handleExport = () => {
    const json = exportHistoryToJSON();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ocr-history-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('fr-FR');
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      text: '📝 Texte',
      ean: '📊 Code-barres',
      product: '🛒 Produit',
      photo: '📸 Photo',
      ingredients: '🧴 Ingrédients',
    };
    return labels[type] || type;
  };

  return (
    <>
      <Helmet>
        <title>Historique OCR - A KI PRI SA YÉ</title>
        <meta name="description" content="Historique local de vos scans OCR" />
      </Helmet>

      <div className="min-h-screen bg-slate-950 text-white pt-24 pb-12 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Link
              to="/ocr"
              className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 mb-4"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              Retour au hub OCR
            </Link>

            <h1 className="text-4xl md:text-5xl font-bold mb-4">📜 Historique OCR</h1>
            <p className="text-gray-400">
              Vos scans OCR sont stockés localement sur cet appareil uniquement
            </p>
          </div>

          {/* Consent Section */}
          <div className="mb-8 p-6 rounded-xl bg-slate-800/50 border border-slate-700/50">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h2 className="text-xl font-bold mb-2">Conserver l'historique OCR</h2>
                <p className="text-sm text-gray-400 mb-3">
                  Activez cette option pour enregistrer vos scans localement. Aucune donnée n'est
                  envoyée à un serveur.
                </p>
                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="px-2 py-1 rounded bg-green-900/30 text-green-300">
                    🔒 100% Local
                  </span>
                  <span className="px-2 py-1 rounded bg-blue-900/30 text-blue-300">
                    ✅ RGPD Conforme
                  </span>
                  <span className="px-2 py-1 rounded bg-purple-900/30 text-purple-300">
                    🗑️ Suppression possible
                  </span>
                </div>
              </div>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => handleConsentToggle(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-14 h-7 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>

          {!consent ? (
            /* No consent - Show message */
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🔒</div>
              <h3 className="text-xl font-bold mb-2">Historique désactivé</h3>
              <p className="text-gray-400">
                Activez l'option ci-dessus pour commencer à enregistrer vos scans
              </p>
            </div>
          ) : history.length === 0 ? (
            /* Consent but no history */
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📭</div>
              <h3 className="text-xl font-bold mb-2">Aucun scan enregistré</h3>
              <p className="text-gray-400 mb-6">Vos futurs scans OCR apparaîtront ici</p>
              <Link
                to="/ocr"
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                Faire un scan
              </Link>
            </div>
          ) : (
            <>
              {/* Statistics */}
              <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-blue-900/20 border border-blue-700/30">
                  <div className="text-3xl font-bold text-blue-400">{stats.totalScans}</div>
                  <div className="text-sm text-gray-400">Scans total</div>
                </div>
                <div className="p-4 rounded-xl bg-green-900/20 border border-green-700/30">
                  <div className="text-3xl font-bold text-green-400">
                    {stats.averageConfidence.toFixed(0)}%
                  </div>
                  <div className="text-sm text-gray-400">Confiance moyenne</div>
                </div>
                <div className="p-4 rounded-xl bg-purple-900/20 border border-purple-700/30">
                  <div className="text-3xl font-bold text-purple-400">
                    {Object.keys(stats.byType).length}
                  </div>
                  <div className="text-sm text-gray-400">Types différents</div>
                </div>
              </div>

              {/* Actions */}
              <div className="mb-6 flex flex-wrap gap-3">
                <button
                  onClick={handleExport}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition-colors flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                    />
                  </svg>
                  Exporter (JSON)
                </button>

                <button
                  onClick={() => setShowConfirmDelete(true)}
                  className="px-4 py-2 bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 rounded-lg font-semibold transition-colors flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                  Tout supprimer
                </button>
              </div>

              {/* Confirm Delete Modal */}
              {showConfirmDelete && (
                <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
                  <div className="bg-slate-800 rounded-xl p-6 max-w-md w-full border border-slate-700">
                    <h3 className="text-xl font-bold mb-4">Confirmer la suppression</h3>
                    <p className="text-gray-400 mb-6">
                      Êtes-vous sûr de vouloir supprimer tout l'historique ? Cette action est
                      irréversible.
                    </p>
                    <div className="flex gap-3">
                      <button
                        onClick={handleClearHistory}
                        className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg font-semibold transition-colors"
                      >
                        Oui, supprimer
                      </button>
                      <button
                        onClick={() => setShowConfirmDelete(false)}
                        className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg font-semibold transition-colors"
                      >
                        Annuler
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* History List */}
              <div className="space-y-4">
                {history.map((entry) => (
                  <div
                    key={entry.id}
                    className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50 hover:border-slate-600/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-lg">{getTypeLabel(entry.type)}</span>
                          <span
                            className={`px-2 py-0.5 rounded text-xs font-semibold ${
                              entry.confidence >= 75
                                ? 'bg-green-900/30 text-green-300'
                                : entry.confidence >= 50
                                ? 'bg-orange-900/30 text-orange-300'
                                : 'bg-gray-700/30 text-gray-300'
                            }`}
                          >
                            {entry.confidence.toFixed(0)}% confiance
                          </span>
                        </div>
                        <div className="text-sm text-gray-400">{formatDate(entry.timestamp)}</div>
                      </div>

                      <button
                        onClick={() => handleDeleteEntry(entry.id)}
                        className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                        aria-label="Supprimer cette entrée"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>

                    <div className="bg-slate-900/50 rounded p-3">
                      <p className="text-sm text-gray-300 font-mono line-clamp-3">
                        {entry.textExtracted || 'Aucun texte extrait'}
                      </p>
                    </div>

                    <div className="mt-2 text-xs text-gray-500">
                      Traitement: {(entry.processingTime / 1000).toFixed(1)}s
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
