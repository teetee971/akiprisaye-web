/**
 * Remplissage rapide de Firestore pour A KI PRI SA YÉ
 * - Collections lues par ton endpoint: "prices" (générale) et "prices_<zone>"
 * - Zones prises en charge ici: martinique, guadeloupe
 * - Lances: node seed.js
 */

const admin = require("firebase-admin");

// Démarre Firebase Admin (réutilise l'app si déjà chargée)
try { admin.app(); } catch { admin.initializeApp(); }
const db = admin.firestore();

const NOW = new Date();
const TS  = admin.firestore.Timestamp.fromDate(NOW);

// Petit helper
const row = (p) => ({
  // clés normalisées que lit ta fonction searchPrices
  name: p.name,                 // ex: "Banane"
  product: (p.product || p.name).toLowerCase(),
  label: (p.label || p.name),   // libellé affichable
  store: p.store,               // ex: "Carrefour Génipa"
  brand: p.brand || null,       // ex: "U"
  unit: p.unit || "kg",         // "kg", "L", "pièce"
  price: p.price,               // nombre
  amount: p.amount || null,     // équivalent (si promo, pack, etc.)
  zone: p.zone,                 // "martinique" | "guadeloupe"
  updatedAt: TS,
  ts: Date.now()
});

// Données de démo (réalistes) — ajuste les libellés/enseignes à ta guise
const DEMO = [
  // MARTINIQUE
  row({ zone:"martinique", name:"Banane", unit:"kg", price:2.45, store:"Carrefour Génipa" }),
  row({ zone:"martinique", name:"Banane", unit:"kg", price:2.19, store:"Hyper U Place d'Armes" }),
  row({ zone:"martinique", name:"Lait demi-écrémé 1L", unit:"L", price:1.12, store:"Carrefour Génipa", brand:"Carrefour" }),
  row({ zone:"martinique", name:"Lait demi-écrémé 1L", unit:"L", price:1.05, store:"Leader Price Ducos", brand:"Leader Price" }),
  row({ zone:"martinique", name:"Baguette", unit:"pièce", price:0.95, store:"Hyper U Place d'Armes" }),
  row({ zone:"martinique", name:"Yaourt nature 4x125g", unit:"paquet", price:1.65, store:"Carrefour Génipa", brand:"Yoplait" }),

  // GUADELOUPE
  row({ zone:"guadeloupe", name:"Banane", unit:"kg", price:2.35, store:"Carrefour Destreland" }),
  row({ zone:"guadeloupe", name:"Banane", unit:"kg", price:2.10, store:"Hyper U Baie-Mahault" }),
  row({ zone:"guadeloupe", name:"Lait demi-écrémé 1L", unit:"L", price:1.09, store:"Hyper U Baie-Mahault" }),
  row({ zone:"guadeloupe", name:"Baguette", unit:"pièce", price:0.89, store:"Carrefour Destreland" }),
  row({ zone:"guadeloupe", name:"Yaourt nature 4x125g", unit:"paquet", price:1.59, store:"Carrefour Destreland", brand:"Danone" }),
];

// Écrit à la fois dans "prices" (pool global) ET dans "prices_<zone>"
async function main(){
  const batch = db.batch();

  for(const it of DEMO){
    const id = `${it.zone}_${it.product}_${it.store}`.toLowerCase().replace(/\s+/g,'-');
    // globale
    batch.set(db.collection("prices").doc(id), it, { merge:true });
    // par zone
    batch.set(db.collection(`prices_${it.zone}`).doc(id), it, { merge:true });
  }

  await batch.commit();
  console.log(`OK: ${DEMO.length} lignes écrites.`);
  process.exit(0);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
