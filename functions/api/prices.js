import { json, pricePerUnit, verdictppu } from "./_utils";

/**
 * Cette route récupère des produits depuis l’API amont (variable d’env API_UPSTREAM),
 * calcule le prix unitaire, et ajoute un verdict.
 *
 * ⛅ Cloudflare Pages → Settings → Environment variables
 *   - API_UPSTREAM = https://api.tondomaine.com/prices
 *   - API_KEY (optionnel) = ta_clé
 */
export async function onRequest({ request, env }) {
  const url = new URL(request.url);
  const territory = url.searchParams.get("territory") || "guadeloupe";
  const q = url.searchParams.get("q") || "";

  const upstream = env.API_UPSTREAM; // ex: https://api.tondomaine.com/prices
  if (!upstream) {
    return json({ error: "API_UPSTREAM manquant dans les variables d'environnement" }, { status: 500 });
  }

  const fetchUrl = new URL(upstream);
  fetchUrl.searchParams.set("territory", territory);
  if (q) fetchUrl.searchParams.set("q", q);

  const res = await fetch(fetchUrl.toString(), {
    headers: env.API_KEY ? { "authorization": `Bearer ${env.API_KEY}` } : undefined
  });

  if (!res.ok) {
    return json({ error: "Upstream error", status: res.status }, { status: 502 });
  }

  const items = await res.json(); // ← attendu: tableau d’objets { title, price, qty, unit, category, brand, ... }

  const enriched = (Array.isArray(items) ? items : []).map((p) => {
    const ppu = pricePerUnit({ price: p.price, qty: p.qty, unit: p.unit });
    const note = verdictppu(ppu, { category: p.category || "lait" });
    return { ...p, territory, ppu, verdict: note };
  });

  return json(
    { ok: true, territory, count: enriched.length, items: enriched },
    { headers: { "cache-control": "public, max-age=60" } }
  );
}
