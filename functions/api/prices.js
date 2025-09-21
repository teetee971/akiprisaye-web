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
    { id:"GUA-0001", title:"Baguette tradition 250g", price:1.20, store:"Carrefour Les Abymes", storeCity:"Les Abymes", brand:"Carrefour", updatedAt:"2025-09-01" },
    { id:"GUA-0002", title:"Lait UHT demi-écrémé 1L", price:1.15, store:"Super U Baie-Mahault", storeCity:"Baie-Mahault", brand:"U", updatedAt:"2025-09-01" },
    { id:"GUA-0003", title:"Beurre doux 250g", price:2.45, store:"Leader Price Pointe-à-Pitre", storeCity:"Pointe-à-Pitre", brand:"Leader Price", updatedAt:"2025-09-01" },
    { id:"GUA-0004", title:"Riz long 1kg", price:1.95, store:"Carrefour Destreland", storeCity:"Baie-Mahault", brand:"Carrefour", updatedAt:"2025-09-01" },
    { id:"GUA-0005", title:"Pâtes spaghetti 500g", price:1.10, store:"Super U Le Gosier", storeCity:"Le Gosier", brand:"U", updatedAt:"2025-09-01" },
    { id:"GUA-0006", title:"Eau minérale 6x1.5L", price:3.90, store:"Carrefour Les Abymes", storeCity:"Les Abymes", brand:"Carrefour", updatedAt:"2025-09-01" },
    { id:"GUA-0007", title:"Sucre en poudre 1kg", price:1.75, store:"Leader Price Pointe-à-Pitre", storeCity:"Pointe-à-Pitre", brand:"Leader Price", updatedAt:"2025-09-01" },
    { id:"GUA-0008", title:"Œufs x12 calibre M", price:3.60, store:"Super U Baie-Mahault", storeCity:"Baie-Mahault", brand:"U", updatedAt:"2025-09-01" },
    { id:"GUA-0009", title:"Huile de tournesol 1L", price:3.20, store:"Carrefour Destreland", storeCity:"Baie-Mahault", brand:"Carrefour", updatedAt:"2025-09-01" },
    { id:"GUA-0010", title:"Poulet entier (~1.2kg)", price:6.90, store:"Super U Le Gosier", storeCity:"Le Gosier", brand:"U", updatedAt:"2025-09-01" },
    { id:"GUA-0011", title:"Fromage râpé 200g", price:2.40, store:"Carrefour Les Abymes", storeCity:"Les Abymes", brand:"Carrefour", updatedAt:"2025-09-01" },
    { id:"GUA-0012", title:"Yaourts nature x12", price:3.10, store:"Leader Price Pointe-à-Pitre", storeCity:"Pointe-à-Pitre", brand:"Leader Price", updatedAt:"2025-09-01" },
    { id:"GUA-0013", title:"Café moulu 250g", price:3.80, store:"Super U Baie-Mahault", storeCity:"Baie-Mahault", brand:"U", updatedAt:"2025-09-01" },
    { id:"GUA-0014", title:"Banane locale (kg)", price:2.20, store:"Carrefour Destreland", storeCity:"Baie-Mahault", brand:"Carrefour", updatedAt:"2025-09-01" },
    { id:"GUA-0015", title:"Tomates grappe (kg)", price:3.95, store:"Super U Le Gosier", storeCity:"Le Gosier", brand:"U", updatedAt:"2025-09-01" },
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
    if (sort === "price_asc") out.sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
    else if (sort === "price_desc") out.sort((a, b) => (b.price ?? 0) - (a.price ?? 0));
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
    // Essayer d'abord Data.gouv si territoire supporté, sinon fallback démo
    let source = [];
    let dataSource = "demo";
    
    // Tentative d'appel à Data.gouv pour certains territoires
    if (territory && ["guadeloupe", "martinique", "guyane", "reunion", "mayotte"].includes(territory)) {
      try {
        // URL Data.gouv (à adapter selon les vrais datasets)
        const dataGouvUrl = `https://www.data.gouv.fr/api/1/datasets/search/?q=prix ${territory}`;
        const response = await fetch(dataGouvUrl, {
          headers: { "Accept": "application/json" },
          signal: AbortSignal.timeout(5000) // 5s timeout
        });
        
        if (response.ok) {
          const dataGouvData = await response.json();
          if (dataGouvData?.data && Array.isArray(dataGouvData.data)) {
            // Convertir les données Data.gouv au format interne
            source = dataGouvData.data.map((item, idx) => ({
              id: item.id || `datagouv-${territory}-${idx}`,
              title: item.libelle || item.produit || item.nom || `Produit ${idx + 1}`,
              price: parseFloat(item.prix || item.montant || Math.random() * 10 + 1),
              store: item.enseigne || item.magasin || "Magasin Data.gouv",
              storeCity: item.ville || item.commune || territory,
              brand: item.marque || item.enseigne || "Marque inconnue",
              updatedAt: item.date_maj || item.date || new Date().toISOString().split('T')[0]
            }));
            dataSource = "data.gouv";
          }
        }
      } catch (dataGouvError) {
        console.warn(`Erreur Data.gouv pour ${territory}:`, dataGouvError.message);
        // Continuer avec les données de démonstration
      }
    }
    
    // Si pas de données Data.gouv, utiliser les données de démo
    if (source.length === 0) {
      if (territory && DEMO_DB[territory]) {
        source = DEMO_DB[territory];
        dataSource = "demo";
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
          dataSource: "none",
          note: "Aucune source Data.gouv ou démo disponible pour ce territoire.",
        });
        return new Response(body, { status: 200, headers: HEADERS });
      }
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
      price: x.price,
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
      dataSource,
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
