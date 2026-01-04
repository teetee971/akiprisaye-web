/**
 * Scan Types and States
 * 
 * This file defines explicit states for the scanning process to ensure
 * clear UX feedback and avoid empty screens.
 */

/**
 * Scan state enumeration for barcode/OCR scanning
 */
export type ScanState = 
  | 'idle'               // Initial state, ready to start scanning
  | 'scanning'           // Camera/OCR actively scanning
  | 'processing'         // Processing detected code/image
  | 'success'            // Product found successfully
  | 'not_found'          // Product not in database
  | 'error'              // General error occurred
  | 'permission_denied'; // Camera permission denied

/**
 * Scan result interface
 */
export interface ScanResult {
  code?: string;           // Scanned barcode code
  text?: string;           // OCR extracted text
  state: ScanState;
  error?: string;          // Error message if applicable
  timestamp: number;       // When scan occurred
}

/**
 * Scanner configuration options
 */
export interface ScannerConfig {
  // Timeout duration in milliseconds before showing timeout message
  scanTimeout?: number;
  
  // Behavior when product is not found
  notFoundBehavior?: 'show_message' | 'offer_search' | 'record_locally';
  
  // Enable/disable OCR processing
  enableOCR?: boolean;
  
  // OCR sensitivity level
  ocrSensitivity?: 'low' | 'medium' | 'high';
  
  // Enable debug logging
  debugMode?: boolean;
}

/**
 * Default scanner configuration
 */
export const DEFAULT_SCANNER_CONFIG: ScannerConfig = {
  scanTimeout: 15000, // 15 seconds
  notFoundBehavior: 'offer_search',
  enableOCR: false,
  ocrSensitivity: 'medium',
  debugMode: false,
};

/**
 * State transition logging helper
 * Only logs when debug mode is enabled
 */
export function logStateTransition(
  from: ScanState,
  to: ScanState,
  context?: Record<string, any>,
  debugMode: boolean = false
): void {
  if (!debugMode) return;
  
  const timestamp = new Date().toISOString();
  const contextStr = context ? JSON.stringify(context) : '';
  
  console.log(`[SCAN_STATE] ${timestamp} | ${from} → ${to} ${contextStr}`);
  
  // Also log to any debug hooks if available
  if (typeof window !== 'undefined' && (window as any).scanDebugHook) {
    try {
      (window as any).scanDebugHook({ from, to, timestamp, context });
    } catch (error) {
      // Silently fail if debug hook has issues
      console.error('Debug hook error:', error);
    }
  }
}

/**
 * User-friendly state messages
 */
export const STATE_MESSAGES: Record<ScanState, string> = {
  idle: 'Prêt à scanner',
  scanning: 'Scan en cours...',
  processing: 'Traitement en cours...',
  success: 'Produit trouvé !',
  not_found: 'Produit non référencé dans notre base',
  error: 'Une erreur est survenue',
  permission_denied: 'Accès à la caméra refusé',
};

/**
 * Get appropriate icon for each state
 */
export function getStateIcon(state: ScanState): string {
  const icons: Record<ScanState, string> = {
    idle: '📷',
    scanning: '🔍',
    processing: '⚙️',
    success: '✅',
    not_found: '❓',
    error: '❌',
    permission_denied: '🔒',
  };
  return icons[state];
}
