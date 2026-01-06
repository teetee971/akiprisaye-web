import { detectAnomalies, generateSyntheticSeries } from './prices';

type Period = 'hour' | 'day' | 'week' | 'month';

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=120',
    },
  });
}

export async function onRequestGet(context: { request: Request }) {
  const { request } = context;
  const url = new URL(request.url);

  const territoire = url.searchParams.get('territoire') ?? 'Guadeloupe';
  const produit = url.searchParams.get('produit') ?? 'Riz 1kg';
  const requestedPeriod = url.searchParams.get('period') as Period | null;
  const period: Period =
    requestedPeriod && ['hour', 'day', 'week', 'month'].includes(requestedPeriod)
      ? requestedPeriod
      : 'day';

  const from = url.searchParams.get('from');
  const to = url.searchParams.get('to');

  const series = generateSyntheticSeries(territoire, produit, period, from, to);
  const anomalies = series.anomalies ?? detectAnomalies(series.data);

  return jsonResponse({
    territoire,
    produit,
    period: series.period,
    updated_at: series.updated_at,
    anomalies,
    source: series.source_name ?? 'synthetic',
    message:
      'Détection simple (z-score + variation). Pour un flux caisse temps réel, connectez un partenaire ou une base D1.',
  });
}
