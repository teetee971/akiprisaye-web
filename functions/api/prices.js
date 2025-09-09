// functions/api/prices.js
/**
 * A KI PRI SA YÉ — /api/prices
 * Cloudflare Pages Function (GET)
 *
 * Query params:
 *  - territory (string) ex: guadeloupe, martinique, reunion, ...
 *  - limit (number, default 20, max 100)
 *  - offset (number, default 0)  // ou page (number) -> offset = page*limit
 *
 * Comportement:
 *  1) Normalise et valide le territoire (accents, tirets, alias DOM-TOM)
 *  2) Valide limit/offset pour éviter "Invalid numeric literal"
 *  3) Si env.API_UPSTREAM est défini, proxy: `${API_UPSTREAM}/prices?...`
 *  4) Sinon renvoie un JSON factice minimal pour tests (OK 200)
 */

const ALLOWED_TERRITORIES = new Map([
  // DOM
  ["guadeloupe", "guadeloupe"],
  ["martinique", "martinique"],
  ["guyane", "guyane"],
  ["guyane-francaise", "guyane"],
  ["reunion", "reunion"],
  ["la-reunion", "reunion"],
  ["mayotte", "mayotte"],
  // COM/Collectivités
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
  // to lower, remove accents, trim, keep letters/numbers/spaces/- only
  const ascii = input
    .toString()
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove diacritics
    .replace(/[^a-z0-9 -]/g, "")     // safe chars
    .replace(/\s+/g, "-");           // spaces -> dashes

  return ALLOWED_TERRITORIES.get(ascii) || null;
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

  // Preflight CORS
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }

  if (request.method !== "GET") {
    return new Response(
      JSON.stringify({ ok: false, error: "Method not allowed" }),
      { status: 405, headers: corsHeaders() }
    );
  }

  try {
    const url = new URL(request.url);
    const q = url.searchParams;

    // Read raw strings first (évite "Invalid numeric literal")
    const rawTerritory = q.get("territory");
    const rawLimit = q.get("limit");
    const rawOffset = q.get("offset");
    const rawPage = q.get("page");

    const territory = normalizeTerritory(rawTerritory);
    if (!territory) {
      return new Response(
        JSON.stringify({
          ok: false,
          error: "Invalid or missing territory",
          hint: {
            param: "territory",
            allowed: Array.from(new Set([...ALLOWED_TERRITORIES.values()])),
            example: "/api/prices?territory=guadeloupe",
          },
        }),
        { status: 400, headers: corsHeaders() }
      );
    }

    let limit = parsePositiveInt(rawLimit, 20);
    if (limit < 1) limit = 20;
    if (limit > 100) limit = 100;

    let offset = parsePositiveInt(rawOffset, 0);
    const page = parsePositiveInt(rawPage, null);
    if (page !== null) {
      offset = page * limit;
    }

    // Si une API amont est configurée, on proxy
    const upstream = env?.API_UPSTREAM;
    if (upstream && /^https?:\/\//i.test(upstream)) {
      const upstreamUrl = new URL("/prices", upstream);
      upstreamUrl.searchParams.set("territory", territory);
      upstreamUrl.searchParams.set("limit", String(limit));
      upstreamUrl.searchParams.set("offset", String(offset));

      const res = await fetch(upstreamUrl.toString(), {
        headers: { Accept: "application/json" },
      });

      // Propage le statut amont si possible
      const text = await res.text();
      // Essaie de parser, sinon renvoie text brut comme message
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        data = { upstreamText: text };
      }

      return new Response(
        JSON.stringify(
          {
            ok: res.ok,
            status: res.status,
            territory,
            limit,
            offset,
            source: "upstream",
            data,
          },
          null,
          2
        ),
        { status: res.ok ? 200 : res.status, headers: corsHeaders() }
      );
    }

    // Sinon: réponse locale factice (utile pour tests rapides)
    const items = Array.from({ length: limit }, (_, i) => ({
      id: offset + i + 1,
      title: `Article ${offset + i + 1} — ${territory}`,
      price: Math.round((5 + Math.random() * 25) * 100) / 100,
      currency: "EUR",
      territory,
      source: "local-demo",
    }));

    return new Response(
      JSON.stringify(
        {
          ok: true,
          territory,
          limit,
          offset,
          count: items.length,
          data: items,
          notice:
            "Réponse locale de test (env.API_UPSTREAM non défini). Configure API_UPSTREAM dans Cloudflare Pages → Settings → Environment Variables pour proxy vers votre API réelle.",
        },
        null,
        2
      ),
      { status: 200, headers: corsHeaders() }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({
        ok: false,
        error: "Internal error",
        message: err?.message || String(err),
      }),
      { status: 500, headers: corsHeaders() }
    );
  }
}
