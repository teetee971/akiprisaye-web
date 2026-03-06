/**
 * Sentry observability setup
 *
 * Initialises Sentry only when VITE_SENTRY_DSN is provided.
 * Degrades silently if the DSN is absent (dev / CI without secrets).
 *
 * Captured signals:
 *  - Unhandled JS exceptions & promise rejections
 *  - React render errors (via ErrorBoundary integration)
 *  - Core Web Vitals (LCP, FID, CLS, TTFB, FCP)
 *  - Session replays are intentionally disabled (privacy)
 */
import * as Sentry from '@sentry/react';

const dsn = import.meta.env.VITE_SENTRY_DSN as string | undefined;

export function initSentry(): void {
  if (!dsn) {
    // No DSN configured – skip (dev / preview without secrets)
    return;
  }

  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    release: (import.meta.env.VITE_BUILD_SHA as string | undefined) ?? 'unknown',

    // Capture 10 % of transactions for performance monitoring
    tracesSampleRate: import.meta.env.PROD ? 0.1 : 0,

    // Session replay disabled – GDPR / privacy
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0,

    // Reduce noise: ignore known benign errors
    ignoreErrors: [
      'ResizeObserver loop limit exceeded',
      'ResizeObserver loop completed with undelivered notifications',
      /^Network Error$/,
      /^Load failed$/,
      /ChunkLoadError/,
      /Loading chunk/,
    ],

    beforeSend(event) {
      // Pass through – PII scrubbing handled via Sentry project settings
      return event;
    },
  });
}

/** Wrap ErrorBoundary with Sentry error capture */
export const SentryErrorBoundary = Sentry.ErrorBoundary;

/** Manually capture an exception (e.g. from a caught try/catch) */
export function captureException(error: unknown, context?: Record<string, unknown>): void {
  if (!dsn) return;
  Sentry.captureException(error, context ? { extra: context } : undefined);
}

/** Manually capture a message */
export function captureMessage(message: string, level: Sentry.SeverityLevel = 'info'): void {
  if (!dsn) return;
  Sentry.captureMessage(message, level);
}
