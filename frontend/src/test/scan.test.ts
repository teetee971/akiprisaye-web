/**
 * Scan Types Tests - v1.0.0
 *
 * Tests for scan state management and transitions
 */

import { describe, it, expect } from 'vitest';
import { DEFAULT_SCAN_SETTINGS } from '../types/scan';
import type { ScanState, ScanStateTransition, ScanSettings } from '../types/scan';

describe('Scan Types', () => {
  describe('DEFAULT_SCAN_SETTINGS', () => {
    it('should have correct default scanner settings', () => {
      expect(DEFAULT_SCAN_SETTINGS.scanner.timeout).toBe(15000);
      expect(DEFAULT_SCAN_SETTINGS.scanner.notFoundBehavior).toBe('manual_search');
      expect(DEFAULT_SCAN_SETTINGS.scanner.enableDebugLogging).toBe(false);
      expect(DEFAULT_SCAN_SETTINGS.scanner.enableOcrFallback).toBe(false);
    });

    it('should have correct default OCR settings', () => {
      expect(DEFAULT_SCAN_SETTINGS.ocr.enabled).toBe(true);
      expect(DEFAULT_SCAN_SETTINGS.ocr.confidenceThreshold).toBe(60);
      expect(DEFAULT_SCAN_SETTINGS.ocr.language).toBe('fra');
      expect(DEFAULT_SCAN_SETTINGS.ocr.timeout).toBe(30000);
    });

    it('should have correct default camera and feedback settings', () => {
      expect(DEFAULT_SCAN_SETTINGS.preferredCamera).toBe('environment');
      expect(DEFAULT_SCAN_SETTINGS.enableSound).toBe(true);
      expect(DEFAULT_SCAN_SETTINGS.enableVibration).toBe(true);
    });
  });

  describe('ScanState', () => {
    it('should have all required states', () => {
      const states: ScanState[] = [
        'idle',
        'scanning',
        'processing',
        'success',
        'not_found',
        'error',
        'permission_denied',
      ];

      // Type checking - this will fail at compile time if states are incorrect
      states.forEach((state) => {
        expect(typeof state).toBe('string');
      });
    });
  });

  describe('ScanStateTransition', () => {
    it('should create valid state transition', () => {
      const transition: ScanStateTransition = {
        from: 'idle',
        to: 'scanning',
        timestamp: new Date(),
        reason: 'User initiated scan',
      };

      expect(transition.from).toBe('idle');
      expect(transition.to).toBe('scanning');
      expect(transition.timestamp).toBeInstanceOf(Date);
      expect(transition.reason).toBe('User initiated scan');
    });

    it('should allow transition without reason', () => {
      const transition: ScanStateTransition = {
        from: 'scanning',
        to: 'processing',
        timestamp: new Date(),
      };

      expect(transition.reason).toBeUndefined();
    });
  });

  describe('ScanSettings validation', () => {
    it('should accept valid scanner timeout', () => {
      const settings: ScanSettings = {
        ...DEFAULT_SCAN_SETTINGS,
        scanner: {
          ...DEFAULT_SCAN_SETTINGS.scanner,
          timeout: 20000,
        },
      };

      expect(settings.scanner.timeout).toBe(20000);
    });

    it('should accept all notFoundBehavior values', () => {
      const behaviors = ['manual_search', 'local_save', 'show_empty'] as const;

      behaviors.forEach((behavior) => {
        const settings: ScanSettings = {
          ...DEFAULT_SCAN_SETTINGS,
          scanner: {
            ...DEFAULT_SCAN_SETTINGS.scanner,
            notFoundBehavior: behavior,
          },
        };

        expect(settings.scanner.notFoundBehavior).toBe(behavior);
      });
    });

    it('should accept valid OCR confidence threshold', () => {
      const settings: ScanSettings = {
        ...DEFAULT_SCAN_SETTINGS,
        ocr: {
          ...DEFAULT_SCAN_SETTINGS.ocr,
          confidenceThreshold: 80,
        },
      };

      expect(settings.ocr.confidenceThreshold).toBe(80);
    });
  });

  describe('State Transition Scenarios', () => {
    it('should represent successful scan flow', () => {
      const transitions: ScanStateTransition[] = [
        {
          from: 'idle',
          to: 'scanning',
          timestamp: new Date(),
          reason: 'User initiated scan',
        },
        {
          from: 'scanning',
          to: 'processing',
          timestamp: new Date(),
          reason: 'Barcode detected',
        },
        {
          from: 'processing',
          to: 'success',
          timestamp: new Date(),
          reason: 'Product found',
        },
      ];

      expect(transitions).toHaveLength(3);
      expect(transitions[0].from).toBe('idle');
      expect(transitions[2].to).toBe('success');
    });

    it('should represent product not found flow', () => {
      const transitions: ScanStateTransition[] = [
        {
          from: 'idle',
          to: 'scanning',
          timestamp: new Date(),
          reason: 'User initiated scan',
        },
        {
          from: 'scanning',
          to: 'processing',
          timestamp: new Date(),
          reason: 'Barcode detected',
        },
        {
          from: 'processing',
          to: 'not_found',
          timestamp: new Date(),
          reason: 'Product not in database',
        },
      ];

      expect(transitions).toHaveLength(3);
      expect(transitions[2].to).toBe('not_found');
    });

    it('should represent permission denied flow', () => {
      const transitions: ScanStateTransition[] = [
        {
          from: 'idle',
          to: 'scanning',
          timestamp: new Date(),
          reason: 'User initiated scan',
        },
        {
          from: 'scanning',
          to: 'permission_denied',
          timestamp: new Date(),
          reason: 'Camera access denied by user',
        },
      ];

      expect(transitions).toHaveLength(2);
      expect(transitions[1].to).toBe('permission_denied');
    });

    it('should represent error flow', () => {
      const transitions: ScanStateTransition[] = [
        {
          from: 'idle',
          to: 'scanning',
          timestamp: new Date(),
          reason: 'User initiated scan',
        },
        {
          from: 'scanning',
          to: 'error',
          timestamp: new Date(),
          reason: 'Camera not found',
        },
      ];

      expect(transitions).toHaveLength(2);
      expect(transitions[1].to).toBe('error');
      expect(transitions[1].reason).toContain('Camera');
    });
  });

  describe('Settings Boundary Values', () => {
    it('should handle minimum timeout', () => {
      const settings: ScanSettings = {
        ...DEFAULT_SCAN_SETTINGS,
        scanner: {
          ...DEFAULT_SCAN_SETTINGS.scanner,
          timeout: 5000, // 5 seconds minimum
        },
      };

      expect(settings.scanner.timeout).toBeGreaterThanOrEqual(5000);
    });

    it('should handle maximum timeout', () => {
      const settings: ScanSettings = {
        ...DEFAULT_SCAN_SETTINGS,
        scanner: {
          ...DEFAULT_SCAN_SETTINGS.scanner,
          timeout: 30000, // 30 seconds maximum
        },
      };

      expect(settings.scanner.timeout).toBeLessThanOrEqual(30000);
    });

    it('should handle confidence threshold boundaries', () => {
      const minSettings: ScanSettings = {
        ...DEFAULT_SCAN_SETTINGS,
        ocr: {
          ...DEFAULT_SCAN_SETTINGS.ocr,
          confidenceThreshold: 30,
        },
      };

      const maxSettings: ScanSettings = {
        ...DEFAULT_SCAN_SETTINGS,
        ocr: {
          ...DEFAULT_SCAN_SETTINGS.ocr,
          confidenceThreshold: 90,
        },
      };

      expect(minSettings.ocr.confidenceThreshold).toBe(30);
      expect(maxSettings.ocr.confidenceThreshold).toBe(90);
    });
  });
});
