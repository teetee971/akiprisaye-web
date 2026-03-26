const DEV_FALLBACK_API_BASE_URL = 'http://127.0.0.1:8787';
const PROD_API_BASE_URL = 'https://akiprisaye-api.pages.dev';

function normalizeBaseUrl(url: string): string {
  return url.trim().replace(/\/+$/, '');
}

function isGitHubPagesHost(hostname: string): boolean {
  return hostname === 'teetee971.github.io' || hostname.endsWith('.github.io');
}

function resolveProductionApiBaseUrl(): string {
  const envUrl =
    import.meta.env.VITE_API_BASE_URL ||
    import.meta.env.VITE_PRICE_API_BASE_URL ||
    '';

  if (envUrl.trim()) {
    return normalizeBaseUrl(envUrl);
  }

  if (typeof window !== 'undefined') {
    const { hostname, pathname } = window.location;
    const isGitHubPages =
      isGitHubPagesHost(hostname) || pathname.startsWith('/akiprisaye-web/');

    if (isGitHubPages) {
      return PROD_API_BASE_URL;
    }
  }

  return PROD_API_BASE_URL;
}

export function resolveApiBaseUrl(): string {
  return import.meta.env.DEV
    ? DEV_FALLBACK_API_BASE_URL
    : resolveProductionApiBaseUrl();
}

export const API_BASE_URL = resolveApiBaseUrl();