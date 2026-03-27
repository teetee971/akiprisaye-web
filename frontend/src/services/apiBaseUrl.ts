export const resolveApiBaseUrl = () => {
  if (import.meta.env.DEV) return 'http://localhost:8787';
  return 'https://akiprisaye-web.pages.dev/api';
};
