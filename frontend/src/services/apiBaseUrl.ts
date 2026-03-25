const DEV_FALLBACK_API_BASE_URL = 'http://localhost:3000/api';
const PROD_FALLBACK_API_BASE_URL = '/api';

export function resolveApiBaseUrl(): string {
  const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL;
  if (typeof configuredBaseUrl === 'string' && configuredBaseUrl.trim().length > 0) {
    return configuredBaseUrl.trim().replace(/\/$/, '');
  }

  return import.meta.env.DEV ? DEV_FALLBACK_API_BASE_URL : PROD_FALLBACK_API_BASE_URL;
}
