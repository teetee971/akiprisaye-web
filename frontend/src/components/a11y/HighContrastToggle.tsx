import React from 'react';
import { useA11yPreferences } from '../../hooks/useA11yPreferences';

/**
 * Composant HighContrastToggle - Bascule du mode contraste élevé
 * Améliore la lisibilité pour les utilisateurs malvoyants
 * Conforme WCAG 2.1 - 1.4.3 (Contrast Minimum) et 1.4.6 (Contrast Enhanced)
 */
export default function HighContrastToggle() {
  const { preferences, toggleHighContrast } = useA11yPreferences();

  return (
    <div className="high-contrast-toggle">
      <label className="flex items-center justify-between cursor-pointer">
        <span className="text-sm font-medium">Contraste élevé</span>
        <div className="relative">
          <input
            type="checkbox"
            checked={preferences.highContrast}
            onChange={toggleHighContrast}
            className="sr-only peer"
            aria-label="Activer le mode contraste élevé"
          />
          <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
        </div>
      </label>
      <p className="text-xs text-slate-400 mt-1">
        Augmente le contraste pour une meilleure lisibilité
      </p>
    </div>
  );
}
