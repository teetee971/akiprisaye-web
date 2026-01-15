/**
 * Scanner Messages Constants
 * Centralized messages for scanner UX
 */

export const SCANNER_MESSAGES = {
  CAMERA_UNAVAILABLE: {
    type: 'info' as const,
    title: 'Caméra indisponible',
    message: 'La caméra n\'est pas accessible sur ce navigateur. Vous pouvez importer une photo du code-barres.'
  }
} as const;

export type ScannerMessageType = 'info' | 'warning' | 'error';

export interface ScannerMessage {
  type: ScannerMessageType;
  title: string;
  message: string;
}
