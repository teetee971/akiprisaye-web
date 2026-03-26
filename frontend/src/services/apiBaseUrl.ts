// frontend/src/services/apiBaseUrl.ts

const DEV_FALLBACK_API_BASE_URL = 'http://127.0.0.1:8787';
const PROD_API_BASE_URL = 'https://akiprisaye-api.pages.dev';

function normalize(url: string): string {
  return url.replace(/\/+$/, '');
}

function resolveProductionApiBaseUrl(): string {
  const envUrl =
    import.meta.env.VITE_API_BASE_URL ||
    import.meta.env.VITE_PRICE_API_BASE;

  if (typeof envUrl === 'string' && envUrl.trim().length > 0) {
    return normalize(envUrl.trim());
  }

  if (typeof window !== 'undefined') {
    const { origin, pathname, hostname } = window.location;

    const isGitHubPages =
      hostname === 'akiprisaye.github.io' &&
      pathname.startsWith('/akiprisaye-web/');

    if (isGitHubPages) {
      return PROD_API_BASE_URL;
    }
  }

  return PROD_API_BASE_URL;
}

export function resolveApiBaseUrl(): string {
  if (import.meta.env.DEV) {
    return DEV_FALLBACK_API_BASE_URL;
  }

  return resolveProductionApiBaseUrl();
}

export const API_BASE_URL = resolveApiBaseUrl();
export default API_BASE_URL;