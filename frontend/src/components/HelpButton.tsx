/**
 * Bouton d'aide pour relancer le tutoriel d'onboarding
 * Accessible à tout moment depuis n'importe quelle page
 */

import React from 'react';
import { HelpCircle } from 'lucide-react';
import { useOnboarding } from '../context/OnboardingContext';

export default function HelpButton() {
  const { startTour } = useOnboarding();

  return (
    <button
      onClick={startTour}
      className="fixed bottom-20 right-4 md:bottom-4 md:right-4 z-40 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-3 shadow-lg transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      aria-label="Afficher le guide utilisateur"
      title="Guide utilisateur"
    >
      <HelpCircle size={24} />
    </button>
  );
}
