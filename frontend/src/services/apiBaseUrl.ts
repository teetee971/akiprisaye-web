export function resolveApiBaseUrl(): string {
  const env = import.meta.env;

  if (env?.DEV) {
    return env.VITE_API_BASE_URL || 'http://localhost:8787';
  }

  return (
    env?.VITE_API_BASE_URL ||
    'https://akiprisaye-web.pages.dev'
  );
}
