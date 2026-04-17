/**
 * Scanner Messages Constants
 * Centralized messages for scanner UX
 */

export const SCANNER_MESSAGES = {
  CAMERA_UNAVAILABLE: {
    type: 'info' as const,
    title: 'Caméra indisponible',
    message:
      'Caméra non disponible sur ce navigateur. Utilisez la saisie manuelle ou importez une image.',
  },
  CAMERA_PERMISSION_DENIED: {
    type: 'warning' as const,
    title: 'Permission caméra refusée',
    message:
      "Permission caméra refusée. Autorisez l'accès à la caméra dans les paramètres du navigateur puis réessayez.",
  },
} as const;

export type ScannerMessageType = 'info' | 'warning' | 'error';

export interface ScannerMessage {
  type: ScannerMessageType;
  title: string;
  message: string;
}
