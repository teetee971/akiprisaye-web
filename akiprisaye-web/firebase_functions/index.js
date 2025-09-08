/**
 * A KI PRI SA YÉ – Cloud Functions
 * Region: us-central1
 * Expose:
 *  - GET /getRanking?zone=martinique
 *  - GET /searchPrices?zone=martinique&q=banane&limit=50
 */

const functions = require('firebase-functions');
const admin     = require('firebase-admin');
const axios     = require('axios');

if (admin.apps.length === 0) admin.initializeApp();
const db = admin.firestore();

const REGION = 'us-central1';
const https  = functions.region(REGION).https;

/* --------- CORS util --------- */
function handleCORS(req, res){
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.status(204).end(''); return true; }
  return false;
}

/* --------- normalisation texte --------- */
function norm(s=''){
  return s.toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu,'');
}

/* --------- zones connues --------- */
const ZONES = [
  'martinique','guadeloupe','guyane','reunion',
  'mayotte','saint-martin','saint-barthelemy',
  'saint-pierre-et-miquelon','polynesie-francaise','wallis-et-futuna'
];

/* =========================================================================
   HELPERS – Open Food Facts (produits) + Open Prices (prix)
   ========================================================================= */

async function offSearchProducts(q, limit=20){
  // API OFF: https://world.openfoodfacts.org/cgi/search.pl
  const url = 'https://world.openfoodfacts.org/cgi/search.pl';
  const params = {
    search_simple: 1,
    action: 'process',
    json: 1,
    page_size: Math.min(limit, 50),
    fields: 'code,product_name,brands,quantity,image_front_url'
  };
  // On split en mots-clés simple
  params.search_terms = q;

  const { data } = await axios.get(url, { params, timeout: 8000 });
  const items = Array.isArray(data.products) ? data.products : [];
  return items
    .filter(p => p.code && (p.product_name || p.brands))
    .map(p => ({
      barcode: p.code,
      name: p.product_name || '',
      brand: p.brands || '',
      quantity: p.quantity || '',
      image: p.image_front_url || ''
    }));
}

async function offPricesByBarcode(barcode){
  // API Open Prices : https://prices.openfoodfacts.org/api/docs
  // Par code-barres : /prices?code=<barcode>
  const base = 'https://prices.openfoodfacts.org/api/v1/prices';
  const { data } = await axios.get(base, { params: { code: barcode }, timeout: 8000 });
  // data.results : [{ price, currency, store, address, city, date, ... }, ...]
  const rows = Array.isArray(data?.results) ? data.results : [];
  return rows.map(r => ({
    price: Number(r.price),
    currency: r.currency || 'EUR',
    store: r.store || (r.retailer || ''),
    city: r.city || '',
    updatedAt: r.date ? new Date(r.date).getTime() : null
  }));
}

/* =========================================================================
   /searchPrices – recherche produit + agrégation des prix Open Prices
   ========================================================================= */
exports.searchPrices = https.onRequest(async (req, res) => {
  if (handleCORS(req, res)) return;
  try{
    const zone  = (req.query.zone || 'martinique').toString().toLowerCase().trim();
    const qRaw  = (req.query.q || '').toString().trim();
    const limit = Math.min(parseInt(req.query.limit)||20, 50);

    if(!qRaw) return res.status(400).json({ error: 'missing q' });
    if(!ZONES.includes(zone)) return res.status(400).json({ error: 'unknown zone' });

    // 1) Produits depuis OFF
    const products = await offSearchProducts(qRaw, limit);

    // 2) Pour chaque code-barres, tenter les prix Open Prices (en //)
    const priced = await Promise.all(products.map(async (p) => {
      try{
        const prices = await offPricesByBarcode(p.barcode);
        // on prend le prix le plus récent si dispo
        let best = null;
        for(const r of prices){
          if(!best || (r.updatedAt && r.updatedAt > best.updatedAt)) best = r;
        }
        return {
          ...p,
          price: best?.price ?? null,
          currency: best?.currency ?? 'EUR',
          store: best?.store ?? '',
          city: best?.city ?? '',
          updatedAt: best?.updatedAt ?? null
        };
      }catch(e){
        // pas de prix => renvoi produit seul
        return { ...p, price: null, currency: 'EUR', store: '', city: '', updatedAt: null };
      }
    }));

    // 3) Filtre simple texte sur nom/marque si besoin
    const q = norm(qRaw);
    const match = (s='') => norm(s).includes(q);
    const out = priced.filter(it => match(it.name) || match(it.brand));

    res.json({ zone, q: qRaw, count: out.length, items: out });
  }catch(err){
    console.error(err);
    res.status(500).json({ error: 'server' });
  }
});

/* =========================================================================
   /getRanking – (ta version d’origine simplifiée) 
   NOTE: on garde le principe: lire Firestore (prices + prices_<zone>), 
   calculer un "panier moyen", etc. Si tu as déjà une version, tu peux
   la conserver. Voici un stub minimal pour éviter les erreurs.
   ========================================================================= */
exports.getRanking = https.onRequest(async (req, res) => {
  if (handleCORS(req, res)) return;
  try{
    const zone = (req.query.zone || 'martinique').toString().toLowerCase().trim();
    if(!ZONES.includes(zone)) return res.status(400).json({ error: 'unknown zone' });

    // Exemple très simple si la collection n’existe pas encore
    const snap = await db.collection('prices').where('zone','==', zone).limit(50).get();
    if(snap.empty){
      return res.json({ zone, rows: [], updatedAt: null });
    }

    // Regrouper par enseigne + faire une moyenne simple
    const rowsByStore = {};
    snap.forEach(doc => {
      const d = doc.data();
      const key = d.store || 'Inconnu';
      if(!rowsByStore[key]) rowsByStore[key] = { sum:0, n:0 };
      rowsByStore[key].sum += Number(d.price || 0);
      rowsByStore[key].n += 1;
    });

    const rows = Object.entries(rowsByStore)
      .map(([store,agg]) => ({
        store, avgBasket: agg.n ? agg.sum/agg.n : null, sampleSize: agg.n
      }))
      .sort((a,b) => (a.avgBasket ?? 1e9) - (b.avgBasket ?? 1e9));

    res.json({ zone, rows, updatedAt: null });
  }catch(e){
    console.error(e);
    res.status(500).json({ error: 'server' });
  }
});
