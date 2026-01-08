/**
 * Tests for Enhanced Geolocation Utility
 * Validates permission handling, error detection, and user-friendly messaging
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  requestGeolocation,
  getCoordinates,
  isLikelyBlockedByPermissionsPolicy,
  type GeolocationResult,
} from '../geolocation';

// Mock navigator.geolocation
const mockGeolocation = {
  getCurrentPosition: vi.fn(),
  watchPosition: vi.fn(),
  clearWatch: vi.fn(),
};

// Mock navigator.permissions
const mockPermissions = {
  query: vi.fn(),
};

describe('Enhanced Geolocation Utility', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup navigator mocks
    Object.defineProperty(global.navigator, 'geolocation', {
      writable: true,
      value: mockGeolocation,
    });
    
    Object.defineProperty(global.navigator, 'permissions', {
      writable: true,
      value: mockPermissions,
    });
  });

  describe('requestGeolocation', () => {
    it('should return error when geolocation is not available', async () => {
      // Remove geolocation from navigator
      Object.defineProperty(global.navigator, 'geolocation', {
        writable: true,
        value: undefined,
      });

      const result = await requestGeolocation();

      expect(result.error).toBeDefined();
      expect(result.errorType).toBe('unavailable');
      expect(result.position).toBeUndefined();
    });

    it('should return position on successful geolocation', async () => {
      const mockPosition: GeolocationPosition = {
        coords: {
          latitude: 16.2415,
          longitude: -61.5331,
          accuracy: 10,
          altitude: null,
          altitudeAccuracy: null,
          heading: null,
          speed: null,
        },
        timestamp: Date.now(),
      };

      mockPermissions.query.mockResolvedValue({ state: 'granted' });
      mockGeolocation.getCurrentPosition.mockImplementation((success) => {
        success(mockPosition);
      });

      const result = await requestGeolocation();

      expect(result.position).toBeDefined();
      expect(result.position?.coords.latitude).toBe(16.2415);
      expect(result.position?.coords.longitude).toBe(-61.5331);
      expect(result.error).toBeUndefined();
    });

    it('should detect permission denied error', async () => {
      const mockError: GeolocationPositionError = {
        code: 1, // PERMISSION_DENIED
        message: 'User denied geolocation',
        PERMISSION_DENIED: 1,
        POSITION_UNAVAILABLE: 2,
        TIMEOUT: 3,
      };

      mockPermissions.query.mockResolvedValue({ state: 'prompt' });
      mockGeolocation.getCurrentPosition.mockImplementation((_, error) => {
        error(mockError);
      });

      const result = await requestGeolocation();

      expect(result.error).toBeDefined();
      expect(result.errorType).toBe('permission-denied');
      expect(result.position).toBeUndefined();
    });

    it('should detect Permissions-Policy block', async () => {
      const mockError: GeolocationPositionError = {
        code: 1,
        message: 'Geolocation has been disabled in this document by permissions policy',
        PERMISSION_DENIED: 1,
        POSITION_UNAVAILABLE: 2,
        TIMEOUT: 3,
      };

      mockPermissions.query.mockResolvedValue({ state: 'prompt' });
      mockGeolocation.getCurrentPosition.mockImplementation((_, error) => {
        error(mockError);
      });

      const result = await requestGeolocation();

      expect(result.error).toBeDefined();
      expect(result.errorType).toBe('permissions-policy');
      expect(result.error).toContain('configuration du site');
    });

    it('should detect timeout error', async () => {
      const mockError: GeolocationPositionError = {
        code: 3, // TIMEOUT
        message: 'Timeout',
        PERMISSION_DENIED: 1,
        POSITION_UNAVAILABLE: 2,
        TIMEOUT: 3,
      };

      mockPermissions.query.mockResolvedValue({ state: 'granted' });
      mockGeolocation.getCurrentPosition.mockImplementation((_, error) => {
        error(mockError);
      });

      const result = await requestGeolocation();

      expect(result.error).toBeDefined();
      expect(result.errorType).toBe('timeout');
    });

    it('should detect position unavailable error', async () => {
      const mockError: GeolocationPositionError = {
        code: 2, // POSITION_UNAVAILABLE
        message: 'Position unavailable',
        PERMISSION_DENIED: 1,
        POSITION_UNAVAILABLE: 2,
        TIMEOUT: 3,
      };

      mockPermissions.query.mockResolvedValue({ state: 'granted' });
      mockGeolocation.getCurrentPosition.mockImplementation((_, error) => {
        error(mockError);
      });

      const result = await requestGeolocation();

      expect(result.error).toBeDefined();
      expect(result.errorType).toBe('unavailable');
    });

    it('should call showMessage callback with appropriate messages', async () => {
      const showMessage = vi.fn();
      const mockPosition: GeolocationPosition = {
        coords: {
          latitude: 16.2415,
          longitude: -61.5331,
          accuracy: 10,
          altitude: null,
          altitudeAccuracy: null,
          heading: null,
          speed: null,
        },
        timestamp: Date.now(),
      };

      mockPermissions.query.mockResolvedValue({ state: 'granted' });
      mockGeolocation.getCurrentPosition.mockImplementation((success) => {
        success(mockPosition);
      });

      await requestGeolocation(showMessage);

      // Should call showMessage with info, then success
      expect(showMessage).toHaveBeenCalledWith(
        expect.stringContaining('Demande'),
        'info'
      );
      expect(showMessage).toHaveBeenCalledWith(
        expect.stringContaining('succès'),
        'success'
      );
    });

    it('should handle denied permission state from Permissions API', async () => {
      mockPermissions.query.mockResolvedValue({ state: 'denied' });

      const result = await requestGeolocation();

      expect(result.error).toBeDefined();
      expect(result.errorType).toBe('permission-denied');
      // Should not call getCurrentPosition if permission is denied
      expect(mockGeolocation.getCurrentPosition).not.toHaveBeenCalled();
    });
  });

  describe('getCoordinates', () => {
    it('should extract coordinates from successful result', () => {
      const result: GeolocationResult = {
        position: {
          coords: {
            latitude: 16.2415,
            longitude: -61.5331,
            accuracy: 10,
            altitude: null,
            altitudeAccuracy: null,
            heading: null,
            speed: null,
          },
          timestamp: Date.now(),
        },
      };

      const coords = getCoordinates(result);

      expect(coords).toBeDefined();
      expect(coords?.latitude).toBe(16.2415);
      expect(coords?.longitude).toBe(-61.5331);
      expect(coords?.accuracy).toBe(10);
    });

    it('should return null for error result', () => {
      const result: GeolocationResult = {
        error: 'Permission denied',
        errorType: 'permission-denied',
      };

      const coords = getCoordinates(result);

      expect(coords).toBeNull();
    });
  });

  describe('isLikelyBlockedByPermissionsPolicy', () => {
    it('should return false when Permissions API is available', async () => {
      mockPermissions.query.mockResolvedValue({ state: 'prompt' });

      const result = await isLikelyBlockedByPermissionsPolicy();

      expect(result).toBe(false);
    });

    it('should return true when Permissions API fails', async () => {
      mockPermissions.query.mockRejectedValue(new Error('Blocked by policy'));

      const result = await isLikelyBlockedByPermissionsPolicy();

      expect(result).toBe(true);
    });

    it('should return true when Permissions API is not available', async () => {
      Object.defineProperty(global.navigator, 'permissions', {
        writable: true,
        value: undefined,
      });

      const result = await isLikelyBlockedByPermissionsPolicy();

      expect(result).toBe(true);
    });
  });

  describe('error message detection', () => {
    it('should detect various Permissions-Policy error messages', async () => {
      const policyErrorMessages = [
        'Geolocation has been disabled in this document by permissions policy',
        'Not allowed by permissions policy',
        'Geolocation Permissions-Policy blocked',
        'disabled in this document by Permission-Policy',
      ];

      mockPermissions.query.mockResolvedValue({ state: 'prompt' });

      for (const message of policyErrorMessages) {
        vi.clearAllMocks(); // Clear between iterations
        
        const mockError: GeolocationPositionError = {
          code: 1,
          message,
          PERMISSION_DENIED: 1,
          POSITION_UNAVAILABLE: 2,
          TIMEOUT: 3,
        };

        mockGeolocation.getCurrentPosition.mockImplementation((_, error) => {
          error(mockError);
        });

        const result = await requestGeolocation();

        expect(result.errorType).toBe('permissions-policy');
      }
    });
  });

  describe('user-friendly messages', () => {
    it('should provide helpful message for Permissions-Policy block', async () => {
      const mockError: GeolocationPositionError = {
        code: 1,
        message: 'Permissions policy blocked',
        PERMISSION_DENIED: 1,
        POSITION_UNAVAILABLE: 2,
        TIMEOUT: 3,
      };

      mockPermissions.query.mockResolvedValue({ state: 'prompt' });
      mockGeolocation.getCurrentPosition.mockImplementation((_, error) => {
        error(mockError);
      });

      const result = await requestGeolocation();

      expect(result.error).toContain('DEPLOYMENT_NOTES.md');
      expect(result.error).toContain('configuration du site');
    });

    it('should provide actionable message for permission denied', async () => {
      mockPermissions.query.mockResolvedValue({ state: 'denied' });

      const result = await requestGeolocation();

      expect(result.error).toContain('paramètres');
      expect(result.error).toContain('navigateur');
    });

    it('should provide clear message for timeout', async () => {
      const mockError: GeolocationPositionError = {
        code: 3,
        message: 'Timeout',
        PERMISSION_DENIED: 1,
        POSITION_UNAVAILABLE: 2,
        TIMEOUT: 3,
      };

      mockPermissions.query.mockResolvedValue({ state: 'granted' });
      mockGeolocation.getCurrentPosition.mockImplementation((_, error) => {
        error(mockError);
      });

      const result = await requestGeolocation();

      expect(result.error).toContain('expiré');
      expect(result.error).toContain('réessayer');
    });
  });
});
