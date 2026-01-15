/**
 * Scan Flow Context - v1.0.0
 * 
 * Context React pour le flux unifié de scan et comparaison
 * Permet de partager l'état du scan entre les composants
 * Conforme aux principes institutionnels (pas de stockage serveur, lecture seule)
 */

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import type {
  ScanFlowContextType,
  ScanFlowState,
  ScanFlowStep,
  ScanSource,
  ScannedProductContext,
} from '../types/scanFlow';

/**
 * État initial du flux
 */
const initialState: ScanFlowState = {
  currentStep: 'capture',
  scannedProduct: null,
  isProcessing: false,
  error: null,
};

/**
 * Contexte React
 */
const ScanFlowContext = createContext<ScanFlowContextType | undefined>(undefined);

/**
 * Props du provider
 */
interface ScanFlowProviderProps {
  children: ReactNode;
}

/**
 * Provider du contexte de flux de scan
 */
export function ScanFlowProvider({ children }: ScanFlowProviderProps) {
  const [state, setState] = useState<ScanFlowState>(initialState);

  /**
   * Initialiser un nouveau scan
   */
  const startScan = useCallback((source: ScanSource) => {
    setState({
      currentStep: 'capture',
      scannedProduct: null,
      isProcessing: false,
      error: null,
    });

    if (import.meta.env.DEV) {
      console.log('[ScanFlow] Scan started with source:', source);
    }
  }, []);

  /**
   * Mettre à jour le produit scanné
   */
  const updateScannedProduct = useCallback((product: ScannedProductContext) => {
    setState((prev) => ({
      ...prev,
      scannedProduct: product,
      error: null,
    }));

    if (import.meta.env.DEV) {
      console.log('[ScanFlow] Product updated:', product);
    }
  }, []);

  /**
   * Passer à l'étape suivante
   */
  const nextStep = useCallback(() => {
    setState((prev) => {
      let nextStep: ScanFlowStep = prev.currentStep;

      if (prev.currentStep === 'capture') {
        nextStep = 'understanding';
      } else if (prev.currentStep === 'understanding') {
        nextStep = 'comparison';
      }

      if (import.meta.env.DEV) {
        console.log('[ScanFlow] Moving to next step:', nextStep);
      }

      return {
        ...prev,
        currentStep: nextStep,
      };
    });
  }, []);

  /**
   * Revenir à l'étape précédente
   */
  const previousStep = useCallback(() => {
    setState((prev) => {
      let prevStep: ScanFlowStep = prev.currentStep;

      if (prev.currentStep === 'comparison') {
        prevStep = 'understanding';
      } else if (prev.currentStep === 'understanding') {
        prevStep = 'capture';
      }

      if (import.meta.env.DEV) {
        console.log('[ScanFlow] Moving to previous step:', prevStep);
      }

      return {
        ...prev,
        currentStep: prevStep,
      };
    });
  }, []);

  /**
   * Réinitialiser le flux
   */
  const reset = useCallback(() => {
    setState(initialState);

    if (import.meta.env.DEV) {
      console.log('[ScanFlow] Reset to initial state');
    }
  }, []);

  /**
   * Définir une erreur
   */
  const setError = useCallback((error: string | null) => {
    setState((prev) => ({
      ...prev,
      error,
      isProcessing: false,
    }));

    if (import.meta.env.DEV && error) {
      console.error('[ScanFlow] Error:', error);
    }
  }, []);

  /**
   * Définir l'état de traitement
   */
  const setProcessing = useCallback((isProcessing: boolean) => {
    setState((prev) => ({
      ...prev,
      isProcessing,
    }));
  }, []);

  const value: ScanFlowContextType = {
    ...state,
    startScan,
    updateScannedProduct,
    nextStep,
    previousStep,
    reset,
    setError,
    setProcessing,
  };

  return (
    <ScanFlowContext.Provider value={value}>
      {children}
    </ScanFlowContext.Provider>
  );
}

/**
 * Hook pour utiliser le contexte de flux de scan
 * @throws Error si utilisé en dehors du provider
 */
export function useScanFlow(): ScanFlowContextType {
  const context = useContext(ScanFlowContext);

  if (context === undefined) {
    throw new Error('useScanFlow must be used within a ScanFlowProvider');
  }

  return context;
}
