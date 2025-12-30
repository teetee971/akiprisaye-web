import fs from "fs";
import fetch from "node-fetch";

console.log("🌍 Génération auto des coordonnées GPS…");

const stores = JSON.parse(fs.readFileSync("./stores.json", "utf8"));

/** Fonction de géocodage OpenStreetMap */
async function geocode(address) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`;

  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "A-KI-PRI-SAYE/1.0 (contact@akiprisaye)" }
    });

    const data = await res.json();
    if (!data || data.length === 0) return null;

    return {
      lat: parseFloat(data[0].lat),
      lng: parseFloat(data[0].lon)
    };

  } catch (err) {
    console.error("❌ Erreur API OSM :", err);
    return null;
  }
}

async function process() {
  let updated = 0;

  for (const s of stores) {
    if (s.lat && s.lng) continue; // déjà OK

    const query = `${s.name} ${s.city || ""} ${s.territory || ""}`;
    console.log(`📍 Recherche: ${query}`);

    const coords = await geocode(query);

    if (coords) {
      s.lat = coords.lat;
      s.lng = coords.lng;
      console.log(`   ✔ Coordonnées trouvées: ${coords.lat}, ${coords.lng}`);
      updated++;
    } else {
      console.log(`   ❌ Impossible de trouver : ${query}`);
    }

    await new Promise(res => setTimeout(res, 1000)); // délai anti-ban API
  }

  fs.writeFileSync("./stores.json", JSON.stringify(stores, null, 2));
  console.log(`\n🎉 Terminé. ${updated} magasins mis à jour automatiquement.`);
}

process();
