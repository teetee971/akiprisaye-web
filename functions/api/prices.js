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
// Prix de référence de la métropole (France hexagonale)
const MAINLAND_PRICES = {
  "Lait UHT 1L": 1.12,
  "Pâtes 500g": 0.98,
  "Riz 1kg": 1.85,
  "Baguette tradition 250g": 0.95,
  "Beurre doux 250g": 1.95,
  "Eau minérale 6x1.5L": 2.90,
  "Sucre en poudre 1kg": 1.35,
  "Œufs x12 calibre M": 2.80,
  "Huile de tournesol 1L": 2.50,
  "Poulet entier (~1.2kg)": 5.20,
  "Fromage râpé 200g": 1.80,
  "Yaourts nature x12": 2.40,
  "Café moulu 250g": 2.95,
  "Banane (kg)": 1.65,
  "Tomates grappe (kg)": 2.80,
};

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

/** 
 * Trouve le prix métropole correspondant à un produit DOM
 * Utilise une correspondance approximative basée sur le titre
 */
function findMainlandPrice(title) {
  // Normalise le titre pour la recherche
  const normalizedTitle = title.toLowerCase();
  
  // Recherche exacte d'abord
  if (MAINLAND_PRICES[title]) {
    return MAINLAND_PRICES[title];
  }
  
  // Recherche par mots-clés
  for (const [mainlandProduct, price] of Object.entries(MAINLAND_PRICES)) {
    const mainlandLower = mainlandProduct.toLowerCase();
    
    // Si le titre contient des mots-clés du produit métropole
    if (normalizedTitle.includes('lait') && mainlandLower.includes('lait')) return price;
    if (normalizedTitle.includes('pâtes') && mainlandLower.includes('pâtes')) return price;
    if (normalizedTitle.includes('riz') && mainlandLower.includes('riz')) return price;
    if (normalizedTitle.includes('baguette') && mainlandLower.includes('baguette')) return price;
    if (normalizedTitle.includes('beurre') && mainlandLower.includes('beurre')) return price;
    if (normalizedTitle.includes('eau') && mainlandLower.includes('eau')) return price;
    if (normalizedTitle.includes('sucre') && mainlandLower.includes('sucre')) return price;
    if (normalizedTitle.includes('œuf') && mainlandLower.includes('œuf')) return price;
    if (normalizedTitle.includes('huile') && mainlandLower.includes('huile')) return price;
    if (normalizedTitle.includes('poulet') && mainlandLower.includes('poulet')) return price;
    if (normalizedTitle.includes('fromage') && mainlandLower.includes('fromage')) return price;
    if (normalizedTitle.includes('yaourt') && mainlandLower.includes('yaourt')) return price;
    if (normalizedTitle.includes('café') && mainlandLower.includes('café')) return price;
    if (normalizedTitle.includes('banane') && mainlandLower.includes('banane')) return price;
    if (normalizedTitle.includes('tomate') && mainlandLower.includes('tomate')) return price;
  }
  
  // Pas de correspondance trouvée
  return null;
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
    const compare = url.searchParams.get("compare") === "true";

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
    const data = page.map((x) => {
      const baseProduct = {
        id: x.id,
        title: x.title,
        price: x.price,
        currency: CURRENCY,
        store: x.store,
        storeCity: x.storeCity,
        brand: x.brand,
        updatedAt: x.updatedAt,
      };

      // Si le paramètre compare=true est présent, ajouter les données de comparaison DOM/Métropole
      if (compare) {
        const mainlandPrice = findMainlandPrice(x.title);
        return {
          ...baseProduct,
          name: x.title, // Alias pour compatibilité webapp
          price_dom: x.price, // Prix DOM (territoire d'outre-mer)
          price_hex: mainlandPrice || x.price * 0.75, // Prix métropole (estimé si pas trouvé)
        };
      }

      return baseProduct;
    });

    const responseBody = compare ? 
      // Format attendu par webapp (avec items)
      { items: data } :
      // Format API standard
      {
        ok: true,
        territory,
        count: total,
        limit,
        offset,
        currency: CURRENCY,
        data,
      };

    const body = JSON.stringify(responseBody);
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
