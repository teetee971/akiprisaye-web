/**
 * Platform Detection Service
 *
 * Detects whether the app is running on web or Android platform
 * and provides utilities for platform-specific features
 *
 * CONTEXT:
 * - Web version: 100% FREE (CITOYEN mode)
 * - Android version: FREE (CITOYEN) + optional PREMIUM features via Google Play Billing
 */

import { Capacitor } from '@capacitor/core';

export type Platform = 'web' | 'android' | 'ios';

/**
 * Get the current platform
 * @returns 'web', 'android', or 'ios'
 */
export function getPlatform(): Platform {
  const platform = Capacitor.getPlatform();
  return platform as Platform;
}

/**
 * Check if running on Android
 */
export function isAndroid(): boolean {
  return getPlatform() === 'android';
}

/**
 * Check if running on web
 */
export function isWeb(): boolean {
  return getPlatform() === 'web';
}

/**
 * Check if running on native platform (Android or iOS)
 */
export function isNative(): boolean {
  return Capacitor.isNativePlatform();
}

/**
 * Check if a specific Capacitor plugin is available
 * Useful for checking if Google Play Billing plugin is available
 */
export function isPluginAvailable(pluginName: string): boolean {
  return Capacitor.isPluginAvailable(pluginName);
}

/**
 * Get platform information for debugging
 */
export function getPlatformInfo() {
  return {
    platform: getPlatform(),
    isNative: isNative(),
    isAndroid: isAndroid(),
    isWeb: isWeb(),
  };
}
