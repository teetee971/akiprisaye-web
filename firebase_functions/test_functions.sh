/**
 * Script de seed Firestore pour A KI PRI SA YÉ
 * - Insère quelques produits tests dans toutes les zones DROM + COM
 * - Journalise tout proprement
 * 
 * Utilisation :
 *   node seed.js
 * 
 * Pré-requis (une des 3 options) :
 *   1) export GOOGLE_APPLICATION_CREDENTIALS="/chemin/vers/serviceAccount.json"
 *   2) placer le fichier dans functions/ sous le nom: serviceAccount.json
 *   3) laisser le nom d’origine généré par Firebase (on tente aussi de le charger)
 */

const admin = require("firebase-admin");
const path = require("path");
const fs = require("fs");

// ---------- Charge la clé de service ----------
function loadServiceAccount() {
  // 1) Via variable d'environnement GOOGLE_APPLICATION_CREDENTIALS
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    const p = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    try {
      return require(p);
    } catch (e) {
      console.error("❌ Impossible de charger la clé depuis GOOGLE_APPLICATION_CREDENTIALS:", p, e.message);
    }
  }

  // 2) Fichier local 'serviceAccount.json' (recommandé si tu poses la clé ici)
  try {
    return require("./serviceAccount.json");
  } catch (_) {}

  // 3) Tentative avec le nom typique téléchargé depuis Firebase Console
  //    (tu peux laisser comme ça si ton fichier porte ce nom)
  try {
    // Mets ici EXACTEMENT le nom de ton fichier si besoin
    return require("./a-ki-pri-sa-ye-firebase-adminsdk-fbsvc-8629890396.json");
  } catch (_) {}

  throw new Error(
    "Aucune clé de service trouvée. " +
    "Place le JSON dans functions/serviceAccount.json ou définis GOOGLE_APPLICATION_CREDENTIALS."
  );
}

const serviceAccount = loadServiceAccount();

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: serviceAccount.project_id,
});

const db = admin.firestore();

// ---------- Zones (DROM + COM) ----------
const ZONES = [
  // RUP/DROM
  "guadeloupe",
  "martinique",
  "guyane",
  "reunion",
  "mayotte",
  // COM
  "saint-pierre-et-miquelon",
  "saint-barthelemy",
  "saint-martin",
  "polynesie-francaise",
  "wallis-et-futuna",
];

// ---------- Produits de base (petit jeu de données de test) ----------
const BASE_PRODUCTS = [
  { name: "Lait demi-écrémé", price: 1.20, store: "HyperDom" },
  { name: "Baguette",         price: 0.90, store: "TiPrix"    },
  { name: "Yaourt nature",    price: 2.50, store: "Market Caraïbes" },
];

/**
 * Insère les produits pour chaque zone dans la collection "products".
 * Doc ID généré: `${zone}_prod${i+1}`
 */
async function seed() {
  console.log("🚀 Lancement du seed Firestore…");
  console.log("🔐 Projet détecté :", serviceAccount.project_id);

  const batchSize = 500; // au cas où on monte en volume
  let ops = 0;
  let batch = db.batch();

  try {
    for (const zone of ZONES) {
      console.log(`\n🌍 Zone: ${zone}`);

      for (let i = 0; i < BASE_PRODUCTS.length; i++) {
        const p = {
          ...BASE_PRODUCTS[i],
          id: `${zone}_prod${i + 1}`,
          zone,
          updatedAt: new Date(),
        };

        const ref = db.collection("products").doc(p.id);
        batch.set(ref, p, { merge: true });
        ops++;

        // Si on dépasse la taille max d'un batch, on commit et on repart
        if (ops % batchSize === 0) {
          await batch.commit();
          console.log(`🧾 Batch commit (${ops} écritures)…`);
          batch = db.batch();
        }

        console.log(`✅ Produit ajouté : ${p.name} (${p.store}) → ${zone}`);
      }
    }

    // Commit final s’il reste des opérations en attente
    if (ops % batchSize !== 0) {
      await batch.commit();
      console.log(`🧾 Batch final commit (${ops} écritures)…`);
    }

    console.log("\n🎉 Données insérées avec succès pour toutes les zones DROM + COM !");
  } catch (err) {
    console.error("❌ Erreur :", err);
  } finally {
    // Toujours fermer proprement le process
    process.exit(0);
  }
}

seed();
