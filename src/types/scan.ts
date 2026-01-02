/**
 * Scan State Types - H — CORRECTIF SCAN UX IMMÉDIAT
 * 
 * Définit tous les états possibles du processus de scan
 * pour assurer qu'aucune action utilisateur ne reste sans réponse visuelle
 */

export type ScanState =
  | 'idle'
  | 'camera_open'
  | 'scanning'
  | 'ocr_processing'
  | 'success'
  | 'no_result'
  | 'error';

/**
 * Messages UX pour chaque état du scan
 */
export const SCAN_STATE_MESSAGES: Record<ScanState, string> = {
  idle: 'Prêt à scanner',
  camera_open: 'Ouverture de la caméra...',
  scanning: 'Analyse du produit…',
  ocr_processing: 'Lecture de l\'étiquette…',
  success: 'Produit trouvé !',
  no_result: 'Produit non identifié — données insuffisantes',
  error: 'Une erreur est survenue'
};

/**
 * Interface pour les produits non référencés (fallback universel)
 */
export interface UnreferencedProduct {
  type: 'unrecognized';
  ean?: string;
  photoUrl?: string;
  captureDate: string;
  territoire: string;
  message: string;
}
