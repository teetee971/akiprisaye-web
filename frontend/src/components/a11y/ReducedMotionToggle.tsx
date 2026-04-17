import React from 'react';
import { useA11yPreferences } from '../../hooks/useA11yPreferences';

/**
 * Composant ReducedMotionToggle - Bascule du mode animations réduites
 * Respecte les préférences utilisateur pour réduire les animations
 * Conforme WCAG 2.1 - 2.3.3 (Animation from Interactions)
 */
export default function ReducedMotionToggle() {
  const { preferences, toggleReducedMotion } = useA11yPreferences();

  return (
    <div className="reduced-motion-toggle">
      <label className="flex items-center justify-between cursor-pointer">
        <span className="text-sm font-medium">Réduire les animations</span>
        <div className="relative">
          <input
            type="checkbox"
            checked={preferences.reducedMotion}
            onChange={toggleReducedMotion}
            className="sr-only peer"
            aria-label="Réduire les animations"
          />
          <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
        </div>
      </label>
      <p className="text-xs text-slate-400 mt-1">Minimise les animations et transitions</p>
    </div>
  );
}
