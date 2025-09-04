/**
 * Script de seed Firestore pour A KI PRI SA YÉ
 * Insère des produits tests dans toutes les zones DROM + COM
 * et lance le recalcul du palmarès automatiquement.
 */

const admin = require("firebase-admin");

admin.initializeApp();
const db = admin.firestore();

// Liste des zones DROM + COM
const ZONES = [
  "guadeloupe",
  "martinique",
  "guyane",
  "reunion",
  "mayotte",
  "saint-pierre-et-miquelon",
  "saint-barthelemy",
  "saint-martin",
  "polynesie-francaise",
  "wallis-et-futuna"
];

// Produits de base
const BASE_PRODUCTS = [
  { name: "Lait demi-écrémé", price: 1.20, store: "HyperDom" },
  { name: "Baguette", price: 0.90, store: "TiPrix" },
  { name: "Yaourt nature", price: 2.50, store: "Market Caraïbes" }
];

async function seed() {
  try {
    for (const zone of ZONES) {
      console.log(`\n🌍 Zone: ${zone}`);
      for (let i = 0; i < BASE_PRODUCTS.length; i++) {
        const p = {
          ...BASE_PRODUCTS[i],
          id: `${zone}_prod${i + 1}`,
          zone: zone,
          updatedAt: new Date()
        };
        await db.collection("products").doc(p.id).set(p, { merge: true });
        console.log(`✅ Produit ajouté : ${p.name} (${p.store}) → ${zone}`);
      }
    }

    console.log("\n🎉 Données insérées avec succès pour toutes les zones DROM + COM !");
  } catch (err) {
    console.error("❌ Erreur :", err);
  } finally {
    process.exit(0);
  }
}

seed();
