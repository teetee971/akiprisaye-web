export async function onRequest() {
  return new Response(JSON.stringify({ ok: true, at: new Date().toISOString() }), {
    headers: { "content-type": "application/json; charset=utf-8" }
  });
}
