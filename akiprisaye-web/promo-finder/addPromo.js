const admin = require("firebase-admin");

// Initialise Firebase avec ton fichier serviceAccountKey.json
const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function addPromo() {
  try {
    const promo = {
      product_slug: "lait-entier",
      product_name: "Lait Entier 1L",
      unit_price: 0.89,
      store_name: "Carrefour Abymes",
      store_id: "carrefour_abymes",
      end_date: new Date("2025-09-15T23:59:59Z"),
      location: new admin.firestore.GeoPoint(16.270, -61.520),
    };

    await db.collection("promotions").add(promo);
    console.log("✅ Promo ajoutée !");
  } catch (err) {
    console.error("❌ Erreur:", err);
  }
}

addPromo();
