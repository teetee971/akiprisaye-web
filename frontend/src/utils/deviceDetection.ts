/**
 * Device detection utilities for performance optimization.
 */

export type DevicePerformanceTier = 'low' | 'medium' | 'high';

export interface OptimizedMapConfig {
  animate: boolean;
  maxVisibleMarkers: number;
  enableClustering: boolean;
  zoomAnimationDuration: number;
  isMobile: boolean;
  performanceTier: DevicePerformanceTier;
}

/** Check if the current device is mobile based on User-Agent. */
export function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent,
  );
}

/** Check if the device has touch support. */
export function hasTouchSupport(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (navigator as any).msMaxTouchPoints > 0
  );
}

/**
 * Get device performance tier ('low' | 'medium' | 'high') based on
 * hardware concurrency and network connection.
 */
export function getDevicePerformanceTier(): DevicePerformanceTier {
  if (typeof navigator === 'undefined') return 'medium';

  const cores = navigator.hardwareConcurrency ?? 4;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const connection = (navigator as any).connection ?? (navigator as any).mozConnection ?? (navigator as any).webkitConnection;

  if (cores < 4 || connection?.effectiveType === '2g') return 'low';
  if (cores >= 8) return 'high';
  return 'medium';
}

/**
 * Get optimized Leaflet map config based on device capabilities.
 */
export function getOptimizedMapConfig(): OptimizedMapConfig {
  const isMobile = isMobileDevice();
  const performanceTier = getDevicePerformanceTier();

  return {
    animate: performanceTier !== 'low',
    maxVisibleMarkers: isMobile ? 50 : 100,
    enableClustering: performanceTier !== 'low',
    zoomAnimationDuration: performanceTier === 'low' ? 0 : 250,
    isMobile,
    performanceTier,
  };
}
