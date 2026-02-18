export function getApiBaseUrl(): string {
  const base = (import.meta.env.VITE_PRICE_API_BASE as string | undefined) ?? (import.meta.env.VITE_API_BASE_URL as string | undefined);
  if (!base) {
    throw new Error('API base URL is not configured (VITE_PRICE_API_BASE/VITE_API_BASE_URL).');
  }
  return base.replace(/\/$/, '');
}
