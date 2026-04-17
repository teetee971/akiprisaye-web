/**
 * Scan Types - v1.0.0
 *
 * Types et interfaces pour la fonctionnalité de scan de codes-barres et OCR
 */

/**
 * États du scan
 */
export type ScanState =
  | 'idle' // Inactif, en attente de démarrage
  | 'scanning' // Scanner actif, recherche de code-barres
  | 'processing' // Traitement du code scanné / OCR en cours
  | 'success' // Scan réussi avec produit trouvé
  | 'not_found' // Scan réussi mais produit non référencé
  | 'error' // Erreur générale
  | 'permission_denied'; // Accès caméra refusé

/**
 * Options de configuration du scanner
 */
export interface ScannerOptions {
  /**
   * Délai d'attente maximum pour le scan (en ms)
   * @default 15000
   */
  timeout?: number;

  /**
   * Comportement en cas de produit non référencé
   * - 'manual_search': Proposer une recherche manuelle
   * - 'local_save': Enregistrer localement pour revue
   * - 'show_empty': Afficher une page produit vide
   */
  notFoundBehavior?: 'manual_search' | 'local_save' | 'show_empty';

  /**
   * Activer le logging détaillé des transitions d'état
   * @default false
   */
  enableDebugLogging?: boolean;

  /**
   * Activer l'OCR en fallback si le code-barres n'est pas détecté
   * @default false
   */
  enableOcrFallback?: boolean;
}

/**
 * Options de configuration pour l'OCR
 */
export interface OcrOptions {
  /**
   * Activer/désactiver l'OCR
   * @default true
   */
  enabled?: boolean;

  /**
   * Niveau de confiance minimum pour accepter le texte détecté (0-100)
   * @default 60
   */
  confidenceThreshold?: number;

  /**
   * Langue pour l'OCR
   * @default 'fra'
   */
  language?: string;

  /**
   * Timeout pour l'OCR (en ms)
   * @default 30000
   */
  timeout?: number;
}

/**
 * Résultat d'un scan
 */
export interface ScanResult {
  /**
   * État final du scan
   */
  state: ScanState;

  /**
   * Code-barres détecté (si applicable)
   */
  barcode?: string;

  /**
   * Texte extrait par OCR (si applicable)
   */
  ocrText?: string;

  /**
   * Données du produit trouvé (si applicable)
   */
  product?: import('./product').Product;

  /**
   * Message d'erreur (si applicable)
   */
  error?: string;

  /**
   * Timestamp du scan
   */
  timestamp: Date;

  /**
   * Durée du scan (en ms)
   */
  duration?: number;
}

/**
 * Configuration des paramètres de scan persistants
 */
export interface ScanSettings {
  /**
   * Options du scanner
   */
  scanner: ScannerOptions;

  /**
   * Options de l'OCR
   */
  ocr: OcrOptions;

  /**
   * Préférence de caméra (avant/arrière)
   */
  preferredCamera?: 'user' | 'environment';

  /**
   * Activer le son au scan
   */
  enableSound?: boolean;

  /**
   * Activer la vibration au scan (sur mobile)
   */
  enableVibration?: boolean;
}

/**
 * Valeurs par défaut pour les paramètres de scan
 */
export const DEFAULT_SCAN_SETTINGS: ScanSettings = {
  scanner: {
    timeout: 15000,
    notFoundBehavior: 'manual_search',
    enableDebugLogging: false,
    enableOcrFallback: false,
  },
  ocr: {
    enabled: true,
    confidenceThreshold: 60,
    language: 'fra',
    timeout: 30000,
  },
  preferredCamera: 'environment',
  enableSound: true,
  enableVibration: true,
};

/**
 * Événement de transition d'état
 */
export interface ScanStateTransition {
  from: ScanState;
  to: ScanState;
  timestamp: Date;
  reason?: string;
}

/**
 * Historique de scan pour analytics/debug
 */
export interface ScanHistory {
  id: string;
  result: ScanResult;
  transitions: ScanStateTransition[];
  userAgent?: string;
  location?: string;
}
