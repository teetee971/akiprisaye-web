/**
 * Composant qui détecte la première visite et lance automatiquement le tour
 * Utilise useEffect pour démarrer le tour une fois que l'app est chargée
 */

import { useEffect } from 'react';
import { useOnboarding } from '../context/OnboardingContext';

export default function OnboardingAutoStart() {
  const { shouldShowTour, startTour } = useOnboarding();

  useEffect(() => {
    // Attendre que la page soit complètement chargée avant de démarrer le tour
    const timer = setTimeout(() => {
      if (shouldShowTour()) {
        startTour();
      }
    }, 1500); // 1.5 secondes pour laisser le temps à la page de charger

    return () => clearTimeout(timer);
  }, [shouldShowTour, startTour]);

  return null; // Ce composant ne rend rien
}
