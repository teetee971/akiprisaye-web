const functions = require("firebase-functions");
const fetch = require("node-fetch");
const { fetchOFF } = require("./off_mini");

// --- Mini heuristique NC8
function guessNC8(product) {
  const cats = (product?.categories_tags_fr || product?.categories_tags || []).join(' ').toLowerCase();
  const out = [];
  if (/th(e|é)/.test(cats)) out.push({code:"0902", libelle:"Thés", score:0.9});
  if (/lait/.test(cats))   out.push({code:"0401", libelle:"Lait", score:0.8});
  if (/cafe|café/.test(cats)) out.push({code:"0901", libelle:"Café", score:0.8});
  return out.slice(0,3);
}

// --- OFF mini
async function getOFF(ean){
  const url = `https://world.openfoodfacts.org/api/v2/product/${ean}.json`;
  const r = await fetch(url); if(!r.ok) throw new Error(`OFF ${r.status}`);
  const j = await r.json(); return j.product || null;
}

// /api/ean2nc8?ean=XXXXXXXX
async function handleEan2Nc8(req, res) {
  const ean = (req.query.ean||'').trim();
  if(!/^\d{8,14}$/.test(ean)) return res.status(400).json({error:'EAN invalide'});
  const out = { ean, productName:null, nc8Candidates:[], sources:[] };
  try {
    const p = await getOFF(ean);
    if (p) {
      out.productName = p.product_name_fr || p.product_name || null;
      out.nc8Candidates = guessNC8(p);
      out.sources.push({kind:'openfoodfacts', ok:true});
    } else {
      out.sources.push({kind:'openfoodfacts', ok:false});
    }
  } catch(e) {
    out.sources.push({kind:'openfoodfacts', ok:false, error:e.message});
  }
  res.json(out);
}

// /api/stores?territoire=martinique
async function handleStores(req, res) {
  const t = (req.query.territoire||'martinique');
  const r = await fetch(`${req.protocol}://${req.get('host')}/data/stores.json`);
  const all = await r.json();
  res.json(all[t] || []);
}

// Router simple
exports.api = functions.https.onRequest(async (req, res) => {
  try {
    if (req.path.startsWith('/ean2nc8')) return handleEan2Nc8(req, res);
    if (req.path.startsWith('/stores'))  return handleStores(req, res);
    res.status(404).json({error:'Not found'});
  } catch (e) {
    res.status(500).json({error:e.message});
  }
});
