/**
 * Scan Flow Types - v1.0.0
 *
 * Types pour le flux unifié de scan et comparaison
 * Conforme aux principes institutionnels du projet A KI PRI SA YÉ
 */

/**
 * Source du scan
 */
export type ScanSource = 'ean' | 'photo' | 'ticket';

/**
 * Contexte d'un produit scanné
 * Objet intermédiaire créé après capture et compréhension
 * Utilisé pour initialiser le comparateur avec contexte
 */
export interface ScannedProductContext {
  /**
   * Source du scan (code-barres, photo produit, ticket)
   */
  source: ScanSource;

  /**
   * Code EAN détecté (si disponible)
   */
  ean?: string;

  /**
   * Texte brut extrait (OCR)
   */
  rawText?: string;

  /**
   * Prix détecté sur le ticket ou l'image (si disponible)
   */
  detectedPrice?: number;

  /**
   * Enseigne détectée sur le ticket (si disponible)
   */
  detectedStore?: string;

  /**
   * Date de détection du prix (pour tickets)
   */
  detectedDate?: string;

  /**
   * Score de confiance de la détection (0-100)
   * Utilisé pour afficher un badge de fiabilité
   */
  confidenceScore: number;

  /**
   * Nom du produit (si résolu)
   */
  productName?: string;

  /**
   * Timestamp de la capture
   */
  timestamp: Date;
}

/**
 * Étape du flux de scan
 */
export type ScanFlowStep = 'capture' | 'understanding' | 'comparison';

/**
 * État du flux de scan
 */
export interface ScanFlowState {
  /**
   * Étape actuelle du flux
   */
  currentStep: ScanFlowStep;

  /**
   * Contexte du produit scanné (null si pas encore scanné)
   */
  scannedProduct: ScannedProductContext | null;

  /**
   * Indicateur de traitement en cours
   */
  isProcessing: boolean;

  /**
   * Message d'erreur (si applicable)
   */
  error: string | null;
}

/**
 * Actions disponibles dans le contexte de flux
 */
export interface ScanFlowActions {
  /**
   * Initialiser un nouveau scan
   */
  startScan: (source: ScanSource) => void;

  /**
   * Mettre à jour le contexte avec les données scannées
   */
  updateScannedProduct: (product: ScannedProductContext) => void;

  /**
   * Passer à l'étape suivante
   */
  nextStep: () => void;

  /**
   * Revenir à l'étape précédente
   */
  previousStep: () => void;

  /**
   * Réinitialiser le flux
   */
  reset: () => void;

  /**
   * Définir une erreur
   */
  setError: (error: string | null) => void;

  /**
   * Définir l'état de traitement
   */
  setProcessing: (isProcessing: boolean) => void;
}

/**
 * Props du contexte complet
 */
export type ScanFlowContextType = ScanFlowState & ScanFlowActions;
