const OP_BASE = 'https://prices.openfoodfacts.org/api/v1/prices';

const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type': 'application/json; charset=utf-8',
};

const withTimeout = async (url: string, timeoutMs = 7000) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'A-KI-PRI-SA-YE/1.0 (+https://akiprisaye-web.pages.dev)',
      },
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
};

export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, { status: 204, headers: corsHeaders });
};

export const onRequestGet: PagesFunction = async ({ request }) => {
  const url = new URL(request.url);
  const barcode = (url.searchParams.get('barcode') ?? '').trim();
  const pageSize = Math.min(30, Math.max(1, Number(url.searchParams.get('pageSize') ?? '10')));

  if (!barcode) {
    return new Response(JSON.stringify({ ok: false, error: 'missing_barcode', observations: [] }), {
      status: 400,
      headers: corsHeaders,
    });
  }

  const endpoint = `${OP_BASE}?${new URLSearchParams({
    product_code: barcode,
    page_size: String(pageSize),
    ordering: '-date',
  }).toString()}`;

  try {
    const upstream = await withTimeout(endpoint);

    if (!upstream.ok) {
      return new Response(
        JSON.stringify({ ok: false, error: 'open_prices_unavailable', observations: [] }),
        { status: 200, headers: corsHeaders },
      );
    }

    const payload = (await upstream.json()) as { results?: Array<Record<string, unknown>> };
    const rows = Array.isArray(payload.results) ? payload.results : [];

    const observations = rows
      .map((row) => {
        const price = Number(row.price);
        const currency = String(row.currency ?? '').toUpperCase();

        if (!Number.isFinite(price) || currency !== 'EUR') {
          return null;
        }

        return {
          source: 'open_prices',
          barcode,
          price,
          currency: 'EUR',
          date: (row.date as string) || (row.created as string) || null,
          locationId: row.location_id ? String(row.location_id) : null,
          proofId: row.proof_id ? String(row.proof_id) : null,
        };
      })
      .filter((row): row is NonNullable<typeof row> => row !== null);

    return new Response(JSON.stringify({ ok: true, barcode, observations }), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Cache-Control': 'public, max-age=180',
      },
    });
  } catch (error) {
    const timeout = error instanceof Error && error.name === 'AbortError';

    return new Response(
      JSON.stringify({
        ok: false,
        error: timeout ? 'open_prices_timeout' : 'open_prices_fetch_failed',
        observations: [],
      }),
      { status: 200, headers: corsHeaders },
    );
  }
};
