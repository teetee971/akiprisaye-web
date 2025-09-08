const { getFirestore } = require("firebase-admin/firestore");
const db = getFirestore();

async function addPromo() {
  await db.collection("promotions").add({
    product_slug: "lait-entier",
    product_name: "Lait Entier 1L",
    unit_price: 0.89,
    store_name: "Carrefour Abymes",
    store_id: "carrefour_abymes",
    end_date: new Date("2025-09-15T23:59:59Z"),
    location: [16.270, -61.520],
  });
  console.log("✅ Promo ajoutée !");
}

addPromo();
