// Cloudflare Pages Functions - SPA fallback for client-side routing
// This catch-all ensures non-asset, HTML navigations fall back to /index.html

export async function onRequest(context) {
  const { request, next, env } = context;
  const url = new URL(request.url);

  // Let other functions (e.g., /api) handle their own routes
  if (url.pathname.startsWith('/api')) {
    return next();
  }

  // Try to serve static asset first
  const response = await env.ASSETS.fetch(request);

  // If not found and the request is for an HTML page, serve index.html (SPA)
  const accept = request.headers.get('accept') || '';
  const isHTMLNav = accept.includes('text/html');

  if (response.status === 404 && isHTMLNav) {
    const indexRequest = new Request(new URL('/index.html', url.origin), request);
    return env.ASSETS.fetch(indexRequest);
  }

  return response;
}
