// functions/eslint.config.cjs  (Flat config, CommonJS)

module.exports = [
  {
    ignores: ['**/node_modules/**'],
    languageOptions: {
      sourceType: 'commonjs',
      ecmaVersion: 2021,
    },
    rules: {
      'max-len': 'off',
      'object-curly-spacing': 'off',
      'comma-dangle': 'off',
    },
  },
];

// ================== searchProducts ==================
// GET /searchProducts?zone=martinique&q=lait[&limit=50]
// Répond: { zone, q, count, items:[{name, store, price, unit, zone, updatedAt}] }
const allowCORS = (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.status(204).send(''); return true; }
  return false;
};

exports.searchProducts = functions.https.onRequest(async (req, res) => {
  if (allowCORS(req, res)) return;
  try{
    const zone = (req.query.zone || 'martinique').toString().toLowerCase();
    const q    = (req.query.q || '').toString().toLowerCase().trim();
    const limit = Math.min(parseInt(req.query.limit)||50, 100);
    if(!q) return res.status(400).json({error:'missing q'});

    // 1) collection générale "prices" (avec champ 'zone')
    const snap = await db.collection('prices').where('zone','==',zone).get();
    let items = snap.docs.map(d=>({id:d.id, ...d.data()}));

    // 2) éventuelle collection par zone "prices_<zone>"
    try {
      const snap2 = await db.collection(`prices_${zone}`).get();
      items = items.concat(snap2.docs.map(d=>({id:d.id, ...d.data()})));
    } catch(e){ /* ok si absente */ }

    // Filtre texte simple (nom/préfixes) – suffisant au début
    const QQ = q.normalize('NFD').replace(/\p{Diacritic}/gu,'');
    const match = (s='') => {
      s = s.toString().toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu,'');
      return s.includes(QQ);
    };
    items = items.filter(it => match(it.name)||match(it.product)||match(it.label));

    // Projection simplifiée
    const out = items.slice(0,limit).map(it => ({
      name: it.name || it.product || it.label || null,
      store: it.store || it.shop || it.brand || null,
      price: it.price ?? it.amount ?? null,
      unit: it.unit || it.unitPrice || null,
      zone: it.zone || zone,
      updatedAt: it.updatedAt || it.ts || null,
    }));

    res.json({ zone, q, count: out.length, items: out });
  }catch(err){
    console.error(err);
    res.status(500).json({error:'server'});
  }
});

// ----------------------------
// 🔎 API : /searchPrices?q=yaourt&zone=martinique&limit=50
// Recherche plein-texte simple dans les collections "prices" et "prices_<zone>"
// ----------------------------
const functions = (typeof functions !== 'undefined') ? functions : require('firebase-functions');
const admin     = (typeof admin     !== 'undefined') ? admin     : require('firebase-admin');

if (!admin.apps || admin.apps.length === 0) {
  try { admin.initializeApp(); } catch(e) {}
}
const db = (typeof db !== 'undefined') ? db : admin.firestore();

exports.searchPrices = functions.https.onRequest(async (req, res) => {
  // CORS très permissif pour la démo
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).send('');

  try{
    const zone  = (req.query.zone || 'martinique').toString().toLowerCase().trim();
    const qRaw  = (req.query.q || '').toString();
    const q     = qRaw.trim();
    const limit = Math.min(parseInt(req.query.limit)||50, 100);
    
    // Nouveaux paramètres de filtre
    const storeFilter = (req.query.store || '').toString().toLowerCase().trim();
    const priceMin = parseFloat(req.query.price_min) || 0;
    const priceMax = parseFloat(req.query.price_max) || Infinity;
    const categoryFilter = (req.query.category || '').toString().toLowerCase().trim();

    if (!q) return res.status(400).json({ error: 'missing q' });

    // 1) Collection générale
    let items = [];
    const snap = await db.collection('prices').where('zone','==', zone).get();
    items = snap.docs.map(d => ({ id: d.id, ...d.data() }));

    // 2) Eventuelle collection par zone prices_<zone>
    try {
      const snap2 = await db.collection(`prices_${zone}`).get();
      items = items.concat(snap2.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch(e) { /* ok si absente */ }

    // 3) Filtre texte (nom/produit/label) insensible aux accents
    const QQ = q.normalize('NFD').replace(/\p{Diacritic}/gu,'').toLowerCase();
    const norm = s => (s||'').toString().normalize('NFD').replace(/\p{Diacritic}/gu,'').toLowerCase();
    items = items.filter(it => {
      return norm(it.name).includes(QQ)
          || norm(it.product).includes(QQ)
          || norm(it.label).includes(QQ);
    });

    // 4) Filtres avancés
    if (storeFilter) {
      items = items.filter(it => {
        const store = norm(it.store || it.shop || it.brand || '');
        return store.includes(storeFilter);
      });
    }

    if (priceMin > 0 || priceMax < Infinity) {
      items = items.filter(it => {
        const price = it.price ?? it.amount ?? 0;
        return price >= priceMin && price <= priceMax;
      });
    }

    if (categoryFilter) {
      const categoryKeywords = {
        'alimentaire': ['lait', 'beurre', 'fromage', 'yaourt', 'pain', 'riz', 'pâtes', 'sucre', 'huile'],
        'boisson': ['eau', 'jus', 'soda', 'café', 'thé'],
        'hygiene': ['savon', 'shampooing', 'dentifrice', 'déodorant'],
        'maison': ['lessive', 'détergent', 'liquide vaisselle'],
        'viande': ['poulet', 'bœuf', 'porc', 'poisson', 'œuf'],
        'fruits': ['banane', 'pomme', 'tomate', 'fruit', 'légume']
      };
      
      const keywords = categoryKeywords[categoryFilter] || [];
      if (keywords.length > 0) {
        items = items.filter(it => {
          const productName = norm(it.name || it.product || it.label || '');
          return keywords.some(keyword => productName.includes(keyword));
        });
      }
    }

    // 5) Projection simplifiée
    const out = items.slice(0, limit).map(it => ({
      name: it.name || it.product || it.label || null,
      store: it.store || it.shop || it.brand || null,
      price: it.price ?? it.amount ?? null,
      unit:  it.unit || it.unitPrice || null,
      zone:  it.zone || zone,
      updatedAt: it.updatedAt || it.ts || null,
    }));

    res.json({ zone, q, count: out.length, items: out });
  }catch(err){
    console.error(err);
    res.status(500).json({ error: 'server' });
  }
});
