const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type': 'application/json; charset=utf-8',
};

const TERRITORY_GL: Record<string, string> = {
  gp: 'fr',
  mq: 'fr',
  gf: 'fr',
  re: 'fr',
  yt: 'fr',
  fr: 'fr',
};

const parsePrice = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value !== 'string') return null;
  const cleaned = value.replace(/[^\d,.-]/g, '').replace(',', '.');
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
};

export const onRequestOptions: PagesFunction = async () => new Response(null, { status: 204, headers: corsHeaders });

export const onRequestGet: PagesFunction = async ({ request, env }) => {
  const url = new URL(request.url);
  const q = (url.searchParams.get('q') ?? '').trim();
  const barcode = (url.searchParams.get('barcode') ?? '').trim();
  const territory = (url.searchParams.get('territory') ?? 'fr').trim().toLowerCase();

  const query = q || barcode;
  if (!query) {
    return new Response(JSON.stringify({ ok: false, error: 'missing_query', results: [] }), { status: 400, headers: corsHeaders });
  }

  const apiKey = (env as Record<string, string | undefined>).SERP_API_KEY;
  if (!apiKey) {
    return new Response(
      JSON.stringify({ ok: true, query, results: [], warning: 'serp_api_key_unconfigured' }),
      { status: 200, headers: corsHeaders },
    );
  }

  const gl = TERRITORY_GL[territory] ?? 'fr';
  const endpoint = `https://serpapi.com/search.json?${new URLSearchParams({
    engine: 'google_shopping',
    q: query,
    api_key: apiKey,
    hl: 'fr',
    gl,
  }).toString()}`;

  try {
    const response = await fetch(endpoint, { headers: { Accept: 'application/json' } });
    if (!response.ok) {
      return new Response(JSON.stringify({ ok: true, query, results: [], warning: `serpapi_error_${response.status}` }), {
        status: 200,
        headers: corsHeaders,
      });
    }

    const payload = (await response.json()) as { shopping_results?: Array<Record<string, unknown>> };
    const results = (payload.shopping_results ?? [])
      .map((item) => {
        const price = parsePrice(item.extracted_price ?? item.price);
        if (price === null) return null;

        return {
          title: String(item.title ?? '').trim(),
          merchant: String(item.source ?? item.merchant ?? 'Marchand web').trim(),
          price,
          currency: 'EUR',
          url: String(item.link ?? item.product_link ?? '').trim(),
          source: 'serpapi',
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null)
      .slice(0, 12);

    return new Response(JSON.stringify({ ok: true, query, results }), {
      status: 200,
      headers: { ...corsHeaders, 'Cache-Control': 'public, max-age=300' },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ ok: true, query, results: [], warning: error instanceof Error ? error.message : String(error) }),
      { status: 200, headers: corsHeaders },
    );
  }
};
