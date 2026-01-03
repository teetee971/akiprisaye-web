/**
 * Scan Types - Explicit states and configuration for scan functionality
 * 
 * Part of scan UX improvements to avoid blank screens and provide clear user feedback
 */

/**
 * Explicit scan states for better UX control
 * Each state corresponds to a specific UI feedback
 */
export type ScanState =
  | 'idle'              // Initial state, ready to start scanning
  | 'scanning'          // Camera active, scanning in progress
  | 'processing'        // Processing barcode/OCR result
  | 'success'           // Product found successfully
  | 'not_found'         // Valid scan but product not in database
  | 'error'             // Error during scan (generic)
  | 'permission_denied' // Camera permission denied
  | 'no_camera'         // No camera available on device
  | 'camera_busy'       // Camera already in use by another app
  | 'timeout';          // Scan timeout exceeded

/**
 * OCR-specific states
 */
export type OCRState =
  | 'idle'              // Initial state
  | 'preprocessing'     // Image preprocessing
  | 'ocr_processing'    // OCR text extraction in progress
  | 'complete'          // OCR completed successfully
  | 'error'             // OCR error
  | 'timeout';          // OCR timeout

/**
 * Scanner configuration options
 */
export interface ScannerConfig {
  /** Scan timeout in milliseconds (default: 15000) */
  scanTimeout?: number;
  
  /** Enable/disable torch (flash) support */
  enableTorch?: boolean;
  
  /** Behavior when product is not found */
  notFoundBehavior?: NotFoundBehavior;
  
  /** Enable debug logging */
  enableDebugLogging?: boolean;
  
  /** Camera facing mode preference */
  cameraFacingMode?: 'environment' | 'user';
}

/**
 * OCR configuration options
 */
export interface OCRConfig {
  /** Enable/disable OCR processing */
  enabled?: boolean;
  
  /** OCR timeout in milliseconds (default: 4000) */
  timeout?: number;
  
  /** OCR sensitivity/confidence threshold (0-100) */
  confidenceThreshold?: number;
  
  /** Image preprocessing options */
  preprocessing?: {
    enhanceContrast?: boolean;
    grayscale?: boolean;
    autoRotate?: boolean;
  };
  
  /** Enable debug logging */
  enableDebugLogging?: boolean;
}

/**
 * Behavior when product is not found in database
 */
export type NotFoundBehavior =
  | 'show_search'        // Offer manual search
  | 'show_message'       // Show info message only
  | 'save_for_review'    // Save scan locally for later review
  | 'suggest_contribution'; // Suggest contributing product info

/**
 * Scan result with state tracking
 */
export interface ScanResult {
  /** Current scan state */
  state: ScanState;
  
  /** Scanned code (EAN, barcode, etc.) */
  code?: string;
  
  /** Error message if state is 'error' */
  error?: string;
  
  /** Additional context/metadata */
  metadata?: {
    timestamp: number;
    scanDuration?: number;
    cameraUsed?: boolean;
    manualInput?: boolean;
  };
}

/**
 * OCR scan result
 */
export interface OCRScanResult {
  /** Current OCR state */
  state: OCRState;
  
  /** Extracted text */
  text?: string;
  
  /** OCR confidence (0-100) */
  confidence?: number;
  
  /** Error message if state is 'error' */
  error?: string;
  
  /** Additional metadata */
  metadata?: {
    timestamp: number;
    processingDuration?: number;
    fromCache?: boolean;
  };
}

/**
 * State transition log for debugging
 */
export interface StateTransitionLog {
  from: ScanState | OCRState;
  to: ScanState | OCRState;
  timestamp: number;
  context?: Record<string, unknown>;
}

/**
 * Scanner settings (user preferences)
 */
export interface ScannerSettings {
  /** OCR configuration */
  ocr: OCRConfig;
  
  /** Scanner configuration */
  scanner: ScannerConfig;
  
  /** User preference for not found behavior */
  notFoundBehavior: NotFoundBehavior;
}

/**
 * Default scanner settings
 */
export const DEFAULT_SCANNER_SETTINGS: ScannerSettings = {
  ocr: {
    enabled: true,
    timeout: 4000,
    confidenceThreshold: 60,
    preprocessing: {
      enhanceContrast: true,
      grayscale: true,
      autoRotate: true,
    },
    enableDebugLogging: false,
  },
  scanner: {
    scanTimeout: 15000,
    enableTorch: true,
    notFoundBehavior: 'show_search',
    enableDebugLogging: false,
    cameraFacingMode: 'environment',
  },
  notFoundBehavior: 'show_search',
};

/**
 * Helper to log state transitions
 */
export function logStateTransition(
  from: ScanState | OCRState,
  to: ScanState | OCRState,
  context?: Record<string, unknown>
): StateTransitionLog {
  const log: StateTransitionLog = {
    from,
    to,
    timestamp: Date.now(),
    context,
  };
  
  if (import.meta.env.DEV) {
    console.log('[SCAN_STATE]', `${from} → ${to}`, context || '');
  }
  
  return log;
}

/**
 * Get user-friendly message for scan state
 */
export function getScanStateMessage(state: ScanState): string {
  const messages: Record<ScanState, string> = {
    idle: 'Prêt à scanner',
    scanning: 'Scan en cours...',
    processing: 'Traitement du code...',
    success: 'Produit trouvé !',
    not_found: 'Produit non référencé',
    error: 'Erreur lors du scan',
    permission_denied: 'Accès caméra refusé',
    no_camera: 'Aucune caméra détectée',
    camera_busy: 'Caméra déjà utilisée',
    timeout: 'Délai d\'attente dépassé',
  };
  
  return messages[state] || 'État inconnu';
}

/**
 * Get user-friendly message for OCR state
 */
export function getOCRStateMessage(state: OCRState): string {
  const messages: Record<OCRState, string> = {
    idle: 'Prêt pour l\'analyse',
    preprocessing: 'Préparation de l\'image...',
    ocr_processing: 'Lecture en cours...',
    complete: 'Analyse terminée !',
    error: 'Erreur lors de l\'analyse',
    timeout: 'Délai d\'analyse dépassé',
  };
  
  return messages[state] || 'État inconnu';
}
