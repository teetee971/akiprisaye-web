import { readFile, writeFile, mkdir } from "fs/promises";
import path from "path";
import axios from "axios";
import { fileURLToPath } from "url";
import { fetchOFFByBarcode, fetchOFFBySearch, mapOFFProduct, safeDownload } from "./lib/off.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");
const APP = path.resolve(ROOT, "..");
const IMG_DIR = path.join(APP, "public", "img", "products");

async function ensureDir(p){ await mkdir(p, { recursive: true }); }

function slugify(s){ return (s||"").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/(^-|-$)/g,""); }

async function loadJSON(p, def=null){
  try{ return JSON.parse(await readFile(p,"utf8")); }
  catch{ return def; }
}

async function enhanceFromApis(seed, apis){
  // OFF d'abord
  const off = apis.find(a => a.type==="openfoodfacts" && a.enabled);
  if (off){
    let raw = null;
    if (seed.barcode) raw = await fetchOFFByBarcode(off.baseUrl, seed.barcode);
    if (!raw && seed.name) raw = await fetchOFFBySearch(off.baseUrl, seed.name);
    if (raw) return mapOFFProduct(raw, off.imageFieldOrder || []);
  }
  // autres APIs : à compléter si activées
  for (const api of apis.filter(a => a.type==="custom" && a.enabled)){
    try{
      // Exemple générique (adapter selon l'API)
      const url = `${api.baseUrl}/products/search?q=${encodeURIComponent(seed.name || seed.barcode || "")}`;
      const { data } = await axios.get(url, {
        timeout: 15000,
        headers: api.auth ? { [api.auth.header]: api.auth.value } : {}
      });
      const p = data?.items?.[0];
      if (p){
        return {
          source: api.name,
          code: p.barcode || p.code || null,
          name: p.name || seed.name,
          brand: p.brand || null,
          quantity: p.quantity || null,
          categories: p.categories || [],
          ingredients: p.ingredients || [],
          image: p.image || null,
          nutrigrade: p.nutriscore?.grade?.toUpperCase?.() || null,
          nutriscore: p.nutriscore || null
        };
      }
    }catch(e){}
  }
  return null;
}

async function main(){
  await ensureDir(IMG_DIR);
  const seeds = await loadJSON(path.join(APP,"src","data","product-seeds.json"), []);
  const apis  = await loadJSON(path.join(APP,"src","data","price-apis.json"), []);
  const stores= await loadJSON(path.join(APP,"src","data","stores.json"), {regions:[]});

  const out = [];
  for (const seed of seeds){
    try{
      const enriched = await enhanceFromApis(seed, apis);
      if (!enriched){ continue; }

      // image locale
      let imageLocal = null;
      if (enriched.image){
        const base = slugify(`${enriched.code || enriched.name}`);
        const ext  = enriched.image.split("?")[0].match(/\.(jpg|jpeg|png|webp)$/i)?.[0] || ".jpg";
        const outPath = path.join(IMG_DIR, `${base}${ext}`);
        const ok = await safeDownload(enriched.image, outPath);
        if (ok) imageLocal = `/img/products/${base}${ext}`;
      }

      out.push({
        ...enriched,
        imageLocal,
        // emplacement pour futurs prix (par magasin/rayon)
        prices: {
          // exemple :
          // "Carrefour": { "Guadeloupe": 3.49, "Martinique": 3.59 }
        }
      });
    }catch(e){}
  }

  await writeFile(path.join(APP,"src","data","products.json"), JSON.stringify({ updatedAt: new Date().toISOString(), products: out }, null, 2), "utf8");
  console.log(`Updated ${out.length} products`);
}

main().catch(err => { console.error(err); process.exit(1); });
