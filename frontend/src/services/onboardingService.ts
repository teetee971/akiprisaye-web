/**
 * Service de gestion de l'onboarding avec stockage local sécurisé
 * Utilise safeLocalStorage pour éviter les crashs en cas de données corrompues
 */

import { safeLocalStorage } from '../utils/safeLocalStorage';
import type { OnboardingState } from '../types/onboarding';

const ONBOARDING_STORAGE_KEY = 'akiprisaye_onboarding';

const DEFAULT_ONBOARDING_STATE: OnboardingState = {
  isFirstVisit: true,
  hasCompletedOnboarding: false,
  currentStep: 0,
  totalSteps: 0,
  dismissed: false,
  firstVisitDate: new Date().toISOString(),
  lastVisitDate: new Date().toISOString(),
};

/**
 * Charge l'état d'onboarding depuis localStorage
 */
export function loadOnboardingState(): OnboardingState {
  const stored = safeLocalStorage.getJSON<OnboardingState>(
    ONBOARDING_STORAGE_KEY,
    DEFAULT_ONBOARDING_STATE
  );

  // Mise à jour de la date de dernière visite
  return {
    ...stored,
    lastVisitDate: new Date().toISOString(),
  };
}

/**
 * Sauvegarde l'état d'onboarding dans localStorage
 */
export function saveOnboardingState(state: OnboardingState): boolean {
  return safeLocalStorage.setJSON(ONBOARDING_STORAGE_KEY, state);
}

/**
 * Marque l'onboarding comme complété
 */
export function markOnboardingComplete(): boolean {
  const state = loadOnboardingState();
  state.hasCompletedOnboarding = true;
  state.isFirstVisit = false;
  return saveOnboardingState(state);
}

/**
 * Masque définitivement l'onboarding
 */
export function dismissOnboarding(): boolean {
  const state = loadOnboardingState();
  state.dismissed = true;
  state.isFirstVisit = false;
  return saveOnboardingState(state);
}

/**
 * Réinitialise l'onboarding (pour les tests ou le support)
 */
export function resetOnboarding(): boolean {
  return safeLocalStorage.setJSON(ONBOARDING_STORAGE_KEY, {
    ...DEFAULT_ONBOARDING_STATE,
    isFirstVisit: true,
    firstVisitDate: new Date().toISOString(),
  });
}

/**
 * Vérifie si le tour doit être affiché automatiquement
 */
export function shouldShowOnboardingTour(): boolean {
  const state = loadOnboardingState();
  return state.isFirstVisit && !state.hasCompletedOnboarding && !state.dismissed;
}
