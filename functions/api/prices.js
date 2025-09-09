// functions/api/prices.js
const ALLOWED_TERRITORIES = new Map([
  ["guadeloupe", "guadeloupe"],
  ["martinique", "martinique"],
  ["guyane", "guyane"],
  ["guyane-francaise", "guyane"],
  ["reunion", "reunion"],
  ["la-reunion", "reunion"],
  ["mayotte", "mayotte"],
  ["saint-martin", "saint-martin"],
  ["st-martin", "saint-martin"],
  ["saint-barthelemy", "saint-barthelemy"],
  ["st-barthelemy", "saint-barthelemy"],
  ["polynesie-francaise", "polynesie-francaise"],
  ["nouvelle-caledonie", "nouvelle-caledonie"],
  ["wallis-et-futuna", "wallis-et-futuna"],
  ["saint-pierre-et-miquelon", "saint-pierre-et-miquelon"],
]);

function normalizeTerritory(input) {
  if (!input) return null;
  return ALLOWED_TERRITORIES.get(
    input.toString().trim().toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9 -]/g, "")
      .replace(/\s+/g, "-")
  ) || null;
}

function parsePositiveInt(value, fallback) {
  const n = Number.parseInt(String(value ?? "").trim(), 10);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Content-Type": "application/json; charset=utf-8",
  };
}

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }
  if (request.method !== "GET") {
    return new Response(JSON.stringify({ ok: false, error: "Method not allowed" }),
      { status: 405, headers: corsHeaders() });
  }

  try {
    const url = new URL(request.url);
    const q = url.searchParams;

    const territory = normalizeTerritory(q.get("territory"));
    if (!territory) {
      return new Response(JSON.stringify({
        ok: false,
        error: "Invalid or missing territory",
        hint: { allowed: Array.from(new Set([...ALLOWED_TERRITORIES.values()])) }
      }), { status: 400, headers: corsHeaders() });
    }

    let limit = parsePositiveInt(q.get("limit"), 20);
    if (limit < 1) limit = 20;
    if (limit > 100) limit = 100;
    let offset = parsePositiveInt(q.get("offset"), 0);
    const page = parsePositiveInt(q.get("page"), null);
    if (page !== null) offset = page * limit;

    const upstream = env?.API_UPSTREAM;
    if (upstream && /^https?:\/\//i.test(upstream)) {
      const upstreamUrl = new URL("/prices", upstream);
      upstreamUrl.searchParams.set("territory", territory);
      upstreamUrl.searchParams.set("limit", String(limit));
      upstreamUrl.searchParams.set("offset", String(offset));
      const res = await fetch(upstreamUrl.toString(), { headers: { Accept: "application/json" } });
      const text = await res.text();
      let data;
      try { data = JSON.parse(text); } catch { data = { upstreamText: text }; }
      return new Response(JSON.stringify({
        ok: res.ok, status: res.status, territory, limit, offset, source: "upstream", data
      }, null, 2), { status: res.ok ? 200 : res.status, headers: corsHeaders() });
    }

    const items = Array.from({ length: limit }, (_, i) => ({
      id: offset + i + 1,
      title: `Article ${offset + i + 1} — ${territory}`,
      price: Math.round((5 + Math.random() * 25) * 100) / 100,
      currency: "EUR",
      territory,
      source: "local-demo",
    }));

    return new Response(JSON.stringify({
      ok: true, territory, limit, offset, count: items.length, data: items,
      notice: "Réponse locale de test (API_UPSTREAM non défini)."
    }, null, 2), { status: 200, headers: corsHeaders() });

  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: err?.message || String(err) }),
      { status: 500, headers: corsHeaders() });
  }
}
