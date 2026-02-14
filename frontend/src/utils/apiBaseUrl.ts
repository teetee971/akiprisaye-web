const DEV_LOCAL_API_ORIGIN = 'http://localhost:3001';

const trimTrailingSlash = (value: string) => value.replace(/\/+$/, '');

const containsLocalhost = (value: string) => /localhost|127\.0\.0\.1/i.test(value);

/**
 * Returns base API origin.
 * - Production: relative /api endpoints by default (empty origin)
 * - Development: allows localhost fallback for legacy local backend usage
 */
export function getApiBaseUrl(): string {
  const configured = import.meta.env.VITE_API_URL?.trim();

  if (configured) {
    if (import.meta.env.PROD && containsLocalhost(configured)) {
      throw new Error(
        'Invalid VITE_API_URL in production: localhost/127.0.0.1 is forbidden. Use a relative /api path or a remote API origin.'
      );
    }

    return trimTrailingSlash(configured);
  }

  if (import.meta.env.DEV) {
    return DEV_LOCAL_API_ORIGIN;
  }

  return '';
}

export function buildApiUrl(path: string): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const base = getApiBaseUrl();
  return `${base}${normalizedPath}`;
}
