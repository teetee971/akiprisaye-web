/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react';
import { X, Accessibility } from 'lucide-react';
import FontSizeControl from './FontSizeControl';
import HighContrastToggle from './HighContrastToggle';
import ReducedMotionToggle from './ReducedMotionToggle';
import { useA11yPreferences } from '../../hooks/useA11yPreferences';

/**
 * Composant A11ySettingsPanel - Panneau de paramètres d'accessibilité
 * Interface centralisée pour gérer toutes les préférences d'accessibilité
 * Conforme RGAA et WCAG 2.1 Level AA
 */
export default function A11ySettingsPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const { preferences, setColorBlindMode, resetToDefaults } = useA11yPreferences();

  return (
    <>
      {/* Bouton flottant pour ouvrir le panneau */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 left-4 z-50 p-3 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg transition-all hover:scale-110 focus:outline-none focus:ring-4 focus:ring-blue-800"
        aria-label="Ouvrir les paramètres d'accessibilité"
        title="Paramètres d'accessibilité"
      >
        <Accessibility size={24} aria-hidden="true" />
      </button>

      {/* Panneau modal */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="a11y-panel-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsOpen(false);
          }}
        >
          <div className="bg-slate-900 rounded-lg shadow-2xl p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 id="a11y-panel-title" className="text-2xl font-bold flex items-center gap-2">
                <Accessibility size={28} aria-hidden="true" />
                Accessibilité
              </h2>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-lg hover:bg-slate-800 transition-colors"
                aria-label="Fermer le panneau d'accessibilité"
              >
                <X size={24} aria-hidden="true" />
              </button>
            </div>

            {/* Contenu */}
            <div className="space-y-6">
              {/* Taille du texte */}
              <section aria-label="Taille du texte">
                <FontSizeControl />
              </section>

              <hr className="border-slate-700" />

              {/* Contraste élevé */}
              <section aria-label="Contraste élevé">
                <HighContrastToggle />
              </section>

              <hr className="border-slate-700" />

              {/* Animations réduites */}
              <section aria-label="Animations réduites">
                <ReducedMotionToggle />
              </section>

              <hr className="border-slate-700" />

              {/* Mode daltonien */}
              <section aria-label="Mode daltonien">
                <label htmlFor="colorblind-mode" className="block text-sm font-medium mb-2">
                  Mode daltonien
                </label>
                <select
                  id="colorblind-mode"
                  value={preferences.colorBlindMode}
                  onChange={(e) => setColorBlindMode(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  aria-describedby="colorblind-help"
                >
                  <option value="none">Aucun</option>
                  <option value="protanopia">Protanopie (difficulté rouge)</option>
                  <option value="deuteranopia">Deutéranopie (difficulté vert)</option>
                  <option value="tritanopia">Tritanopie (difficulté bleu)</option>
                </select>
                <p id="colorblind-help" className="text-xs text-slate-400 mt-1">
                  Simule et compense les différents types de daltonisme
                </p>
              </section>

              <hr className="border-slate-700" />

              {/* Bouton reset */}
              <div>
                <button
                  onClick={() => {
                    resetToDefaults();
                  }}
                  className="w-full px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-600"
                  aria-label="Réinitialiser tous les paramètres d'accessibilité par défaut"
                >
                  Réinitialiser par défaut
                </button>
              </div>
            </div>

            {/* Footer informatif */}
            <div className="mt-6 p-3 bg-blue-900/30 rounded-lg border border-blue-800/50">
              <p className="text-xs text-blue-200">
                <strong>Note :</strong> Les paramètres d'accessibilité sont enregistrés localement et persistent entre les sessions.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
