import admin from "firebase-admin";
import geofire from "geofire-common";
import dayjs from "dayjs";

// --------------- CONFIG ---------------
// Option A : via variable d'environnement (recommandé)
//   export GOOGLE_APPLICATION_CREDENTIALS="/chemin/service-account.json"
//   admin.initializeApp({ credential: admin.credential.applicationDefault() });
//
// Option B : pointer directement vers le JSON :
import fs from "fs";
const saPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || "./service-account.json";
const serviceAccount = JSON.parse(fs.readFileSync(saPath, "utf8"));
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
// --------------------------------------

const db = admin.firestore();

function slugify(s) {
  return s.toLowerCase()
    .normalize("NFKD").replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-").replace(/-+/g, "-").trim();
}

async function main() {
  // ---- Exemple de promo à ajouter ----
  const productName = "Lait Entier 1L";
  const storeName   = "Carrefour Abymes";
  const unitPrice   = 0.89; // prix unitaire en €
  const endDateIso  = dayjs().add(7, "day").toISOString();

  // Position du magasin (à adapter)
  const lat = 16.270, lng = -61.5201;

  const doc = {
    product_name : productName,
    product_slug : slugify(productName),       // ex: "lait-entier-1l"
    unit_price   : unitPrice,
    store_name   : storeName,
    store_id     : slugify(storeName),         // ex: "carrefour-abymes"
    end_date_iso : endDateIso,
    location     : new admin.firestore.GeoPoint(lat, lng),
    geohash      : geofire.geohashForLocation([lat, lng]),
    created_at   : admin.firestore.FieldValue.serverTimestamp(),
  };

  await db.collection("promotions").add(doc);
  console.log("✅ Promo ajoutée :", doc);
}

main().catch(err => {
  console.error("❌ Erreur:", err);
  process.exit(1);
});
