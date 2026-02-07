/**
 * Types pour le système d'onboarding interactif
 * Gère la détection de première visite, les préférences utilisateur,
 * et le suivi de progression du tutoriel
 */

export interface OnboardingState {
  /** Première visite détectée */
  isFirstVisit: boolean;
  /** Tutoriel complété */
  hasCompletedOnboarding: boolean;
  /** Étape actuelle du tutoriel */
  currentStep: number;
  /** Nombre total d'étapes */
  totalSteps: number;
  /** Tutoriel définitivement masqué par l'utilisateur */
  dismissed: boolean;
  /** Date de première visite */
  firstVisitDate: string;
  /** Date de dernière visite */
  lastVisitDate: string;
}

export interface OnboardingContextType {
  state: OnboardingState;
  /** Démarre le tutoriel */
  startTour: () => void;
  /** Marque le tutoriel comme complété */
  completeOnboarding: () => void;
  /** Réinitialise l'onboarding (pour les tests) */
  resetOnboarding: () => void;
  /** Masque définitivement le tutoriel */
  dismissOnboarding: () => void;
  /** Vérifie si le tour doit être affiché automatiquement */
  shouldShowTour: () => boolean;
  /** Tour en cours d'exécution */
  isTourActive: boolean;
  /** Active/désactive le tour */
  setIsTourActive: (active: boolean) => void;
}

export interface OnboardingStep {
  /** Sélecteur CSS de l'élément cible */
  target: string;
  /** Contenu du tooltip */
  content: string;
  /** Titre optionnel */
  title?: string;
  /** Position du tooltip */
  placement?: 'top' | 'bottom' | 'left' | 'right' | 'center' | 'auto';
  /** Désactiver l'interaction avec l'élément ciblé */
  disableBeacon?: boolean;
  /** Action avant d'afficher l'étape */
  beforeStep?: () => void | Promise<void>;
}
