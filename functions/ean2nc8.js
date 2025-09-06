export async function onRequest(context) {
  try {
    const url = new URL(context.request.url);
    const ean = (url.searchParams.get("ean") || "").trim();
    return new Response(
      JSON.stringify({ ok: true, ean, message: "Fonction ean2nc8 OK ✅" }),
      { headers: { "content-type": "application/json; charset=utf-8" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ ok: false, error: String(err) }),
      { status: 500, headers: { "content-type": "application/json; charset=utf-8" } }
    );
  }
}
