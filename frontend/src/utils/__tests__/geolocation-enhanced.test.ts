// @ts-nocheck
 
/**
 * Test for enhanced geolocation utility
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { requestGeolocation, isGeolocationAvailable, getGeolocationDiagnostics } from '../geolocationEnhanced';

describe('Enhanced Geolocation Utility', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('requestGeolocation', () => {
    it('should return error when geolocation API is not available', async () => {
      // Mock navigator without geolocation
      const originalNavigator = global.navigator;
      Object.defineProperty(global, 'navigator', {
        value: {},
        writable: true,
        configurable: true
      });

      const result = await requestGeolocation();

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('NOT_SUPPORTED');
      expect(result.error?.userMessage).toContain('ne supporte pas');

      // Restore navigator
      Object.defineProperty(global, 'navigator', {
        value: originalNavigator,
        writable: true,
        configurable: true
      });
    });

    it('should call showMessage callback on success', async () => {
      const mockShowMessage = vi.fn();
      const mockPosition = {
        coords: {
          latitude: 48.8566,
          longitude: 2.3522,
          accuracy: 10
        }
      };

      // Mock geolocation API
      const mockGetCurrentPosition = vi.fn((success) => {
        success(mockPosition);
      });

      Object.defineProperty(global.navigator, 'geolocation', {
        value: { getCurrentPosition: mockGetCurrentPosition },
        writable: true,
        configurable: true
      });

      const result = await requestGeolocation(mockShowMessage);

      expect(result.success).toBe(true);
      expect(result.position?.latitude).toBe(48.8566);
      expect(result.position?.longitude).toBe(2.3522);
      expect(mockShowMessage).toHaveBeenCalledWith(
        expect.stringContaining('succès'),
        'success'
      );
    });

    it('should map PERMISSION_DENIED error to user-friendly message', async () => {
      const mockShowMessage = vi.fn();
      const mockError = {
        code: 1, // PERMISSION_DENIED
        message: 'User denied geolocation',
        PERMISSION_DENIED: 1,
        POSITION_UNAVAILABLE: 2,
        TIMEOUT: 3
      };

      // Mock geolocation API with error
      const mockGetCurrentPosition = vi.fn((success, error) => {
        error(mockError);
      });

      Object.defineProperty(global.navigator, 'geolocation', {
        value: { getCurrentPosition: mockGetCurrentPosition },
        writable: true,
        configurable: true
      });

      const result = await requestGeolocation(mockShowMessage);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('PERMISSION_DENIED');
      expect(result.error?.userMessage).toContain('refusé');
      expect(result.error?.suggestions).toBeDefined();
      expect(result.error?.suggestions?.length).toBeGreaterThan(0);
    });

    it('should detect Permissions-Policy errors', async () => {
      const mockShowMessage = vi.fn();
      const mockError = {
        code: 1,
        message: 'Geolocation has been disabled in this document by permissions policy',
        PERMISSION_DENIED: 1,
        POSITION_UNAVAILABLE: 2,
        TIMEOUT: 3
      };

      // Mock geolocation API with Permissions-Policy error
      const mockGetCurrentPosition = vi.fn((success, error) => {
        error(mockError);
      });

      Object.defineProperty(global.navigator, 'geolocation', {
        value: { getCurrentPosition: mockGetCurrentPosition },
        writable: true,
        configurable: true
      });

      const result = await requestGeolocation(mockShowMessage);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('PERMISSIONS_POLICY_BLOCKED');
      expect(result.error?.userMessage).toContain('bloquée');
      expect(mockShowMessage).toHaveBeenCalledWith(
        expect.stringContaining('bloquée'),
        'error'
      );
    });
  });

  describe('isGeolocationAvailable', () => {
    it('should return false when geolocation API is not available', async () => {
      // Mock navigator without geolocation
      const originalNavigator = global.navigator;
      Object.defineProperty(global, 'navigator', {
        value: {},
        writable: true,
        configurable: true
      });

      const result = await isGeolocationAvailable();

      expect(result.available).toBe(false);
      expect(result.reason).toBeDefined();

      // Restore navigator
      Object.defineProperty(global, 'navigator', {
        value: originalNavigator,
        writable: true,
        configurable: true
      });
    });

    it('should return true when geolocation API is available', async () => {
      // Mock geolocation API
      Object.defineProperty(global.navigator, 'geolocation', {
        value: { getCurrentPosition: vi.fn() },
        writable: true,
        configurable: true
      });

      const result = await isGeolocationAvailable();

      expect(result.available).toBe(true);
    });
  });

  describe('getGeolocationDiagnostics', () => {
    it('should return diagnostic information', async () => {
      // Mock geolocation API
      Object.defineProperty(global.navigator, 'geolocation', {
        value: { getCurrentPosition: vi.fn() },
        writable: true,
        configurable: true
      });

      const diagnostics = await getGeolocationDiagnostics();

      expect(diagnostics).toHaveProperty('apiSupported');
      expect(diagnostics).toHaveProperty('permissionsApiSupported');
      expect(diagnostics).toHaveProperty('isInIframe');
      expect(diagnostics).toHaveProperty('isWebView');
      expect(diagnostics).toHaveProperty('userAgent');
    });
  });
});
