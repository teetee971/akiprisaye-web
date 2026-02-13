const OFF_BASE = 'https://world.openfoodfacts.org';

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

  if (!barcode) {
    return new Response(JSON.stringify({ ok: false, error: 'missing_barcode', data: null }), {
      status: 400,
      headers: corsHeaders,
    });
  }

  const endpoint = `${OFF_BASE}/api/v2/product/${encodeURIComponent(barcode)}.json`;

  try {
    const upstream = await withTimeout(endpoint);

    if (!upstream.ok) {
      return new Response(
        JSON.stringify({
          ok: false,
          error: 'off_upstream_error',
          status: upstream.status,
          data: null,
        }),
        { status: 200, headers: corsHeaders },
      );
    }

    const payload = (await upstream.json()) as {
      product?: Record<string, unknown>;
      status?: number;
      code?: string;
    };

    const p = payload.product ?? {};

    const normalized = {
      barcode,
      source: 'openfoodfacts',
      found: payload.status === 1,
      name: (p.product_name_fr as string) || (p.product_name as string) || null,
      brand: (p.brands as string) || null,
      quantity: (p.quantity as string) || null,
      imageUrl: (p.image_front_url as string) || (p.image_url as string) || null,
      categories: Array.isArray(p.categories_tags) ? p.categories_tags : [],
      nutriscore: (p.nutriscore_grade as string) || null,
      ecoscore: (p.ecoscore_grade as string) || null,
      raw: p,
    };

    return new Response(JSON.stringify({ ok: true, data: normalized }), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Cache-Control': 'public, max-age=300',
      },
    });
  } catch (error) {
    const timeout = error instanceof Error && error.name === 'AbortError';

    return new Response(
      JSON.stringify({
        ok: false,
        error: timeout ? 'off_timeout' : 'off_fetch_failed',
        data: null,
      }),
      { status: 200, headers: corsHeaders },
    );
  }
};
