/**
 * UX Monitor - Lightweight Client-Side Observability
 *
 * PURPOSE:
 * Detect real production friction without backend, analytics, or user tracking.
 *
 * PRIVACY-FIRST:
 * - No cookies, no fingerprints, no user IDs
 * - No external services (GA, Sentry, PostHog)
 * - No personal data collection
 * - Console logs only (developer tools)
 *
 * WHAT WE OBSERVE:
 * 1. Functional errors (scan failures, permission denials)
 * 2. UX friction (timeouts, abandons, loading times)
 * 3. Stability (JS errors, rejected promises)
 *
 * HOW TO DISABLE:
 * Set VITE_UX_MONITOR_ENABLED=false in environment or toggle flag below.
 */

// Feature flag - Single point to enable/disable
const UX_MONITOR_ENABLED = import.meta.env.VITE_UX_MONITOR_ENABLED !== 'false';

// Log prefix for easy filtering
const PREFIX = '[UX_MONITOR]';

// Simple structured logging
interface UXEvent {
  type: 'scan' | 'permission' | 'navigation' | 'performance' | 'error';
  action: string;
  duration?: number;
  metadata?: Record<string, any>;
}

/**
 * Log a UX event to console
 * Format: [UX_MONITOR] {type}:{action} {duration}ms {metadata}
 */
function logEvent(event: UXEvent): void {
  if (!UX_MONITOR_ENABLED) return;

  const { type, action, duration, metadata } = event;

  let message = `${PREFIX} ${type}:${action}`;

  if (duration !== undefined) {
    message += ` in ${duration}ms`;
  }

  if (metadata) {
    message += ` ${JSON.stringify(metadata)}`;
  }

  // Use appropriate console level
  if (type === 'error') {
    console.error(message);
  } else if (action.includes('denied') || action.includes('failed')) {
    console.warn(message);
  } else {
    console.info(message);
  }
}

// Track timing for performance monitoring
const timers: Map<string, number> = new Map();

/**
 * Start timing an action
 */
function startTimer(key: string): void {
  if (!UX_MONITOR_ENABLED) return;
  timers.set(key, Date.now());
}

/**
 * End timing and log result
 */
function endTimer(
  key: string,
  type: UXEvent['type'],
  action: string,
  metadata?: Record<string, any>
): void {
  if (!UX_MONITOR_ENABLED) return;

  const startTime = timers.get(key);
  if (startTime) {
    const duration = Date.now() - startTime;
    logEvent({ type, action, duration, metadata });
    timers.delete(key);
  }
}

// =============================================================================
// SCAN MONITORING
// =============================================================================

export const uxMonitor = {
  // Scan flow
  scanStarted: (mode: 'barcode' | 'photo' | 'receipt') => {
    logEvent({ type: 'scan', action: 'scan_started', metadata: { mode } });
    startTimer(`scan_${mode}`);
  },

  scanCompleted: (mode: 'barcode' | 'photo' | 'receipt', success: boolean) => {
    endTimer(`scan_${mode}`, 'scan', success ? 'scan_completed' : 'scan_failed', { mode, success });
  },

  scanCancelled: (mode: 'barcode' | 'photo' | 'receipt') => {
    logEvent({ type: 'scan', action: 'scan_cancelled', metadata: { mode } });
    timers.delete(`scan_${mode}`);
  },

  // =============================================================================
  // PERMISSION MONITORING
  // =============================================================================

  // Camera permission
  cameraPermissionRequested: () => {
    logEvent({ type: 'permission', action: 'camera_permission_requested' });
    startTimer('camera_permission');
  },

  cameraPermissionGranted: () => {
    endTimer('camera_permission', 'permission', 'camera_permission_granted');
  },

  cameraPermissionDenied: (reason?: string) => {
    endTimer('camera_permission', 'permission', 'camera_permission_denied', { reason });
  },

  // Geolocation permission
  geolocationRequested: () => {
    logEvent({ type: 'permission', action: 'geolocation_requested' });
    startTimer('geolocation');
  },

  geolocationGranted: () => {
    endTimer('geolocation', 'permission', 'geolocation_granted');
  },

  geolocationDenied: (reason?: string) => {
    endTimer('geolocation', 'permission', 'geolocation_denied', { reason });
  },

  // =============================================================================
  // NAVIGATION MONITORING
  // =============================================================================

  pageView: (route: string) => {
    logEvent({ type: 'navigation', action: 'page_view', metadata: { route } });
  },

  quickScanUsed: () => {
    logEvent({ type: 'navigation', action: 'quick_scan_button_used' });
  },

  searchModeSelected: (mode: string) => {
    logEvent({ type: 'navigation', action: 'search_mode_selected', metadata: { mode } });
  },

  // =============================================================================
  // PERFORMANCE MONITORING
  // =============================================================================

  firstResultDisplayed: (context: string) => {
    endTimer('first_result', 'performance', 'first_result_displayed', { context });
  },

  loadingTimeout: (context: string, threshold: number) => {
    logEvent({
      type: 'performance',
      action: 'loading_timeout',
      duration: threshold,
      metadata: { context },
    });
  },

  // =============================================================================
  // ERROR MONITORING
  // =============================================================================

  jsError: (error: Error, context?: string) => {
    logEvent({
      type: 'error',
      action: 'js_error',
      metadata: {
        message: error.message,
        context,
        stack: error.stack?.split('\n').slice(0, 3).join('\n'), // First 3 lines only
      },
    });
  },

  promiseRejection: (reason: any, context?: string) => {
    logEvent({
      type: 'error',
      action: 'unhandled_promise_rejection',
      metadata: {
        reason: String(reason),
        context,
      },
    });
  },

  // =============================================================================
  // UTILITY
  // =============================================================================

  isEnabled: () => UX_MONITOR_ENABLED,

  // Manual timing for custom scenarios
  startCustomTimer: (key: string) => startTimer(key),
  endCustomTimer: (key: string, action: string, metadata?: Record<string, any>) => {
    endTimer(key, 'performance', action, metadata);
  },
};

// =============================================================================
// GLOBAL ERROR HANDLERS
// =============================================================================

if (UX_MONITOR_ENABLED && typeof window !== 'undefined') {
  // Catch unhandled JS errors
  window.addEventListener('error', (event) => {
    uxMonitor.jsError(event.error || new Error(event.message), 'global');
  });

  // Catch unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    uxMonitor.promiseRejection(event.reason, 'global');
  });
}

export default uxMonitor;
