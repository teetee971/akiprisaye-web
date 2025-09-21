// Cloudflare Pages Function: /api/prices
// - Ne renvoie plus 404 : ok:true, count:0, data:[]
// - Démo: dataset interne pour "guadeloupe"
// - Paramètres: territory, limit, offset, q, sort

const HEADERS = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "public, max-age=60, s-maxage=300",
  "access-control-allow-origin": "*",
};

const CURRENCY = "EUR";

// --- DEMO DATA --------------------------------------------------------------
// Remplace/branche ici une vraie source (CSV/JSON/Firestore/API…) si besoin.
// Ex: lire depuis un asset public: const url = new URL('../../public/data/xxx.json', import.meta.url)
const DEMO_DB = {
  guadeloupe: [
    { id:"GUA-0001", title:"Baguette tradition 250g", price_dom:1.20, price_hex:0.95, store:"Carrefour Les Abymes", storeCity:"Les Abymes", brand:"Carrefour", updatedAt:"2025-09-01" },
    { id:"GUA-0002", title:"Lait UHT demi-écrémé 1L", price_dom:1.45, price_hex:1.12, store:"Super U Baie-Mahault", storeCity:"Baie-Mahault", brand:"U", updatedAt:"2025-09-01" },
    { id:"GUA-0003", title:"Beurre doux 250g", price_dom:2.45, price_hex:1.89, store:"Leader Price Pointe-à-Pitre", storeCity:"Pointe-à-Pitre", brand:"Leader Price", updatedAt:"2025-09-01" },
    { id:"GUA-0004", title:"Riz long 1kg", price_dom:2.30, price_hex:1.85, store:"Carrefour Destreland", storeCity:"Baie-Mahault", brand:"Carrefour", updatedAt:"2025-09-01" },
    { id:"GUA-0005", title:"Pâtes spaghetti 500g", price_dom:1.36, price_hex:0.98, store:"Super U Le Gosier", storeCity:"Le Gosier", brand:"U", updatedAt:"2025-09-01" },
    { id:"GUA-0006", title:"Eau minérale 6x1.5L", price_dom:3.90, price_hex:2.85, store:"Carrefour Les Abymes", storeCity:"Les Abymes", brand:"Carrefour", updatedAt:"2025-09-01" },
    { id:"GUA-0007", title:"Sucre en poudre 1kg", price_dom:1.75, price_hex:1.20, store:"Leader Price Pointe-à-Pitre", storeCity:"Pointe-à-Pitre", brand:"Leader Price", updatedAt:"2025-09-01" },
    { id:"GUA-0008", title:"Œufs x12 calibre M", price_dom:3.60, price_hex:2.80, store:"Super U Baie-Mahault", storeCity:"Baie-Mahault", brand:"U", updatedAt:"2025-09-01" },
    { id:"GUA-0009", title:"Huile de tournesol 1L", price_dom:3.20, price_hex:2.45, store:"Carrefour Destreland", storeCity:"Baie-Mahault", brand:"Carrefour", updatedAt:"2025-09-01" },
    { id:"GUA-0010", title:"Poulet entier (~1.2kg)", price_dom:6.90, price_hex:5.20, store:"Super U Le Gosier", storeCity:"Le Gosier", brand:"U", updatedAt:"2025-09-01" },
    { id:"GUA-0011", title:"Fromage râpé 200g", price_dom:2.40, price_hex:1.95, store:"Carrefour Les Abymes", storeCity:"Les Abymes", brand:"Carrefour", updatedAt:"2025-09-01" },
    { id:"GUA-0012", title:"Yaourts nature x12", price_dom:3.10, price_hex:2.30, store:"Leader Price Pointe-à-Pitre", storeCity:"Pointe-à-Pitre", brand:"Leader Price", updatedAt:"2025-09-01" },
    { id:"GUA-0013", title:"Café moulu 250g", price_dom:3.80, price_hex:2.90, store:"Super U Baie-Mahault", storeCity:"Baie-Mahault", brand:"U", updatedAt:"2025-09-01" },
    { id:"GUA-0014", title:"Banane locale (kg)", price_dom:2.20, price_hex:3.50, store:"Carrefour Destreland", storeCity:"Baie-Mahault", brand:"Carrefour", updatedAt:"2025-09-01" },
    { id:"GUA-0015", title:"Tomates grappe (kg)", price_dom:3.95, price_hex:2.80, store:"Super U Le Gosier", storeCity:"Le Gosier", brand:"U", updatedAt:"2025-09-01" },
  ],
};

// ---------------------------------------------------------------------------

function normalizeTerritory(t) {
  return (t || "").toString().trim().toLowerCase();
}

function parseIntSafe(v, def) {
  const n = parseInt(v, 10);
  return Number.isFinite(n) && n >= 0 ? n : def;
}

/** Filtre/tri simple côté worker (démonstration) */
function filterAndSort(data, q, sort) {
  let out = Array.isArray(data) ? data.slice() : [];

  if (q) {
    const needle = q.toLowerCase();
    out = out.filter((x) =>
      [x.title, x.store, x.storeCity, x.brand]
        .filter(Boolean)
        .some((s) => s.toLowerCase().includes(needle))
    );
  }

  if (sort) {
    if (sort === "price_asc") out.sort((a, b) => (a.price_dom ?? 0) - (b.price_dom ?? 0));
    else if (sort === "price_desc") out.sort((a, b) => (b.price_dom ?? 0) - (a.price_dom ?? 0));
    else if (sort === "alpha") out.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
  }

  return out;
}

export async function onRequestGet({ request }) {
  try {
    const url = new URL(request.url);
    const territory = normalizeTerritory(url.searchParams.get("territory"));
    const limit = Math.max(1, Math.min(parseIntSafe(url.searchParams.get("limit"), 20), 100));
    const offset = Math.max(0, parseIntSafe(url.searchParams.get("offset"), 0));
    const q = url.searchParams.get("q") || "";
    const sort = url.searchParams.get("sort") || "";

    // 1) Sélection source
    // Branche ici ta vraie source si disponible (fetch CSV/JSON).
    // Si pas de source : on tombe sur dataset de démo (ou vide).
    let source = [];
    if (territory && DEMO_DB[territory]) {
      source = DEMO_DB[territory];
    } else {
      // Pas de données connues pour ce territoire → on renvoie vide (pas d'erreur/404)
      const body = JSON.stringify({
        ok: true,
        territory,
        count: 0,
        limit,
        offset,
        currency: CURRENCY,
        data: [],
        note: "Aucune source branchée pour ce territoire (mode démo).",
      });
      return new Response(body, { status: 200, headers: HEADERS });
    }

    // 2) Filtre/tri local (démo)
    let filtered = filterAndSort(source, q, sort);

    // 3) Pagination
    const total = filtered.length;
    const page = filtered.slice(offset, offset + limit);

    // 4) Mapping de sortie
    const data = page.map((x) => ({
      id: x.id,
      title: x.title,
      price_dom: x.price_dom,
      price_hex: x.price_hex,
      currency: CURRENCY,
      store: x.store,
      storeCity: x.storeCity,
      brand: x.brand,
      updatedAt: x.updatedAt,
    }));

    const body = JSON.stringify({
      ok: true,
      territory,
      count: total,
      limit,
      offset,
      currency: CURRENCY,
      data,
    });
    return new Response(body, { status: 200, headers: HEADERS });
  } catch (err) {
    const body = JSON.stringify({
      ok: false,
      status: 500,
      error: "prices_internal_error",
      message: err?.message || String(err),
    });
    return new Response(body, { status: 200, headers: HEADERS }); // 200 pour ne pas casser le front
  }
}
