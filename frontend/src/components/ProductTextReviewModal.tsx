/**
 * Product Text Review Modal
 * Part of PR D - Text-based Product Recognition
 *
 * MANDATORY user validation before any action
 * - Shows suggested products with confidence scores
 * - User must explicitly confirm selection
 * - User can cancel/correct at any time
 *
 * UX Principles:
 * - ❌ NO automatic selection
 * - ✅ Clear "Suggestion" messaging
 * - ✅ Visible confidence scores
 * - ✅ Mobile-first design
 * - ✅ Keyboard navigation support
 */

import React, { useEffect, useRef } from 'react';

interface Props {
  suggestions: { label: string; score: number }[];
  onConfirm: (label: string) => void;
  onCancel: () => void;
}

export function ProductTextReviewModal({ suggestions, onConfirm, onCancel }: Props) {
  const modalRef = useRef<HTMLDivElement>(null);
  const firstButtonRef = useRef<HTMLButtonElement>(null);

  // Focus management and keyboard navigation
  useEffect(() => {
    // Focus first interactive element on mount
    firstButtonRef.current?.focus();

    // Handle Escape key
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
      }
    };

    // Trap focus within modal
    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab' || !modalRef.current) return;

      const focusableElements = modalRef.current.querySelectorAll('button:not([disabled])');
      const firstElement = focusableElements[0] as HTMLElement;
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault();
        lastElement?.focus();
      } else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault();
        firstElement?.focus();
      }
    };

    document.addEventListener('keydown', handleEscape);
    document.addEventListener('keydown', handleTab);

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('keydown', handleTab);
    };
  }, [onCancel]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      role="dialog"
      aria-labelledby="modal-title"
      aria-describedby="modal-description"
      aria-modal="true"
    >
      <div
        ref={modalRef}
        className="w-full max-w-md bg-gradient-to-br from-purple-900/90 to-blue-900/90 backdrop-blur-md rounded-2xl shadow-2xl border border-white/10 overflow-hidden"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/10">
          <h3 id="modal-title" className="text-xl font-bold text-white">
            🔍 Confirmer le produit détecté
          </h3>
          <p id="modal-description" className="text-sm text-white/70 mt-1">
            ⚠️ Suggestion automatique — Veuillez vérifier avant de continuer
          </p>
        </div>

        {/* Suggestions List */}
        <div className="px-6 py-4 max-h-96 overflow-y-auto">
          {suggestions.length === 0 ? (
            <div className="text-center py-8 text-white/60">
              <p className="mb-2">❌ Aucun produit trouvé</p>
              <p className="text-sm">Essayez de saisir le code EAN manuellement</p>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-white/60 mb-3">Sélectionnez le produit correspondant :</p>
              {suggestions.map((s, index) => (
                <button
                  key={`${s.label}-${index}`}
                  ref={index === 0 ? firstButtonRef : null}
                  onClick={() => onConfirm(s.label)}
                  className="w-full px-4 py-3 bg-white/10 hover:bg-white/20 focus:bg-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500 border border-white/20 rounded-lg text-left transition-all duration-200 group"
                  aria-label={`Confirmer ${s.label} avec ${Math.round(s.score * 100)}% de confiance`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-white font-medium group-hover:text-blue-300 transition-colors">
                      {s.label}
                    </span>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        s.score >= 0.7
                          ? 'bg-green-500/20 text-green-300'
                          : s.score >= 0.5
                            ? 'bg-yellow-500/20 text-yellow-300'
                            : 'bg-red-500/20 text-red-300'
                      }`}
                    >
                      {Math.round(s.score * 100)}%
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/10 bg-black/20">
          <button
            onClick={onCancel}
            className="w-full px-4 py-3 bg-white/10 hover:bg-white/20 focus:bg-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500 border border-white/20 rounded-lg text-white font-medium transition-colors duration-200"
            aria-label="Annuler la sélection"
          >
            ❌ Annuler
          </button>
          <p className="text-xs text-white/50 mt-2 text-center">
            💡 Astuce : Utilisez la saisie manuelle pour plus de précision
          </p>
        </div>
      </div>
    </div>
  );
}
