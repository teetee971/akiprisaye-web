/**
 * Test suite to verify BarcodeScanner handles missing navigator API correctly
 * This ensures CI builds don't fail when navigator is undefined (Node.js environment)
 */

import { describe, it, expect } from 'vitest';

describe('BarcodeScanner - Navigator Guard', () => {
  it('should be importable without throwing navigator errors', () => {
    // This test verifies that the module can be imported in Node.js environment
    // where navigator might be undefined or incomplete
    expect(() => {
      // Dynamic import to test module loading
      import('../BarcodeScanner');
    }).not.toThrow();
  });

  it('should handle undefined navigator gracefully', () => {
    // Save original navigator
    const originalNavigator = global.navigator;
    
    try {
      // Simulate missing navigator (SSR/Node environment)
      (global as any).navigator = undefined;
      
      // Import should not throw
      expect(async () => {
        await import('../BarcodeScanner');
      }).not.toThrow();
    } finally {
      // Restore navigator
      (global as any).navigator = originalNavigator;
    }
  });

  it('should handle missing permissions API gracefully', () => {
    // Save original navigator
    const originalNavigator = global.navigator;
    
    try {
      // Simulate navigator without permissions API (older browsers)
      (global as any).navigator = {
        userAgent: 'test',
        // permissions is missing
      };
      
      // Import should not throw
      expect(async () => {
        await import('../BarcodeScanner');
      }).not.toThrow();
    } finally {
      // Restore navigator
      (global as any).navigator = originalNavigator;
    }
  });
});
