/**
 * Tests for scan types and utilities
 */
import { describe, it, expect, vi } from 'vitest';
import {
  logStateTransition,
  getStateIcon,
  STATE_MESSAGES,
  DEFAULT_SCANNER_CONFIG,
} from '../types/scan';
import type { ScanState } from '../types/scan';

describe('Scan Types and Utilities', () => {
  describe('STATE_MESSAGES', () => {
    it('should have messages for all scan states', () => {
      const expectedStates: ScanState[] = [
        'idle',
        'scanning',
        'processing',
        'success',
        'not_found',
        'error',
        'permission_denied',
      ];

      expectedStates.forEach((state) => {
        expect(STATE_MESSAGES[state]).toBeDefined();
        expect(typeof STATE_MESSAGES[state]).toBe('string');
        expect(STATE_MESSAGES[state].length).toBeGreaterThan(0);
      });
    });
  });

  describe('getStateIcon', () => {
    it('should return an icon for each scan state', () => {
      const states: ScanState[] = [
        'idle',
        'scanning',
        'processing',
        'success',
        'not_found',
        'error',
        'permission_denied',
      ];

      states.forEach((state) => {
        const icon = getStateIcon(state);
        expect(icon).toBeDefined();
        expect(typeof icon).toBe('string');
        expect(icon.length).toBeGreaterThan(0);
      });
    });

    it('should return different icons for different states', () => {
      const idleIcon = getStateIcon('idle');
      const scanningIcon = getStateIcon('scanning');
      const errorIcon = getStateIcon('error');

      expect(idleIcon).not.toBe(scanningIcon);
      expect(scanningIcon).not.toBe(errorIcon);
      expect(errorIcon).not.toBe(idleIcon);
    });
  });

  describe('logStateTransition', () => {
    it('should log state transition to console', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      logStateTransition('idle', 'scanning', { test: 'context' });

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[SCAN_STATE]')
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('idle → scanning')
      );

      consoleSpy.mockRestore();
    });

    it('should handle transitions without context', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      logStateTransition('scanning', 'processing');

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[SCAN_STATE]')
      );

      consoleSpy.mockRestore();
    });
  });

  describe('DEFAULT_SCANNER_CONFIG', () => {
    it('should have valid default configuration', () => {
      expect(DEFAULT_SCANNER_CONFIG).toBeDefined();
      expect(DEFAULT_SCANNER_CONFIG.scanTimeout).toBe(15000);
      expect(DEFAULT_SCANNER_CONFIG.notFoundBehavior).toBe('offer_search');
      expect(DEFAULT_SCANNER_CONFIG.enableOCR).toBe(false);
      expect(DEFAULT_SCANNER_CONFIG.ocrSensitivity).toBe('medium');
      expect(DEFAULT_SCANNER_CONFIG.debugMode).toBe(false);
    });

    it('should have valid notFoundBehavior options', () => {
      const validBehaviors = ['show_message', 'offer_search', 'record_locally'];
      expect(validBehaviors).toContain(DEFAULT_SCANNER_CONFIG.notFoundBehavior);
    });

    it('should have valid ocrSensitivity options', () => {
      const validSensitivities = ['low', 'medium', 'high'];
      expect(validSensitivities).toContain(DEFAULT_SCANNER_CONFIG.ocrSensitivity);
    });
  });

  describe('State Transitions', () => {
    it('should support common scan flow transitions', () => {
      const commonFlow: ScanState[] = [
        'idle',
        'scanning',
        'processing',
        'success',
      ];

      // Verify all states are valid
      commonFlow.forEach((state) => {
        expect(STATE_MESSAGES[state]).toBeDefined();
        expect(getStateIcon(state)).toBeDefined();
      });
    });

    it('should support error flow transitions', () => {
      const errorFlow: ScanState[] = ['idle', 'scanning', 'error'];

      errorFlow.forEach((state) => {
        expect(STATE_MESSAGES[state]).toBeDefined();
        expect(getStateIcon(state)).toBeDefined();
      });
    });

    it('should support not found flow transitions', () => {
      const notFoundFlow: ScanState[] = [
        'idle',
        'scanning',
        'processing',
        'not_found',
      ];

      notFoundFlow.forEach((state) => {
        expect(STATE_MESSAGES[state]).toBeDefined();
        expect(getStateIcon(state)).toBeDefined();
      });
    });

    it('should support permission denied flow', () => {
      const permissionFlow: ScanState[] = ['idle', 'permission_denied'];

      permissionFlow.forEach((state) => {
        expect(STATE_MESSAGES[state]).toBeDefined();
        expect(getStateIcon(state)).toBeDefined();
      });
    });
  });

  describe('Scanner Configuration', () => {
    it('should allow custom timeout values', () => {
      const customTimeout = 20000;
      const config = { ...DEFAULT_SCANNER_CONFIG, scanTimeout: customTimeout };

      expect(config.scanTimeout).toBe(customTimeout);
    });

    it('should allow different notFoundBehavior values', () => {
      const behaviors = ['show_message', 'offer_search', 'record_locally'];

      behaviors.forEach((behavior) => {
        const config = {
          ...DEFAULT_SCANNER_CONFIG,
          notFoundBehavior: behavior as any,
        };
        expect(config.notFoundBehavior).toBe(behavior);
      });
    });

    it('should allow enabling OCR', () => {
      const config = { ...DEFAULT_SCANNER_CONFIG, enableOCR: true };
      expect(config.enableOCR).toBe(true);
    });

    it('should allow different OCR sensitivity levels', () => {
      const sensitivities = ['low', 'medium', 'high'];

      sensitivities.forEach((sensitivity) => {
        const config = {
          ...DEFAULT_SCANNER_CONFIG,
          ocrSensitivity: sensitivity as any,
        };
        expect(config.ocrSensitivity).toBe(sensitivity);
      });
    });

    it('should allow enabling debug mode', () => {
      const config = { ...DEFAULT_SCANNER_CONFIG, debugMode: true };
      expect(config.debugMode).toBe(true);
    });
  });
});
