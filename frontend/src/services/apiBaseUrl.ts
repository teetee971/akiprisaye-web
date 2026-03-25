const DEV_FALLBACK_API_BASE_URL = 'http://localhost:3000/api';

function normalizeBasePath(rawBasePath: string): string {
  const trimmed = rawBasePath.trim();
  if (!trimmed) return '';

  const noTrailingSlash = trimmed.replace(/\/+$/, '');
  if (!noTrailingSlash) return '';

  return noTrailingSlash.startsWith('/') ? noTrailingSlash : `/${noTrailingSlash}`;
}

function resolveProductionApiBaseUrl(): string {
  const normalizedBasePath = normalizeBasePath(import.meta.env.BASE_URL || '/');
  if (!normalizedBasePath) {
    return '/api';
  }

  return `${normalizedBasePath}/api`;
}

export function resolveApiBaseUrl(): string {
  const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL;
  if (typeof configuredBaseUrl === 'string' && configuredBaseUrl.trim().length > 0) {
    return configuredBaseUrl.trim().replace(/\/+$/, '');
  }

  return import.meta.env.DEV ? DEV_FALLBACK_API_BASE_URL : resolveProductionApiBaseUrl();
}
