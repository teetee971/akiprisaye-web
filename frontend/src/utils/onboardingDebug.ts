 
/**
 * Utilitaire de test pour le système d'onboarding
 * Permet de tester facilement les différents états de l'onboarding
 */

import { resetOnboarding, shouldShowOnboardingTour, loadOnboardingState } from '../services/onboardingService';

/**
 * Affiche l'état actuel de l'onboarding dans la console
 */
export function debugOnboardingState() {
  const state = loadOnboardingState();
  console.group('🎓 État de l\'onboarding');
  console.log('Première visite:', state.isFirstVisit);
  console.log('Tutoriel complété:', state.hasCompletedOnboarding);
  console.log('Masqué définitivement:', state.dismissed);
  console.log('Première visite le:', new Date(state.firstVisitDate).toLocaleString('fr-FR'));
  console.log('Dernière visite le:', new Date(state.lastVisitDate).toLocaleString('fr-FR'));
  console.log('Le tour devrait s\'afficher:', shouldShowOnboardingTour());
  console.groupEnd();
  return state;
}

/**
 * Réinitialise l'onboarding pour simuler une première visite
 */
export function simulateFirstVisit() {
  console.log('🔄 Simulation d\'une première visite...');
  resetOnboarding();
  console.log('✅ Rechargez la page pour voir le tour d\'onboarding');
  return debugOnboardingState();
}

/**
 * Commandes disponibles dans la console du navigateur
 */
if (typeof window !== 'undefined') {
  (window as any).onboardingDebug = {
    state: debugOnboardingState,
    reset: simulateFirstVisit,
    help: () => {
      console.log(`
🎓 Commandes d'onboarding disponibles:

onboardingDebug.state()  - Afficher l'état actuel
onboardingDebug.reset()  - Réinitialiser (simuler première visite)
onboardingDebug.help()   - Afficher cette aide
      `);
    }
  };

  console.log('🎓 Utilitaires d\'onboarding chargés. Tapez onboardingDebug.help() pour voir les commandes.');
}
