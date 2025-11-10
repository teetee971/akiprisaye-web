/**
 * Cloudflare Pages Function: /api/health
 * Health check endpoint for monitoring and uptime checks
 */

export async function onRequestGet(context) {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.1.0',
    environment: 'production',
    endpoints: {
      prices: '/api/prices',
      news: '/api/news',
      contact: '/api/contact',
    },
    features: {
      pwa: true,
      offline: true,
      responsive: true,
    },
  };

  return new Response(JSON.stringify(health), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache',
    },
  });
}
