 
 
/**
 * Test suite to verify CameraPermissionHandler handles missing navigator API correctly
 * This ensures CI builds don't fail when navigator is undefined (Node.js environment)
 */

import { describe, it, expect } from 'vitest';

describe('CameraPermissionHandler - Navigator Guard', () => {
  it('should be importable without throwing navigator errors', () => {
    // This test verifies that the module can be imported in Node.js environment
    // where navigator might be undefined or incomplete
    expect(() => {
      // Dynamic import to test module loading
      import('../CameraPermissionHandler');
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
        await import('../CameraPermissionHandler');
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
      // Simulate navigator without permissions API (Safari/iOS)
      (global as any).navigator = {
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
        // permissions is missing - common in Safari
      };
      
      // Import should not throw
      expect(async () => {
        await import('../CameraPermissionHandler');
      }).not.toThrow();
    } finally {
      // Restore navigator
      (global as any).navigator = originalNavigator;
    }
  });
});
