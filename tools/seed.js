// Seed Firestore (produits) — utilise GOOGLE_APPLICATION_CREDENTIALS (clé admin locale)
// Ne JAMAIS commiter la clé. Exécuter: node seed.js
import admin from "firebase-admin";
import fs from "fs";

if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  console.error("⚠️  Définis GOOGLE_APPLICATION_CREDENTIALS=/chemin/vers/serviceAccount.json");
  process.exit(1);
}

admin.initializeApp({ credential: admin.credential.applicationDefault() });
const db = admin.firestore();

const data = {
  items: [
    { id:"lait-1l", name:"Lait UHT 1L", price_dom:1.45, price_hex:1.12 },
    { id:"pates-500g", name:"Pâtes 500g", price_dom:1.36, price_hex:0.98 },
    { id:"riz-1kg", name:"Riz 1kg", price_dom:2.30, price_hex:1.85 }
  ]
};

async function run(){
  const batch = db.batch();
  data.items.forEach(p => {
    const ref = db.collection("products").doc(p.id);
    batch.set(ref, p);
  });
  await batch.commit();
  console.log("✅ Seed OK: products");
  process.exit(0);
}
run().catch(err=>{ console.error(err); process.exit(1); });
