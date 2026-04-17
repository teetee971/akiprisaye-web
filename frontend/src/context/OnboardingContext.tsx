/**
 * Contexte global pour la gestion de l'onboarding interactif
 * Fournit l'état et les méthodes de contrôle du tutoriel à toute l'application
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { OnboardingState, OnboardingContextType } from '../types/onboarding';
import {
  loadOnboardingState,
  saveOnboardingState,
  markOnboardingComplete as serviceMarkComplete,
  dismissOnboarding as serviceDismiss,
  resetOnboarding as serviceReset,
  shouldShowOnboardingTour as serviceShouldShow,
} from '../services/onboardingService';

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<OnboardingState>(() => loadOnboardingState());
  const [isTourActive, setIsTourActive] = useState(false);

  // Sauvegarder l'état à chaque changement
  useEffect(() => {
    saveOnboardingState(state);
  }, [state]);

  const startTour = useCallback(() => {
    setIsTourActive(true);
  }, []);

  const completeOnboarding = useCallback(() => {
    serviceMarkComplete();
    setState(loadOnboardingState());
    setIsTourActive(false);
  }, []);

  const dismissOnboarding = useCallback(() => {
    serviceDismiss();
    setState(loadOnboardingState());
    setIsTourActive(false);
  }, []);

  const resetOnboarding = useCallback(() => {
    serviceReset();
    setState(loadOnboardingState());
    setIsTourActive(false);
  }, []);

  const shouldShowTour = useCallback(() => {
    return serviceShouldShow();
  }, []);

  const value: OnboardingContextType = {
    state,
    startTour,
    completeOnboarding,
    resetOnboarding,
    dismissOnboarding,
    shouldShowTour,
    isTourActive,
    setIsTourActive,
  };

  return <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>;
}

/**
 * Hook pour accéder au contexte d'onboarding
 */
export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
}
