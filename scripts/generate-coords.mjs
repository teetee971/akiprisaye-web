import fs from 'fs';
import { resolve } from 'path';

console.log('🌍 Génération auto des coordonnées GPS...');

const candidates = [
  resolve(process.cwd(), 'stores.json'),
  resolve(process.cwd(), 'frontend/stores.json'),
  resolve(process.cwd(), 'frontend/public/stores.json'),
  resolve(process.cwd(), 'public/stores.json'),
  resolve(process.cwd(), 'data/stores.json'),
];

const storesPath = candidates.find(p => fs.existsSync(p));

if (!storesPath) {
  console.error('[CI] stores.json introuvable. Candidates:', candidates);
  process.exit(1);
}

console.log('[CI] Using:', storesPath);

const raw = fs.readFileSync(storesPath, 'utf8');
const json = JSON.parse(raw);

if (!json || !Array.isArray(json.stores)) {
  console.error('[CI] Format invalide: attendu { "stores": [] }');
  process.exit(1);
}

const stores = json.stores;

async function geocode(address) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`;
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "A-KI-PRI-SAYE/1.0 (contact@akiprisaye)"
      }
    });

    const data = await res.json();
    if (!data || data.length === 0) return null;

    return {
      lat: parseFloat(data[0].lat),
      lng: parseFloat(data[0].lon),
    };
  } catch (err) {
    console.error("❌ Erreur API OSM :", err);
    return null;
  }
}

async function processStores() {
  let updated = 0;

  for (const s of stores) {
    if (s.lat && s.lng) continue;

    const query = `${s.name} ${s.city || ""} ${s.territory || ""}`;
    console.log(`📍 Recherche: ${query}`);

    const coords = await geocode(query);

    if (coords) {
      s.lat = coords.lat;
      s.lng = coords.lng;
      console.log(`✓ Coordonnées trouvées: ${coords.lat}, ${coords.lng}`);
      updated++;
    } else {
      console.log(`❌ Impossible de trouver: ${query}`);
    }

    await new Promise(res => setTimeout(res, 1000));
  }

  fs.writeFileSync(storesPath, JSON.stringify({ stores }, null, 2) + '\n');
  console.log(`🎉 Terminé. ${updated} magasins mis à jour.`);
}

processStores();
