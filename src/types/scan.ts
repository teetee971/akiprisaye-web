// Types et constantes partagées pour l'état du scanner
export type ScanState =
  | 'idle'
  | 'scanning'
  | 'processing'
  | 'success'
  | 'not_found'
  | 'error'
  | 'permission_denied';

export const SCAN_STATES = {
  IDLE: 'idle' as ScanState,
  SCANNING: 'scanning' as ScanState,
  PROCESSING: 'processing' as ScanState,
  SUCCESS: 'success' as ScanState,
  NOT_FOUND: 'not_found' as ScanState,
  ERROR: 'error' as ScanState,
  PERMISSION_DENIED: 'permission_denied' as ScanState,
};

export type NotFoundBehavior = 'suggest_search' | 'save_for_review' | 'open_empty_product_page';

export const DEFAULT_NOT_FOUND_BEHAVIOR: NotFoundBehavior = 'suggest_search';
