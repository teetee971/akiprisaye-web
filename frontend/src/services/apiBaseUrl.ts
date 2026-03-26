const DEV_FALLBACK_API_BASE_URL = 'http://127.0.0.1:8787';

function normalizeBaseUrl(value: string): string {
  return value.replace(/\/+$/, '');
}

function resolveProductionApiBaseUrl(): string {
  const envValue =
    import.meta.env.VITE_API_BASE_URL ||
    '';
    '';

  if (typeof envValue === 'string' && envValue.trim()) {
    return normalizeBaseUrl(envValue.trim());
  }

  if (typeof window !== 'undefined') {
    const { origin, pathname } = window.location;
    const isGitHubPages =
      origin.includes('github.io') ||
      pathname.startsWith('/akiprisaye-web/');

    if (isGitHubPages) {
      return 'https://akiprisaye-api.pages.dev';
    }
  }

  return 'https://akiprisaye-api.pages.dev';
}

export function resolveApiBaseUrl(): string {
  return import.meta.env.DEV
    ? DEV_FALLBACK_API_BASE_URL
    : resolveProductionApiBaseUrl();
}

export const API_BASE_URL = resolveApiBaseUrl();

export default API_BASE_URL;