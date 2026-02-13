const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type': 'application/json; charset=utf-8',
};

export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, { status: 204, headers: corsHeaders });
};

export const onRequestGet: PagesFunction = async () => {
  return new Response(
    JSON.stringify({
      status: 'ok',
      service: 'cloudflare-pages-functions',
      timestamp: new Date().toISOString(),
    }),
    {
      status: 200,
      headers: {
        ...corsHeaders,
        'Cache-Control': 'no-store',
      },
    },
  );
};
