/**
 * Tests for scan types and utilities
 */

import { describe, it, expect } from 'vitest';
import {
  logStateTransition,
  getScanStateMessage,
  getOCRStateMessage,
  DEFAULT_SCANNER_SETTINGS,
  type ScanState,
  type OCRState,
} from '../scan';

describe('scan types', () => {
  describe('logStateTransition', () => {
    it('should create a state transition log', () => {
      const log = logStateTransition('idle', 'scanning', { trigger: 'user_initiated' });
      
      expect(log.from).toBe('idle');
      expect(log.to).toBe('scanning');
      expect(log.timestamp).toBeGreaterThan(0);
      expect(log.context).toEqual({ trigger: 'user_initiated' });
    });

    it('should work without context', () => {
      const log = logStateTransition('scanning', 'processing');
      
      expect(log.from).toBe('scanning');
      expect(log.to).toBe('processing');
      expect(log.context).toBeUndefined();
    });
  });

  describe('getScanStateMessage', () => {
    it('should return correct message for idle state', () => {
      expect(getScanStateMessage('idle')).toBe('Prêt à scanner');
    });

    it('should return correct message for scanning state', () => {
      expect(getScanStateMessage('scanning')).toBe('Scan en cours...');
    });

    it('should return correct message for success state', () => {
      expect(getScanStateMessage('success')).toBe('Produit trouvé !');
    });

    it('should return correct message for not_found state', () => {
      expect(getScanStateMessage('not_found')).toBe('Produit non référencé');
    });

    it('should return correct message for error state', () => {
      expect(getScanStateMessage('error')).toBe('Erreur lors du scan');
    });

    it('should return correct message for permission_denied state', () => {
      expect(getScanStateMessage('permission_denied')).toBe('Accès caméra refusé');
    });

    it('should return correct message for no_camera state', () => {
      expect(getScanStateMessage('no_camera')).toBe('Aucune caméra détectée');
    });

    it('should return correct message for timeout state', () => {
      expect(getScanStateMessage('timeout')).toBe('Délai d\'attente dépassé');
    });
  });

  describe('getOCRStateMessage', () => {
    it('should return correct message for idle state', () => {
      expect(getOCRStateMessage('idle')).toBe('Prêt pour l\'analyse');
    });

    it('should return correct message for preprocessing state', () => {
      expect(getOCRStateMessage('preprocessing')).toBe('Préparation de l\'image...');
    });

    it('should return correct message for ocr_processing state', () => {
      expect(getOCRStateMessage('ocr_processing')).toBe('Lecture en cours...');
    });

    it('should return correct message for complete state', () => {
      expect(getOCRStateMessage('complete')).toBe('Analyse terminée !');
    });

    it('should return correct message for error state', () => {
      expect(getOCRStateMessage('error')).toBe('Erreur lors de l\'analyse');
    });

    it('should return correct message for timeout state', () => {
      expect(getOCRStateMessage('timeout')).toBe('Délai d\'analyse dépassé');
    });
  });

  describe('DEFAULT_SCANNER_SETTINGS', () => {
    it('should have default OCR settings', () => {
      expect(DEFAULT_SCANNER_SETTINGS.ocr).toBeDefined();
      expect(DEFAULT_SCANNER_SETTINGS.ocr.enabled).toBe(true);
      expect(DEFAULT_SCANNER_SETTINGS.ocr.timeout).toBe(4000);
      expect(DEFAULT_SCANNER_SETTINGS.ocr.confidenceThreshold).toBe(60);
    });

    it('should have default scanner settings', () => {
      expect(DEFAULT_SCANNER_SETTINGS.scanner).toBeDefined();
      expect(DEFAULT_SCANNER_SETTINGS.scanner.scanTimeout).toBe(15000);
      expect(DEFAULT_SCANNER_SETTINGS.scanner.enableTorch).toBe(true);
      expect(DEFAULT_SCANNER_SETTINGS.scanner.cameraFacingMode).toBe('environment');
    });

    it('should have default notFoundBehavior', () => {
      expect(DEFAULT_SCANNER_SETTINGS.notFoundBehavior).toBe('show_search');
    });

    it('should have OCR preprocessing defaults', () => {
      const preprocessing = DEFAULT_SCANNER_SETTINGS.ocr.preprocessing;
      expect(preprocessing).toBeDefined();
      expect(preprocessing?.enhanceContrast).toBe(true);
      expect(preprocessing?.grayscale).toBe(true);
      expect(preprocessing?.autoRotate).toBe(true);
    });
  });

  describe('ScanState type', () => {
    it('should accept all valid scan states', () => {
      const validStates: ScanState[] = [
        'idle',
        'scanning',
        'processing',
        'success',
        'not_found',
        'error',
        'permission_denied',
        'no_camera',
        'camera_busy',
        'timeout',
      ];

      validStates.forEach((state) => {
        expect(getScanStateMessage(state)).toBeTruthy();
      });
    });
  });

  describe('OCRState type', () => {
    it('should accept all valid OCR states', () => {
      const validStates: OCRState[] = [
        'idle',
        'preprocessing',
        'ocr_processing',
        'complete',
        'error',
        'timeout',
      ];

      validStates.forEach((state) => {
        expect(getOCRStateMessage(state)).toBeTruthy();
      });
    });
  });
});
