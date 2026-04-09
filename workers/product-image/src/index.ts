export interface Env {
  // Optionnel: si tu veux protéger l’API
  API_TOKEN?: string;
}

function corsHeaders(origin = "*") {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
  };
}

function stripAccents(input: string) {
  return input.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function normalizeQuery(q: string) {
  let s = stripAccents(q.toLowerCase());

  // supprime ponctuation / symboles
  s = s.replace(/[^a-z0-9\s]/g, " ");

  // enlève mots “enseigne” fréquents (à ajuster)
  s = s.replace(/\b(crf|carrefour|super|u|leclerc|auchan|lidl|aldi|intermarche|casino|monoprix|franprix|leader|price)\b/g, " ");

  // espaces multiples
  s = s.replace(/\s+/g, " ").trim();
  return s;
}

function clampQ(q: string) {
  q = q.trim();
  if (!q) return null;
  if (q.length > 120) return null; // anti-abus
  return q;
}

async function openFoodFactsImage(normalized: string, lang = "fr") {
  // Recherche texte simple (sans EAN)
  // Note: l’API OFF peut évoluer; on fait au plus robuste avec des champs standards.
  const url =
    `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(normalized)}` +
    `&search_simple=1&action=process&json=1&page_size=5&fields=product_name,image_front_url,image_url,image_small_url,brands,quantity,lang`;

  const res = await fetch(url, { headers: { "User-Agent": "akiprisaye-web/1.0 (product-image-worker)" } });
  if (!res.ok) return null;
  const data: any = await res.json();

  const products: any[] = Array.isArray(data?.products) ? data.products : [];
  for (const p of products) {
    const img =
      p?.image_front_url ||
      p?.image_url ||
      p?.image_small_url ||
      null;
    if (img) return { imageUrl: img as string, confidence: 0.65 };
  }
  return null;
}

async function wikimediaImage(normalized: string) {
  // Recherche une image sur Wikimedia Commons
  const search = `${normalized} product packaging`;
  const api =
    `https://commons.wikimedia.org/w/api.php?action=query&format=json&origin=*` +
    `&generator=search&gsrsearch=${encodeURIComponent(search)}` +
    `&gsrlimit=3&gsrnamespace=6&prop=imageinfo&iiprop=url&iiurlwidth=640`;

  const res = await fetch(api);
  if (!res.ok) return null;
  const data: any = await res.json();
  const pages = data?.query?.pages;
  if (!pages) return null;

  const arr = Object.values(pages) as any[];
  for (const page of arr) {
    const info = page?.imageinfo?.[0];
    const thumb = info?.thumburl || info?.url;
    if (thumb) return { imageUrl: thumb as string, confidence: 0.4 };
  }
  return null;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: { ...corsHeaders() } });
    }

    if (request.method !== "GET") {
      return new Response("Method Not Allowed", { status: 405, headers: corsHeaders() });
    }

    // Optionnel: token
    if (env.API_TOKEN) {
      const auth = request.headers.get("authorization") || "";
      const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
      if (token !== env.API_TOKEN) {
        return new Response("Unauthorized", { status: 401, headers: corsHeaders() });
      }
    }

    const qRaw = clampQ(url.searchParams.get("q") || "");
    if (!qRaw) {
      return Response.json(
        { error: "Missing or invalid q" },
        { status: 400, headers: corsHeaders() },
      );
    }

    const lang = (url.searchParams.get("lang") || "fr").slice(0, 5);
    const normalizedQuery = normalizeQuery(qRaw);

    // Cache API (clé stable)
    const cacheKey = new Request(`https://cache.local/product-image?q=${encodeURIComponent(normalizedQuery)}&lang=${encodeURIComponent(lang)}`);
    const cache = caches.default;

    const cached = await cache.match(cacheKey);
    if (cached) {
      const body = await cached.text();
      return new Response(body, {
        status: 200,
        headers: { "Content-Type": "application/json; charset=utf-8", ...corsHeaders(), "X-Cache": "HIT" },
      });
    }

    let imageUrl: string | null = null;
    let source: "openfoodfacts" | "wikimedia" | "none" = "none";
    let confidence = 0;

    const off = await openFoodFactsImage(normalizedQuery, lang);
    if (off?.imageUrl) {
      imageUrl = off.imageUrl;
      source = "openfoodfacts";
      confidence = off.confidence;
    } else {
      const wm = await wikimediaImage(normalizedQuery);
      if (wm?.imageUrl) {
        imageUrl = wm.imageUrl;
        source = "wikimedia";
        confidence = wm.confidence;
      }
    }

    const payload = {
      query: qRaw,
      normalizedQuery,
      imageUrl,
      source,
      confidence,
      cached: false,
    };

    const response = new Response(JSON.stringify(payload), {
      status: 200,
      headers: { "Content-Type": "application/json; charset=utf-8", ...corsHeaders(), "X-Cache": "MISS" },
    });

    // Cache 30 jours si on a une image, 1 jour sinon
    const ttl = imageUrl ? 60 * 60 * 24 * 30 : 60 * 60 * 24;
    response.headers.set("Cache-Control", `public, max-age=${ttl}`);
    ctx.waitUntil(cache.put(cacheKey, response.clone()));

    return response;
  },
};