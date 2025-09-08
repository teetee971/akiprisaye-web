export async function onRequest({ request }) {
  const url = new URL(request.url);
  const ean = (url.searchParams.get('ean') || '').trim();

  return new Response(
    JSON.stringify({ ok: true, ean, message: 'Fonction ean2nc8 OK ✅' }),
    { headers: { 'content-type': 'application/json; charset=utf-8' } }
  );
}
