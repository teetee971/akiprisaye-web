import { useState, useEffect } from 'react';
import { safeLocalStorage } from '../utils/safeLocalStorage';

export interface A11yPreferences {
  fontSize: number; // 100 = normal, 120 = 120%, etc.
  highContrast: boolean;
  reducedMotion: boolean;
  colorBlindMode: 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia';
}

const DEFAULT_PREFERENCES: A11yPreferences = {
  fontSize: 100,
  highContrast: false,
  reducedMotion: false,
  colorBlindMode: 'none',
};

const STORAGE_KEY = 'akiprisaye_a11y_preferences';

/**
 * Hook pour gérer les préférences d'accessibilité de l'utilisateur
 * Synchronise avec localStorage et applique les préférences au DOM
 */
export function useA11yPreferences() {
  const [preferences, setPreferences] = useState<A11yPreferences>(() => {
    // Charger les préférences depuis localStorage
    const stored = safeLocalStorage.getJSON<A11yPreferences>(STORAGE_KEY, DEFAULT_PREFERENCES);

    // Détecter les préférences système si aucune préférence n'est enregistrée
    if (stored.reducedMotion === false) {
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (prefersReducedMotion) {
        stored.reducedMotion = true;
      }
    }

    return stored;
  });

  // Sauvegarder les préférences dans localStorage
  const savePreferences = (newPreferences: Partial<A11yPreferences>) => {
    const updated = { ...preferences, ...newPreferences };
    setPreferences(updated);
    safeLocalStorage.setJSON(STORAGE_KEY, updated);
  };

  // Appliquer les préférences au DOM
  useEffect(() => {
    const root = document.documentElement;

    // Taille de police
    root.style.fontSize = `${preferences.fontSize}%`;

    // Mode contraste élevé
    if (preferences.highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }

    // Animations réduites
    if (preferences.reducedMotion) {
      root.classList.add('reduce-motion');
    } else {
      root.classList.remove('reduce-motion');
    }

    // Mode daltonien
    root.setAttribute('data-colorblind-mode', preferences.colorBlindMode);
  }, [preferences]);

  // Fonctions helper pour modifier des préférences individuelles
  const setFontSize = (size: number) => {
    savePreferences({ fontSize: Math.max(80, Math.min(200, size)) });
  };

  const toggleHighContrast = () => {
    savePreferences({ highContrast: !preferences.highContrast });
  };

  const toggleReducedMotion = () => {
    savePreferences({ reducedMotion: !preferences.reducedMotion });
  };

  const setColorBlindMode = (mode: A11yPreferences['colorBlindMode']) => {
    savePreferences({ colorBlindMode: mode });
  };

  const resetToDefaults = () => {
    setPreferences(DEFAULT_PREFERENCES);
    safeLocalStorage.setJSON(STORAGE_KEY, DEFAULT_PREFERENCES);
  };

  return {
    preferences,
    setFontSize,
    toggleHighContrast,
    toggleReducedMotion,
    setColorBlindMode,
    resetToDefaults,
    savePreferences,
  };
}
