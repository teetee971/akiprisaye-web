/**
 * Cron helper to préchauffer /api/prices cache.
 * Can be wired to Cloudflare Cron Triggers (horaire, quotidien, hebdomadaire).
 * No fake data is generated — it simply calls the live API to fill KV.
 */

import { onRequestGet as fetchPrices } from '../api/prices';

const DEFAULT_TERRITORY = 'Guadeloupe';
const DEFAULT_PRODUCT = 'Riz 1kg';

export async function onRequest(context: { request: Request; env: Record<string, unknown> }) {
  const url = new URL(context.request.url);
  const mode = url.searchParams.get('mode') ?? 'hourly';

  const periods =
    mode === 'weekly'
      ? ['week' as const]
      : mode === 'daily'
        ? ['day', 'month'] // institutionnel
        : ['hour']; // commercial

  const warmed: Array<{ period: string; status: number }> = [];

  for (const period of periods) {
    const apiUrl = new URL('/api/prices', url.origin);
    apiUrl.searchParams.set('territoire', DEFAULT_TERRITORY);
    apiUrl.searchParams.set('produit', DEFAULT_PRODUCT);
    apiUrl.searchParams.set('period', period);

    // Réutilise directement le handler pour éviter un roundtrip réseau.
    const response = await fetchPrices({
      ...context,
      request: new Request(apiUrl.toString()),
    });

    warmed.push({ period, status: response.status });
  }

  return new Response(
    JSON.stringify({
      ok: true,
      mode,
      warmed,
      note: 'Configurer les cron Cloudflare pour appeler /functions/cron/prices?mode=hourly|daily|weekly',
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}
