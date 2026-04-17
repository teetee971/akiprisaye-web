import React from 'react';
import { Minus, Plus } from 'lucide-react';
import { useA11yPreferences } from '../../hooks/useA11yPreferences';

/**
 * Composant FontSizeControl - Contrôle de la taille de police
 * Permet aux utilisateurs d'ajuster la taille du texte de 80% à 200%
 * Conforme WCAG 2.1 - 1.4.4 (Resize text)
 */
export default function FontSizeControl() {
  const { preferences, setFontSize } = useA11yPreferences();

  const handleDecrease = () => {
    setFontSize(preferences.fontSize - 10);
  };

  const handleIncrease = () => {
    setFontSize(preferences.fontSize + 10);
  };

  const handleReset = () => {
    setFontSize(100);
  };

  return (
    <div className="font-size-control">
      <label htmlFor="font-size-range" className="block text-sm font-medium mb-2">
        Taille du texte
      </label>
      <div className="flex items-center gap-3">
        <button
          onClick={handleDecrease}
          disabled={preferences.fontSize <= 80}
          className="p-2 rounded-lg bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          aria-label="Diminuer la taille du texte"
          title="Diminuer la taille du texte"
        >
          <Minus size={20} />
          <span className="sr-only">A-</span>
        </button>

        <div className="flex-1">
          <input
            id="font-size-range"
            type="range"
            min="80"
            max="200"
            step="10"
            value={preferences.fontSize}
            onChange={(e) => setFontSize(Number(e.target.value))}
            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
            aria-label="Ajuster la taille du texte"
            aria-valuemin={80}
            aria-valuemax={200}
            aria-valuenow={preferences.fontSize}
            aria-valuetext={`${preferences.fontSize}%`}
          />
          <div className="flex justify-between text-xs text-slate-400 mt-1">
            <span>80%</span>
            <button
              onClick={handleReset}
              className="text-blue-400 hover:text-blue-300 underline"
              aria-label="Réinitialiser la taille du texte à 100%"
            >
              {preferences.fontSize}%
            </button>
            <span>200%</span>
          </div>
        </div>

        <button
          onClick={handleIncrease}
          disabled={preferences.fontSize >= 200}
          className="p-2 rounded-lg bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          aria-label="Augmenter la taille du texte"
          title="Augmenter la taille du texte"
        >
          <Plus size={20} />
          <span className="sr-only">A+</span>
        </button>
      </div>
    </div>
  );
}
